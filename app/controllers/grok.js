// grok.js - generative AI controller
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Read API key from environment for security
const API_KEY = process.env.GOOGLE_API_KEY || process.env.GENERATIVE_API_KEY || '';
if (!API_KEY) {
    console.warn('Warning: GOOGLE_API_KEY is not set. AI calls will fail without a valid key.');
}

const ai = new GoogleGenerativeAI(API_KEY);

// Helper: call model with timeout and optional retry
async function callModelWithTimeout(model, payload, timeoutMs = 8000, retries = 1) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const p = model.generateContent(payload);
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('AI request timeout')), timeoutMs));
            const result = await Promise.race([p, timeoutPromise]);
            return result;
        } catch (err) {
            console.error(`AI call attempt ${attempt + 1} failed:`, err && (err.stack || err.message || err));
            if (attempt === retries) throw err;
            // small backoff before retry
            await new Promise(r => setTimeout(r, 500));
        }
    }
}

module.exports.chatController = async (req, res) => {
    const userMessage = req.body.message;
    if (!userMessage) {
        return res.status(400).json({ error: '消息内容不能为空' });
    }

    try {
        const model = ai.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

        const payload = {
            model: "gemini-2.0-flash-lite",
            contents: [{ role: "user", parts: [{ text: userMessage }] }]
        };

        // call with timeout and single retry
        const result = await callModelWithTimeout(model, payload, 8000, 1);

        // Extract reply text - guard for API shape
        let aiAnswer = '';
        try {
            aiAnswer = (result && result.response && typeof result.response.text === 'function') ? result.response.text() : (result && result.responseText) || '';
        } catch (e) {
            console.error('Failed to parse AI response:', e, result);
        }

        if (!aiAnswer) {
            console.error('AI returned empty response:', result);
            return res.status(502).json({ error: 'AI 服务未返回结果，请稍后再试。' });
        }

        return res.json({ reply: aiAnswer });
    } catch (error) {
        console.error('AI 调用出错（final）:', error && (error.stack || error.message || error));
        // 503 Service Unavailable is appropriate for upstream dependency failure
        return res.status(503).json({ error: 'AI 服务不可用，请稍后再试。' });
    }
};