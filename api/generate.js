export default async function handler(req, res) {
    // 1. Check for POST method
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 2. Ensure we have an API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not set in Vercel environment variables.' });
    }

    try {
        const { industry, sectionId } = req.body;
        
        // 3. Google Gemini Endpoint
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const systemContext = `You are an expert market researcher for the ${industry} industry. 
        INVARIANT RULES: 1. Explain definitional gaps. 2. Segment at Indian state level. 3. Find the "paradox number" (India vs Global). 4. CITE DATA SOURCES. 5. If data is unavailable, write "RELIABLE DATA NOT AVAILABLE". 6. Format in Markdown with Tables.`;

        const prompts = {
            "00": "Masthead: 5-6 headline metrics table.",
            "01": "Market Size & Growth. Base/Bull scenarios. Explain why estimates diverge.",
            "02": "Segmentation: Product, geography (Indian states), brand share.",
            "03": "Competitive Matrix: Table with Brand, Tier, Share, Strategic Edge, Blind Spot.",
            "04": "Paradox: Compare India metrics vs Global peers. Highlight the gap.",
            "05": "Structural Insights: 4-5 cards on behavioural shifts and supply chain.",
            "06": "Porter's 5 Forces: Rate 1-5 with India-specific context.",
            "07": "SWOT: Specific, quantified 2x2 table.",
            "08": "Synthesis Table: Dimension, Quant Fact, Qual Signal, Strategic Implication.",
            "09": "Value Chain: Trace 6 stages from input to consumer. Margin distribution per ₹100.",
            "10": "Closing Insight: A 5-sentence thesis. No bullets."
        };

        const payload = {
            contents: [{
                parts: [{ text: `${systemContext}\n\nTASK: ${prompts[sectionId]}` }]
            }]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        // 4. Detailed Error Checking for Google's Response
        if (!response.ok) {
            console.error("Google API Error:", data);
            return res.status(response.status).json({ error: data.error?.message || "Google API Error" });
        }

        if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
            const aiText = data.candidates[0].content.parts[0].text;
            return res.status(200).json({ text: aiText });
        } else {
            throw new Error("Unexpected response format from Gemini");
        }

    } catch (err) {
        console.error("Server Error:", err);
        res.status(500).json({ error: err.message });
    }
}
