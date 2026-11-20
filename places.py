"""places.py - Google Places API (New) integration for finding business leads.

Uses the Places API (New) Text Search endpoint:
https://places.googleapis.com/v1/places:searchText
"""

import logging
import time
from typing import Any, Dict, Generator, List, Optional
import requests

logger = logging.getLogger(__name__)

PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
FIELD_MASK = (
    "places.id,"
    "places.displayName,"
    "places.formattedAddress,"
    "places.nationalPhoneNumber,"
    "places.internationalPhoneNumber,"
    "places.websiteUri,"
    "places.rating,"
    "places.userRatingCount,"
    "places.regularOpeningHours,"
    "places.googleMapsUri,"
    "places.businessStatus,"
    "nextPageToken"
)


class PlacesAPIError(Exception):
    """Custom exception for Google Places API errors."""
    pass


class PlacesClient:
    """Client for Google Places API (New) Text Search with retry and pagination."""

    def __init__(self, api_key: str, max_retries: int = 3, backoff_factor: float = 2.0):
        if not api_key:
            raise ValueError(
                "Google Places API key is missing. Set GOOGLE_PLACES_API_KEY in your .env file."
            )
        self.api_key = api_key
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor
        self.session = requests.Session()

    def _post_with_retry(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Performs a POST request with exponential backoff on transient errors."""
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": self.api_key,
            "X-Goog-FieldMask": FIELD_MASK,
        }

        for attempt in range(self.max_retries + 1):
            try:
                response = self.session.post(
                    PLACES_SEARCH_URL,
                    json=payload,
                    headers=headers,
                    timeout=15,
                )

                if response.status_code == 200:
                    return response.json()

                if response.status_code in (429, 500, 502, 503, 504):
                    if attempt < self.max_retries:
                        sleep_time = self.backoff_factor * (2 ** attempt)
                        logger.warning(
                            f"Places API returned HTTP {response.status_code}. "
                            f"Retrying in {sleep_time:.1f}s (Attempt {attempt + 1}/{self.max_retries})..."
                        )
                        time.sleep(sleep_time)
                        continue

                # Non-retriable or retries exhausted
                error_msg = f"Places API failed with HTTP {response.status_code}: {response.text}"
                logger.error(error_msg)
                raise PlacesAPIError(error_msg)

            except requests.exceptions.RequestException as e:
                if attempt < self.max_retries:
                    sleep_time = self.backoff_factor * (2 ** attempt)
                    logger.warning(
                        f"Network error contacting Places API: {e}. "
                        f"Retrying in {sleep_time:.1f}s (Attempt {attempt + 1}/{self.max_retries})..."
                    )
                    time.sleep(sleep_time)
                else:
                    raise PlacesAPIError(f"Network error after {self.max_retries} retries: {e}") from e

        raise PlacesAPIError("Exceeded maximum retries for Places API.")

    def search_location_niche(
        self,
        query: str,
        location: str,
        max_results: int = 50,
        min_reviews: int = 3,
        seen_place_ids: Optional[set] = None,
    ) -> List[Dict[str, Any]]:
        """Searches for businesses matching query in location using pagination.

        Args:
            query: The business niche query (e.g. 'heating engineer')
            location: The city or area (e.g. 'Leeds')
            max_results: Maximum places to collect for this query (up to 60 usually returned by API)
            min_reviews: Minimum number of reviews to accept
            seen_place_ids: Set of place IDs to skip if already processed

        Returns:
            List of parsed and filtered business dictionaries.
        """
        seen_place_ids = seen_place_ids or set()
        collected_places: List[Dict[str, Any]] = []
        page_token: Optional[str] = None
        page_num = 1
        text_query = f"{query} in {location}"

        while len(collected_places) < max_results:
            remaining = max_results - len(collected_places)
            page_size = min(20, remaining)

            payload: Dict[str, Any] = {
                "textQuery": text_query,
                "pageSize": page_size,
            }
            if page_token:
                payload["pageToken"] = page_token

            logger.info(f"Searching: '{text_query}' (Page {page_num}, requesting up to {page_size})...")

            try:
                data = self._post_with_retry(payload)
            except Exception as e:
                logger.error(f"Failed to fetch results for '{text_query}': {e}")
                break

            places_raw = data.get("places", [])
            if not places_raw:
                logger.info(f"No more results returned for '{text_query}'.")
                break

            added_this_page = 0
            for place in places_raw:
                place_id = place.get("id", "")
                if not place_id or place_id in seen_place_ids:
                    continue

                # Status check
                business_status = place.get("businessStatus", "OPERATIONAL")
                if business_status == "CLOSED_PERMANENTLY":
                    continue

                # Review count check
                review_count = place.get("userRatingCount", 0) or 0
                if review_count < min_reviews:
                    continue

                display_name = place.get("displayName", {}).get("text", "")
                if not display_name:
                    continue

                phone = place.get("internationalPhoneNumber") or place.get("nationalPhoneNumber", "")
                website = place.get("websiteUri", "")
                rating = float(place.get("rating", 0.0) or 0.0)
                opening_hours_obj = place.get("regularOpeningHours", {})
                weekday_descriptions = opening_hours_obj.get("weekdayDescriptions", [])
                maps_url = place.get("googleMapsUri", "")
                address = place.get("formattedAddress", "")

                business_record = {
                    "place_id": place_id,
                    "business_name": display_name,
                    "address": address,
                    "phone": phone,
                    "website": website,
                    "rating": rating,
                    "review_count": review_count,
                    "opening_hours": "; ".join(weekday_descriptions) if weekday_descriptions else "",
                    "raw_opening_hours": weekday_descriptions,
                    "google_maps_url": maps_url,
                    "business_status": business_status,
                }

                seen_place_ids.add(place_id)
                collected_places.append(business_record)
                added_this_page += 1

                if len(collected_places) >= max_results:
                    break

            logger.info(
                f"Page {page_num}: retrieved {len(places_raw)} places, "
                f"retained {added_this_page} valid leads (Total for query: {len(collected_places)})."
            )

            page_token = data.get("nextPageToken")
            if not page_token or len(collected_places) >= max_results:
                break

            page_num += 1
            # Delay to allow page token activation in Google Places API
            time.sleep(1.5)

        return collected_places
