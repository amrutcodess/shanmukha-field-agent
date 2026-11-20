"""clean.py - Data cleaning, phone normalization, IST call window calculation,
and lead scoring for B2B outreach leads.
"""

from datetime import datetime, time as dtime
import logging
import re
from typing import Any, Dict, List, Optional, Tuple
import zoneinfo

import phonenumbers
from phonenumbers import PhoneNumberType

logger = logging.getLogger(__name__)

IST_TIMEZONE = zoneinfo.ZoneInfo("Asia/Kolkata")


def normalize_phone(raw_phone: str, country_code: str) -> Tuple[str, str]:
    """Normalizes phone number to E.164 and determines phone type.

    Args:
        raw_phone: Raw phone string from Places API
        country_code: ISO 2-letter country code (e.g. 'GB', 'AE', 'US')

    Returns:
        Tuple of (e164_formatted_number, phone_type)
        phone_type is one of: 'mobile', 'landline', 'unknown'
    """
    if not raw_phone:
        return "", "unknown"

    clean_digits = re.sub(r"[^\d+]", "", raw_phone)
    if not clean_digits:
        return "", "unknown"

    try:
        parsed = phonenumbers.parse(raw_phone, country_code.upper())
        if phonenumbers.is_valid_number(parsed):
            e164 = phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
            ptype = phonenumbers.number_type(parsed)

            if ptype == PhoneNumberType.MOBILE:
                phone_type = "mobile"
            elif ptype == PhoneNumberType.FIXED_LINE:
                phone_type = "landline"
            elif ptype == PhoneNumberType.FIXED_LINE_OR_MOBILE:
                # Disambiguate using country-specific prefixes
                if country_code.upper() == "GB" and e164.startswith("+447"):
                    phone_type = "mobile"
                elif country_code.upper() == "AE" and e164.startswith("+9715"):
                    phone_type = "mobile"
                else:
                    phone_type = "unknown"
            else:
                phone_type = "unknown"

            return e164, phone_type

    except Exception:
        pass

    # Fallback heuristic if phonenumbers fails on slightly malformed inputs
    if country_code.upper() == "GB" and (clean_digits.startswith("+447") or clean_digits.startswith("07")):
        return clean_digits, "mobile"
    if country_code.upper() == "AE" and (clean_digits.startswith("+9715") or clean_digits.startswith("05")):
        return clean_digits, "mobile"

    return clean_digits, "unknown"


def calculate_best_call_time_ist(timezone_str: str) -> str:
    """Calculates suggested call window in IST corresponding to 9am - 5pm in business timezone.

    Args:
        timezone_str: IANA timezone string (e.g. 'Europe/London', 'Asia/Dubai', 'America/New_York')

    Returns:
        Formatted IST time range string.
    """
    try:
        biz_tz = zoneinfo.ZoneInfo(timezone_str)
    except Exception:
        biz_tz = zoneinfo.ZoneInfo("UTC")

    now = datetime.now(biz_tz)
    local_start = datetime(now.year, now.month, now.day, 9, 0, tzinfo=biz_tz)
    local_end = datetime(now.year, now.month, now.day, 17, 0, tzinfo=biz_tz)

    ist_start = local_start.astimezone(IST_TIMEZONE)
    ist_end = local_end.astimezone(IST_TIMEZONE)

    return f"{ist_start.strftime('%H:%M')} - {ist_end.strftime('%H:%M')} IST (09:00 - 17:00 local)"


def analyze_opening_hours(weekday_descriptions: List[str]) -> bool:
    """Detects if business hours do not cover evenings or weekends (missed call problem).

    Returns:
        True if the business closes before/at 6 PM weekdays and is closed on weekends.
    """
    if not weekday_descriptions:
        return False

    hours_text = " ".join(weekday_descriptions).lower()

    # Check weekend closure (Saturday or Sunday closed)
    weekend_closed = (
        "saturday: closed" in hours_text
        or "sunday: closed" in hours_text
        or "closed saturday" in hours_text
        or "closed sunday" in hours_text
    )

    # Check evening closure: closes by 17:00, 17:30, or 18:00 (5:00 PM - 6:00 PM)
    # Match patterns like "5:00 pm", "5:30 pm", "6:00 pm", "17:00", "18:00"
    early_weekday_close = False
    for line in weekday_descriptions:
        line_lower = line.lower()
        if any(day in line_lower for day in ["monday", "tuesday", "wednesday", "thursday", "friday"]):
            if "open 24 hours" in line_lower:
                return False
            if re.search(r"(?:[45]:\d\d\s*pm|1[67]:\d\d|6:00\s*pm|18:00)", line_lower):
                early_weekday_close = True
                break

    # If both weekend is closed/limited and weekdays close early, high likelihood of missed evening/weekend calls
    return weekend_closed or early_weekday_close


