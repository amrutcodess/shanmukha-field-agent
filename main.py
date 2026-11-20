"""main.py - Entry point for the B2B Lead Generator CLI tool.

Usage:
    python main.py                  # Full run using config.yaml
    python main.py --dry-run        # Run first 20 results of one market
    python main.py --sheets         # Full run and export to Google Sheets
    python main.py --followups-due  # Show leads with follow-up due today or earlier
"""

import argparse
from datetime import datetime
import logging
import os
import sys
from typing import Any, Dict, List, Set
from urllib.parse import urlparse

from dotenv import load_dotenv
import yaml

from clean import clean_and_score_lead, normalize_phone
from enrich import WebEnricher
from output import (
    append_leads_to_csv,
    export_to_google_sheets,
    load_existing_leads_index,
    print_summary,
    show_followups_due,
)
from places import PlacesClient

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("b2b_lead_agent")


def load_config(config_path: str) -> Dict[str, Any]:
    """Loads and validates configuration from YAML file."""
    if not os.path.exists(config_path):
        logger.error(f"Configuration file not found: {config_path}")
        sys.exit(1)

    try:
        with open(config_path, "r", encoding="utf-8") as f:
            config = yaml.safe_load(f)
        return config or {}
    except Exception as e:
        logger.error(f"Error reading configuration file '{config_path}': {e}")
        sys.exit(1)


def extract_domain(url: str) -> str:
    """Extracts base domain from a URL for deduplication."""
    if not url:
        return ""
    try:
        netloc = urlparse(url).netloc.lower()
        if netloc.startswith("www."):
            netloc = netloc[4:]
        return netloc
    except Exception:
        return ""


