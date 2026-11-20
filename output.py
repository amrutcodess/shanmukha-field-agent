"""output.py - Output formatting, CSV management with deduplication,
Google Sheets export, and follow-up tracking.
"""

from datetime import datetime
import logging
import os
from typing import Any, Dict, List, Optional, Set, Tuple

import pandas as pd

logger = logging.getLogger(__name__)

CSV_COLUMNS = [
    "business_name",
    "place_id",
    "market",
    "search_query",
    "location",
    "lead_score",
    "rating",
    "review_count",
    "phone",
    "phone_normalized",
    "phone_type",
    "whatsapp_likely",
    "whatsapp_link",
    "website",
    "website_domain",
    "email",
    "email_type",
    "contact_name",
    "address",
    "opening_hours",
    "no_evening_or_weekend_coverage",
    "best_call_time_ist",
    "data_confidence",
    "google_maps_url",
    "business_status",
    "contact_status",
    "stage",
    "last_contacted_date",
    "next_follow_up_date",
    "channel_used",
    "reply_notes",
    "notes",
    "date_added",
]


def load_existing_leads_index(csv_path: str) -> Tuple[Set[str], Set[str], Set[str]]:
    """Loads existing place IDs, normalized phones, and domains for deduplication across runs.

    Returns:
        Tuple of (existing_place_ids, existing_phones, existing_domains)
    """
    if not os.path.exists(csv_path):
        return set(), set(), set()

    try:
        df = pd.read_csv(csv_path, dtype=str)
        existing_place_ids = set(df["place_id"].dropna().str.strip()) if "place_id" in df.columns else set()
        existing_phones = (
            set(df["phone_normalized"].dropna().str.strip().replace("", float("nan")).dropna())
            if "phone_normalized" in df.columns
            else set()
        )
        existing_domains = (
            set(df["website_domain"].dropna().str.strip().replace("", float("nan")).dropna())
            if "website_domain" in df.columns
            else set()
        )
        return existing_place_ids, existing_phones, existing_domains
    except Exception as e:
        logger.warning(f"Could not load existing CSV for deduplication: {e}")
        return set(), set(), set()


def append_leads_to_csv(leads: List[Dict[str, Any]], csv_path: str) -> int:
    """Appends new leads to the CSV file without duplicating existing records.

    Returns:
        Number of leads written.
    """
    if not leads:
        return 0

    new_df = pd.DataFrame(leads)
    # Ensure all required columns are present
    for col in CSV_COLUMNS:
        if col not in new_df.columns:
            new_df[col] = ""

    # Reorder columns consistently
    new_df = new_df[CSV_COLUMNS]

    file_exists = os.path.exists(csv_path)
    if not file_exists:
        new_df.to_csv(csv_path, index=False, encoding="utf-8-sig")
    else:
        new_df.to_csv(csv_path, mode="a", header=False, index=False, encoding="utf-8-sig")

    return len(leads)


def print_summary(total_found: int, new_leads: List[Dict[str, Any]]) -> None:
    """Prints a structured summary of the lead collection run."""
    print("\n" + "=" * 65)
    print("                LEAD GENERATION SUMMARY                ")
    print("=" * 65)
    total_new = len(new_leads)
    duplicates_skipped = max(0, total_found - total_new)
    print(f"Total Places Found via API: {total_found}")
    print(f"Total New Leads Stored:    {total_new}")
    print(f"Duplicates/Filtered:       {duplicates_skipped}")
    print("-" * 65)

    # Market breakdowns
    markets: Dict[str, Dict[str, int]] = {}
    for lead in new_leads:
        m = lead.get("market", "Unknown")
        if m not in markets:
            markets[m] = {"found": 0, "email": 0, "mobile": 0, "whatsapp": 0}
        markets[m]["found"] += 1
        if lead.get("email"):
            markets[m]["email"] += 1
        if lead.get("phone_type") == "mobile":
            markets[m]["mobile"] += 1
        if lead.get("whatsapp_link") or lead.get("whatsapp_likely"):
            markets[m]["whatsapp"] += 1

    print("Market Breakdown (New Leads Added):")
    if not markets:
        print("  (No new leads added in this run)")
    for m, stats in markets.items():
        print(f"  • Market: {m}")
        print(f"      - New leads:         {stats['found']}")
        print(f"      - With email:        {stats['email']}")
        print(f"      - With mobile phone: {stats['mobile']}")
        print(f"      - With WhatsApp:     {stats['whatsapp']}")

    print("=" * 65 + "\n")


