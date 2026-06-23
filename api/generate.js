export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { industry, sectionId } = req.body;
    const apiKey = process.env.GEMINI_API_KEY; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const systemContext = `You are a professional market researcher. You are writing Section ${sectionId} of a report for the ${industry} industry. 
    INVARIANT RULES: 1. Explain definitional gaps. 2. Segment at Indian state/region level. 3. Find the "paradox number" (e.g. India vs Global). 4. CITE DATA SOURCES for every number. 5. If data is unavailable, write "RELIABLE DATA NOT AVAILABLE". 6. Format in Markdown with Tables.`;

    const prompts = {
        "00": "Masthead: 5-6 headline metrics table.",
        "01": "Market Size & Growth. Base/Bull scenarios. Explain why estimates diverge.",
        "02": "Segmentation Deep-Dive. Product type, geography (Indian states), brand share.",
        "03": "Competitive Matrix: Table with Brand, Tier, Share, Strategic Edge, Blind Spot.",
        "04": "Paradox: Compare India metrics vs Global peers. Highlight the opportunity gap.",
        "05": "Structural Insights: Cards on behavioural shifts and supply chain truths.",
        "06": "Porter's 5 Forces: Rate 1-5 with India-specific context.",
        "07": "SWOT: Specific, quantified 2x2 table.",
        "08": "Synthesis Table: Dimension, Quant Fact, Qual Signal, Strategic Implication.",
        "09": "Value Chain: Trace 6 stages from input to consumer. Show Margin distribution per ₹100.",
        "10": "Closing Insight: A 5-sentence thesis. No bullets."
    };

    const payload = {
        contents: [{ parts: [{ text: `${systemContext}\n\nTASK: ${prompts[sectionId]}` }] }]
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        res.status(200).json({ text: data.candidates[0].content.parts[0].text });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
