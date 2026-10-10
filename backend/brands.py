
import re
import sqlite3
from urllib.parse import urlparse

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator

from database import get_connection

router = APIRouter(prefix="/api/brands", tags=["Brands"])


class BrandCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    industry: str = Field(default="Other", max_length=80)
    official_website: str = Field(min_length=1, max_length=255)
    official_social_handles: list[str] = Field(default_factory=list, max_length=20)
    notes: str = Field(default="", max_length=1000)

    @field_validator("name", "industry")
    @classmethod
    def clean_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be empty.")
        return value

    @field_validator("official_website")
    @classmethod
    def validate_website(cls, value: str) -> str:
        value = value.strip()
        if "://" not in value:
            value = "https://" + value

        parsed = urlparse(value)
        if (
            parsed.scheme != "https"
            or not parsed.hostname
            or "." not in parsed.hostname
            or parsed.username
            or parsed.password
        ):
            raise ValueError("Enter a valid HTTPS website URL.")

        return value.rstrip("/")

    @field_validator("official_social_handles")
    @classmethod
    def validate_handles(cls, handles: list[str]) -> list[str]:
        cleaned = []

        for handle in handles:
            handle = handle.strip()
            if not handle:
                continue
            if len(handle) > 200 or not re.match(
                r"^(https?://|@|[A-Za-z0-9_.-])", handle
            ):
                raise ValueError(f"Invalid social handle: {handle}")
            cleaned.append(handle)

        return list(dict.fromkeys(cleaned))


def brand_to_dict(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "industry": row["industry"],
        "official_website": row["official_website"],
        "official_social_handles": row["official_social_handles"].splitlines(),
        "notes": row["notes"],
        "created_at": row["created_at"],
    }


def initialize_brand_table() -> None:
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS brands (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                industry TEXT NOT NULL,
                official_website TEXT NOT NULL,
                official_social_handles TEXT NOT NULL DEFAULT '',
                notes TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        connection.commit()


@router.get("")
def list_brands():
    initialize_brand_table()

    with get_connection() as connection:
        rows = connection.execute(
            "SELECT * FROM brands ORDER BY id DESC"
        ).fetchall()

    return {"items": [brand_to_dict(row) for row in rows]}


@router.post("", status_code=201)
def create_brand(brand: BrandCreate):
    initialize_brand_table()

    with get_connection() as connection:
        existing = connection.execute(
            """
            SELECT id FROM brands
            WHERE lower(name) = lower(?)
            """,
            (brand.name,),
        ).fetchone()

        if existing:
            raise HTTPException(
                status_code=409,
                detail="A brand with this name already exists.",
            )

        cursor = connection.execute(
            """
            INSERT INTO brands (
                name, industry, official_website,
                official_social_handles, notes
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                brand.name,
                brand.industry,
                brand.official_website,
                "\n".join(brand.official_social_handles),
                brand.notes.strip(),
            ),
        )
        connection.commit()

        row = connection.execute(
            "SELECT * FROM brands WHERE id = ?",
            (cursor.lastrowid,),
        ).fetchone()

    return brand_to_dict(row)


@router.get("/{brand_id}")
def get_brand(brand_id: int):
    initialize_brand_table()

    with get_connection() as connection:
        row = connection.execute(
            "SELECT * FROM brands WHERE id = ?",
            (brand_id,),
        ).fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="Brand not found.")

    return brand_to_dict(row)
