
import json
import sqlite3
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator

from brands import initialize_brand_table
from database import get_connection, initialize_database
from risk_engine import analyze_candidate

router = APIRouter(prefix="/api", tags=["Threat Analysis"])


class CandidateAnalysis(BaseModel):
    brand_id: int = Field(gt=0)
    candidate_type: Literal["social_profile", "app_listing"] = (
        "social_profile"
    )
    candidate_name: str = Field(min_length=1, max_length=200)
    candidate_url: str = Field(default="", max_length=500)
    candidate_handle: str = Field(default="", max_length=300)
    publisher_name: str = Field(default="", max_length=200)

    @field_validator(
        "candidate_name",
        "candidate_url",
        "candidate_handle",
        "publisher_name",
    )
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()

    @field_validator("candidate_name")
    @classmethod
    def name_must_not_be_blank(cls, value: str) -> str:
        if not value:
            raise ValueError("Candidate name cannot be blank.")
        return value


@router.post("/analyze")
def analyze_threat(candidate: CandidateAnalysis):
    initialize_brand_table()
    initialize_database()

    with get_connection() as connection:
        brand = connection.execute(
            "SELECT * FROM brands WHERE id = ?",
            (candidate.brand_id,),
        ).fetchone()

    if brand is None:
        raise HTTPException(
            status_code=404,
            detail="Brand not found. Register the brand first.",
        )

    official_handles = brand["official_social_handles"].splitlines()

    # Pass only metadata relevant to the selected candidate type.
    if candidate.candidate_type == "social_profile":
        handle = candidate.candidate_handle
        publisher = ""
    else:
        handle = ""
        publisher = candidate.publisher_name

    result = analyze_candidate(
        brand_name=brand["name"],
        official_website=brand["official_website"],
        official_social_handles=official_handles,
        candidate_name=candidate.candidate_name,
        candidate_url=candidate.candidate_url,
        candidate_handle=handle,
        publisher_name=publisher,
        candidate_type=candidate.candidate_type,
    )

    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO investigations (
                brand_id,
                brand_name,
                candidate_type,
                candidate_name,
                candidate_url,
                candidate_handle,
                publisher_name,
                risk_score,
                risk_level,
                signals_json,
                disclaimer
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                brand["id"],
                brand["name"],
                candidate.candidate_type,
                candidate.candidate_name,
                candidate.candidate_url,
                candidate.candidate_handle,
                candidate.publisher_name,
                result["risk_score"],
                result["risk_level"],
                json.dumps(result["signals"]),
                result["disclaimer"],
            ),
        )
        investigation_id = cursor.lastrowid
        connection.commit()

    return {
        "investigation_id": investigation_id,
        "brand": {
            "id": brand["id"],
            "name": brand["name"],
        },
        "candidate": candidate.model_dump(),
        **result,
    }


@router.get("/investigations")
def get_investigations():
    """Return saved investigations, newest first."""
    initialize_brand_table()
    initialize_database()

    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT *
            FROM investigations
            ORDER BY created_at DESC, id DESC
            LIMIT 100
            """
        ).fetchall()

    investigations = []

    for row in rows:
        item = dict(row)
        item["signals"] = json.loads(item.pop("signals_json"))
        investigations.append(item)

    return {
        "count": len(investigations),
        "items": investigations,
    }
