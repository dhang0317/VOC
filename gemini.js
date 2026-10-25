// =============================================
// GEMINI API - 生成填空題邏輯
// =============================================

// 採用最新 Flash 輕量模型作為主力，速度快且不易遇到尖峰塞車
const GEMINI_MODEL = "gemini-3.7-flash"; 

// 金鑰管理工具函式 (儲存於瀏覽器 localStorage)
export function getApiKey() {
  return localStorage.getItem("gemini_api_key") || "";
}

export function setApiKey(key) {
  if (key && key.trim()) {
    localStorage.setItem("gemini_api_key", key.trim());
    return true;
  }
  return false;
}

export function clearApiKey() {
  localStorage.removeItem("gemini_api_key");
}

/**
 * 呼叫 Gemini API
 * @param {string} prompt
 * @returns {string} - 模型回傳的純文字
 */
async function callGemini(prompt) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("MISSING_API_KEY");
  }

  // 模型備援：優先採用 3.7-flash 快速出題，失敗時切換 3.8-flash
  const models = [GEMINI_MODEL, "gemini-3.8-flash"];
  let firstErr;
  for (const model of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await callGeminiModel(prompt, apiKey, model);
      } catch (e) {
        firstErr = firstErr || e; // 保留主模型的真實錯誤訊息
        console.warn(`模型 ${model} 第 ${attempt + 1} 次失敗:`, e.message);
        // 過載/暫時性錯誤：等待後重試同一模型
        const transient = /high demand|overloaded|unavailable|try again|503|429|超時/i.test(e.message);
        if (!transient) break;
        await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
      }
    }
  }
  throw firstErr;
}

async function callGeminiModel(prompt, apiKey, model, useThinking = true) {
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // 設置 60 秒超時控制器，防止請求無限卡死
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  let res;
  try {
    const generationConfig = {
      temperature: 0.25,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
      thinkingConfig: {
        thinkingBudget: 0,
        thinkingLevel: "low"
      }
    };
    res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig
      })
    });
  } catch (fetchErr) {
    clearTimeout(timeoutId);
    if (fetchErr.name === "AbortError") {
      throw new Error("AI 出題回應超時（超過 60 秒），請減少單字數量或稍候再試。");
    }
    throw fetchErr;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const message = errData?.error?.message || `HTTP ${res.status}`;
    if (res.status === 400 || res.status === 403) {
      throw new Error(`API Key 無效或權限不足 (${message})，請檢查設定。`);
    }
    throw new Error(`Gemini API 請求失敗: ${message}`);
  }

  const data = await res.json();
  const candidate = data.candidates?.[0];
  
  // ── 支援 Gemini 3.8 思考模型多段 Parts 解析 ──
  // 在 3.8 模型中，parts[0] 可能是思考過程 (thought: true)，實際回答文本在非 thought 的 part 中
  let text = "";
  const parts = candidate?.content?.parts || [];
  for (const part of parts) {
    if (part.text && !part.thought) {
      text += part.text;
    }
  }

  // Fallback 相容舊格式或未標記 thought 的情形
  if (!text.trim() && parts.length > 0) {
    const nonThought = parts.filter(p => !p.thought);
    text = (nonThought.length > 0 ? nonThought : parts).map(p => p.text || "").join("").trim();
  }

  if (!text) {
    if (candidate?.finishReason === "SAFETY") throw new Error("內容被安全過濾器攔截，請嘗試更換單字");
    if (candidate?.finishReason === "MAX_TOKENS") throw new Error("題目內容過長超出限制，請減少選取單字數量");
    throw new Error("AI 沒有回傳有效內容，請再試一次");
  }
  return text;
}

/**
 * 解析 JSON，支援帶有 markdown code block 及修復截斷不完整 JSON 的回應
 */
