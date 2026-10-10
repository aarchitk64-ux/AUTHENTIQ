
const API_BASE_URL = "http://127.0.0.1:8000";

export interface Brand {
  id: number;
  name: string;
  industry: string;
  official_website: string;
  official_social_handles: string[];
  notes: string;
  created_at: string;
}

export interface RiskSignal {
  name: string;
  points: number;
  details: string;
}

export interface AnalysisRequest {
  brand_id: number;
  candidate_name: string;
  candidate_url?: string;
  candidate_handle?: string;
  publisher_name?: string;
}

export interface AnalysisResult {
  brand: {
    id: number;
    name: string;
  };
  candidate: AnalysisRequest;
  risk_score: number;
  risk_level: string;
  signals: RiskSignal[];
  disclaimer: string;
}

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `API error (${response.status}): ${message}`
    );
  }

  return response.json() as Promise<T>;
}

export async function getBrands(): Promise<Brand[]> {
  const data = await request<{ items: Brand[] }>("/api/brands");
  return data.items;
}

export async function analyzeCandidate(
  candidate: AnalysisRequest
): Promise<AnalysisResult> {
  return request<AnalysisResult>("/api/analyze", {
    method: "POST",
    body: JSON.stringify(candidate),
  });
}

export interface Investigation {
    id: number;
    brand_id: number;
    brand_name: string;
    candidate_name: string;
    candidate_url: string;
    candidate_handle: string;
    publisher_name: string;
    risk_score: number;
    risk_level: string;
    disclaimer: string;
    created_at: string;
    signals: RiskSignal[];
  }
  
  export async function getInvestigations(): Promise<Investigation[]> {
    const data = await request<{
      count: number;
      items: Investigation[];
    }>("/api/investigations");
  
    return data.items;
  }
  
  export interface AnalysisRequest {
    brand_id: number;
    candidate_type: "social_profile" | "app_listing";
    candidate_name: string;
    candidate_url?: string;
    candidate_handle?: string;
    publisher_name?: string;
  }