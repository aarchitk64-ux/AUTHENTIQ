
from difflib import SequenceMatcher
from urllib.parse import urlparse
import re


DISCLAIMER = (
    "AUTHENTIQ uses heuristic signals from manually supplied data. "
    "A risk score is not proof of impersonation or authenticity. "
    "Verify the evidence independently before taking action."
)

VALID_CANDIDATE_TYPES = {"social_profile", "app_listing"}


def safe_text(value) -> str:
    """Convert optional input values into safe strings."""
    if value is None:
        return ""
    if not isinstance(value, str):
        return str(value)
    return value.strip()


def normalize_text(value: str) -> str:
    """Normalize text and common number-to-letter substitutions."""
    value = safe_text(value).lower()

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
    value = safe_text(url)

    if not value:
        return ""

    if "://" not in value:
        value = "https://" + value

    try:
        parsed = urlparse(value)
        hostname = (parsed.hostname or "").lower().rstrip(".")
        return hostname.removeprefix("www.")
    except (ValueError, AttributeError):
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
    value = safe_text(handle).rstrip("/")

    if not value:
        return ""

    if "://" in value:
        try:
            parsed = urlparse(value)
            path = parsed.path.strip("/")
            value = path.split("/")[-1] if path else ""
        except ValueError:
            return ""

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
    """Calculate a bounded, explainable heuristic risk score."""

    if candidate_type not in VALID_CANDIDATE_TYPES:
        raise ValueError(
            "candidate_type must be social_profile or app_listing"
        )

    brand_name = safe_text(brand_name)
    official_website = safe_text(official_website)
    candidate_name = safe_text(candidate_name)
    candidate_url = safe_text(candidate_url)
    candidate_handle = safe_text(candidate_handle)
    publisher_name = safe_text(publisher_name)

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

    brand_normalized = normalize_text(brand_name)
    candidate_normalized = normalize_text(candidate_name)

    official_domain = get_domain(official_website)
    candidate_domain = get_domain(candidate_url)

    supplied_handles = (
        official_social_handles
        if isinstance(official_social_handles, (list, tuple, set))
        else []
    )

    official_handles = {
        handle_identity(handle)
        for handle in supplied_handles
        if handle_identity(handle)
    }

    candidate_identity = handle_identity(candidate_handle)

    # A registered handle is a configured match, not independent
    # verification of account ownership.
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
                    "handle. This configured match does not independently "
                    "verify account ownership."
                ),
            }],
            "disclaimer": DISCLAIMER,
        }

    # 1. Candidate-name analysis.
    if brand_normalized and brand_normalized in candidate_normalized:
        add_signal(
            "Brand name appears in candidate name",
            30,
            f"The candidate name contains a normalized match for "
            f"'{brand_name}'. Authorized partners, resellers, and support "
            "accounts may also legitimately mention a brand.",
        )
    else:
        name_similarity = similarity_score(
            brand_name,
            candidate_name,
        )

        if name_similarity >= 55:
            add_signal(
                "Similar brand name",
                20,
                f"The normalized candidate name has {name_similarity}% "
                "similarity to the registered brand name.",
            )

    # 2. Social-handle analysis.
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
                "The candidate handle contains a normalized match for "
                "the brand but is not a registered official handle. "
                "This is a similarity signal, not proof of impersonation.",
            )

    # 3. Website-domain analysis.
    if candidate_domain and official_domain:
        if candidate_domain == official_domain:
            signals.append({
                "name": "Official domain match",
                "points": 0,
                "details": (
                    "The hostname matches the registered official "
                    "hostname. This alone does not verify the identity "
                    "or legitimacy of the specific page."
                ),
            })

        elif candidate_domain.endswith("." + official_domain):
            signals.append({
                "name": "Official domain subdomain",
                "points": 0,
                "details": (
                    "The hostname is a subdomain of the registered "
                    "official hostname. Verify the specific service "
                    "before trusting it."
                ),
            })

        else:
            official_label = official_domain.split(".")[0]
            candidate_label = candidate_domain.split(".")[0]

            official_label_normalized = normalize_text(official_label)
            candidate_label_normalized = normalize_text(candidate_label)

            domain_similarity = similarity_score(
                official_label,
                candidate_label,
            )

            # A brand embedded in a different hostname can be relevant
            # even when the entire hostname is not a close string match.
            brand_in_hostname = (
                bool(official_label_normalized)
                and official_label_normalized in candidate_label_normalized
                and candidate_label_normalized != official_label_normalized
            )

            if domain_similarity >= 75 or brand_in_hostname:
                add_signal(
                    "Look-alike domain",
                    30,
                    f"Candidate hostname '{candidate_domain}' resembles "
                    f"or contains the registered hostname label "
                    f"'{official_label}'. Similarity alone does not "
                    "prove abuse; independently verify domain ownership.",
                )

    # 4. Publisher analysis for mobile-app listings.
    if candidate_type == "app_listing" and publisher_name:
        publisher_normalized = normalize_text(publisher_name)

        if (
            brand_normalized
            and publisher_normalized
            and publisher_normalized != brand_normalized
        ):
            add_signal(
                "Publisher name differs from brand",
                10,
                f"Publisher '{publisher_name}' differs from the "
                f"registered brand name '{brand_name}'. Authorized "
                "developers, subsidiaries, and contractors may publish "
                "legitimate apps.",
            )

    # 5. Clamp the total score to the supported range.
    score = max(0, min(score, 100))

    # Keep risk labels compatible with tests expecting Low, Medium,
    # or High. The official-handle early return remains a special case.
    if score >= 70:
        level = "High"
    elif score >= 40:
        level = "Medium"
    else:
        level = "Low"

    if not signals:
        signals.append({
            "name": "Insufficient risk signals",
            "points": 0,
            "details": (
                "No configured risk rules matched. This does not "
                "establish that the candidate is safe or authentic."
            ),
        })

    return {
        "risk_score": score,
        "risk_level": level,
        "signals": signals,
        "disclaimer": DISCLAIMER,
    }
