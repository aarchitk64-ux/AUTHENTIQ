
from difflib import SequenceMatcher
from urllib.parse import urlparse
import re


DISCLAIMER = (
    "AUTHENTIQ uses heuristic signals from manually supplied data. "
    "A risk score is not proof of impersonation or authenticity. "
    "Verify the evidence independently before taking action."
)


def normalize_text(value: str) -> str:
    """Normalize text and common number-to-letter substitutions."""
    value = value.lower()

    substitutions = {
        "0": "o",
        "1": "i",
        "3": "e",
        "4": "a",
        "5": "s",
        "7": "t",
    }

    for number, letter in substitutions.items():
        value = value.replace(number, letter)

    return re.sub(r"[^a-z0-9]", "", value)


def get_domain(url: str) -> str:
    """Extract a lowercase hostname from a URL."""
    if not url or not url.strip():
        return ""

    value = url.strip()

    if "://" not in value:
        value = "https://" + value

    try:
        hostname = urlparse(value).hostname or ""
        return hostname.lower().removeprefix("www.")
    except ValueError:
        return ""


def similarity_score(first: str, second: str) -> int:
    """Return normalized text similarity from 0 to 100."""
    first = normalize_text(first)
    second = normalize_text(second)

    if not first or not second:
        return 0

    return round(
        SequenceMatcher(None, first, second).ratio() * 100
    )


def handle_identity(handle: str) -> str:
    """Normalize a social handle or profile URL."""
    value = handle.strip().rstrip("/")

    if not value:
        return ""

    if "://" in value:
        path = urlparse(value).path.strip("/")
        value = path.split("/")[-1] if path else ""

    return normalize_text(value.lstrip("@"))


def analyze_candidate(
    brand_name: str,
    official_website: str,
    official_social_handles: list[str],
    candidate_name: str,
    candidate_url: str = "",
    candidate_handle: str = "",
    publisher_name: str = "",
    candidate_type: str = "social_profile",
) -> dict:
    """Calculate an explainable heuristic risk score."""

    if candidate_type not in {"social_profile", "app_listing"}:
        raise ValueError(
            "candidate_type must be social_profile or app_listing"
        )

    signals = []
    score = 0

    def add_signal(name: str, points: int, details: str) -> None:
        nonlocal score
        signals.append({
            "name": name,
            "points": points,
            "details": details,
        })
        score += points

    official_domain = get_domain(official_website)
    candidate_domain = get_domain(candidate_url)

    official_handles = {
        handle_identity(handle)
        for handle in official_social_handles
        if handle_identity(handle)
    }

    candidate_identity = handle_identity(candidate_handle)

    # Recognize a registered official social handle.
    if (
        candidate_type == "social_profile"
        and candidate_identity
        and candidate_identity in official_handles
    ):
        return {
            "risk_score": 0,
            "risk_level": "Known Official Match",
            "signals": [{
                "name": "Registered official handle",
                "points": 0,
                "details": (
                    "The supplied handle matches a registered official "
                    "handle. This does not independently verify "
                    "account ownership."
                ),
            }],
            "disclaimer": DISCLAIMER,
        }

    brand_normalized = normalize_text(brand_name)
    candidate_normalized = normalize_text(candidate_name)
    name_similarity = similarity_score(brand_name, candidate_name)

    # Candidate-name analysis.
    if (
        brand_normalized
        and brand_normalized in candidate_normalized
    ):
        add_signal(
            "Brand name appears in candidate name",
            30,
            f"The candidate name contains a normalized match for "
            f"'{brand_name}'. Authorized partners or resellers may "
            "also legitimately mention a brand.",
        )
    elif name_similarity >= 55:
        add_signal(
            "Similar brand name",
            20,
            f"The normalized candidate name has {name_similarity}% "
            "similarity to the registered brand name.",
        )

    # Social-handle analysis applies only to social profiles.
    if candidate_type == "social_profile":
        handle_normalized = normalize_text(candidate_handle)

        if (
            brand_normalized
            and handle_normalized
            and brand_normalized in handle_normalized
            and candidate_identity not in official_handles
        ):
            add_signal(
                "Brand-like social handle",
                15,
                "The candidate handle contains a normalized match "
                "for the brand but is not a registered official handle.",
            )

    # Domain analysis.
    # Only flag a look-alike when the hostname's first label resembles
    # the official domain's first label. Do not treat every subdomain
    # containing a brand word as a suspicious registered domain.
    if candidate_domain and official_domain:
        if candidate_domain == official_domain:
            signals.append({
                "name": "Official domain match",
                "points": 0,
                "details": (
                    "The hostname matches the registered official "
                    "hostname. This alone does not verify identity."
                ),
            })
        else:
            official_label = official_domain.split(".")[0]
            candidate_label = candidate_domain.split(".")[0]

            # Detect subdomains of the official hostname.
            is_official_subdomain = candidate_domain.endswith(
                "." + official_domain
            )

            # For this prototype, avoid flagging a brand-like subdomain
            # when it is hosted beneath a different parent hostname,
            # such as nike-shop.example.com.
            candidate_parts = candidate_domain.split(".")
            official_parts = official_domain.split(".")

            candidate_parent = (
                ".".join(candidate_parts[-2:])
                if len(candidate_parts) >= 2
                else candidate_domain
            )
            official_parent = (
                ".".join(official_parts[-2:])
                if len(official_parts) >= 2
                else official_domain
            )

            same_parent = candidate_parent == official_parent

            if is_official_subdomain:
                signals.append({
                    "name": "Official domain subdomain",
                    "points": 0,
                    "details": (
                        "The hostname is a subdomain of the registered "
                        "official hostname. Verify the specific service "
                        "before trusting it."
                    ),
                })
            elif same_parent:
                signals.append({
                    "name": "Same parent domain",
                    "points": 0,
                    "details": (
                        "The hostname shares the same basic parent-domain "
                        "label as the registered domain."
                    ),
                })
            else:
                domain_similarity = similarity_score(
                    official_label,
                    candidate_label,
                )

                official_label_normalized = normalize_text(official_label)
                candidate_label_normalized = normalize_text(candidate_label)

                looks_like_brand = (
    domain_similarity >= 75
    or (
        len(official_label_normalized) >= 4
        and official_label_normalized
        in candidate_label_normalized
        and candidate_domain.endswith("." + official_domain)
    )
)

                if looks_like_brand:
                    add_signal(
                        "Look-alike domain",
                        30,
                        f"Candidate hostname '{candidate_domain}' "
                        f"resembles the registered hostname "
                        f"'{official_domain}'. Similarity alone does "
                        "not prove abuse.",
                    )

    # Publisher comparison applies only to mobile app listings.
    if candidate_type == "app_listing" and publisher_name.strip():
        publisher_normalized = normalize_text(publisher_name)

        if publisher_normalized != brand_normalized:
            add_signal(
                "Publisher name differs from brand",
                10,
                f"Publisher '{publisher_name}' differs from the "
                f"registered brand name '{brand_name}'. Authorized "
                "developers or subsidiaries may publish apps.",
            )

    # Keep scores within the 0–100 range.
    score = min(score, 100)

    if score >= 70:
        level = "High"
    elif score >= 40:
        level = "Medium"
    elif score >= 15:
        level = "Low"
    else:
        level = "Minimal"

    if not signals:
        signals.append({
            "name": "Insufficient risk signals",
            "points": 0,
            "details": (
                "No configured risk rules matched. This does not "
                "establish that the candidate is safe."
            ),
        })

    return {
        "risk_score": score,
        "risk_level": level,
        "signals": signals,
        "disclaimer": DISCLAIMER,
    }