def export_to_google_sheets(
    leads: List[Dict[str, Any]],
    credentials_file: str,
    sheet_name_or_id: str,
) -> bool:
    """Exports leads to Google Sheets using a Google Service Account."""
    try:
        import gspread
    except ImportError:
        logger.error("gspread library is not installed. Install with: pip install gspread")
        return False

    if not credentials_file or not os.path.exists(credentials_file):
        logger.error(
            f"Google Service Account file not found at: '{credentials_file}'. "
            "Please check GOOGLE_SHEETS_CREDENTIALS_FILE in .env."
        )
        return False

    if not leads:
        logger.info("No leads to push to Google Sheets.")
        return True

    try:
        logger.info(f"Connecting to Google Sheets using credentials from {credentials_file}...")
        gc = gspread.service_account(filename=credentials_file)

        # Try opening by ID or title
        try:
            if len(sheet_name_or_id) > 25 and " " not in sheet_name_or_id:
                sheet = gc.open_by_key(sheet_name_or_id)
            else:
                sheet = gc.open(sheet_name_or_id)
        except gspread.SpreadsheetNotFound:
            logger.info(f"Spreadsheet '{sheet_name_or_id}' not found. Creating a new one...")
            sheet = gc.create(sheet_name_or_id)

        worksheet = sheet.get_worksheet(0)
        existing_values = worksheet.get_all_values()

        # Format dataframe
        df = pd.DataFrame(leads)[CSV_COLUMNS]
        df = df.fillna("")

        rows_to_append = df.values.tolist()

        if not existing_values:
            # Sheet is empty, write header + data
            all_rows = [CSV_COLUMNS] + rows_to_append
            worksheet.update(all_rows)
            logger.info(f"Created new sheet with {len(rows_to_append)} rows.")
        else:
            # Append rows only
            worksheet.append_rows(rows_to_append)
            logger.info(f"Appended {len(rows_to_append)} rows to Google Sheet.")

        print(f"[Sheets] Successfully exported {len(rows_to_append)} leads to: {sheet.url}")
        return True

    except Exception as e:
        logger.error(f"Failed to export leads to Google Sheets: {e}")
        return False


def show_followups_due(csv_path: str) -> None:
    """Displays leads whose follow-up date is today or earlier, ordered by lead_score."""
    if not os.path.exists(csv_path):
        print(f"Error: Lead file '{csv_path}' does not exist.")
        return

    try:
        df = pd.read_csv(csv_path, dtype=str)
    except Exception as e:
        print(f"Error reading CSV file '{csv_path}': {e}")
        return

    if "next_follow_up_date" not in df.columns:
        print("No 'next_follow_up_date' column found in leads file.")
        return

    # Clean dates and lead score
    today_str = datetime.now().strftime("%Y-%m-%d")
    df["next_follow_up_date"] = df["next_follow_up_date"].fillna("").str.strip()
    df["lead_score"] = pd.to_numeric(df.get("lead_score", 0), errors="coerce").fillna(0).astype(int)

    # Filter due dates: non-empty and <= today
    due_leads = df[(df["next_follow_up_date"] != "") & (df["next_follow_up_date"] <= today_str)].copy()

    if due_leads.empty:
        print(f"\n[Follow-ups] No follow-ups due today ({today_str}) or earlier.\n")
        return

    # Sort descending by lead_score
    due_leads = due_leads.sort_values(by="lead_score", ascending=False)

    print("\n" + "=" * 80)
    print(f"           FOLLOW-UPS DUE TODAY OR EARLIER (as of {today_str})           ")
    print("=" * 80)
    print(f"Total Follow-ups Due: {len(due_leads)}\n")

    for idx, (_, row) in enumerate(due_leads.iterrows(), start=1):
        score = row.get("lead_score", 0)
        biz_name = row.get("business_name", "Unknown Business")
        market = row.get("market", "")
        due_date = row.get("next_follow_up_date", "")
        stage = row.get("stage", "new")
        channel = row.get("channel_used", "call")
        phone = row.get("phone_normalized") or row.get("phone", "No phone")
        contact = row.get("contact_name") or "Owner / Manager"
        notes = row.get("reply_notes") or row.get("notes") or "(No notes)"
        call_window = row.get("best_call_time_ist", "")

        print(f"#{idx} [Score: {score:3d}] {biz_name} ({market})")
        print(f"    Due: {due_date} | Stage: {stage} | Channel: {channel} | Contact: {contact}")
        print(f"    Phone: {phone} | Best Call Window (IST): {call_window}")
        print(f"    Notes: {notes}")
        print("-" * 80)

    print("=" * 80 + "\n")
