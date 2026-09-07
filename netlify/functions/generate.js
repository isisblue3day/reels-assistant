cat > netlify/functions/generate.js << 'EOF'
const templateConcepts = [
  ["今年中秋，送一份有故事的好禮", "你送的，不只是一盒禮。", "節慶送禮", ["中秋送禮是傳統，但選禮物卻可以很永續", "我們的每件選品都來自社會企業或友善農業", "你的選擇，支持了台灣的好故事"], "現在就來挑一份友善好禮", "真人口播＋字卡", "中秋", "中秋節到了，卻為選禮物煩惱嗎？我們精心選了30件來自台灣社會企業和友善農業的禮物，讓你的禮物也能說故事。這個中秋，不只送禮，還能送出改變🎁", ["#中秋送禮", "#永續選品", "#社會企業"]],
];

function getRandomTemplates(count, previousTemplates = []) {
  const available = templateConcepts.filter(
    (_, idx) => !previousTemplates.includes(idx)
  );
  
  if (available.length === 0) {
    previousTemplates = [];
  }
  
  const shuffled = available.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function buildPost(template, dayIndex, startDate) {
  const date = new Date(startDate);
  date.setDate(date.getDate() + dayIndex);
  
  const isWeekend = [0, 6].includes(date.getDay());
  const time = isWeekend ? "10:30" : "20:30";
  
  return {
    day: `Day ${dayIndex + 1}`,
    date: date.toISOString().split('T')[0],
    display: `${date.getMonth() + 1}/${date.getDate()}`,
    time,
    festival: template[7] || null,
    category: template[2],
    title: template[0],
    hook: template[1],
    points: template[3],
    cta: template[4],
    format: template[5],
    igCaption: template[7],
    hashtags: template[8],
    geminiPrompts: buildGeminiPrompts(template),
    status: "待發布"
  };
}

function buildGeminiPrompts(template) {
  const title = template[0];
  const points = template[3];
  
  return [
    `為台灣永續品牌製作 Instagram Reels 開頭（8秒、9:16直式）。主題：${title}。開場需在 3 秒內吸引注意，畫面中央下方留白供字幕使用。禁止出現文字、Logo、浮水印。風格：自然光、真實台灣生活感。`,
    
    `為台灣永續品牌製作產品展示片段（8秒、9:16直式）。內容重點：${points[0]}。使用細緻近景、慢速推鏡，搭配自然材質背景。體現台灣生活美學。禁止出現文字、Logo、浮水印。`,
    
    `為台灣永續品牌製作故事敘述片段（8秒、9:16直式）。核心訊息：${points[1]} 與 ${points[2]}。呈現真實人物互動、手作工藝或社群分享場景。強調關心、共融、永續。禁止出現文字、Logo、浮水印。`,
    
    `為台灣永續品牌製作 CTA 結尾（8秒、9:16直式）。行動呼籲：${template[4]}。在自然生活場景中展示選品或溫暖互動，鏡頭緩慢拉遠。畫面中央預留空白供 CTA 文字使用。禁止出現文字、Logo、浮水印。`
  ];
}

exports.handler = async (event) => {
  const { startDate, defaultCTA, accountName } = JSON.parse(event.body);
  
  try {
    const posts = [];
    const usedTemplates = [];
    
    for (let i = 0; i < 30; i++) {
      const [template] = getRandomTemplates(1, usedTemplates);
      usedTemplates.push(templateConcepts.indexOf(template));
      
      const post = buildPost(template, i, startDate);
      post.cta = post.cta.replace("%CTA%", defaultCTA).replace("%ACCOUNT%", accountName);
      
      posts.push(post);
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, posts })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
EOF
