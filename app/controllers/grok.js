// grok.js - generative AI controller
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fetch = require('node-fetch');
// Read API key from environment for security
const API_KEY = process.env.GOOGLE_API_KEY;
const ZHIPU_API_KEY ="d5206613c7d547ca9f8035300561cf02.U0IvpBxZpBZWyVry"
const ai = new GoogleGenerativeAI(API_KEY);

// Helper: call model with timeout and optional retry
async function callGemini(modelName, userMessage, timeoutMs = 8000, retries = 1) {
    const model = ai.getGenerativeModel({ model: modelName });
    const payload = {
        contents: [{ role: "user", parts: [{ text: userMessage }] }]
    };

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const p = model.generateContent(payload);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Gemini请求超时')), timeoutMs)
            );
            const result = await Promise.race([p, timeoutPromise]);
            return result.response.text();
        } catch (err) {
            console.error(`Gemini调用第${attempt + 1}次失败:`, err.message);
            if (attempt === retries) throw err;
            await new Promise(r => setTimeout(r, 500));
        }
    }
}
async function callZhipu(modelName, userMessage, timeoutMs = 8000, retries = 1) {
    const url = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
    
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const options = {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${ZHIPU_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: modelName,
                    messages: [
                        {"role": "system", "content": "你是一个有用的AI助手。"},
                        {"role": "user", "content": userMessage}
                    ],
                    temperature: 0.6,
                    max_tokens: 1024,
                    stream: false
                })
            };

            // 超时控制
            const p = fetch(url, options)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`智谱API错误: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    // 提取回复内容
                    return data?.choices?.[0]?.message?.content || '';
                });

            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('智谱请求超时')), timeoutMs)
            );

            return await Promise.race([p, timeoutPromise]);
        } catch (err) {
            console.error(`智谱调用第${attempt + 1}次失败:`, err.message);
            if (attempt === retries) throw err;
            await new Promise(r => setTimeout(r, 500));
        }
    }
}
module.exports.chatController = async (req, res) => {
    const { message: userMessage, model = "gemini-2.0-flash-lite" } = req.body;

    if (!userMessage) {
        return res.status(400).json({ error: '消息内容不能为空' });
    }

    try {
        let aiAnswer = '';
        
        // 根据模型名称选择调用方式
        if (model.includes('gemini')) {
            aiAnswer = await callGemini(model, userMessage, 8000, 1);
        } else {
            
            const zhipuModel = model || "glm-4.5-flash";
            aiAnswer = await callZhipu(zhipuModel, userMessage, 8000, 1);
        }

        if (!aiAnswer) {
            console.error('AI返回空响应');
            return res.status(502).json({ error: 'AI 服务未返回结果，请稍后再试。' });
        }

        return res.json({ reply: aiAnswer });
    } catch (error) {
        console.error('AI调用最终失败:', error.message);
        return res.status(503).json({ error: 'AI 服务不可用，请稍后再试。' });
    }
};