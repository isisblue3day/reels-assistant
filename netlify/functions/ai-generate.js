cat > netlify/functions/ai-generate.js << 'EOF'
const fetch = require('node-fetch');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function callGemini(prompt) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000
        }
      })
    }
  );
  
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callOpenAI(prompt) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000
    })
  });
  
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

async function generateAIPlan(month, brandVoice, targetAudience, previousMetrics) {
  const prompt = `
你是一位台灣永續品牌的社群內容策略師。
月份：${month}
品牌調性：${brandVoice}
目標受眾：${targetAudience}
上月數據回饋：${previousMetrics}

請為本月生成一份 30 天的 Reels 內容規劃。
  `;
  
  try {
    let content = await callGemini(prompt);
    if (!content || content.length < 100) {
      content = await callOpenAI(prompt);
    }
    return JSON.parse(content);
  } catch (error) {
    console.error('AI 生成失敗:', error);
    return null;
  }
}

exports.handler = async (event) => {
  const {
    startDate,
    brandVoice,
    targetAudience,
    previousMetrics,
    defaultCTA,
    accountName
  } = JSON.parse(event.body);
  
  try {
    const date = new Date(startDate);
    const month = date.toLocaleString('zh-TW', { month: 'long' });
    
    const aiPlan = await generateAIPlan(month, brandVoice, targetAudience, previousMetrics);
    
    if (!aiPlan || aiPlan.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'AI 生成失敗，請稍後重試' })
      };
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, posts: aiPlan })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
EOF
