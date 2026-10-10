"use client";

import { useCallback, useEffect, useState } from "react";

import AnalyzeCandidate from "./AnalyzeCandidate";

import { getInvestigations, type Investigation } from "../lib/api";
const API_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:8000";

type Brand = {

  id: number;

  name: string;

  industry: string;

  official_website: string;

  official_social_handles: string[];

  notes: string;

  created_at: string;

};

const demoThreats = [

  {

    name: "AUTHENTIQ Support",

    handle: "@authentiq_support_help",

    platform: "Social profile",

    risk: 94,

    level: "CRITICAL",

    signals: ["Name similarity", "Unofficial account"],

  },

  {

    name: "Authentiq Rewards",

    handle: "authentiq-rewards.example",

    platform: "Website",

    risk: 81,

    level: "HIGH",

    signals: ["Lookalike domain", "Brand keyword"],

  },

  {

    name: "AUTHENTIQ Mobile",

    handle: "Unknown publisher",

    platform: "App listing",

    risk: 67,

    level: "MEDIUM",

    signals: ["Publisher mismatch", "Similar branding"],

  },

];

const navItems = [

  "Overview",

  "Brand Monitoring",

  "Threat Intelligence",

  "SignalGraph",

  "Investigations",

];

export default function Home() {

  const [activeNav, setActiveNav] = useState("Overview");

  const [brands, setBrands] = useState<Brand[]>([]);

  const [investigations, setInvestigations] = useState<Investigation[]>([]);

const [loadingInvestigations, setLoadingInvestigations] = useState(true);

const [investigationError, setInvestigationError] = useState("");

const [selectedInvestigation, setSelectedInvestigation] =

useState<Investigation | null>(null);

const [investigationSearch, setInvestigationSearch] = useState("");

const [investigationRiskFilter, setInvestigationRiskFilter] =

  useState("All");

  const [loading, setLoading] = useState(true);

  const [apiError, setApiError] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");

  const [formError, setFormError] = useState("");

  const [filter, setFilter] = useState("All");

  const [selectedThreat, setSelectedThreat] =

    useState<(typeof demoThreats)[number] | null>(null);

  const [name, setName] = useState("");

  const [industry, setIndustry] = useState("Technology");

  const [website, setWebsite] = useState("");

  const [handles, setHandles] = useState("");

  const [notes, setNotes] = useState("");

  const loadBrands = useCallback(async () => {

    setLoading(true);

    setApiError("");

    try {

      const response = await fetch(`${API_URL}/api/brands`);

      if (!response.ok) {

        throw new Error(`API returned HTTP ${response.status}`);

      }

      const data = await response.json();

      setBrands(data.items);

    } catch {

      setApiError(

        "Unable to connect to the backend. Check that FastAPI is running at 127.0.0.1:8000."

      );

    } finally {

      setLoading(false);

    }

  }, []);

const loadInvestigations = useCallback(async () => {

  setLoadingInvestigations(true);

  setInvestigationError("");

  try {

    const items = await getInvestigations();

    setInvestigations(items);

  } catch (error) {

    setInvestigationError(

      error instanceof Error

        ? error.message

        : "Unable to load investigation history."

    );

  } finally {

    setLoadingInvestigations(false);

  }

}, []);

useEffect(() => {

  void loadBrands();

  void loadInvestigations();

}, [loadBrands, loadInvestigations]);

  async function handleAddBrand(event: React.FormEvent<HTMLFormElement>) {

    event.preventDefault();

    setSaving(true);

    setFormError("");

    setMessage("");

    const socialHandles = handles

      .split(/[\n,]+/)

      .map((handle) => handle.trim())

      .filter(Boolean);

    try {

      const response = await fetch(`${API_URL}/api/brands`, {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({

          name,

          industry,

          official_website: website,

          official_social_handles: socialHandles,

          notes,

        }),

      });

      const data = await response.json();

      if (!response.ok) {

        throw new Error(

          typeof data.detail === "string"

            ? data.detail

            : "Please check the information you entered."

        );

      }

      setBrands((current) => [data, ...current]);

      setMessage(`Brand "${data.name}" was saved successfully.`);

      setName("");

      setIndustry("Technology");

      setWebsite("");

      setHandles("");

      setNotes("");

      setShowForm(false);

      setActiveNav("Brand Monitoring");

    } catch (error) {

      setFormError(

        error instanceof Error

          ? error.message

          : "Something went wrong while saving the brand."

      );

    } finally {

      setSaving(false);

    }

  }

  const visibleThreats = demoThreats.filter(

    (threat) =>

      filter === "All" || threat.level === filter.toUpperCase()

  );

  const criticalCount = demoThreats.filter(

    (threat) => threat.level === "CRITICAL"

  ).length;

  const highCount = demoThreats.filter(

    (threat) => threat.level === "HIGH"

  ).length;

  const mediumCount = demoThreats.filter(

    (threat) => threat.level === "MEDIUM"

  ).length;

  // Investigation analytics — calculated from saved investigation records.

  const totalInvestigations = investigations.length;

  const highRiskCases = investigations.filter((item) => {

    const level = item.risk_level.toUpperCase();

    return level === "HIGH" || level === "CRITICAL";

  }).length;

  const averageRiskScore =

    totalInvestigations > 0

      ? Math.round(

          investigations.reduce(

            (total, item) => total + item.risk_score,

            0

          ) / totalInvestigations

        )

      : 0;

  const latestInvestigation = investigations.reduce<

    Investigation | null

  >((latest, item) => {

    if (!latest) return item;

    return new Date(item.created_at).getTime() >

      new Date(latest.created_at).getTime()

      ? item

      : latest;

  }, null);

  return (

    <main className="min-h-screen bg-[#080d17] text-slate-100">

      <div className="flex min-h-screen">

        <aside className="hidden w-64 shrink-0 border-r border-white/[0.08] bg-[#0b111e] p-5 lg:flex lg:flex-col">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/30 bg-blue-500/10 text-xl text-blue-300">

              ◈

            </div>

            <div>

              <h1 className="text-lg font-bold tracking-[0.18em]">

                AUTHENTIQ

              </h1>

              <p className="text-[10px] tracking-[0.2em] text-slate-500">

                DIGITAL TRUST INTELLIGENCE

              </p>

            </div>

          </div>

          <div className="mt-10">

            <p className="mb-3 px-3 text-[10px] font-semibold tracking-[0.2em] text-slate-500">

              WORKSPACE

            </p>

            <nav className="space-y-1">

              {navItems.map((item, index) => (

                <button

                  key={item}

                  onClick={() => setActiveNav(item)}

                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition ${

                    activeNav === item

                      ? "border border-blue-400/20 bg-blue-500/10 text-blue-300"

                      : "text-slate-400 hover:bg-white/[0.04] hover:text-white"

                  }`}

                >

                  <span className="w-5 text-center text-lg">

                    {["◫", "◎", "⌁", "⌘", "▤"][index]}

                  </span>

                  {item}

                  {item === "Threat Intelligence" && (

                    <span className="ml-auto rounded-md bg-red-500/15 px-2 py-0.5 text-xs text-red-300">

                      {demoThreats.length}

                    </span>

                  )}

                </button>

              ))}

            </nav>

          </div>

          <div className="mt-auto rounded-xl border border-blue-400/15 bg-blue-500/[0.06] p-4">

            <div className="flex items-center gap-2 text-xs font-medium text-blue-300">

              <span className="h-2 w-2 rounded-full bg-blue-400" />

              PROTOTYPE STATUS

            </div>

            <p className="mt-3 text-sm font-medium">Backend connected</p>

            <p className="mt-1 text-xs leading-5 text-slate-500">

              Registered brands are stored in SQLite. Threat records remain

              sample data.

            </p>

          </div>

        </aside>

        <section className="min-w-0 flex-1">

          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] px-5 py-4 md:px-8">

            <div>

              <p className="text-xs text-slate-500">

                Workspace / {activeNav}

              </p>

              <h2 className="mt-1 text-lg font-semibold">{activeNav}</h2>

            </div>

            <div className="flex items-center gap-3">

              <span className="rounded-full border border-blue-400/20 bg-blue-400/[0.08] px-3 py-1.5 text-xs text-blue-300">

                ● Prototype

              </span>

              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-slate-800 text-sm font-semibold">

                A

              </div>

            </div>

          </header>

          <div className="mx-auto max-w-[1500px] p-5 md:p-8">

            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">

              <div>

                <p className="text-xs font-semibold tracking-[0.2em] text-blue-400">

                  SECURITY OPERATIONS CENTER

                </p>

                <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">

                  Trust, made <span className="text-blue-400">visible.</span>

                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">

                  Register official brands, manage their digital identities,

                  and explore explainable risk signals.

                </p>

              </div>

              <button

                onClick={() => {

                  setShowForm(true);

                  setFormError("");

                  setMessage("");

                }}

                className="rounded-lg bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-400"

              >

                + Add a brand

              </button>

            </div>

            {apiError && (

              <div className="mb-6 rounded-xl border border-red-400/20 bg-red-400/[0.06] p-4 text-sm text-red-300">

                <p>{apiError}</p>

                <button

                  onClick={() => void loadBrands()}

                  className="mt-2 font-semibold underline"

                >

                  Retry connection

                </button>

              </div>

            )}

            {message && (

              <div className="mb-6 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4 text-sm text-emerald-300">

                {message}

              </div>

            )}

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

              {[

                {

                  label: "REGISTERED BRANDS",

                  value: loading ? "…" : String(brands.length).padStart(2, "0"),

                  note: "Saved in SQLite",

                  icon: "◎",

                },

                {

                  label: "POTENTIAL THREATS",

                  value: String(demoThreats.length).padStart(2, "0"),

                  note: "Sample entities only",

                  icon: "⌁",

                },

                {

                  label: "HIGH-RISK SIGNALS",

                  value: String(criticalCount + highCount).padStart(2, "0"),

                  note: "Sample risk classifications",

                  icon: "△",

                },

                {

                  label: "LINKED EVIDENCE",

                  value: "04",

                  note: "Illustrative graph links",

                  icon: "⌘",

                },

              ].map((stat) => (

                <div

                  key={stat.label}

                  className="rounded-xl border border-white/[0.08] bg-[#0d1422] p-5"

                >

                  <div className="flex items-center justify-between">

                    <p className="text-[10px] font-semibold tracking-[0.14em] text-slate-500">

                      {stat.label}

                    </p>

                    <span className="text-xl text-blue-400">{stat.icon}</span>

                  </div>

                  <p className="mt-5 text-3xl font-semibold tracking-tight">

                    {stat.value}

                  </p>

                  <p className="mt-2 text-xs text-slate-500">{stat.note}</p>

                </div>

              ))}

            </div>

            <section className="mb-6 rounded-xl border border-white/[0.08] bg-[#0d1422] p-5 md:p-6">

              <div className="flex flex-wrap items-center justify-between gap-3">

                <div>

                  <h3 className="font-semibold">Registered brands</h3>

                  <p className="mt-1 text-xs text-slate-500">

                    Official brand profiles retrieved from your backend

                  </p>

                </div>

                <button

                  onClick={() => void loadBrands()}

                  disabled={loading}

                  className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.05] disabled:opacity-50"

                >

                  {loading ? "Loading…" : "Refresh brands"}

                </button>

              </div>

              {loading ? (

                <p className="mt-6 text-sm text-slate-400">

                  Loading registered brands…

                </p>

              ) : brands.length === 0 ? (

                <div className="mt-6 rounded-lg border border-dashed border-white/10 p-8 text-center">

                  <p className="text-sm text-slate-300">

                    No brands registered yet.

                  </p>

                  <button

                    onClick={() => setShowForm(true)}

                    className="mt-3 text-sm font-medium text-blue-300 hover:text-blue-200"

                  >

                    Register your first brand →

                  </button>

                </div>

              ) : (

                <div className="mt-5 space-y-3">

                  {brands.map((brand) => (

                    <div

                      key={brand.id}

                      className="rounded-xl border border-white/[0.07] bg-[#080e19] p-4"

                    >

                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">

                        <div>

                          <h4 className="font-semibold text-slate-100">

                            {brand.name}

                          </h4>

                          <p className="mt-1 text-xs text-slate-500">

                            {brand.industry} · Brand ID #{brand.id}

                          </p>

                          <a

                            href={brand.official_website}

                            target="_blank"

                            rel="noreferrer"

                            className="mt-2 inline-block break-all text-sm text-blue-300 hover:text-blue-200"

                          >

                            {brand.official_website}

                          </a>

                        </div>

                        <span className="w-fit rounded-md border border-emerald-400/20 bg-emerald-400/[0.06] px-2 py-1 text-[10px] font-semibold text-emerald-300">

                          REGISTERED

                        </span>

                      </div>

                      {brand.official_social_handles.length > 0 && (

                        <div className="mt-3 flex flex-wrap gap-2">

                          {brand.official_social_handles.map((handle) => (

                            <span

                              key={handle}

                              className="rounded-md border border-white/[0.08] px-2 py-1 text-xs text-slate-400"

                            >

                              {handle}

                            </span>

                          ))}

                        </div>

                      )}

                      {brand.notes && (

                        <p className="mt-3 text-xs leading-5 text-slate-500">

                          {brand.notes}

                        </p>

                      )}

                    </div>

                  ))}

                </div>

              )}

            </section>

            <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">

              <section className="rounded-xl border border-white/[0.08] bg-[#0d1422] p-5 md:p-6">

                <div>

                  <h3 className="font-semibold">SignalGraph</h3>

                  <p className="mt-1 text-xs text-slate-500">

                    Illustrative relationships between demo entities

                  </p>

                </div>

                <div className="relative mt-5 flex min-h-[250px] items-center justify-center overflow-hidden rounded-lg border border-white/[0.05] bg-[#080e19]">

                  <svg

                    viewBox="0 0 520 250"

                    className="absolute h-full w-full"

                    role="img"

                    aria-label="Illustrative graph connecting a brand to sample entities"

                  >

                    <defs>

                      <pattern

                        id="dots"

                        width="20"

                        height="20"

                        patternUnits="userSpaceOnUse"

                      >

                        <circle cx="1" cy="1" r="1" fill="#24334a" />

                      </pattern>

                    </defs>

                    <rect width="520" height="250" fill="url(#dots)" />

                    <g stroke="#3479db" strokeOpacity=".65" strokeWidth="1.5">

                      <line x1="260" y1="124" x2="110" y2="65" />

                      <line x1="260" y1="124" x2="410" y2="65" />

                      <line x1="260" y1="124" x2="110" y2="200" />

                      <line x1="260" y1="124" x2="410" y2="200" />

                    </g>

                    <g fill="#0d1e35" stroke="#4b9aff" strokeWidth="1.5">

                      <circle cx="260" cy="124" r="31" />

                      <circle cx="110" cy="65" r="20" />

                      <circle cx="410" cy="65" r="20" />

                      <circle cx="110" cy="200" r="20" />

                      <circle cx="410" cy="200" r="20" />

                    </g>

                    <g fill="#bfdbfe" fontSize="10" textAnchor="middle">

                      <text x="260" y="128">BRAND</text>

                      <text x="110" y="69">SOC</text>

                      <text x="410" y="69">WEB</text>

                      <text x="110" y="204">APP</text>

                      <text x="410" y="204">SIG</text>

                    </g>

                  </svg>

                </div>

                <p className="mt-4 text-xs leading-5 text-slate-500">

                  Graph connections are illustrative, not evidence that

                  entities share an owner or are malicious.

                </p>

              </section>

              <section className="rounded-xl border border-white/[0.08] bg-[#0d1422] p-5 md:p-6">

                <h3 className="font-semibold">Risk distribution</h3>

                <p className="mt-1 text-xs text-slate-500">

                  Based on sample threat records

                </p>

                <div className="mt-7 space-y-6">

                  {[

                    {

                      label: "Critical",

                      count: criticalCount,

                      color: "bg-red-400",

                    },

                    {

                      label: "High",

                      count: highCount,

                      color: "bg-orange-400",

                    },

                    {

                      label: "Medium",

                      count: mediumCount,

                      color: "bg-amber-300",

                    },

                    {

                      label: "Low",

                      count: 0,

                      color: "bg-emerald-400",

                    },

                  ].map((risk) => (

                    <div key={risk.label}>

                      <div className="mb-2 flex justify-between text-xs">

                        <span className="text-slate-400">{risk.label}</span>

                        <span className="text-slate-300">{risk.count}</span>

                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">

                        <div

                          className={`h-full rounded-full ${risk.color}`}

                          style={{

                            width: `${(risk.count / Math.max(demoThreats.length, 1)) * 100}%`,

                          }}

                        />

                      </div>

                    </div>

                  ))}

                </div>

                <div className="mt-8 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">

                  <p className="text-xs leading-5 text-slate-400">

                    Risk scores are review indicators, not definitive findings

                    of impersonation.

                  </p>

                </div>

              </section>

            </div>

            <section className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0d1422]">

              <div className="flex flex-col justify-between gap-4 border-b border-white/[0.08] p-5 md:flex-row md:items-center md:px-6">

                <div>

                  <h3 className="font-semibold">Threat intelligence</h3>

                  <p className="mt-1 text-xs text-slate-500">

                    Sample records only — live threat detection is not

                    connected

                  </p>

                </div>

                <select

                  value={filter}

                  onChange={(event) => setFilter(event.target.value)}

                  className="rounded-lg border border-white/10 bg-[#080d17] px-3 py-2 text-sm text-slate-300 outline-none focus:border-blue-400"

                  aria-label="Filter sample threats by risk level"

                >

                  <option>All</option>

                  <option>Critical</option>

                  <option>High</option>

                  <option>Medium</option>

                </select>

              </div>

              <div className="overflow-x-auto">

                <table className="w-full min-w-[760px] text-left text-sm">

                  <thead className="bg-white/[0.02] text-[10px] tracking-[0.13em] text-slate-500">

                    <tr>

                      <th className="px-6 py-4 font-medium">ENTITY</th>

                      <th className="px-6 py-4 font-medium">TYPE</th>

                      <th className="px-6 py-4 font-medium">RISK SIGNALS</th>

                      <th className="px-6 py-4 font-medium">RISK SCORE</th>

                      <th className="px-6 py-4 font-medium">LEVEL</th>

                      <th className="px-6 py-4 font-medium">ACTION</th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-white/[0.05]">

                    {visibleThreats.map((threat) => (

                      <tr

                        key={threat.name}

                        className="hover:bg-white/[0.02]"

                      >

                        <td className="px-6 py-4">

                          <p className="font-medium text-slate-200">

                            {threat.name}

                          </p>

                          <p className="mt-1 text-xs text-slate-500">

                            {threat.handle}

                          </p>

                        </td>

                        <td className="px-6 py-4 text-xs text-slate-400">

                          {threat.platform}

                        </td>

                        <td className="px-6 py-4">

                          <div className="flex flex-wrap gap-1.5">

                            {threat.signals.map((signal) => (

                              <span

                                key={signal}

                                className="rounded-md border border-white/[0.08] px-2 py-1 text-[10px] text-slate-400"

                              >

                                {signal}

                              </span>

                            ))}

                          </div>

                        </td>

                        <td className="px-6 py-4 font-semibold tabular-nums">

                          {threat.risk}

                          <span className="text-slate-500">/100</span>

                        </td>

                        <td className="px-6 py-4">

                          <span

                            className={`rounded-md px-2 py-1 text-[10px] font-semibold ${

                              threat.level === "CRITICAL"

                                ? "bg-red-400/10 text-red-300"

                                : threat.level === "HIGH"

                                  ? "bg-orange-400/10 text-orange-300"

                                  : "bg-amber-300/10 text-amber-200"

                            }`}

                          >

                            {threat.level}

                          </span>

                        </td>

                        <td className="px-6 py-4">

                          <button

                            onClick={() => setSelectedThreat(threat)}

                            className="text-xs font-medium text-blue-300 hover:text-blue-200"

                          >

                            Investigate →

                          </button>

                        </td>

                      </tr>

                    ))}

                    {visibleThreats.length === 0 && (

                      <tr>

                        <td

                          colSpan={6}

                          className="px-6 py-10 text-center text-sm text-slate-500"

                        >

                          No sample records match this filter.

                        </td>

                      </tr>

                    )}

                  </tbody>

                </table>

              </div>

              <div className="border-t border-white/[0.06] px-6 py-3 text-xs text-slate-500">

                Showing {visibleThreats.length} of {demoThreats.length} demo

                records

              </div>

            </section>

            <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-white/[0.08] py-5 text-xs text-slate-600 sm:flex-row">

              <span>AUTHENTIQ · Know What&apos;s Genuine.</span>

              <span>Prototype v0.2 · Demo threats, real brand registration</span>

            </footer>

              {/* Candidate risk analysis \*/}

              <section className="mt-8">

                <AnalyzeCandidate />

              </section>

{/* Investigation History \*/}

<section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">

  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

    <div>

      <h2 className="text-xl font-semibold text-white">

        Investigation History

      </h2>

      <p className="mt-1 text-sm text-slate-400">

        Review saved risk assessments and their supporting evidence.

      </p>

    </div>

    <button

      type="button"

      onClick={() => void loadInvestigations()}

      disabled={loadingInvestigations}

      className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-blue-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"

    >

      {loadingInvestigations ? "Refreshing..." : "Refresh history"}

    </button>

  </div>

  {/* Search and risk filter \*/}

  <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_200px]">

    <input

      type="search"

      value={investigationSearch}

      onChange={(event) => setInvestigationSearch(event.target.value)}

      placeholder="Search candidate, brand, URL, or handle..."

      aria-label="Search investigations"

      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"

    />

    <select

      value={investigationRiskFilter}

      onChange={(event) => setInvestigationRiskFilter(event.target.value)}

      aria-label="Filter investigations by risk level"

      className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"

    >

      <option value="All">All risk levels</option>

      <option value="Critical">Critical</option>

      <option value="High">High</option>

      <option value="Medium">Medium</option>

      <option value="Low">Low</option>

    </select>

  </div>

  {/* Loading state \*/}

  {loadingInvestigations && (

    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-8 text-center">

      <p className="text-sm text-slate-400">

        Loading investigation history...

      </p>

    </div>

  )}

  {/* Error state \*/}

  {!loadingInvestigations && investigationError && (

    <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5">

      <p className="text-sm font-medium text-red-300">

        Unable to load investigation history

      </p>

      <p className="mt-2 text-sm text-slate-400">

        {investigationError}

      </p>

      <button

        type="button"

        onClick={() => void loadInvestigations()}

        className="mt-4 rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-200 transition hover:bg-red-500/10"

      >

        Try again

      </button>

    </div>

  )}

  {/* Investigation records \*/}

  {!loadingInvestigations &&

    !investigationError &&

    (() => {

      const query = investigationSearch.trim().toLowerCase();

      const filteredInvestigations = investigations.filter((item) => {

        const searchableText = [

          item.candidate_name,

          item.brand_name,

          item.candidate_url,

          item.candidate_handle,

          item.publisher_name,

        ]

          .filter(Boolean)

          .join(" ")

          .toLowerCase();

        const matchesSearch = searchableText.includes(query);

        const matchesRisk =

          investigationRiskFilter === "All" ||

          item.risk_level.toUpperCase() ===

            investigationRiskFilter.toUpperCase();

        return matchesSearch && matchesRisk;

      });

      if (investigations.length === 0) {

        return (

          <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center">

            <h3 className="font-medium text-white">

              No investigations yet

            </h3>

            <p className="mt-2 text-sm text-slate-400">

              Analyze a candidate profile to create your first saved investigation.

            </p>

          </div>

        );

      }

      if (filteredInvestigations.length === 0) {

        return (

          <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center">

            <h3 className="font-medium text-white">

              No matching investigations

            </h3>

            <p className="mt-2 text-sm text-slate-400">

              Try another search term or choose a different risk level.

            </p>

            <button

              type="button"

              onClick={() => {

                setInvestigationSearch("");

                setInvestigationRiskFilter("All");

              }}

              className="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-blue-500"

            >

              Clear filters

            </button>

          </div>

        );

      }

      return (

        <div className="space-y-3">

          <div className="mb-3 flex items-center justify-between">

            <p className="text-xs text-slate-500">

              Showing {filteredInvestigations.length} of {investigations.length} investigations

            </p>

          </div>

          {filteredInvestigations.map((item) => {

            const riskLevel = item.risk_level.toUpperCase();

            const riskStyles: Record<string, string> = {

              CRITICAL: "border-red-500/30 bg-red-500/10 text-red-300",

              HIGH: "border-orange-500/30 bg-orange-500/10 text-orange-300",

              MEDIUM: "border-amber-500/30 bg-amber-500/10 text-amber-300",

              LOW: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",

            };

            const riskStyle =

              riskStyles[riskLevel] ??

              "border-slate-700 bg-slate-800 text-slate-300";

            return (

              <article

                key={item.id}

                onClick={() => setSelectedInvestigation(item)}

                onKeyDown={(event) => {

                  if (

                    event.key === "Enter" ||

                    event.key === " "

                  ) {

                    event.preventDefault();

                    setSelectedInvestigation(item);

                  }

                }}

                role="button"

                tabIndex={0}

                aria-label={`View investigation for ${item.candidate_name}`}

                className="cursor-pointer rounded-xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-blue-500/50 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"

              >

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                  <div className="min-w-0 flex-1">

                    <div className="flex flex-wrap items-center gap-2">

                      <h3 className="break-words font-semibold text-white">

                        {item.candidate_name}

                      </h3>

                      <span

                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${riskStyle}`}

                      >

                        {item.risk_level}

                      </span>

                    </div>

                    <p className="mt-1 text-sm text-slate-400">

                      Brand:{" "}

                      <span className="text-slate-200">

                        {item.brand_name}

                      </span>

                    </p>

                    <p className="mt-3 break-all text-xs text-slate-500">

                      {item.candidate_url || "No website provided"}

                    </p>

                    <p className="mt-1 break-all text-xs text-slate-500">

                      {item.candidate_handle || "No handle provided"}

                    </p>

                    <p className="mt-3 text-xs text-slate-500">

                      {new Date(item.created_at).toLocaleString()}

                    </p>

                  </div>

                  <div className="shrink-0 sm:text-right">

                    <p className="text-3xl font-semibold text-white">

                      {item.risk_score}

                      <span className="text-sm text-slate-500">/100</span>

                    </p>

                    <p className="mt-1 text-xs text-slate-500">

                      Heuristic risk score

                    </p>

                    <p className="mt-3 text-sm font-medium text-blue-400">

                      View details →

                    </p>

                  </div>

                </div>

                <div className="mt-4 border-t border-slate-800 pt-3">

                  <p className="text-xs text-slate-400">

                    {item.signals.length} evidence signal

                    {item.signals.length === 1 ? "" : "s"} recorded

                  </p>

                </div>

              </article>

            );

          })}

        </div>

      );

    })()}