def run_lead_generation(
    config: Dict[str, Any],
    dry_run: bool = False,
    push_to_sheets: bool = False,
    output_override: str = "",
) -> None:
    """Orchestrates search, enrichment, cleaning, scoring, and output saving."""
    load_dotenv()
    api_key = os.getenv("GOOGLE_PLACES_API_KEY") or os.getenv("PLACES_API_KEY")

    if not api_key:
        print("\n" + "!" * 70)
        print("ERROR: GOOGLE_PLACES_API_KEY is not set!")
        print("Please add your Google Places API key to your .env file:")
        print("    GOOGLE_PLACES_API_KEY=AIzaSy...")
        print("See README.md for instructions on getting an API key and setting quotas.")
        print("!" * 70 + "\n")
        sys.exit(1)

    output_file = output_override or config.get("output_file", "leads.csv")
    max_results_per_query = int(config.get("max_results_per_query", 50))
    target_total_leads = int(config.get("target_total_leads", 250))
    min_reviews = int(config.get("min_reviews", 3))
    markets = config.get("markets", [])

    if not markets:
        logger.error("No markets defined in configuration.")
        return

    # In dry-run mode, limit to 20 results of the first market
    if dry_run:
        print("\n>>> [DRY RUN MODE ENABLED] <<<")
        print("Testing with the first market only, limited to at most 20 leads.\n")
        markets = markets[:1]
        target_total_leads = 20
        max_results_per_query = min(20, max_results_per_query)

    # Load existing indices to deduplicate across runs
    existing_place_ids, existing_phones, existing_domains = load_existing_leads_index(output_file)
    print(
        f"Loaded existing database: {len(existing_place_ids)} place IDs, "
        f"{len(existing_phones)} phones, {len(existing_domains)} domains indexed."
    )

    seen_place_ids: Set[str] = set(existing_place_ids)
    seen_phones: Set[str] = set(existing_phones)
    seen_domains: Set[str] = set(existing_domains)

    places_client = PlacesClient(api_key=api_key)
    enricher = WebEnricher()

    new_leads: List[Dict[str, Any]] = []
    total_raw_found = 0

    print(f"Target total leads for this run: {target_total_leads}")
    print(f"Output CSV destination: {output_file}\n")

    # Main search loop across markets
    for market in markets:
        market_name = market.get("name", "Unknown")
        country_code = market.get("country_code", "US")
        locations = market.get("locations", [])
        niche_queries = market.get("niche_queries", [])

        print(f"\n==================== MARKET: {market_name} ({country_code}) ====================")

        for location in locations:
            for query in niche_queries:
                if len(new_leads) >= target_total_leads:
                    print(f"\n[Info] Reached target total leads ({target_total_leads}). Concluding searches.")
                    break

                print(f"\nSearching: '{query}' in {location}...")

                # Fetch places from Places API (New)
                try:
                    places_found = places_client.search_location_niche(
                        query=query,
                        location=location,
                        max_results=max_results_per_query,
                        min_reviews=min_reviews,
                        seen_place_ids=seen_place_ids,
                    )
                except Exception as e:
                    logger.error(f"Search error on query '{query}' in '{location}': {e}")
                    continue

                total_raw_found += len(places_found)

                # Process and enrich each place
                for idx, place in enumerate(places_found, start=1):
                    if len(new_leads) >= target_total_leads:
                        break

                    name = place.get("business_name", "Unknown")
                    raw_phone = place.get("phone", "")
                    website = place.get("website", "")

                    # Check phone deduplication
                    e164_phone, phone_type = normalize_phone(raw_phone, country_code)
                    if e164_phone and e164_phone in seen_phones:
                        logger.info(f"  [Skip Duplicate Phone] {name} ({e164_phone})")
                        continue

                    # Check domain deduplication
                    domain = extract_domain(website)
                    if domain and domain in seen_domains:
                        logger.info(f"  [Skip Duplicate Domain] {name} ({domain})")
                        continue

                    # Step 2: Enrich from website
                    enrich_data: Dict[str, Any] = {
                        "website_domain": domain,
                        "email": "",
                        "email_type": "none",
                        "contact_name": "",
                        "whatsapp_link": "",
                    }
                    if website:
                        print(f"  [{idx}/{len(places_found)}] Enriching {name} ({domain})...", end="", flush=True)
                        try:
                            enrich_data = enricher.enrich(website)
                            status_extra = []
                            if enrich_data.get("email"):
                                status_extra.append(f"email: {enrich_data['email']}")
                            if enrich_data.get("whatsapp_link"):
                                status_extra.append("WhatsApp link found")
                            if enrich_data.get("contact_name"):
                                status_extra.append(f"contact: {enrich_data['contact_name']}")
                            extra_str = f" -> Found: {', '.join(status_extra)}" if status_extra else " -> Done"
                            print(extra_str)
                        except Exception as e:
                            print(f" -> Error during enrichment: {e}")
                    else:
                        print(f"  [{idx}/{len(places_found)}] {name} (No website listed)")

                    # Step 3: Clean and score
                    lead = clean_and_score_lead(
                        place_record=place,
                        enrich_record=enrich_data,
                        market_config=market,
                        search_query=query,
                        location=location,
                    )

                    # Update deduplication tracking sets
                    if e164_phone:
                        seen_phones.add(e164_phone)
                    if domain:
                        seen_domains.add(domain)

                    new_leads.append(lead)

                    lead_score = lead.get("lead_score", 0)
                    wa_likely = "Yes" if lead.get("whatsapp_likely") else "No"
                    print(
                        f"      Score: {lead_score} | Phone: {lead.get('phone_normalized') or raw_phone} "
                        f"({lead.get('phone_type')}) | WhatsApp likely: {wa_likely}"
                    )

            if len(new_leads) >= target_total_leads:
                break

        if len(new_leads) >= target_total_leads:
            break

    # Step 4: Output to CSV
    num_written = append_leads_to_csv(new_leads, output_file)
    print(f"\n[Storage] Successfully saved {num_written} leads to '{output_file}'.")

    # Step 5: Optional Google Sheets export
    if push_to_sheets:
        creds_file = os.getenv("GOOGLE_SHEETS_CREDENTIALS_FILE", "service_account.json")
        sheet_target = os.getenv("GOOGLE_SHEET_ID") or os.getenv("GOOGLE_SHEET_TITLE", "B2B Leads Outreach")
        export_to_google_sheets(new_leads, creds_file, sheet_target)

    # Print summary metrics
    print_summary(total_raw_found, new_leads)


def main():
    parser = argparse.ArgumentParser(
        description="B2B Business Lead Collector & Scoring CLI (Local Service Businesses)"
    )
    parser.add_argument(
        "--config",
        default="config.yaml",
        help="Path to YAML configuration file (default: config.yaml)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Runs the first 20 results of one market only for verification",
    )
    parser.add_argument(
        "--sheets",
        action="store_true",
        help="Export newly collected leads to Google Sheets using service account",
    )
    parser.add_argument(
        "--followups-due",
        action="store_true",
        help="Display leads whose next follow-up date is today or earlier, ordered by lead score",
    )
    parser.add_argument(
        "--output",
        default="",
        help="Override output CSV file path",
    )

    args = parser.parse_args()

    # If --followups-due is requested, inspect CSV directly and exit
    if args.followups_due:
        config = load_config(args.config)
        output_file = args.output or config.get("output_file", "leads.csv")
        show_followups_due(output_file)
        return

    # Normal or dry-run lead generation
    config = load_config(args.config)
    run_lead_generation(
        config=config,
        dry_run=args.dry_run,
        push_to_sheets=args.sheets,
        output_override=args.output,
    )


if __name__ == "__main__":
    main()
