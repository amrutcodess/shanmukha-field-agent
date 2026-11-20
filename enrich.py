"""enrich.py - Enriches business leads by inspecting public business websites.

Extracts only publicly published contact information:
- Email addresses (filtering out spam/no-reply, classifying as generic vs direct)
- Contact / owner name if listed
- WhatsApp links (wa.me or api.whatsapp.com)

Respects robots.txt, applies domain rate limiting (1-2s between requests),
caps requests at 3 pages per domain, and never collects personal social media.
"""

import json
import logging
import random
import re
import time
from typing import Any, Dict, List, Optional, Set, Tuple
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

import bs4
from bs4 import BeautifulSoup
import requests

logger = logging.getLogger(__name__)

# Standard user agent for public contact verification
USER_AGENT = "Mozilla/5.0 (compatible; B2BLeadBot/1.0; +https://example.com/bot; public business contact discovery)"

# Regex patterns
EMAIL_REGEX = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")

INVALID_EMAIL_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".css", ".js", ".woff", ".ttf", ".ico"
}

DISALLOWED_EMAIL_PATTERNS = [
    r"no-?reply",
    r"donotreply",
    r"example\.com",
    r"domain\.com",
    r"sentry\.io",
    r"wixpress\.com",
    r"wordpress\.com",
    r"cloudflare",
    r"github",
    r"placeholder",
    r"^test@",
    r"^user@",
    r"^email@",
]

GENERIC_EMAIL_PREFIXES = {
    "info", "contact", "sales", "support", "admin", "office", "hello",
    "enquiries", "inquiries", "help", "service", "team", "mail", "general", "billing", "reception"
}

# Regex to detect owner/founder/director patterns (using horizontal whitespace [ \t] to avoid matching across lines)
OWNER_PATTERNS = [
    re.compile(r"(?:Owner|Founder|Co-Founder|Director|Managing Director|Proprietor|Principal)[\s:]+([A-Z][a-z]+(?:[ \t]+[A-Z][a-z]+){1,2})", re.IGNORECASE),
    re.compile(r"(?:Meet|About)[ \t]+([A-Z][a-z]+(?:[ \t]+[A-Z][a-z]+){1,2})(?:,|\s+-\s+|\s+—\s+|\s+the\s+owner|\s+our\s+founder)", re.IGNORECASE),
    re.compile(r"([A-Z][a-z]+(?:[ \t]+[A-Z][a-z]+){1,2})[,\s]+(?:Owner|Founder|Director|Managing Director|Proprietor)", re.IGNORECASE),
]

DISALLOWED_NAME_TOKENS = {
    "our", "team", "us", "about", "contact", "services", "ltd", "limited", "inc", "llc",
    "co", "company", "heating", "boiler", "cooling", "air", "conditioning", "hvac", "repair",
    "plumbing", "customer", "support", "privacy", "policy", "terms", "home", "call", "now"
}


