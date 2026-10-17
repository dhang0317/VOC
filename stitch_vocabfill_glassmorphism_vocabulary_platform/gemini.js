// =============================================
// GEMINI API - 生成填空題邏輯
// =============================================

function getApiKey() {
  return localStorage.getItem("gemini_api_key") || "";
}

const GEMINI_MODEL = "gemini-2.5-flash";

/**
 * 呼叫 Gemini API
 * @param {string} prompt
 * @returns {string} - 模型回傳的純文字
 */
async function callGemini(prompt) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 8192,
        responseMimeType: "application/json"
      }
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `API 錯誤 ${res.status}`);
  }

  const data = await res.json();
  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text;
  if (!text) {
    if (candidate?.finishReason === "SAFETY") throw new Error("內容被安全過濾器攔截，請嘗試更換單字");
    throw new Error("AI 沒有回傳內容，請再試一次");
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

/**
 * 主要函式：生成填空題組
 *
 * @param {string[]} words     - 單字陣列，例如 ["apple","banana","cherry"]
 * @param {string}   lang      - "en" 或 "zh"
 * @param {string}   difficulty - "elementary" | "middle" | "high"
 * @returns {object} exerciseData 結構如下：
 * {
 *   words: string[],
 *   lang: string,
 *   difficulty: string,
 *   articles: [
 *     {
 *       targetWords: string[],        // 此篇文章使用的單字
 *       text: string,                  // 完整文章（含正確單字）
 *       blanks: [{ word, position }], // 要挖空的單字
 *       options: string[]              // 選項（含干擾選項）
 *     }
 *   ],
 *   sentences: [
 *     {
 *       word: string,
 *       items: [
 *         { sentence: string, options: string[] }  // 每個句子 + 選項
 *       ]
 *     }
 *   ]
 * }
 */
export async function generateExercise(words, lang, difficulty, options = {}) {
  // 可客製化：每篇文章單字數、總文章篇數、歷史答題弱點參考
  const wordsPerArticle = parseInt(options.wordsPerArticle, 10) || 3;
  const targetArticles = options.numArticles ? parseInt(options.numArticles, 10) : null;
  const historySummary = options.historySummary || null;

  const chunks = [];
  if (targetArticles && targetArticles > 0) {
    // 依據指定的篇數均分單字
    for (let i = 0; i < targetArticles; i++) {
      const start = i * wordsPerArticle;
      const slice = words.slice(start, start + wordsPerArticle);
      if (slice.length > 0) chunks.push(slice);
      else if (chunks.length > 0) {
        // 若單字已分配完但指定多篇，複用現有單字搭配
        chunks.push(words.slice(0, Math.min(wordsPerArticle, words.length)));
      }
    }
  } else {
    // 依據指定的每篇單字數分組
    for (let i = 0; i < words.length; i += wordsPerArticle) {
      chunks.push(words.slice(i, i + wordsPerArticle));
    }
  }

  // 確保至少有一篇文章分組
  if (chunks.length === 0) {
    chunks.push(words);
  }

  // 篩選出所有在文章中用到的單字
  const wordsUsedInArticles = Array.from(new Set(chunks.flat()));

  const diffDesc = DIFFICULTY_MAP[difficulty] || DIFFICULTY_MAP.middle;
  const isEn = lang === "en";
  const diffText = isEn ? diffDesc.en : diffDesc.zh;

  // ── 一次呼叫同時生成文章 + 句子 ─────
  const prompt = buildPrompt(wordsUsedInArticles, chunks, lang, diffText, isEn, historySummary);
  const rawText = await callGemini(prompt);
  const parsed  = parseJSON(rawText);

  return {
    words,
    lang,
    difficulty,
    articles:  parsed.articles  || [],
    sentences: parsed.sentences || []
  };
}

function buildPrompt(words, chunks, lang, diffText, isEn, historySummary) {
  const articleRequests = chunks.map((chunk, i) =>
    `Article ${i + 1}: use ALL of these words naturally: ${chunk.join(", ")}`
  ).join("\n");

  const historyInstructionEn = historySummary
    ? `\nStudent's Past Performance Reference:\n${historySummary}\nPlease pay special attention to the student's weak areas/past incorrect words by reinforcing their clear contexts and explanatory distinctions.\n`
    : "";

  const historyInstructionZh = historySummary
    ? `\n學生過往答題狀況參考：\n${historySummary}\n請特別針對學生答錯率較高的單字或易混淆處，強化語境提示與辨析解說。\n`
    : "";

  if (isEn) {
    return `You are an English teacher creating fill-in-the-blank exercises for students at ${diffText}.
Your target students are Traditional Chinese speakers (繁體中文).
${historyInstructionEn}
Words to use: ${words.join(", ")}

Generate a JSON object with exactly this structure:
{
  "articles": [
    {
      "targetWords": ["word1", "word2", "word3"],
      "text": "The full article paragraph with the target words included naturally.",
      "blanks": [
        { "word": "word1", "translation": "中文翻譯" },
        { "word": "word2", "translation": "中文翻譯" },
        { "word": "word3", "translation": "中文翻譯" }
      ],
      "distractors": ["wrong1", "wrong2"],
      "explanation": "【文章語境與單字中文翻譯】\\n- word1 (詞性)：中文翻譯與用法說明\\n- word2 (詞性)：中文翻譯與用法說明\\n- word3 (詞性)：中文翻譯與用法說明\\n文章大意與填空脈絡說明。"
    }
  ],
  "sentences": [
    {
      "word": "word1",
      "translation": "中文翻譯",
      "items": [
        { 
          "sentence": "Sentence with ___BLANK___ in place of word1.", 
          "distractors": ["wrong1", "wrong2"],
          "explanation": "【單字翻譯與解析】word1 (詞性) 中文翻譯。例句中文翻譯，以及為何在此處使用該單字。"
        },
        { 
          "sentence": "Another sentence with ___BLANK___.", 
          "distractors": ["wrong1", "wrong2"],
          "explanation": "【單字翻譯與解析】word1 (詞性) 中文翻譯。例句中文翻譯與用法解析。"
        }
      ]
    }
  ]
}

Rules:
- ${articleRequests}
- If an article has 4 or more target words, organize the article into multiple natural paragraphs separated by newline characters (\\n\\n).
- Provide 2 example sentences per word.
- For each article and sentence explanation, ALWAYS include the Traditional Chinese (繁體中文) translation of the English vocabulary words, their part of speech (詞性), and sentence context explanation.
- In sentence "sentence" field, replace the target word with ___BLANK___.
- "distractors" are 2 plausible but wrong words.
- Output ONLY valid JSON, no markdown, no extra explanation outside JSON.`;
  } else {
    return `你是中文老師，請為${diffText}學生製作填空練習題。
${historyInstructionZh}
單字清單：${words.join("、")}

請輸出以下結構的 JSON：
{
  "articles": [
    {
      "targetWords": ["單字1", "單字2", "單字3"],
      "text": "包含所有目標單字的完整文章段落。若單字較多，請以換行(\\n\\n)分為2~3個自然段落。",
      "blanks": [
        { "word": "單字1" },
        { "word": "單字2" },
        { "word": "單字3" }
      ],
      "distractors": ["干擾詞1", "干擾詞2"],
      "explanation": "【文章語境與詞彙詳解】包含各目標單字之精確釋義、成語/詞性說明與段落語境脈絡。"
    }
  ],
  "sentences": [
    {
      "word": "單字1",
      "items": [
        { 
          "sentence": "含有___BLANK___的句子（___BLANK___代替目標單字）。", 
          "distractors": ["干擾詞1", "干擾詞2"],
          "explanation": "【詞義與語境解析】單字詳細釋義、例句意思解析與用法說明。"
        },
        { 
          "sentence": "第二個句子，含___BLANK___。", 
          "distractors": ["干擾詞1", "干擾詞2"],
          "explanation": "【詞義與語境解析】單字詳細釋義與例句解析。"
        }
      ]
    }
  ]
}

規則：
- ${articleRequests}
- 若文章包含 4 個或以上單字，請務必將文章分為 2 到 3 個段落（以 \\n\\n 分段），使閱讀與結構清晰自然。
- 每個單字製作 2 個例句。
- 務必為每篇文章與每個句子提供深入易懂的 "explanation"（詳解），包含目標詞彙的精確釋義與用法。
- sentence 欄位中將目標單字替換為 ___BLANK___。
- distractors 是 2 個合理但錯誤的選項。
- 只輸出合法 JSON，不要 markdown，不要任何多餘外層文字。`;
  }
}

/**
 * 將 AI 回傳的原始 exercise data 轉換為含選項的完整題目
 * （為每個空格建立包含正確答案 + 干擾選項的 options 陣列，並打亂順序）
 */
export function buildOptions(exerciseData) {
  // 文章部分
  exerciseData.articles = exerciseData.articles.map(article => {
    const allOptions = [...article.targetWords, ...(article.distractors || [])];
    article.options = shuffle(allOptions);
    return article;
  });

  // 句子部分
  exerciseData.sentences = exerciseData.sentences.map(sentGroup => {
    sentGroup.items = sentGroup.items.map(item => {
      const allOpts = [sentGroup.word, ...(item.distractors || [])];
      item.options = shuffle(allOpts);
      return item;
    });
    return sentGroup;
  });

  return exerciseData;
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