</section>

          </div>

        </section>

      </div>

      {showForm && (

        <div

          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4"

          onClick={() => !saving && setShowForm(false)}

        >

          <section

            role="dialog"

            aria-modal="true"

            aria-labelledby="add-brand-title"

            className="my-8 w-full max-w-xl rounded-2xl border border-white/10 bg-[#0d1422] p-6 shadow-2xl"

            onClick={(event) => event.stopPropagation()}

          >

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-xs font-semibold tracking-[0.15em] text-blue-300">

                  BRAND MONITORING

                </p>

                <h3 id="add-brand-title" className="mt-2 text-xl font-semibold">

                  Register a brand

                </h3>

                <p className="mt-2 text-sm leading-5 text-slate-400">

                  Save the official identity details that AUTHENTIQ can use as

                  a baseline for future monitoring.

                </p>

              </div>

              <button

                onClick={() => setShowForm(false)}

                disabled={saving}

                aria-label="Close form"

                className="rounded-lg px-3 py-1 text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-50"

              >

                ✕

              </button>

            </div>

            <form onSubmit={handleAddBrand} className="mt-6 space-y-4">

              <div>

                <label

                  htmlFor="brand-name"

                  className="mb-2 block text-sm text-slate-300"

                >

                  Brand name *

                </label>

                <input

                  id="brand-name"

                  required

                  minLength={2}

                  maxLength={100}

                  value={name}

                  onChange={(event) => setName(event.target.value)}

                  placeholder="e.g. Acme Technologies"

                  className="w-full rounded-lg border border-white/10 bg-[#080d17] px-3 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-blue-400"

                />

              </div>

              <div>

                <label

                  htmlFor="brand-industry"

                  className="mb-2 block text-sm text-slate-300"

                >

                  Industry

                </label>

                <select

                  id="brand-industry"

                  value={industry}

                  onChange={(event) => setIndustry(event.target.value)}

                  className="w-full rounded-lg border border-white/10 bg-[#080d17] px-3 py-3 text-sm outline-none focus:border-blue-400"

                >

                  <option>Technology</option>

                  <option>Banking and Finance</option>

                  <option>E-commerce</option>

                  <option>Healthcare</option>

                  <option>Education</option>

                  <option>Media and Entertainment</option>

                  <option>Other</option>

                </select>

              </div>

              <div>

                <label

                  htmlFor="brand-website"

                  className="mb-2 block text-sm text-slate-300"

                >

                  Official website *

                </label>

                <input

                  id="brand-website"

                  required

                  type="text"

                  maxLength={255}

                  value={website}

                  onChange={(event) => setWebsite(event.target.value)}

                  placeholder="https://example.com"

                  className="w-full rounded-lg border border-white/10 bg-[#080d17] px-3 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-blue-400"

                />

                <p className="mt-1 text-xs text-slate-500">

                  Enter a website domain or an HTTPS URL.

                </p>

              </div>

              <div>

                <label

                  htmlFor="brand-handles"

                  className="mb-2 block text-sm text-slate-300"

                >

                  Official social handles

                </label>

                <textarea

                  id="brand-handles"

                  rows={3}

                  maxLength={1000}

                  value={handles}

                  onChange={(event) => setHandles(event.target.value)}

                  placeholder={"@officialbrand\nhttps://instagram.com/officialbrand"}

                  className="w-full resize-y rounded-lg border border-white/10 bg-[#080d17] px-3 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-blue-400"

                />

                <p className="mt-1 text-xs text-slate-500">

                  Separate multiple handles with commas or new lines.

                </p>

              </div>

              <div>

                <label

                  htmlFor="brand-notes"

                  className="mb-2 block text-sm text-slate-300"

                >

                  Notes

                </label>

                <textarea

                  id="brand-notes"

                  rows={2}

                  maxLength={1000}

                  value={notes}

                  onChange={(event) => setNotes(event.target.value)}

                  placeholder="Additional identification notes (optional)"

                  className="w-full resize-y rounded-lg border border-white/10 bg-[#080d17] px-3 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-blue-400"

                />

              </div>

              {formError && (

                <div

                  role="alert"

                  className="rounded-lg border border-red-400/20 bg-red-400/[0.06] p-3 text-sm text-red-300"

                >

                  {formError}

                </div>

              )}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">

                <button

                  type="button"

                  disabled={saving}

                  onClick={() => setShowForm(false)}

                  className="rounded-lg border border-white/10 px-4 py-3 text-sm text-slate-300 hover:bg-white/[0.04] disabled:opacity-50"

                >

                  Cancel

                </button>

                <button

                  type="submit"

                  disabled={saving}

                  className="rounded-lg bg-blue-500 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"

                >

                  {saving ? "Saving brand…" : "Save brand"}

                </button>

              </div>

            </form>

          </section>

        </div>

      )}

