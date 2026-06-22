/* ============================================
   THE RESEARCH DESK — framework definition
   Structured encoding of the Industry Research Report Template.
   Each entry becomes one skeleton card + one API call.
============================================ */

// Rules sent with EVERY section call. Non-negotiable per the framework.
const INVARIANT_RULES = `
You are generating one section of a structured industry research report, following a strict framework.

NON-NEGOTIABLE RULES (apply to every section, no exceptions):
1. If reliable data is not available for a number or claim, you MUST say so explicitly (e.g. "Reliable public data on X was not found; the following is a directional estimate" or "No reliable data available"). NEVER hallucinate or silently estimate a precise-sounding number without flagging it as such.
2. Every number or factual claim must be followed by a source attribution in this exact inline format: [Source: <name of source, e.g. "Mordor Intelligence, 2025" or "Company FY24 Annual Report">]. If multiple sources are cross-referenced, cite both.
3. Always cross-reference market size / growth estimates across multiple research firms where possible — never rely on a single source for headline numbers. If estimates diverge, briefly explain WHY (definitional differences, scope, year of estimate).
4. Segment India-specific data at state/region level where relevant, not just national aggregates.
5. Be specific and quantified wherever possible. Avoid vague qualitative filler like "strong brand" or "growing market" without a number or named entity attached.
6. Output must be valid HTML fragment (no <html>, <head>, or <body> tags) using ONLY these elements: <p>, <table>/<thead>/<tbody>/<tr>/<th>/<td>, <div class="insight-card">, <ul>/<li>, <strong>, <em>. Do not use inline styles or <script> tags.
7. For any chart data, output a separate JSON block wrapped exactly like this on its own line: <!--CHART_DATA:{"type":"line|bar|doughnut|radar","title":"...", "labels":[...], "datasets":[{"label":"...","data":[...]}]}-->
   Only include a CHART_DATA block if the section's chart type calls for one. Keep numeric data realistic and consistent with the prose above it.
8. End the section's HTML with a single line: <p class="source-note">Sources: <list all distinct sources cited in this section, comma-separated></p>
9. Never break character to explain what you're doing — output the section content directly, nothing else.
`.trim();

