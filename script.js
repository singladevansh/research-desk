const framework = [
    { id: "00", title: "Masthead & Key Metrics", tag: "MASTHEAD / COVER" },
    { id: "01", title: "Market Size & Trajectory", tag: "SECTION 01 · QUANTITATIVE" },
    { id: "02", title: "Market Segmentation Deep-Dive", tag: "SECTION 02 · QUANTITATIVE" },
    { id: "03", title: "Competitive Landscape Matrix", tag: "SECTION 03 · MIXED" },
    { id: "04", title: "The Paradox / Benchmark Comparison", tag: "SECTION 04 · QUANTITATIVE" },
    { id: "05", title: "Structural & Behavioural Insights", tag: "SECTION 05 · QUALITATIVE" },
    { id: "06", title: "Porter's Five Forces", tag: "SECTION 06 · ANALYTICAL" },
    { id: "07", title: "SWOT Analysis", tag: "SECTION 07 · MIXED" },
    { id: "08", title: "Synthesis Table", tag: "SECTION 08 · STRATEGIC" },
    { id: "09", title: "Value Chain & Margins", tag: "SECTION 09 · OPERATIONAL" },
    { id: "10", title: "Closing Insight Thesis", tag: "CLOSING STATEMENT" }
];

async function generateReport() {
    const industry = document.getElementById('industryInput').value;
    if (!industry) return alert("Please enter an industry name.");

    const runBtn = document.getElementById('runBtn');
    runBtn.disabled = true;
    const container = document.getElementById('report-container');
    container.innerHTML = ''; // Clear previous

    for (const section of framework) {
        document.getElementById('current-step').innerText = `ANALYZING: ${section.title}`;

        // Create Section UI
        const secDiv = document.createElement('div');
        secDiv.className = 'report-section';
        secDiv.style.display = 'block';
        secDiv.innerHTML = `
            <span class="section-tag monospace">${section.tag}</span>
            <h2 class="serif">${section.title}</h2>
            <div class="content monospace">Gemini is researching...</div>
        `;
        container.appendChild(secDiv);
        secDiv.scrollIntoView({ behavior: 'smooth' });

        // Call Vercel Backend
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ industry, sectionId: section.id })
            });
            const data = await response.json();
            secDiv.querySelector('.content').className = 'content'; // Remove monospace
            secDiv.querySelector('.content').innerHTML = marked.parse(data.text);
        } catch (err) {
            secDiv.querySelector('.content').innerText = "Data unavailable for this section.";
        }
    }

    document.getElementById('current-step').innerText = "REPORT COMPLETE";
    runBtn.disabled = false;
}