{selectedInvestigation && (

  <div

    className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/75 p-4"

    onClick={() => setSelectedInvestigation(null)}

  >

    <section

      role="dialog"

      aria-modal="true"

      aria-labelledby="saved-investigation-title"

      className="my-8 w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0d1422] p-6 shadow-2xl"

      onClick={(event) => event.stopPropagation()}

    >

      <div className="flex items-start justify-between gap-4">

        <div>

          <p className="text-xs font-semibold tracking-[0.15em] text-blue-300">

            SAVED INVESTIGATION

          </p>

          <h2

            id="saved-investigation-title"

            className="mt-2 text-xl font-semibold text-white"

          >

            {selectedInvestigation.candidate_name}

          </h2>

          <p className="mt-1 text-sm text-slate-400">

            Brand: {selectedInvestigation.brand_name}

          </p>

        </div>

        <button

          type="button"

          onClick={() => setSelectedInvestigation(null)}

          aria-label="Close investigation details"

          className="rounded-lg px-3 py-1 text-slate-400 hover:bg-white/5 hover:text-white"

        >

          ✕

        </button>

      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">

        <div className="rounded-xl border border-white/[0.08] p-4">

          <p className="text-sm text-slate-400">Risk score</p>

          <p className="mt-2 text-3xl font-semibold text-white">

            {selectedInvestigation.risk_score}/100

          </p>

        </div>

        <div className="rounded-xl border border-white/[0.08] p-4">

          <p className="text-sm text-slate-400">Risk level</p>

          <p className="mt-2 text-xl font-semibold text-white">

            {selectedInvestigation.risk_level}

          </p>

        </div>

      </div>

      <div className="mt-5 space-y-3">

        <h3 className="font-semibold text-white">Candidate information</h3>

        <div className="rounded-lg border border-white/[0.08] p-4 text-sm">

          <p className="text-slate-400">Website</p>

          <p className="mt-1 break-all text-slate-200">

            {selectedInvestigation.candidate_url || "Not provided"}

          </p>

          <p className="mt-4 text-slate-400">Social handle</p>

          <p className="mt-1 break-all text-slate-200">

            {selectedInvestigation.candidate_handle || "Not provided"}

          </p>

          <p className="mt-4 text-slate-400">Publisher</p>

          <p className="mt-1 text-slate-200">

            {selectedInvestigation.publisher_name || "Not provided"}

          </p>

          <p className="mt-4 text-slate-400">Investigated on</p>

          <p className="mt-1 text-slate-200">

            {new Date(selectedInvestigation.created_at).toLocaleString()}

          </p>

        </div>

      </div>

      <div className="mt-6">

        <h3 className="font-semibold text-white">Evidence and risk signals</h3>

        {selectedInvestigation.signals.length === 0 ? (

          <p className="mt-3 text-sm text-slate-400">

            No risk signals were recorded.

          </p>

        ) : (

          <ul className="mt-3 space-y-3">

            {selectedInvestigation.signals.map((signal, index) => (

              <li

                key={`${signal.name}-${index}`}

                className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4"

              >

                <div className="flex flex-wrap justify-between gap-2">

                  <p className="font-medium text-slate-200">

                    {signal.name}

                  </p>

                  <span className="text-sm text-blue-300">

                    +{signal.points} points

                  </span>

                </div>

                <p className="mt-2 text-sm leading-5 text-slate-400">

                  {signal.details}

                </p>

              </li>

            ))}

          </ul>

        )}

      </div>

      <p className="mt-5 rounded-lg border border-amber-400/20 bg-amber-400/[0.04] p-3 text-xs leading-5 text-slate-400">

        {selectedInvestigation.disclaimer}

      </p>

      <button

        type="button"

        onClick={() => setSelectedInvestigation(null)}

        className="mt-5 w-full rounded-lg bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-400"

      >

        Close details

      </button>

    </section>

  </div>

)}

    </main>

  );

}
