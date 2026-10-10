
from risk_engine import analyze_candidate


def test_suspicious_candidate():
    result = analyze_candidate(
        brand_name="Nike",
        official_website="https://www.nike.com",
        official_social_handles=["@nike"],
        candidate_name="Nike Official Store",
        candidate_url="https://nike-support-example.com",
        candidate_handle="@nike_support_help",
        publisher_name="Unknown Publisher",
    )

    assert result["risk_score"] > 0
    assert result["risk_level"] in ["Minimal", "Low", "Medium", "High"]
    assert len(result["signals"]) > 0


def test_official_handle():
    result = analyze_candidate(
        brand_name="Nike",
        official_website="https://www.nike.com",
        official_social_handles=["@nike"],
        candidate_name="Nike",
        candidate_handle="@nike",
    )

    assert result["risk_score"] == 0
    assert result["risk_level"] == "Known Official Match"


if __name__ == "__main__":
    test_suspicious_candidate()
    test_official_handle()
    print("PASS: Both risk engine tests passed.")
