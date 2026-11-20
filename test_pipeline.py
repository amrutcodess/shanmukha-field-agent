"""test_pipeline.py - Automated tests for the B2B lead generation modules.
"""

from datetime import datetime, timedelta
import os
import unittest
from unittest.mock import MagicMock, patch

from clean import (
    analyze_opening_hours,
    calculate_best_call_time_ist,
    calculate_lead_score,
    clean_and_score_lead,
    determine_data_confidence,
    normalize_phone,
)
from enrich import WebEnricher
from output import (
    CSV_COLUMNS,
    append_leads_to_csv,
    load_existing_leads_index,
    show_followups_due,
)
from places import PlacesClient


class TestPhoneAndScore(unittest.TestCase):
    def test_phone_normalization_uk(self):
        # UK mobile
        e164, ptype = normalize_phone("07123 456789", "GB")
        self.assertEqual(e164, "+447123456789")
        self.assertEqual(ptype, "mobile")

        # UK landline (Leeds area code 0113)
        e164, ptype = normalize_phone("0113 243 1234", "GB")
        self.assertEqual(e164, "+441132431234")
        self.assertEqual(ptype, "landline")

    def test_phone_normalization_uae(self):
        # UAE mobile
        e164, ptype = normalize_phone("050 123 4567", "AE")
        self.assertEqual(e164, "+971501234567")
        self.assertEqual(ptype, "mobile")

        # UAE landline (Dubai 04)
        e164, ptype = normalize_phone("04 234 5678", "AE")
        self.assertEqual(e164, "+97142345678")
        self.assertEqual(ptype, "landline")

    def test_best_call_time_ist(self):
        # Should generate a non-empty string mentioning IST
        uk_time = calculate_best_call_time_ist("Europe/London")
        uae_time = calculate_best_call_time_ist("Asia/Dubai")
        us_time = calculate_best_call_time_ist("America/New_York")

        self.assertIn("IST", uk_time)
        self.assertIn("09:00 - 17:00 local", uk_time)
        self.assertIn("IST", uae_time)
        self.assertIn("IST", us_time)

    def test_analyze_opening_hours(self):
        weekday_descriptions = [
            "Monday: 8:00 AM – 5:00 PM",
            "Tuesday: 8:00 AM – 5:00 PM",
            "Wednesday: 8:00 AM – 5:00 PM",
            "Thursday: 8:00 AM – 5:00 PM",
            "Friday: 8:00 AM – 5:00 PM",
            "Saturday: Closed",
            "Sunday: Closed",
        ]
        self.assertTrue(analyze_opening_hours(weekday_descriptions))

        open_24h = [
            "Monday: Open 24 hours",
            "Tuesday: Open 24 hours",
            "Wednesday: Open 24 hours",
            "Thursday: Open 24 hours",
            "Friday: Open 24 hours",
            "Saturday: Open 24 hours",
            "Sunday: Open 24 hours",
        ]
        self.assertFalse(analyze_opening_hours(open_24h))

    def test_lead_scoring(self):
        # High-potential missed-call lead: high rating, 40 reviews, missed call hours, direct email, mobile
        high_score = calculate_lead_score(
            rating=4.8,
            review_count=40,
            has_missed_call_hours=True,
            whatsapp_likely=True,
            email="dave@leedsboilers.co.uk",
            email_type="direct",
        )
        self.assertGreaterEqual(high_score, 80)

        # Low-potential lead: 3.2 rating, 4 reviews, open 24h, no email
        low_score = calculate_lead_score(
            rating=3.2,
            review_count=4,
            has_missed_call_hours=False,
            whatsapp_likely=False,
            email="",
            email_type="none",
        )
        self.assertLess(low_score, 40)

    def test_data_confidence(self):
        self.assertEqual(determine_data_confidence(True, True, 10), "high")
        self.assertEqual(determine_data_confidence(True, False, 10), "medium")
        self.assertEqual(determine_data_confidence(False, False, 0), "low")


