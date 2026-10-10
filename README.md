# AUTHENTIQ — Digital Risk Protection Platform

**Detect. Investigate. Protect.**

AUTHENTIQ is a digital risk protection prototype designed to identify potential brand impersonation across social media profiles and mobile app listings.

## Problem Statement

Fake social media profiles, scam accounts, impersonating company pages, and fraudulent mobile apps can damage brand reputation and mislead users.

## Our Solution

AUTHENTIQ analyzes candidate profiles and app listings using explainable risk signals, helping users investigate potential brand impersonation.

## Key Features

- **Social Profile Analysis:** Evaluate candidate social profiles for suspicious brand similarities.
- **Mobile App Analysis:** Assess candidate app listings using available risk signals.
- **Explainable Risk Scoring:** Display a risk score, risk category, and supporting signals.
- **Brand-Aware Assessment:** Use configured brand information during analysis.
- **Investigation History:** Review previous analyses.

## Technology Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: Python, FastAPI
- Database: SQLite

## How It Works

1. Select a brand and candidate type.
2. Enter the candidate profile or app information.
3. Run the analysis.
4. Review the risk score and supporting evidence.
5. Use the findings to guide further investigation.

## Limitations

AUTHENTIQ is a hackathon prototype. Risk scores are heuristic assessments and do not prove malicious activity. Results depend on the information provided and the detection signals implemented in the current version. Comprehensive live monitoring is not implied.

## Project Purpose

Built for a digital risk protection hackathon focused on brand impersonation detection and explainable threat analysis.