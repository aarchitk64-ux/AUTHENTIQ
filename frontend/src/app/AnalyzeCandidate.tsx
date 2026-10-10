
"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  analyzeCandidate,
  getBrands,
  type AnalysisResult,
  type Brand,
} from "../lib/api";

type CandidateType = "social_profile" | "app_listing";

export default function AnalyzeCandidate() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandId, setBrandId] = useState("");
  const [candidateType, setCandidateType] =
    useState<CandidateType>("social_profile");
  const [candidateName, setCandidateName] = useState("");
  const [candidateUrl, setCandidateUrl] = useState("");
  const [candidateHandle, setCandidateHandle] = useState("");
  const [publisherName, setPublisherName] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  const isAppListing = candidateType === "app_listing";

  useEffect(() => {
    let active = true;

    getBrands()
      .then((items) => {
        if (!active) return;
        setBrands(items);
        if (items.length > 0) setBrandId(String(items[0].id));
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Unable to load brands."
          );
        }
      })
      .finally(() => {
        if (active) setLoadingBrands(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    setAnalyzing(true);

    try {
      const analysis = await analyzeCandidate({
        brand_id: Number(brandId),
        candidate_type: candidateType,
        candidate_name: candidateName.trim(),
        candidate_url: candidateUrl.trim(),
        candidate_handle: isAppListing ? "" : candidateHandle.trim(),
        publisher_name: isAppListing ? publisherName.trim() : "",
      });

      console.log("AUTHENTIQ analysis response:", analysis);
      setResult(analysis);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  }

  const highRisk =
    result?.risk_level === "High" || result?.risk_level === "Medium";

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6 rounded-2xl border border-white/10 bg-slate-950/80 p-6 text-white shadow-xl sm:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">
          AUTHENTIQ · Signal Analysis
        </p>
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
          Analyze a suspicious candidate
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Assess possible impersonation using registered brand information
          and explainable heuristic risk signals.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="candidateType" className="mb-2 block text-sm text-slate-300">
            Candidate type
          </label>
          <select
            id="candidateType"
            value={candidateType}
            onChange={(event) => {
              setCandidateType(event.target.value as CandidateType);
              setResult(null);
              setError("");
            }}
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"
          >
            <option value="social_profile">Social media profile</option>
            <option value="app_listing">Mobile app listing</option>
          </select>
        </div>

        <div>
          <label htmlFor="brand" className="mb-2 block text-sm text-slate-300">
            Registered brand
          </label>
          <select
            id="brand"
            value={brandId}
            onChange={(event) => setBrandId(event.target.value)}
            required
            disabled={loadingBrands || brands.length === 0}
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"
          >
            {loadingBrands && <option value="">Loading brands...</option>}
            {!loadingBrands && brands.length === 0 && (
              <option value="">No brands registered</option>
            )}
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="candidateName" className="mb-2 block text-sm text-slate-300">
            {isAppListing ? "App listing name *" : "Profile or account name *"}
          </label>
          <input
            id="candidateName"
            value={candidateName}
            onChange={(event) => setCandidateName(event.target.value)}
            required
            maxLength={200}
            placeholder={
              isAppListing ? "e.g. Nike Shopping Rewards" : "e.g. Nike Support Official"
            }
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"
          />
        </div>

        <div>
          <label htmlFor="candidateUrl" className="mb-2 block text-sm text-slate-300">
            {isAppListing ? "App store listing URL" : "Profile or website URL"}
          </label>
          <input
            id="candidateUrl"
            type="url"
            value={candidateUrl}
            onChange={(event) => setCandidateUrl(event.target.value)}
            maxLength={500}
            placeholder={
              isAppListing
                ? "https://play.google.com/store/apps/details?id=..."
                : "https://example.com/profile"
            }
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"
          />
        </div>

        {!isAppListing && (
          <div>
            <label htmlFor="candidateHandle" className="mb-2 block text-sm text-slate-300">
              Social handle
            </label>
            <input
              id="candidateHandle"
              value={candidateHandle}
              onChange={(event) => setCandidateHandle(event.target.value)}
              maxLength={300}
              placeholder="e.g. @nike_support_help"
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"
            />
          </div>
        )}

        <div>
          <label htmlFor="publisherName" className="mb-2 block text-sm text-slate-300">
            {isAppListing ? "App developer / publisher" : "Account owner (optional)"}
          </label>
          <input
            id="publisherName"
            value={publisherName}
            onChange={(event) => setPublisherName(event.target.value)}
            maxLength={200}
            placeholder={
              isAppListing ? "e.g. Unknown Developer" : "e.g. Example Media Ltd."
            }
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={
            analyzing ||
            loadingBrands ||
            brands.length === 0 ||
            !brandId ||
            !candidateName.trim()
          }
          className="w-full rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {analyzing ? "Analyzing signals..." : "Analyze Candidate"}
        </button>
      </form>

      {result && (
        <div aria-live="polite" className="space-y-5 rounded-2xl border border-white/10 bg-slate-900 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-400">
                {isAppListing ? "App listing" : "Social profile"} assessment for {result.brand.name}
              </p>
              <h3 className="mt-1 text-xl font-bold">{result.risk_level}</h3>
            </div>
            <p className="text-3xl font-bold text-cyan-300">
              {result.risk_score}
              <span className="text-base text-slate-400"> / 100</span>
            </p>
          </div>

          <div
            className="h-2 overflow-hidden rounded-full bg-slate-700"
            role="progressbar"
            aria-label="Heuristic risk score"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={result.risk_score}
          >
            <div
              className={`h-full rounded-full ${highRisk ? "bg-red-400" : "bg-cyan-400"}`}
              style={{ width: `${result.risk_score}%` }}
            />
          </div>

          <div>
            <h4 className="mb-3 font-semibold">Evidence signals</h4>
            <div className="space-y-3">
              {result.signals.map((signal, index) => (
                <div key={`${signal.name}-${index}`} className="rounded-xl border border-white/10 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">{signal.name}</p>
                    <span className="shrink-0 text-sm text-cyan-300">
                      +{signal.points}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {signal.details}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs leading-5 text-slate-400">{result.disclaimer}</p>
        </div>
      )}
    </section>
  );
}