class TestEnrichment(unittest.TestCase):
    def setUp(self):
        self.enricher = WebEnricher()

    def test_email_extraction_and_filtering(self):
        from bs4 import BeautifulSoup
        html = """
        <html>
            <body>
                <p>Welcome to Dave's Boilers!</p>
                <a href="mailto:info@davesboilers.co.uk">Email Us</a>
                <p>For urgent inquiries contact dave.miller@davesboilers.co.uk</p>
                <p>Do not contact noreply@davesboilers.co.uk or logo@image.png</p>
            </body>
        </html>
        """
        soup = BeautifulSoup(html, "html.parser")
        text = soup.get_text(separator=" ")
        emails = self.enricher._extract_emails_from_text(text, soup)

        self.assertIn("info@davesboilers.co.uk", emails)
        self.assertIn("dave.miller@davesboilers.co.uk", emails)
        self.assertNotIn("noreply@davesboilers.co.uk", emails)
        self.assertNotIn("logo@image.png", emails)

    def test_whatsapp_link_extraction(self):
        from bs4 import BeautifulSoup
        html = """
        <div>
            <a href="https://wa.me/447123456789">Chat on WhatsApp</a>
        </div>
        """
        soup = BeautifulSoup(html, "html.parser")
        text = soup.get_text()
        wa = self.enricher._extract_whatsapp_link(soup, text)
        self.assertEqual(wa, "https://wa.me/447123456789")

    def test_contact_name_extraction(self):
        from bs4 import BeautifulSoup
        html = """
        <div>
            <p>Owner: Marcus Henderson</p>
            <p>We are a family run heating company.</p>
        </div>
        """
        soup = BeautifulSoup(html, "html.parser")
        text = soup.get_text()
        name = self.enricher._extract_contact_name(soup, text)
        self.assertEqual(name, "Marcus Henderson")


class TestOutputAndCSV(unittest.TestCase):
    def test_csv_append_and_deduplication(self):
        test_csv = "test_temp_leads.csv"
        if os.path.exists(test_csv):
            os.remove(test_csv)

        try:
            lead1 = {
                "business_name": "Apex Heating",
                "place_id": "ChIJ_TEST_1",
                "market": "UK",
                "search_query": "heating engineer",
                "location": "Leeds",
                "lead_score": 85,
                "rating": 4.9,
                "review_count": 52,
                "phone": "07123 456789",
                "phone_normalized": "+447123456789",
                "phone_type": "mobile",
                "whatsapp_likely": True,
                "whatsapp_link": "https://wa.me/447123456789",
                "website": "https://apexheating.co.uk",
                "website_domain": "apexheating.co.uk",
                "email": "apex@apexheating.co.uk",
                "email_type": "generic",
                "contact_name": "John Apex",
                "address": "123 High St, Leeds",
                "opening_hours": "Mon-Fri 8am-5pm",
                "no_evening_or_weekend_coverage": True,
                "best_call_time_ist": "14:30 - 22:30 IST",
                "data_confidence": "high",
                "google_maps_url": "https://maps.google.com/?cid=1",
                "business_status": "OPERATIONAL",
                "contact_status": "new",
                "stage": "new",
                "last_contacted_date": "",
                "next_follow_up_date": datetime.now().strftime("%Y-%m-%d"),
                "channel_used": "call",
                "reply_notes": "Needs after-hours answering audit",
                "notes": "",
                "date_added": "2026-11-02",
            }

            # Write first lead
            written = append_leads_to_csv([lead1], test_csv)
            self.assertEqual(written, 1)

            # Check index loading
            p_ids, phones, domains = load_existing_leads_index(test_csv)
            self.assertIn("ChIJ_TEST_1", p_ids)
            self.assertIn("+447123456789", phones)
            self.assertIn("apexheating.co.uk", domains)

            # Test show_followups_due runs without error
            show_followups_due(test_csv)

        finally:
            if os.path.exists(test_csv):
                os.remove(test_csv)


if __name__ == "__main__":
    unittest.main()
