/* ============================================
   THE RESEARCH DESK — app logic
   Handles: initiate flow, form, section-by-section generation,
   skeleton card updates, chart rendering.
============================================ */

(function () {
  "use strict";

  // ---- Config ----
  // Point this at your deployed serverless proxy (see /api/generate.js).
  // For local testing with a backend running on the same host, relative path works.
  const PROXY_ENDPOINT = "/api/generate";

  // ---- Elements ----
  const initiateBtn = document.getElementById("initiateBtn");
  const skeletonPreview = document.getElementById("skeletonPreview");
  const reportForm = document.getElementById("reportForm");
  const generateBtn = document.getElementById("generateBtn");
  const reportOutputSection = document.getElementById("reportOutput");
  const reportSkeleton = document.getElementById("reportSkeleton");
  const outputTitle = document.getElementById("outputTitle");
  const outputEyebrow = document.getElementById("outputEyebrow");

  const charts = {}; // id -> Chart.js instance, so we can destroy/redraw safely

  // ---- Step 1: Initiate button reveals a staggered skeleton preview, then the form ----
  initiateBtn.addEventListener("click", () => {
    initiateBtn.disabled = true;
    skeletonPreview.hidden = false;
    skeletonPreview.innerHTML = "";

    FRAMEWORK_SECTIONS.forEach((section, i) => {
      const chip = document.createElement("span");
      chip.className = "skeleton-chip";
      chip.textContent = section.tag.split("·")[0].trim();
      chip.style.animationDelay = `${i * 60}ms`;
      skeletonPreview.appendChild(chip);
    });

    const totalDelay = FRAMEWORK_SECTIONS.length * 60 + 400;
    setTimeout(() => {
      reportForm.hidden = false;
      reportForm.scrollIntoView({ behavior: "smooth", block: "center" });
    }, totalDelay);
  });

  // ---- Step 2: Form submit kicks off generation ----
  reportForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const industry = document.getElementById("industryName").value.trim();
    const company = document.getElementById("companyName").value.trim();
    const apiKey = document.getElementById("apiKey").value.trim();
    const model = document.getElementById("modelChoice").value;

    if (!industry || !apiKey) return;

    generateBtn.disabled = true;
    generateBtn.textContent = "Generating…";

    const ctx = { industry, company, factSheet: "" };

    buildSkeletonCards(ctx);
    reportOutputSection.hidden = false;
    outputEyebrow.textContent = company ? `${industry} · ${company}` : industry;
    outputTitle.textContent = `${industry} — Industry Research Report`;
    reportOutputSection.scrollIntoView({ behavior: "smooth", block: "start" });

    const activeSections = FRAMEWORK_SECTIONS.filter(
      (s) => !s.conditional || s.conditional(ctx)
    );

    for (const section of activeSections) {
      await runSection(section, ctx, apiKey, model);
    }

    generateBtn.disabled = false;
    generateBtn.textContent = "Generate report";
  });

  // ---- Build empty skeleton cards up front ----
  function buildSkeletonCards(ctx) {
    reportSkeleton.innerHTML = "";
    const activeSections = FRAMEWORK_SECTIONS.filter(
      (s) => !s.conditional || s.conditional(ctx)
    );

    activeSections.forEach((section) => {
      const card = document.createElement("article");
      card.className = "skeleton-card";
      card.id = `card-${section.id}`;

      card.innerHTML = `
        <p class="skeleton-card-tag">${escapeHtml(section.tag)}</p>
        <h3 class="skeleton-card-title">${escapeHtml(section.title)}</h3>
        <p class="skeleton-card-desc">${escapeHtml(section.desc)}</p>
        <div class="skeleton-card-body" id="body-${section.id}">
          <div class="placeholder-shimmer" style="width:90%"></div>
          <div class="placeholder-shimmer" style="width:75%"></div>
          <div class="placeholder-shimmer" style="width:60%"></div>
        </div>
      `;
      reportSkeleton.appendChild(card);
    });
  }

  // ---- Run a single section: call proxy, parse response, update DOM ----
  async function runSection(section, ctx, apiKey, model) {
    const card = document.getElementById(`card-${section.id}`);
    const body = document.getElementById(`body-${section.id}`);
    card.classList.add("is-loading");

    try {
      const prompt = section.prompt(ctx);

      const response = await fetch(PROXY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          model,
          system: INVARIANT_RULES,
          prompt,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `Request failed (${response.status})`);
      }

      const data = await response.json();
      const rawText = data.text || "";

      const { html, chartData } = extractChartData(rawText);

      body.innerHTML = html;
      card.classList.remove("is-loading");
      card.classList.add("is-done");

      if (chartData) {
        renderChart(section.id, chartData, card);
      }

      // Append a compact fact-sheet entry for later sections to reference.
      ctx.factSheet += `\n[${section.title}]: ${stripHtml(html).slice(0, 600)}\n`;
    } catch (err) {
      card.classList.remove("is-loading");
      card.classList.add("is-error");
      body.innerHTML = `<p style="color:#9C3C3C;">Could not generate this section: ${escapeHtml(
        err.message || String(err)
      )}</p>`;
    }
  }

  // ---- Parse out the CHART_DATA HTML comment, return clean HTML + parsed chart spec ----
  function extractChartData(rawText) {
    const chartRegex = /<!--CHART_DATA:([\s\S]*?)-->/;
    const match = rawText.match(chartRegex);
    let chartData = null;

    if (match) {
      try {
        chartData = JSON.parse(match[1]);
      } catch (e) {
        chartData = null;
      }
    }

    const html = rawText.replace(chartRegex, "").trim();
    return { html, chartData };
  }

  // ---- Render a Chart.js chart into a canvas appended to the card ----
  function renderChart(sectionId, chartData, card) {
    const wrap = document.createElement("div");
    wrap.className = "skeleton-card-chart";
    const canvas = document.createElement("canvas");
    canvas.id = `chart-${sectionId}`;
    wrap.appendChild(canvas);
    card.appendChild(wrap);

    if (charts[sectionId]) {
      charts[sectionId].destroy();
    }

    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
    const palette = [accent, "#5C5A9C", "#9C5C3C", "#3C7C9C", "#8A8578"];

    const datasets = (chartData.datasets || []).map((ds, i) => ({
      ...ds,
      borderColor: palette[i % palette.length],
      backgroundColor:
        chartData.type === "doughnut" || chartData.type === "radar"
          ? palette
          : palette[i % palette.length] + "33",
      borderWidth: 2,
    }));

    charts[sectionId] = new Chart(canvas, {
      type: chartData.type || "bar",
      data: { labels: chartData.labels || [], datasets },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: Boolean(chartData.title),
            text: chartData.title || "",
            font: { family: "JetBrains Mono", size: 12 },
          },
          legend: { labels: { font: { family: "Inter", size: 11 } } },
        },
        scales:
          chartData.type === "radar" || chartData.type === "doughnut"
            ? {}
            : {
                x: { ticks: { font: { family: "Inter", size: 11 } } },
                y: { ticks: { font: { family: "Inter", size: 11 } } },
              },
      },
    });
  }

  // ---- Utilities ----
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function stripHtml(html) {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || "";
  }
})();