const FRAMEWORK_SECTIONS = [
  {
    id: "masthead",
    tag: "Masthead",
    title: "Cover & Key Metrics",
    desc: "Industry name, 5–6 headline numbers, data sources credited upfront.",
    chartHint: null,
    prompt: (ctx) => `
Generate the MASTHEAD / COVER section for an industry research report on: "${ctx.industry}".
${ctx.company ? `This report has a brand spotlight focus on: "${ctx.company}".` : ""}

Include:
- A "Hook Facts" banner: exactly 4 surprising headline numbers a reader wouldn't expect, each with its source.
- A key metrics strip: 5–6 headline numbers for this industry (market size, growth rate, etc.), each with source.
- A one-line note crediting the data sources used upfront.

Format as HTML per the rules above. Use <div class="insight-card"> for each hook fact / metric.
`.trim(),
  },
  {
    id: "section01",
    tag: "Section 01 · Quantitative",
    title: "Market Size & Growth Trajectory",
    desc: "Cross-referenced estimates, definitional divergence, forecast scenarios.",
    chartHint: "line",
    prompt: (ctx) => `
Generate SECTION 01 — Market Size & Growth Trajectory — for the industry: "${ctx.industry}".

Must include:
- Cross-referenced market size estimates from at least 2 different research firms/sources, with each cited.
- A brief explanation of WHY estimates diverge (definitional gap, scope, year).
- A forecast with conservative / base / bull scenarios over the next 5 years — provide this as a CHART_DATA block (type: line) with three datasets (Conservative, Base, Bull).
- Key metric cards (use <div class="insight-card">): current market size, projected market size, CAGR, organised vs unorganised split, and any other relevant metric.

Format as HTML per the rules above.
`.trim(),
  },
  {
    id: "section02",
    tag: "Section 02 · Quantitative",
    title: "Market Segmentation Deep-Dive",
    desc: "By product, format, geography, brand share — and the unorganised segment.",
    chartHint: "doughnut",
    prompt: (ctx) => `
Generate SECTION 02 — Market Segmentation Deep-Dive — for the industry: "${ctx.industry}".

Must include:
- Segmentation by product type / flavor / variant / format.
- Segmentation by geography — state or region level, not just national.
- Segmentation by brand: market share within the organised segment — provide this as a CHART_DATA block (type: doughnut).
- A note on what the unorganised segment looks like and how it distorts the other numbers.
- A mention of any other segmentation lenses available for this industry.

Format as HTML per the rules above.
`.trim(),
  },
  {
    id: "section03",
    tag: "Section 03 · Quantitative + Qualitative",
    title: "Competitive Landscape Matrix",
    desc: "Brand tiers, market share, positioning, strategic edge, blind spots.",
    chartHint: null,
    prompt: (ctx) => `
Generate SECTION 03 — Competitive Landscape Matrix — for the industry: "${ctx.industry}".
${ctx.company ? `Make sure "${ctx.company}" is represented as a row if it fits a relevant tier.` : ""}

Produce a single HTML <table> with columns: Brand, Tier, Market Position / Geography Owned, Market Share (organised segment), Price Range, Strategic Edge, Blind Spot.
Include separate rows for: market leader, premium player, volume player, regional specialist, fast-growing challenger, and startup/D2C player (and any other emerging brand worth tracking), where reliable data allows. If data is unavailable for a cell, write "Data not reliably available" rather than guessing.

Format as HTML per the rules above.
`.trim(),
  },
  {
    id: "section04",
    tag: "Section 04 · Quantitative",
    title: "The Paradox / Benchmark Comparison",
    desc: "India vs global peers — the gap that defines the opportunity.",
    chartHint: "bar",
    prompt: (ctx) => `
Generate SECTION 04 — The Paradox / Benchmark Comparison — for the industry: "${ctx.industry}".

Must include:
- A comparison of India's key metric (per-capita consumption, penetration, spend, etc.) against global peer countries.
- Identify the single comparison number that makes the latent opportunity obvious (the "paradox number") — state it plainly.
- Provide this comparison as a CHART_DATA block (type: bar) with India and 3–5 peer countries.
- One paragraph interpreting what the India-vs-next-comparable-country gap implies for market opportunity.

Format as HTML per the rules above.
`.trim(),
  },
  {
    id: "section05",
    tag: "Section 05 · Qualitative",
    title: "Structural & Behavioural Insights",
    desc: "Behavioural shifts, supply chain truths, regulatory blind spots.",
    chartHint: null,
    prompt: (ctx) => `
Generate SECTION 05 — Structural & Behavioural Insights — for the industry: "${ctx.industry}".

Produce 5–7 <div class="insight-card"> cards, each with a bolded label/title and 3–4 lines of specific, India-contextualised insight. Draw from angles such as: a behavioural shift in consumer psychology, a brand architecture insight, a supply chain truth, a regulatory blind spot, a low-end/high-end coexistence insight, an export/international opportunity, a labour/gender/social dimension, a digital/channel disruption. Pick whichever angles are most relevant and interesting for this specific industry — not all are mandatory.

Format as HTML per the rules above.
`.trim(),
  },
  {
    id: "section06",
    tag: "Section 06 · Framework",
    title: "Porter's Five Forces",
    desc: "Each force scored and India-contextualised, with a structural read.",
    chartHint: "radar",
    prompt: (ctx) => `
Generate SECTION 06 — Porter's Five Forces — for the industry: "${ctx.industry}".

For each of the 5 forces (Threat of New Entrants, Bargaining Power of Suppliers, Bargaining Power of Buyers, Threat of Substitutes, Competitive Rivalry), produce a <div class="insight-card"> containing:
- Force name + intensity label (Very High / High / Medium / Low)
- Score out of 5
- 4–5 specific, India-contextualised bullet points (use <ul><li>)

Then provide a CHART_DATA block (type: radar) with all 5 forces and their scores out of 5.
End with one paragraph: what this configuration means for new entrants, incumbents, and investors.

Format as HTML per the rules above. Never treat this as a generic checkbox — every point must be specific to this industry in India.
`.trim(),
  },
  {
    id: "section07",
    tag: "Section 07 · Mixed Matrix",
    title: "SWOT Analysis",
    desc: "Specific, quantified, India-contextualised — tied to earlier sections.",
    chartHint: null,
    prompt: (ctx) => `
Generate SECTION 07 — SWOT Analysis — for the industry: "${ctx.industry}".

Produce a 2x2 HTML table or four <div class="insight-card"> blocks (Strengths, Weaknesses, Opportunities, Threats). Every point must be specific (name the actual brand/number/regulation, not generic phrases like "strong brand") and quantified where possible.

Context from earlier sections to reference and stay consistent with:
${ctx.factSheet || "(no prior context yet)"}

Strengths and Opportunities should draw on the market sizing, segmentation, and benchmark data above. Weaknesses and Threats should draw on the regulatory, structural, and competitive issues identified above.

Format as HTML per the rules above.
`.trim(),
  },
  {
    id: "section08",
    tag: "Section 08 · Mixed Matrix",
    title: "Synthesis Table",
    desc: "Dimension, hard number, ground-level signal, and strategic implication.",
    chartHint: null,
    prompt: (ctx) => `
Generate SECTION 08 — Synthesis Table — for the industry: "${ctx.industry}".

Produce a single HTML <table> with columns: Dimension, Quantitative Fact, Qualitative Signal, Signal Strength (use 🟢/🟡/🔴 emoji plus a word like Very High/High/Medium/Risk), Strategic Implication.
Aim for 6–9 rows covering the full spread of opportunity and risk for this industry.

Context from earlier sections to draw from:
${ctx.factSheet || "(no prior context yet)"}

Format as HTML per the rules above. This is the most decision-useful section — make every row earn its place.
`.trim(),
  },
  {
    id: "section09",
    tag: "Section 09 · Value Chain",
    title: "From Input to Consumer",
    desc: "Margin capture at every stage, and what the brand actually keeps.",
    chartHint: "bar",
    prompt: (ctx) => `
Generate SECTION 09 — Value Chain (Input to Consumer) — for the industry: "${ctx.industry}".

Must include:
- At least 6 stage cards (<div class="insight-card">), each with: stage name + who operates here, key inputs/players/formats, margin captured at this stage (% of retail price), any temperature/compliance/quality constraint, and one critical fact most people ignore.
- A margin distribution chart as a CHART_DATA block (type: bar, stacked-style data across the same 6+ stages) showing how the retail rupee splits across stages.
- A brand earnings benchmark <table> across 4–6 tier types (mass / mid-premium / premium / regional growth / startup-D2C / artisanal as relevant) with columns: Tier, Gross Margin %, EBITDA %, Net Margin %, Retained per ₹100 MRP.

Format as HTML per the rules above. You must be able to answer: what does the brand actually earn per rupee sold? If data is unavailable, say so rather than guessing.
`.trim(),
  },
  {
    id: "section10",
    tag: "Section 10 · Brand Spotlight",
    title: "Company Spotlight",
    desc: "Mapping macro findings to one brand's specific reality.",
    chartHint: "bar",
    conditional: (ctx) => Boolean(ctx.company),
    prompt: (ctx) => `
Generate SECTION 10 — Brand / Company Spotlight — on "${ctx.company}", within the industry: "${ctx.industry}".

Source from official company filings where this is a listed company (stock exchange filings, annual reports) — cite specifically. If reliable public data isn't available for a given metric, say so explicitly rather than estimating.

Must include:
- Key metric cards (<div class="insight-card">): revenue trajectory, growth %, relevant touchpoints/infra deployed.
- A revenue journey chart as a CHART_DATA block (type: bar) showing recent years' revenue.
- A "Research Linkage Matrix" <table>: rows = major findings from earlier sections, columns = Finding, Relevance to ${ctx.company}, Verdict (✅ aligned / ⚠️ gap / 🔴 risk).
- A closing thesis paragraph: where this brand is in its journey, the bull case, and the 2–3 things that must go right.

Context from earlier sections to draw from:
${ctx.factSheet || "(no prior context yet)"}

Format as HTML per the rules above.
`.trim(),
  },
  {
    id: "closing",
    tag: "Closing Insight",
    title: "The Thesis",
    desc: "One paragraph. No bullets. The single most important takeaway.",
    chartHint: null,
    prompt: (ctx) => `
Generate the CLOSING INSIGHT for this industry research report on: "${ctx.industry}".

Write exactly ONE paragraph, no bullets, no headers, no hedging. It should read as a thesis, not a summary — written so that someone who skipped the entire report understands the single most important thing about this industry in roughly 5 sentences.

Context from the full report to synthesize from:
${ctx.factSheet || "(no prior context yet)"}

Output as a single <p> tag, per the formatting rules above (still include a source-note line only if new sources are cited here; otherwise omit it).
`.trim(),
  },
];

// Which model string to use as default, kept here so it's easy to change in one place.
const DEFAULT_MODEL = "claude-sonnet-4-6";
