
from pathlib import Path
import sqlite3

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATABASE_PATH = DATA_DIR / "authentiq.db"


def get_connection() -> sqlite3.Connection:
    """Open a connection to the AUTHENTIQ SQLite database."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")

    return connection


def initialize_database() -> None:
    """Create and safely migrate the AUTHENTIQ database schema."""
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS app_meta (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
            """
        )

        connection.execute(
            """
            INSERT OR IGNORE INTO app_meta (key, value)
            VALUES ('schema_version', '2')
            """
        )

        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS investigations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                brand_id INTEGER NOT NULL,
                brand_name TEXT NOT NULL,
                candidate_type TEXT NOT NULL DEFAULT 'social_profile',
                candidate_name TEXT NOT NULL,
                candidate_url TEXT NOT NULL DEFAULT '',
                candidate_handle TEXT NOT NULL DEFAULT '',
                publisher_name TEXT NOT NULL DEFAULT '',
                risk_score INTEGER NOT NULL,
                risk_level TEXT NOT NULL,
                signals_json TEXT NOT NULL,
                disclaimer TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (brand_id) REFERENCES brands(id)
                    ON DELETE RESTRICT
            )
            """
        )

        # Migrate existing databases without removing investigation history.
        columns = {
            row["name"]
            for row in connection.execute(
                "PRAGMA table_info(investigations)"
            ).fetchall()
        }

        if "candidate_type" not in columns:
            connection.execute(
                """
                ALTER TABLE investigations
                ADD COLUMN candidate_type TEXT NOT NULL
                DEFAULT 'social_profile'
                """
            )

        connection.execute(
            """
            UPDATE app_meta
            SET value = '3'
            WHERE key = 'schema_version'
            """
        )

        connection.commit()


def check_database() -> bool:
    """Check whether SQLite can execute a query."""
    try:
        with get_connection() as connection:
            connection.execute("SELECT 1").fetchone()
        return True
    except sqlite3.Error:
        return False