def calculate_lead_score(
    rating: float,
    review_count: int,
    has_missed_call_hours: bool,
    whatsapp_likely: bool,
    email: str,
    email_type: str,
) -> int:
    """Calculates lead score (0-100) based on review volume, rating, and missed-call opportunities.

    Criteria:
    - Higher for businesses with 30+ reviews, rating >= 4.0, and early closure/weekend off.
    - Additional points for reachable channels (mobile/WhatsApp, direct email).
    """
    score = 10  # Base score

    # Review count score
    if review_count >= 100:
        score += 30
    elif review_count >= 30:
        score += 25
    elif review_count >= 10:
        score += 10
    elif review_count >= 3:
        score += 5

    # Rating score
    if rating >= 4.5:
        score += 25
    elif rating >= 4.0:
        score += 20
    elif rating >= 3.5:
        score += 10

    # Missed call opportunity (limited evening / weekend coverage)
    if has_missed_call_hours:
        score += 25

    # Contactability bonus
    if whatsapp_likely:
        score += 10

    if email:
        if email_type == "direct":
            score += 10
        else:
            score += 5

    return min(100, max(0, score))


def determine_data_confidence(has_phone: bool, has_website: bool, review_count: int) -> str:
    """Calculates data confidence level: high, medium, or low."""
    present_count = 0
    if has_phone:
        present_count += 1
    if has_website:
        present_count += 1
    if review_count > 0:
        present_count += 1

    if present_count == 3:
        return "high"
    elif present_count == 2:
        return "medium"
    return "low"


def clean_and_score_lead(
    place_record: Dict[str, Any],
    enrich_record: Dict[str, Any],
    market_config: Dict[str, Any],
    search_query: str,
    location: str,
) -> Dict[str, Any]:
    """Combines place data and enriched website data into a finalized, scored lead record."""
    country_code = market_config.get("country_code", "US")
    market_name = market_config.get("name", "Unknown")
    timezone_str = market_config.get("timezone", "UTC")

    # Phone normalization
    raw_phone = place_record.get("phone", "")
    phone_normalized, phone_type = normalize_phone(raw_phone, country_code)

    # WhatsApp likely heuristic (Note: this is strictly an estimate, never confirmed)
    has_wa_link = bool(enrich_record.get("whatsapp_link"))
    whatsapp_likely = (phone_type == "mobile") or has_wa_link

    # Opening hours analysis
    weekday_hours = place_record.get("raw_opening_hours", [])
    has_missed_call_hours = analyze_opening_hours(weekday_hours)

    # Lead scoring
    rating = place_record.get("rating", 0.0)
    review_count = place_record.get("review_count", 0)
    email = enrich_record.get("email", "")
    email_type = enrich_record.get("email_type", "none")
    lead_score = calculate_lead_score(
        rating=rating,
        review_count=review_count,
        has_missed_call_hours=has_missed_call_hours,
        whatsapp_likely=whatsapp_likely,
        email=email,
        email_type=email_type,
    )

    # Best call time in IST
    best_call_time_ist = calculate_best_call_time_ist(timezone_str)

    # Data confidence
    data_confidence = determine_data_confidence(
        has_phone=bool(phone_normalized or raw_phone),
        has_website=bool(place_record.get("website")),
        review_count=review_count,
    )

    today_str = datetime.now().strftime("%Y-%m-%d")

    return {
        "business_name": place_record.get("business_name", ""),
        "place_id": place_record.get("place_id", ""),
        "market": market_name,
        "search_query": search_query,
        "location": location,
        "lead_score": lead_score,
        "rating": rating,
        "review_count": review_count,
        "phone": raw_phone,
        "phone_normalized": phone_normalized,
        "phone_type": phone_type,
        "whatsapp_likely": whatsapp_likely,
        "whatsapp_link": enrich_record.get("whatsapp_link", ""),
        "website": place_record.get("website", ""),
        "website_domain": enrich_record.get("website_domain", ""),
        "email": email,
        "email_type": email_type,
        "contact_name": enrich_record.get("contact_name", ""),
        "address": place_record.get("address", ""),
        "opening_hours": place_record.get("opening_hours", ""),
        "no_evening_or_weekend_coverage": has_missed_call_hours,
        "best_call_time_ist": best_call_time_ist,
        "data_confidence": data_confidence,
        "google_maps_url": place_record.get("google_maps_url", ""),
        "business_status": place_record.get("business_status", "OPERATIONAL"),
        "contact_status": "new",
        "stage": "new",
        "last_contacted_date": "",
        "next_follow_up_date": "",
        "channel_used": "",
        "reply_notes": "",
        "notes": "",
        "date_added": today_str,
    }