function parseJSON(text) {
  let clean = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  
  // 優先嘗試標準 JSON 解析
  try {
    return JSON.parse(clean);
  } catch (initialErr) {
    // 若因截斷出現 Unexpected end of JSON，嘗試修補封閉括號
    let repaired = clean;
    const openBraces = (repaired.match(/\{/g) || []).length;
    const closeBraces = (repaired.match(/\}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;

    // 清除結尾不完整的字串或逗號
    repaired = repaired.replace(/,\s*$/, "");
    if ((repaired.match(/"/g) || []).length % 2 !== 0) {
      repaired += '"';
    }

    for (let i = 0; i < (openBrackets - closeBrackets); i++) repaired += "]";
    for (let i = 0; i < (openBraces - closeBraces); i++) repaired += "}";

    try {
      return JSON.parse(repaired);
    } catch (secondErr) {
      // 嘗試從字串中尋找最外層的 JSON object
      const start = clean.indexOf("{");
      const end = clean.lastIndexOf("}");
      if (start !== -1 && end > start) {
        try {
          return JSON.parse(clean.substring(start, end + 1));
        } catch (thirdErr) {}
      }
      throw new Error("AI 回傳的題目格式不完整，請減少單字數量或重試一次");
    }
  }
}

// ── 難度對應說明 ───────────────────────────
const DIFFICULTY_MAP = {
  elementary: { zh: "小學（國小）程度", en: "elementary school level, short simple sentences" },
  middle:     { zh: "國中程度",         en: "middle school level, moderate complexity" },
  high:       { zh: "高中程度",         en: "high school level, richer vocabulary" }
};

// ── 本地單字常用釋義字典（包含常見高頻詞彙、詞性標籤與繁中釋義）──
export const LOCAL_DICTIONARY = {
  // 核心示範與常見學術字彙
  "sustainability": { pos: "n.", zh: "永續性；持續發展能力" },
  "articulate":     { pos: "v. / adj.", zh: "清楚表達；清晰發音；能言善道的" },
  "paradigm":       { pos: "n.", zh: "範式；典範；思考架構" },
  "comprehensive":  { pos: "adj.", zh: "全面性的；詳盡包羅萬象的" },
  "benchmark":      { pos: "n. / v.", zh: "基準；比較參照指標；設定標竿" },
  "resilient":      { pos: "adj.", zh: "有彈性的；能迅速復原的；堅韌的" },
  "pragmatic":      { pos: "adj.", zh: "務實的；重實效的；實用主義的" },
  "ambiguity":      { pos: "n.", zh: "模稜兩可；不明確；歧義" },
  "volatile":       { pos: "adj.", zh: "易變的；反覆無常的；波動劇烈的" },
  "fluctuate":      { pos: "v.", zh: "波動；上下起伏；動搖" },
  "advocate":       { pos: "v. / n.", zh: "提倡；主張；擁護者；支持者" },
  "conducive":      { pos: "adj.", zh: "有助於…的；促成…的" },
  "scrutiny":       { pos: "n.", zh: "詳細審查；仔細檢查；監視" },
  "leverage":       { pos: "v. / n.", zh: "槓桿作用；善用資源；發揮優勢" },

  // 高頻大考與學測核心單字
  "innovation":     { pos: "n.", zh: "創新；革新；新發明" },
  "perspective":    { pos: "n.", zh: "觀點；看法；遠景" },
  "collaborate":    { pos: "v.", zh: "合作；協作；共同工作" },
  "diversity":      { pos: "n.", zh: "多樣性；多元化；差異" },
  "efficiency":     { pos: "n.", zh: "效率；效能；功效" },
  "strategy":       { pos: "n.", zh: "策略；戰略；計策" },
  "fundamental":    { pos: "adj. / n.", zh: "基礎的；根本的；基本原則" },
  "integrity":      { pos: "n.", zh: "正直；廉潔；完整性" },
  "subsequent":     { pos: "adj.", zh: "隨後的；接著發生的" },
  "evaluate":       { pos: "v.", zh: "評估；評價；估價" },
  "hypothesis":     { pos: "n.", zh: "假設；假說；前提" },
  "consistent":     { pos: "adj.", zh: "一致的；始終如一的；連貫的" },
  "crucial":        { pos: "adj.", zh: "關鍵的；至關重要的；決定性的" },
  "phenomenon":     { pos: "n.", zh: "現象；罕見奇蹟" },
  "potential":      { pos: "adj. / n.", zh: "潛在的；可能的；潛力；潛能" },
  "implement":      { pos: "v. / n.", zh: "實施；執行；貫徹；工具" },
  "maintain":       { pos: "v.", zh: "維持；保持；堅持主張" },

  // 干擾項詞庫與延伸詞彙
  "generate":       { pos: "v.", zh: "產生；引起；發電" },
  "indicate":       { pos: "v.", zh: "指出；顯示；表明" },
  "isolate":        { pos: "v.", zh: "使孤立；隔離；分離" },
  "facilitate":     { pos: "v.", zh: "促進；促使；使便利" },
  "compensate":     { pos: "v.", zh: "賠償；補償；抵銷" },
  "eliminate":      { pos: "v.", zh: "消除；淘汰；排除" },
  "stimulate":      { pos: "v.", zh: "刺激；激勵；促使" },
  "diminish":       { pos: "v.", zh: "減少；縮減；降低" },
  "dominate":       { pos: "v.", zh: "支配；主導；在…中占首要地位" },
  "accelerate":     { pos: "v.", zh: "加速；加快；促進" },
  "obstacle":       { pos: "n.", zh: "障礙；阻礙；妨礙" },
  "dimension":      { pos: "n.", zh: "維度；尺寸；層面" },
  "framework":      { pos: "n.", zh: "框架；架構；體系" },
  "criterion":      { pos: "n.", zh: "準則；標準；評判尺度" },
  "consensus":      { pos: "n.", zh: "共識；一致看法" },
  "mechanism":      { pos: "n.", zh: "機制；機械裝置；運作途徑" },
  "substitute":     { pos: "n. / v.", zh: "替代品；代替；取代" },
  "hierarchy":      { pos: "n.", zh: "等級制度；階層結構" },
  "transition":     { pos: "n. / v.", zh: "轉變；過渡；變遷" },
  "discrepancy":    { pos: "n.", zh: "差異；不一致；分歧" },
  "arbitrary":      { pos: "adj.", zh: "專斷的；任意的；武斷的" },
  "coherent":       { pos: "adj.", zh: "條理清晰的；前後一致的" },
  "explicit":       { pos: "adj.", zh: "明確的；詳述的；坦率的" },
  "implicit":       { pos: "adj.", zh: "含蓄的；隱含的；不言明的" },
  "preliminary":    { pos: "adj. / n.", zh: "初步的；預備的；開端" },
  "tentative":      { pos: "adj.", zh: "暫時的；試驗性的；猶豫的" },
  "versatile":      { pos: "adj.", zh: "多功能的；多才多藝的" },
  "vulnerable":     { pos: "adj.", zh: "脆弱的；易受傷害的" },
  "prevalent":      { pos: "adj.", zh: "普遍的；盛行的；流行的" },
  "substantial":    { pos: "adj.", zh: "實質的；大量的；可觀的" },

  // 日常與延伸
  "apple":          { pos: "n.", zh: "蘋果" },
  "banana":         { pos: "n.", zh: "香蕉" },
  "cherry":         { pos: "n.", zh: "櫻桃" },
  "acquire":        { pos: "v.", zh: "獲得；習得；收購" },
  "allocate":       { pos: "v.", zh: "分配；配置；分派" },
  "alter":          { pos: "v.", zh: "改變；修改；調整" },
  "coherent":       { pos: "adj.", zh: "連貫的；有條理的" },
  "consequence":    { pos: "n.", zh: "結果；後果；重要性" },
  "distinguish":    { pos: "v.", zh: "區分；辨別；使出眾" },
  "emphasize":      { pos: "v.", zh: "強調；著重" },
  "enhance":        { pos: "v.", zh: "增強；提升；提高" },
  "inevitable":     { pos: "adj.", zh: "不可避免的；必然的" },
  "justify":        { pos: "v.", zh: "證明…合理；為…辯護" },
  "manifest":       { pos: "v. / adj.", zh: "表明；展現；顯而易見的" },
  "reinforce":      { pos: "v.", zh: "強化；加強；增援" },
  "significance":   { pos: "n.", zh: "重要性；意義" },
  "undergo":        { pos: "v.", zh: "經歷；經受；接受" }
};

/** 查詢本地字典或 localStorage 延伸字典的中文釋義 (純前端 0 API 呼叫) */
export function getLocalTranslation(word) {
  if (!word) return null;
  const key = String(word).trim().toLowerCase();
  
  // 1. 本地靜態字典比對
  if (LOCAL_DICTIONARY[key]) {
    const entry = LOCAL_DICTIONARY[key];
    if (typeof entry === "object") {
      return { pos: entry.pos || "", zh: entry.zh || "" };
    }
    return { pos: "", zh: String(entry) };
  }

  // 簡易複數或時態還原嘗試 (Lemmatization Fallback)
  let lemmaKey = null;
  if (key.endsWith("ies") && key.length > 4) lemmaKey = key.slice(0, -3) + "y";
  else if (key.endsWith("es") && key.length > 3) lemmaKey = key.slice(0, -2);
  else if (key.endsWith("s") && !key.endsWith("ss") && key.length > 3) lemmaKey = key.slice(0, -1);
  else if (key.endsWith("ed") && key.length > 4) lemmaKey = key.slice(0, -2);
  else if (key.endsWith("ing") && key.length > 5) lemmaKey = key.slice(0, -3);

  if (lemmaKey && LOCAL_DICTIONARY[lemmaKey]) {
    const entry = LOCAL_DICTIONARY[lemmaKey];
    if (typeof entry === "object") {
      return { pos: entry.pos || "", zh: entry.zh || "" };
    }
    return { pos: "", zh: String(entry) };
  }
  
  // 2. 嘗試從使用者單字庫字典快取 (vocab_custom_dict) 取得
  try {
    const userDict = JSON.parse(localStorage.getItem("vocab_custom_dict") || "{}");
    if (userDict[key]) {
      const val = userDict[key];
      if (typeof val === "object") {
        return { pos: val.pos || "", zh: val.zh || "" };
      }
      // 若為字串，嘗試解析是否存在 [pos] 前綴
      const posMatch = String(val).match(/^\[(.*?)\]\s*(.*)$/);
      if (posMatch) {
        return { pos: posMatch[1], zh: posMatch[2] };
      }
      return { pos: "", zh: String(val) };
    }
  } catch (e) {}

  return null;
}

// ── 前端干擾項備用詞庫（Distractor Pool）──
const DISTRACTOR_POOL = [
  "generate", "indicate", "isolate", "facilitate", "compensate",
  "eliminate", "stimulate", "diminish", "dominate", "accelerate",
  "obstacle", "dimension", "framework", "criterion", "consensus",
  "mechanism", "substitute", "hierarchy", "transition", "discrepancy",
  "arbitrary", "coherent", "explicit", "implicit", "preliminary",
  "tentative", "versatile", "vulnerable", "prevalent", "substantial"
];

// ── 本地快取層（Local Cache Layer - 24 小時有效）──
const CACHE_PREFIX = "vocab_exercise_cache_";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function generateCacheKey(words, selectedTypes, difficulty, lang) {
  const sortedWords = [...words].map(w => w.trim().toLowerCase()).sort().join(",");
  const sortedTypes = [...selectedTypes].sort().join(",");
  return `${CACHE_PREFIX}${sortedWords}_${sortedTypes}_${difficulty}_${lang}`;
}

function getCachedExercise(cacheKey) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const raw = localStorage.getItem(cacheKey);
    if (!raw) return null;
    const item = JSON.parse(raw);
    if (Date.now() - item.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    return item.data;
  } catch (e) {
    return null;
  }
}

function setCachedExercise(cacheKey, data) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    localStorage.setItem(cacheKey, JSON.stringify({
      timestamp: Date.now(),
      data: data
    }));
  } catch (e) {
    console.warn("Storage full or error saving cache:", e);
  }
}

/**
 * 主要函式：生成填空題組（含本地快取與 Token 成本極限優化）
 *
 * @param {string[]} words     - 單字陣列，例如 ["apple","banana","cherry"]
 * @param {string}   lang      - "en" 或 "zh"
 * @param {string}   difficulty - "elementary" | "middle" | "high"
 * @param {object}   options   - 選項配置
 */
/**
 * 前端 Adapter：將 AI 輸出的極限壓縮 JSON 映射回既有 UI 元件所需完整資料結構
 * 壓縮鍵名：
 * art -> articles, t -> text, tw -> targetWords, b -> blanks, exp -> explanation
 * w -> word, pos -> pos, zh -> translation
 * sen -> sentences, itm -> items, s -> sentence
 * glo -> glossary
 */
export function adaptCompactPayload(parsed) {
  if (!parsed || typeof parsed !== "object") return { articles: [], sentences: [], glossary: [] };

  const rawArts = parsed.art || parsed.articles || [];
  const articles = rawArts.map(a => ({
    title: a.title || "Contextual Reading Drill",
    targetWords: a.tw || a.targetWords || (a.b || a.blanks || []).map(b => b.w || b.word),
    text: a.t || a.text || "",
    blanks: (a.b || a.blanks || []).map(b => ({
      word: b.w || b.word || "",
      explanation: b.exp || b.explanation || b.zh || ""
    })),
    explanation: a.exp || a.explanation || a.zh || ""
  }));

  const rawSens = parsed.sen || parsed.sentences || [];
  const sentences = rawSens.map(s => ({
    word: s.w || s.word || "",
    items: (s.itm || s.items || []).map(item => ({
      sentence: item.s || item.sentence || "",
      explanation: item.exp || item.explanation || item.zh || "",
      options: item.options || []
    }))
  }));

  const rawGlo = parsed.glo || parsed.glossary || [];
  const glossary = rawGlo.map(g => ({
    word: (g.w || g.word || "").toLowerCase().trim(),
    pos: g.pos || g.p || "",
    translation: g.zh || g.translation || ""
  }));

  return { articles, sentences, glossary };
}
export async function generateExercise(words, lang, difficulty, options = {}) {
  const isAutoWords = options.wordsPerArticle === "auto" || !options.wordsPerArticle;
  const isAutoArticles = options.numArticles === "auto" || !options.numArticles;
  
  const wordsPerArticle = isAutoWords ? null : parseInt(options.wordsPerArticle, 10);
  const targetArticles = isAutoArticles ? null : parseInt(options.numArticles, 10);
  const historySummary = options.historySummary || null;
  const selectedTypes = options.selectedTypes || ["article", "sentence", "spelling"];

  const wantArticles = selectedTypes.includes("article");
  const wantSentences = selectedTypes.includes("sentence") || selectedTypes.includes("spelling");

  // 1. 檢查本地快取（若無歷史錯誤差異，可直接命中極速回傳，節省 100% Token）
  const cacheKey = generateCacheKey(words, selectedTypes, difficulty, lang + `_w${options.wordsPerArticle}_a${options.numArticles}`);
  if (!historySummary) {
    const cached = getCachedExercise(cacheKey);
    if (cached) {
      console.log("⚡ 命中本地 24h 快取，零 API Token 消耗載入！");
      return cached;
    }
  }

  const chunks = [];
  if (wantArticles) {
    if (!isAutoWords && !isAutoArticles) {
      // 兩者皆指定
      for (let i = 0; i < targetArticles; i++) {
        const start = i * wordsPerArticle;
        const slice = words.slice(start, start + wordsPerArticle);
        if (slice.length > 0) chunks.push(slice);
        else if (chunks.length > 0) {
          chunks.push(words.slice(0, Math.min(wordsPerArticle, words.length)));
        }
      }
    } else if (!isAutoWords && isAutoArticles) {
      // 指定每篇字數，篇數由 AI 或總單字量均分
      for (let i = 0; i < words.length; i += wordsPerArticle) {
        chunks.push(words.slice(i, i + wordsPerArticle));
      }
    } else if (isAutoWords && !isAutoArticles) {
      // 指定篇數，每篇字數平均分配
      const numArts = Math.max(1, targetArticles);
      const perArt = Math.max(1, Math.ceil(words.length / numArts));
      for (let i = 0; i < numArts; i++) {
        const slice = words.slice(i * perArt, (i + 1) * perArt);
        if (slice.length > 0) chunks.push(slice);
      }
    } else {
      // 全由 AI 自行判斷最佳篇數與篇幅分組 (Auto)
      // 若單字量 <= 6 篇幅 1 篇；6~12 篇幅 1~2 篇；>12 篇幅每 4~6 字一篇
      const idealChunkSize = words.length <= 6 ? words.length : (words.length <= 12 ? Math.ceil(words.length / 2) : 5);
      for (let i = 0; i < words.length; i += idealChunkSize) {
        chunks.push(words.slice(i, i + idealChunkSize));
      }
    }

    if (chunks.length === 0) {
      chunks.push(words);
    }
  }

  const wordsUsedInArticles = chunks.length > 0 ? Array.from(new Set(chunks.flat())) : words;
  const diffDesc = DIFFICULTY_MAP[difficulty] || DIFFICULTY_MAP.middle;
  const isEn = lang === "en";
  const diffText = isEn ? diffDesc.en : diffDesc.zh;

  // 2. 構建包含 glossary 的 Prompt 模板
  const prompt = buildPrompt(wordsUsedInArticles, chunks, lang, diffText, isEn, historySummary, selectedTypes);
  const rawText = await callGemini(prompt);
  const parsedRaw = parseJSON(rawText);
  // 透過 Adapter 自動展開壓縮鍵名（art->articles, sen->sentences, glo->glossary）
  const parsed = adaptCompactPayload(parsedRaw);

  // 3. 處理篇章詞彙庫 (Glossary)
  const rawGlossary = Array.isArray(parsed.glossary) ? parsed.glossary : [];
  // 將 glossary 項目自動寫入本地快取，利於全站即時免聯網查詢
  try {
    const customDict = JSON.parse(localStorage.getItem("vocab_custom_dict") || "{}");
    rawGlossary.forEach(item => {
      if (item && item.word) {
        const wKey = String(item.word).trim().toLowerCase();
        customDict[wKey] = {
          pos: item.pos || "",
          zh: item.translation || item.zh || ""
        };
      }
    });
    localStorage.setItem("vocab_custom_dict", JSON.stringify(customDict));
  } catch (e) {}

  // 4. 由前端字典或 glossary 補齊 translation，確保與下游 practice.html 介面相容
  const rawArticles = wantArticles ? (parsed.articles || []) : [];
  rawArticles.forEach(art => {
    (art.blanks || []).forEach(b => {
      const gMatch = rawGlossary.find(g => String(g.word).toLowerCase() === String(b.word).toLowerCase());
      b.translation = b.translation || (gMatch ? gMatch.translation : "") || getLocalTranslation(b.word);
    });
  });

  const rawSentences = wantSentences ? (parsed.sentences || []) : [];
  rawSentences.forEach(group => {
    const gMatch = rawGlossary.find(g => String(g.word).toLowerCase() === String(group.word).toLowerCase());
    group.translation = group.translation || (gMatch ? gMatch.translation : "") || getLocalTranslation(group.word);
  });

  const exerciseResult = {
    words,
    lang,
    difficulty,
    selectedTypes,
    articles: rawArticles,
    sentences: rawSentences,
    glossary: rawGlossary
  };

  // 5. 存入本地快取（24 小時有效）
  setCachedExercise(cacheKey, exerciseResult);

  return exerciseResult;
}

/**
 * 構建包含篇章詞彙庫 (Glossary) 的 Prompt 模板
 */
function buildPrompt(words, chunks, lang, diffText, isEn, historySummary, selectedTypes = ["article", "sentence", "spelling"]) {
  const wantArticles = selectedTypes.includes("article");
  const wantSentences = selectedTypes.includes("sentence") || selectedTypes.includes("spelling");
  // 策略 4: 單字數 > 5 時每字僅需 1 個例句；單字較少時產生 2 個例句，大幅節省 50% 句子 Token
  const sentsPerWord = words.length > 5 ? 1 : 2;

  const articleRequests = chunks.map((chunk, i) =>
    `Article ${i + 1} words: ${chunk.join(", ")}`
  ).join("\n");

  const historyInstructionEn = historySummary
    ? `Student History: ${historySummary}\nReinforce clear contextual contrast for weak words.\n`
    : "";

  const historyInstructionZh = historySummary
    ? `學生歷史答題：${historySummary}\n請針對常錯單字強化語境提示與辨析。\n`
    : "";

  if (isEn) {
    // 極限壓縮鍵名：art, t, tw, b, w, exp, sen, itm, s, glo, pos, zh (可減少約 35% JSON Token)
    const articlesSchema = wantArticles ? `  "art": [
    {
      "tw": ["word1", "word2"],
      "t": "Paragraph naturally using target words.",
      "b": [
        { "w": "word1", "exp": "【繁體中文】精準解析（15~25字）：簡述上下文語意與關鍵搭配。" }
      ],
      "exp": "【繁體中文】1 句話概括主旨。"
    }
  ]` : "";

    const sentencesSchema = wantSentences ? `  "sen": [
    {
      "w": "word1",
      "itm": [
        { 
          "s": "Context sentence with ___BLANK___.", 
          "exp": "【繁體中文】精簡解析（15~25字）：含句意翻譯與選擇 word1 理由。" 
        }
      ]
    }
  ]` : "";

    const glossarySchema = `  "glo": [
    {
      "w": "target word",
      "pos": "n./v./adj.",
      "zh": "繁體中文精確釋義"
    }
  ]`;

    const schemaParts = [articlesSchema, sentencesSchema, glossarySchema].filter(Boolean).join(",\n");

    return `You are a Senior Exam Item Writer & Curriculum Designer specializing in the Taiwan General Scholastic Ability Test (GSAT 學測), TOEIC, and CEFR B1-B2 / GEPT High-Intermediate English exams. Your task is to design high-standard, authentic cloze and vocabulary test items at ${diffText}.
${historyInstructionEn}Target Words: ${words.join(", ")}

Return ONLY a JSON object with this exact structure:
{
${schemaParts}
}

EXAM SPECIFICATIONS & RULES:
${wantArticles ? `1. CLOZE TEST (綜合測驗 / 篇章克漏字) - GSAT & CEFR Standard:
- Length & Structure: Each passage must be a coherent, well-crafted, 150–220 word article featuring a clear introductory topic sentence, logical development with transitional cues, and a conclusion.
- Passage Topics: Academic/scientific trends, environmental sustainability, humanities, world history, cultural phenomena, or everyday science.
- Word Integration & Blanks:
  * Integrate designated target words naturally:\n${articleRequests}
  * If an article has 4+ words, divide into 2-3 structured paragraphs with double newlines (\\n\\n).
  * CRITICAL FOR ARTICLE TEXT (文章填空佔位符規範): Every target word in "text" MUST be replaced by an indexed placeholder: [BLANK_1], [BLANK_2], [BLANK_3], etc., matching the exact 1-to-1 order of the items in the "blanks" array.
  * DO NOT use plain numbers like (1) or (2), and DO NOT leave the raw target word in the text.
  * Context Clues: Surrounding context MUST provide strong semantic indicators, transition words (e.g., however, consequently, furthermore), or idiomatic collocations so that only the designated target word logically and grammatically fits.` : ""}

${wantSentences ? `2. SENTENCE COMPLETION (詞彙單題 / 句子選擇) - GSAT Part 1 Standard:
- Provide ${sentsPerWord} distinct, exam-grade sentence(s) per target word.
- Complexity & Length: Each sentence must be 20–35 words long, employing compound or complex sentence structures (e.g., relative clauses, participial phrases, concessive or conditional clauses). Avoid overly simple or childish sentences.
- Placeholders: Replace the target word with the single placeholder: ___BLANK___
- CRITICAL ANTI-LEAK RULE (嚴格防漏題規則): The target word (and any direct inflected/root forms of it) MUST NOT appear anywhere else in the generated sentence! ___BLANK___ is the ONLY placeholder.
- Contextual Logic: Ensure rich contextual clues, cause-and-effect indicators, or strong collocations are present so students can clearly deduce the intended word.` : ""}

3. PASSAGE GLOSSARY (篇章繁中詞彙對照表):
- In "glossary", include ONLY the designated Target Words (${words.join(", ")}) with lowercase "word", "pos", and concise "translation" (Traditional Chinese). Do not add extra words.

4. CONCISE EXPLANATION GUIDELINES (精準中文解析規範):
- ALL "explanation" and "translation" MUST BE IN TRADITIONAL CHINESE (繁體中文).
- Keep each explanation strictly between 15-25 words: focus directly on the decisive context clue or collocation.
- Output ONLY valid JSON with no markdown wrapping or preamble.`;
  } else {
    // 中文版本精簡 Schema
    const articlesSchemaZh = wantArticles ? `  "art": [
    {
      "tw": ["單字1", "單字2"],
      "t": "融入目標單字的自然文章段落。",
      "b": [
        { "w": "單字1", "exp": "繁體中文精簡解析（15~25字）：說明上下文關鍵線索。" }
      ],
      "exp": "1 句話主旨摘要。"
    }
  ]` : "";

    const sentencesSchemaZh = wantSentences ? `  "sen": [
    {
      "w": "單字1",
      "itm": [
        { "s": "含有___BLANK___的高階語境句子（20~35字）。", "exp": "繁體中文精簡解析（15~25字）：翻譯與填答理由。" }
      ]
    }
  ]` : "";

    const glossarySchemaZh = `  "glo": [
    {
      "w": "目標單字",
      "pos": "詞性 (如 n., v., adj.)",
      "zh": "貼合語境的繁體中文釋義"
    }
  ]`;

    const schemaPartsZh = [articlesSchemaZh, sentencesSchemaZh, glossarySchemaZh].filter(Boolean).join(",\n");

    return `你是資深英語檢定與大學學測命題專家，請為${diffText}學生製作符合學測與國際英檢標準的高品質題型。
${historyInstructionZh}目標單字：${words.join("、")}

請輸出以下結構的 JSON：
{
${schemaPartsZh}
}

命題規範：
${wantArticles ? `1. 綜合測驗 / 篇章克漏字：
- 篇章長度為 120～180 字完整短文，具備明確主題句與轉折邏輯。
- 依要求將單字自然寫入文章：\n${articleRequests}\n- 單字達 4 個以上請以 \\n\\n 分段。
- 文章中的目標單字位置必須統一使用 [BLANK_1]、[BLANK_2] 等佔位符，嚴禁直接寫出答案或使用 (1)。
- 空格前後必須有明確的語境線索與慣用語搭配。` : ""}
${wantSentences ? `2. 詞彙單題：
- 每個單字提供 ${sentsPerWord} 個高鑑別度例句，長度約 20～30 字。
- 句子中目標單字請以 ___BLANK___ 代替。
- 嚴格防漏題規則：目標單字及其衍生詞嚴禁出現在該題句子的其他任何位置！
- 句意需具備充足的上下文邏輯提示。` : ""}
3. 篇章詞彙庫 (glossary)：僅需包含本次目標單字之小寫原型、詞性與繁體中文釋義。
4. 解析一律使用繁體中文，精簡於 15~25 字直指解題關鍵。
- 只輸出合法 JSON，不要任何多餘外層文字。`;
  }
}

/**
 * 前端自行合成干擾選項（前端 Distractor Synthesis）
 * 徹底不仰賴 API 輸出 distractors，直接從目標單字組 + 前端詞庫隨機抽取
 */
export function buildOptions(exerciseData) {
  if (!exerciseData) return exerciseData;

  const allTargetWords = (exerciseData.words || []).map(w => w.trim().toLowerCase());

  // 文章部分選項合成
  if (exerciseData.articles && Array.isArray(exerciseData.articles)) {
    exerciseData.articles = exerciseData.articles.map(article => {
      const artTargets = (article.targetWords || []).map(w => w.trim());
      // 若原文章 targetWords 已滿 4 個，直接使用作為選項；不足則由外部單字庫補齊
      const pool = Array.from(new Set([
        ...artTargets,
        ...allTargetWords,
        ...DISTRACTOR_POOL
      ]));

      // 篩選出不屬於目前文章目標詞的候選干擾項
      const targetLower = new Set(artTargets.map(t => t.toLowerCase()));
      const availableDistractors = pool.filter(w => !targetLower.has(w.toLowerCase()));
      const shuffledDistractors = shuffle(availableDistractors).slice(0, 3);

      const finalOptions = Array.from(new Set([...artTargets, ...shuffledDistractors]));
      article.options = shuffle(finalOptions);
      return article;
    });
  }

  // 句子部分選項合成
  if (exerciseData.sentences && Array.isArray(exerciseData.sentences)) {
    exerciseData.sentences = exerciseData.sentences.map(sentGroup => {
      const correctWord = (sentGroup.word || "").trim();
      const pool = Array.from(new Set([
        ...allTargetWords,
        ...DISTRACTOR_POOL
      ])).filter(w => w.toLowerCase() !== correctWord.toLowerCase());

      sentGroup.items = (sentGroup.items || []).map(item => {
        // 隨機抽 3 個干擾選項，組成 4 選 1
        const randomDistractors = shuffle(pool).slice(0, 3);
        const finalOpts = [correctWord, ...randomDistractors];
        item.options = shuffle(finalOpts);
        return item;
      });
      return sentGroup;
    });
  }

  return exerciseData;
}

/**
 * 大量單字分批：把任意數量（150、1000…）的單字切成小批次，每批各自出題
 */
export function splitBatches(words, wordsPerArticle) {
  const wpa = parseInt(wordsPerArticle, 10);
  const size = wpa > 0 ? wpa * Math.max(1, Math.floor(12 / wpa)) : 12;
  const batches = [];
  for (let i = 0; i < words.length; i += size) batches.push(words.slice(i, i + size));
  return batches;
}

/**
 * 針對單一批次單字生成題型並合成干擾選項
 */
export async function generateBatch(words, meta, types) {
  const result = await generateExercise(words, meta.lang || 'en', meta.difficulty || 'middle', {
    wordsPerArticle: meta.wordsPerArticle,
    numArticles: 'auto',
    historySummary: meta.historySummary || null,
    selectedTypes: types
  });
  return buildOptions(result);
}

/**
 * 非同步背景補全題目（專門生成句子題型與干擾選項）
 */
export async function generateRemainingSentences(exerciseData) {
  if (!exerciseData || !exerciseData.words) return null;
  const sentenceTypes = (exerciseData.selectedTypes || []).filter(t => t === 'sentence' || t === 'spelling');
  if (sentenceTypes.length === 0) return null;

  const result = await generateExercise(exerciseData.words, exerciseData.lang || 'en', exerciseData.difficulty || 'middle', {
    selectedTypes: sentenceTypes,
    historySummary: exerciseData.historySummary || null
  });

  return buildOptions(result).sentences || [];
}

/** Fisher-Yates shuffle */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

