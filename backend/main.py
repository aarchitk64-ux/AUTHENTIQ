
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import check_database, initialize_database
from brands import initialize_brand_table, router as brands_router
from threats import router as threats_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_brand_table()
    initialize_database()
    yield


app = FastAPI(
    title="AUTHENTIQ API",
    description="Digital Trust Intelligence Platform API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://authentiq-peach.vercel.app",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(brands_router)
app.include_router(threats_router)


@app.get("/")
def root():
    return {
        "name": "AUTHENTIQ API",
        "message": "Digital Trust Intelligence Platform API",
        "docs": "/docs",
    }


@app.get("/api/health")
def health_check():
    database_connected = check_database()

    return {
        "status": "ok" if database_connected else "degraded",
        "service": "authentiq-api",
        "database": (
            "connected" if database_connected else "unavailable"
        ),
        "version": "0.1.0",
    }
