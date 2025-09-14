// 修正后的完整 grok.js
const { GoogleGenAI } = require('@google/genai');
const { GoogleGenerativeAI } = require("@google/generative-ai");
// 1. 正确初始化（直接传密钥字符串）
const ai = new GoogleGenerativeAI("AIzaSyCCzusPoa0YHo1-zZeFo73pUPQOx9OUgXw");

module.exports.chatController = async (req, res) => {
    const userMessage = req.body.message;
    if (!userMessage) {
        return res.status(400).json({ error: '消息内容不能为空' });
    }

    try {
        // 2. 先获取模型实例（关键步骤）
        const model = ai.getGenerativeModel({ model: "gemini-2.5-pro" });
        
        // 3. 调用生成内容的方法
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: userMessage }] }]
        });
        
        // 4. 提取回复文本
        const aiAnswer = result.response.text();
        res.json({ reply: aiAnswer });
    } catch (error) {
        console.error("AI 调用出错：", error);
        res.status(500).json({ error: "AI 调用出错，请稍后再试。" });
    }
};