class WebEnricher:
    """Enriches leads from public company websites."""

    def __init__(self, timeout: int = 10, min_delay: float = 1.0, max_delay: float = 2.0):
        self.timeout = timeout
        self.min_delay = min_delay
        self.max_delay = max_delay
        self.domain_last_request: Dict[str, float] = {}
        self.robot_parsers: Dict[str, RobotFileParser] = {}
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": USER_AGENT})

    def _get_domain(self, url: str) -> str:
        """Extracts normalized hostname from URL."""
        try:
            parsed = urlparse(url)
            netloc = parsed.netloc.lower()
            if netloc.startswith("www."):
                netloc = netloc[4:]
            return netloc
        except Exception:
            return ""

    def _respect_rate_limit(self, domain: str) -> None:
        """Enforces a 1-2 second pause between requests to the same domain."""
        if not domain:
            return
        last_time = self.domain_last_request.get(domain)
        if last_time:
            elapsed = time.time() - last_time
            target_delay = random.uniform(self.min_delay, self.max_delay)
            if elapsed < target_delay:
                sleep_needed = target_delay - elapsed
                time.sleep(sleep_needed)
        self.domain_last_request[domain] = time.time()

    def _is_allowed_by_robots(self, url: str) -> bool:
        """Checks if fetching the URL is permitted by robots.txt."""
        try:
            parsed = urlparse(url)
            if not parsed.scheme or not parsed.netloc:
                return False
            root_url = f"{parsed.scheme}://{parsed.netloc}"
            domain = parsed.netloc.lower()

            if domain not in self.robot_parsers:
                robots_url = f"{root_url}/robots.txt"
                rp = RobotFileParser()
                rp.set_url(robots_url)
                try:
                    self._respect_rate_limit(domain)
                    res = self.session.get(robots_url, timeout=5)
                    if res.status_code == 200:
                        rp.parse(res.text.splitlines())
                    else:
                        # 404 or other code implies no specific restrictions
                        rp.allow_all = True
                except Exception:
                    # On network error fetching robots.txt, default to permissive
                    rp.allow_all = True
                self.robot_parsers[domain] = rp

            rp = self.robot_parsers[domain]
            return rp.can_fetch(USER_AGENT, url)
        except Exception:
            return True

    def _fetch_html(self, url: str) -> Optional[str]:
        """Safely fetches HTML content respecting robots.txt and timeouts."""
        try:
            domain = self._get_domain(url)
            if not self._is_allowed_by_robots(url):
                logger.debug(f"Skipping {url}: Disallowed by robots.txt")
                return None

            self._respect_rate_limit(domain)
            response = self.session.get(url, timeout=self.timeout, allow_redirects=True)
            if response.status_code == 200 and "text/html" in response.headers.get("Content-Type", ""):
                return response.text
        except Exception as e:
            logger.debug(f"Could not fetch {url}: {e}")
        return None

    def _discover_relevant_pages(self, homepage_url: str, soup: BeautifulSoup) -> List[str]:
        """Finds up to 2 contact or about URLs from the homepage."""
        discovered: List[str] = []
        home_parsed = urlparse(homepage_url)
        home_netloc = home_parsed.netloc.lower()

        keywords = ["contact", "about", "team", "reach", "touch"]

        for a in soup.find_all("a", href=True):
            href = a["href"].strip()
            text = (a.get_text() or "").lower()

            # Ignore non-http links, tel, mailto, javascript
            if not href or href.startswith(("#", "javascript:", "mailto:", "tel:")):
                continue

            full_url = urljoin(homepage_url, href)
            parsed_full = urlparse(full_url)

            # Must be internal to the same domain
            if parsed_full.netloc.lower() != home_netloc:
                continue

            # Must not be the homepage itself
            if parsed_full.path in ("", "/"):
                continue

            href_lower = full_url.lower()
            if any(kw in href_lower or kw in text for kw in keywords):
                # Clean URL (strip fragments and query)
                clean_url = f"{parsed_full.scheme}://{parsed_full.netloc}{parsed_full.path}"
                if clean_url not in discovered and clean_url != homepage_url:
                    discovered.append(clean_url)
                    if len(discovered) >= 2:
                        break

        return discovered

    def _extract_emails_from_text(self, text: str, soup: BeautifulSoup) -> Set[str]:
        """Extracts valid business emails from text and mailto: links."""
        emails: Set[str] = set()

        # 1. Mailto links
        for a in soup.find_all("a", href=True):
            href = a["href"].strip()
            if href.lower().startswith("mailto:"):
                raw_mail = href.split(":", 1)[1].split("?")[0].strip()
                if raw_mail:
                    emails.add(raw_mail.lower())

        # 2. Text matches
        for match in EMAIL_REGEX.findall(text):
            emails.add(match.lower())

        valid_emails: Set[str] = set()
        for email in emails:
            # Check length and dots
            if len(email) > 80 or "@" not in email:
                continue

            # Check invalid file extensions
            if any(email.endswith(ext) for ext in INVALID_EMAIL_EXTENSIONS):
                continue

            # Check disallowed patterns
            if any(re.search(pat, email) for pat in DISALLOWED_EMAIL_PATTERNS):
                continue

            valid_emails.add(email)

        return valid_emails

    def _extract_whatsapp_link(self, soup: BeautifulSoup, page_text: str) -> Optional[str]:
        """Extracts wa.me or api.whatsapp.com links."""
        # 1. Search hrefs
        for a in soup.find_all("a", href=True):
            href = a["href"].strip()
            if "wa.me/" in href or "api.whatsapp.com/send" in href or "web.whatsapp.com/send" in href:
                return href

        # 2. Search raw text for wa.me link
        wa_match = re.search(r"https?://wa\.me/[0-9+]+", page_text)
        if wa_match:
            return wa_match.group(0)

        return None

    def _extract_contact_name(self, soup: BeautifulSoup, text: str) -> Optional[str]:
        """Extracts contact or owner name from schema.org JSON-LD or page text."""
        # 1. Schema.org JSON-LD
        for script in soup.find_all("script", type="application/ld+json"):
            try:
                data = json.loads(script.string or "")
                if isinstance(data, dict):
                    # Person schema
                    if data.get("@type") == "Person" and data.get("name"):
                        name = str(data.get("name")).strip()
                        if 3 <= len(name) <= 40:
                            return name
                    # Founder / employee in LocalBusiness or Organization
                    for field in ("founder", "director", "employee"):
                        person = data.get(field)
                        if isinstance(person, dict) and person.get("name"):
                            return str(person.get("name")).strip()
                        elif isinstance(person, str) and 3 <= len(person) <= 40:
                            return person
            except Exception:
                continue

        # 2. Regex matching on visible text
        for pattern in OWNER_PATTERNS:
            match = pattern.search(text)
            if match:
                candidate = match.group(1).strip()
                # Sanity check candidate words
                tokens = candidate.lower().split()
                if any(tok in DISALLOWED_NAME_TOKENS for tok in tokens):
                    continue
                if 3 <= len(candidate) <= 35:
                    return candidate

        return None

    def enrich(self, website_url: str) -> Dict[str, Any]:
        """Enriches lead from the business website (up to 3 pages).

        Args:
            website_url: Homepage URL of the business.

        Returns:
            Dict containing domain, email, email_type, contact_name, whatsapp_link.
        """
        result: Dict[str, Any] = {
            "website_domain": "",
            "email": "",
            "email_type": "none",
            "contact_name": "",
            "whatsapp_link": "",
        }

        if not website_url or not isinstance(website_url, str):
            return result

        domain = self._get_domain(website_url)
        result["website_domain"] = domain
        if not domain:
            return result

        # Ensure scheme
        target_url = website_url
        if not target_url.startswith(("http://", "https://")):
            target_url = "https://" + target_url

        # Fetch Homepage
        home_html = self._fetch_html(target_url)
        if not home_html:
            return result

        try:
            home_soup = BeautifulSoup(home_html, "html.parser")
        except Exception:
            return result

        # Pages to process: Homepage + up to 2 discovered pages
        pages_to_fetch = [target_url]
        subpages = self._discover_relevant_pages(target_url, home_soup)
        pages_to_fetch.extend(subpages[:2])  # Max 3 pages total

        all_emails: Set[str] = set()
        whatsapp_link: Optional[str] = None
        contact_name: Optional[str] = None

        for idx, page_url in enumerate(pages_to_fetch):
            try:
                if idx == 0:
                    soup = home_soup
                    html = home_html
                else:
                    html = self._fetch_html(page_url)
                    if not html:
                        continue
                    soup = BeautifulSoup(html, "html.parser")

                # Remove script and style elements for clean text
                for script in soup(["script", "style", "noscript", "svg"]):
                    script.extract()

                page_text = soup.get_text(separator=" ", strip=True)

                # Extract emails
                page_emails = self._extract_emails_from_text(page_text, soup)
                all_emails.update(page_emails)

                # Extract WhatsApp link
                if not whatsapp_link:
                    whatsapp_link = self._extract_whatsapp_link(soup, page_text)

                # Extract contact name
                if not contact_name:
                    contact_name = self._extract_contact_name(soup, page_text)

            except Exception as e:
                logger.debug(f"Error processing page {page_url}: {e}")

        # Choose best email and classify
        if all_emails:
            # Check for direct vs generic
            direct_emails = []
            generic_emails = []

            for email in all_emails:
                prefix = email.split("@")[0].lower()
                if any(prefix.startswith(gen) for gen in GENERIC_EMAIL_PREFIXES):
                    generic_emails.append(email)
                else:
                    direct_emails.append(email)

            if direct_emails:
                result["email"] = sorted(direct_emails)[0]
                result["email_type"] = "direct"
            else:
                result["email"] = sorted(generic_emails)[0]
                result["email_type"] = "generic"

        if whatsapp_link:
            result["whatsapp_link"] = whatsapp_link

        if contact_name:
            result["contact_name"] = contact_name

        return result
