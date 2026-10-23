// =============================================
// APP.JS - 共用工具與狀態管理
// =============================================
import { onAuthChange, getCurrentUser, logout, loginWithGoogle } from "./firebase-config.js";

// ── Toast 通知 ─────────────────────────────
export function showToast(msg, type = "info") {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  
  // 建立通知內容（光暈狀態指示燈 + 訊息文字）
  toast.innerHTML = `<span class="toast-dot"></span><span class="toast-msg">${msg}</span>`;
  toast.className = `toast ${type} show`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3200);
}

// ── Glassmorphism Confirm Modal (自訂確認對話框 UI，取代 window.confirm) ──
export function showConfirmModal({
  title = "請確認",
  message = "確定要執行此操作嗎？",
  confirmText = "確認",
  cancelText = "取消",
  isDanger = true
} = {}) {
  return new Promise((resolve) => {
    let overlay = document.getElementById("custom-confirm-modal");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "custom-confirm-modal";
      overlay.className = "modal-overlay";
      document.body.appendChild(overlay);
    }

    const dangerBtnClass = isDanger 
      ? "background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); color: #ff8888;" 
      : "background: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.3); color: #ffffff;";

    overlay.innerHTML = `
      <div class="modal-box" style="max-width: 400px; text-align: center; border-radius: 20px; padding: 26px 22px;">
        <div style="width: 48px; height: 48px; border-radius: 50%; background: ${isDanger ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.1)'}; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 14px;">
          <span class="material-symbols-outlined" style="font-size: 24px; color: ${isDanger ? '#ef4444' : '#ffffff'};">${isDanger ? 'warning' : 'help'}</span>
        </div>
        <h3 style="font-size: 1.15rem; font-weight: 700; color: #fff; margin-bottom: 8px;">${title}</h3>
        <p style="font-size: 0.9rem; color: #a3a3a3; line-height: 1.5; margin-bottom: 22px;">${message}</p>
        <div style="display: flex; gap: 10px; justify-content: center;">
          <button id="modal-cancel-action" type="button" style="flex: 1; padding: 10px 16px; border-radius: 12px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #d4d4d4; cursor: pointer; font-size: 0.9rem; font-weight: 500; transition: all 0.2s;">
            ${cancelText}
          </button>
          <button id="modal-confirm-action" type="button" style="flex: 1; padding: 10px 16px; border-radius: 12px; ${dangerBtnClass} cursor: pointer; font-size: 0.9rem; font-weight: 600; transition: all 0.2s;">
            ${confirmText}
          </button>
        </div>
      </div>
    `;

    overlay.classList.add("active");

    const cleanUp = () => {
      overlay.classList.remove("active");
    };

    const confirmBtn = overlay.querySelector("#modal-confirm-action");
    const cancelBtn = overlay.querySelector("#modal-cancel-action");

    confirmBtn.onclick = () => {
      cleanUp();
      resolve(true);
    };

    cancelBtn.onclick = () => {
      cleanUp();
      resolve(false);
    };

    overlay.onclick = (e) => {
      if (e.target === overlay) {
        cleanUp();
        resolve(false);
      }
    };
  });
}

// ── Glassmorphism Prompt Modal (自訂輸入對話框 UI，取代 window.prompt) ──
export function showPromptModal({
  title = "請輸入",
  message = "",
  placeholder = "",
  defaultValue = "",
  confirmText = "確定",
  cancelText = "取消"
} = {}) {
  return new Promise((resolve) => {
    let overlay = document.getElementById("custom-prompt-modal");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "custom-prompt-modal";
      overlay.className = "modal-overlay";
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div class="modal-box" style="max-width: 400px; text-align: center; border-radius: 20px; padding: 26px 22px;">
        <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(255, 255, 255, 0.1); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 14px;">
          <span class="material-symbols-outlined" style="font-size: 24px; color: #ffffff;">folder</span>
        </div>
        <h3 style="font-size: 1.15rem; font-weight: 700; color: #fff; margin-bottom: 8px;">${title}</h3>
        ${message ? `<p style="font-size: 0.9rem; color: #a3a3a3; line-height: 1.5; margin-bottom: 16px;">${message}</p>` : ''}
        <div style="margin-bottom: 20px; text-align: left;">
          <input type="text" id="modal-prompt-input" value="${defaultValue}" placeholder="${placeholder}" 
                 style="width: 100%; padding: 10px 14px; border-radius: 10px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-size: 0.95rem; outline: none; box-sizing: border-box;" />
        </div>
        <div style="display: flex; gap: 10px; justify-content: center;">
          <button id="modal-prompt-cancel" type="button" style="flex: 1; padding: 10px 16px; border-radius: 12px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #d4d4d4; cursor: pointer; font-size: 0.9rem; font-weight: 500; transition: all 0.2s;">
            ${cancelText}
          </button>
          <button id="modal-prompt-confirm" type="button" style="flex: 1; padding: 10px 16px; border-radius: 12px; background: #ffffff; color: #000000; border: none; cursor: pointer; font-size: 0.9rem; font-weight: 600; transition: all 0.2s;">
            ${confirmText}
          </button>
        </div>
      </div>
    `;

    overlay.classList.add("active");
    const inputEl = overlay.querySelector("#modal-prompt-input");
    setTimeout(() => {
      inputEl.focus();
      inputEl.select();
    }, 50);

    const cleanUp = () => {
      overlay.classList.remove("active");
    };

    const confirmBtn = overlay.querySelector("#modal-prompt-confirm");
    const cancelBtn = overlay.querySelector("#modal-prompt-cancel");

    const handleConfirm = () => {
      const val = inputEl.value.trim();
      cleanUp();
      resolve(val || null);
    };

    confirmBtn.onclick = handleConfirm;
    inputEl.onkeydown = (e) => {
      if (e.key === "Enter") handleConfirm();
      if (e.key === "Escape") {
        cleanUp();
        resolve(null);
      }
    };

    cancelBtn.onclick = () => {
      cleanUp();
      resolve(null);
    };

    overlay.onclick = (e) => {
      if (e.target === overlay) {
        cleanUp();
        resolve(null);
      }
    };
  });
}

// ── Loading overlay ────────────────────────
export function showLoading(msg = "AI 生成中...") {
  const el = document.getElementById("loading-overlay");
  if (el) {
    el.querySelector(".loading-text").textContent = msg;
    el.classList.add("active");
  }
}

export function hideLoading() {
  const el = document.getElementById("loading-overlay");
  if (el) el.classList.remove("active");
}

// ── Stars background ───────────────────────
export function initStars(count = 80) {
  const container = document.getElementById("stars-bg");
  if (!container) return;
  for (let i = 0; i < count; i++) {
    const s = document.createElement("div");
    s.className = "star";
    const size = Math.random() * 2 + 0.5;
    s.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random() * 100}%;
      top:${Math.random() * 100}%;
      --dur:${(Math.random() * 4 + 2).toFixed(1)}s;
      animation-delay:${(Math.random() * 4).toFixed(1)}s;
    `;
    container.appendChild(s);
  }
}

// ── Auth guard & nav user display ─────────
export function requireAuth(redirectTo = "index.html") {
  return new Promise(resolve => {
    onAuthChange(user => {
      if (!user) {
        window.location.href = redirectTo;
      } else {
        updateNavUser(user);
        resolve(user);
      }
    });
  });
}

export function updateNavUser(user) {
  const nameEl   = document.getElementById("nav-user-name");
  const avatarEl = document.getElementById("nav-avatar");
  if (nameEl)   nameEl.textContent  = user.displayName || (user.email ? user.email.split("@")[0] : "使用者");
  if (avatarEl) avatarEl.src        = user.photoURL || "";
  if (avatarEl) avatarEl.style.display = user.photoURL ? "block" : "none";
}

// ── Logout button ──────────────────────────
export function initLogoutBtn() {
  const btn = document.getElementById("logout-btn");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    await logout();
    window.location.href = "index.html";
  });
}

// ── sessionStorage helpers ─────────────────
export function saveToSession(key, data) {
  sessionStorage.setItem(key, JSON.stringify(data));
}

export function loadFromSession(key) {
  const raw = sessionStorage.getItem(key);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// ── Difficulty label ───────────────────────
export const DIFFICULTY_LABELS = {
  elementary: "小學",
  middle:     "國中",
  high:       "高中"
};

export const LANG_LABELS = { en: "英文", zh: "中文" };

// ── Format date ────────────────────────────
export function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("zh-TW", { year: "numeric", month: "2-digit", day: "2-digit" })
    + " " + d.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" });
}

// ── Smart Extract Words from raw text ──────
export function smartExtractWords(text, lang = "en") {
  if (!text) return [];
  if (lang === "zh") {
    return Array.from(new Set(text.split(/[\s,，、\n]+/).map(w => w.trim()).filter(w => w.length >= 1)));
  }
  // English regex: words with letters, hyphens, min 2 chars
  const matches = text.match(/[A-Za-z]+(?:-[A-Za-z]+)*/g) || [];
  const stopwords = new Set([
    'the','and','for','that','this','with','from','have','are','was','were',
    'will','been','they','them','their','what','when','where','which','who',
    'whom','whose','why','how','all','any','both','each','few','more','most',
    'other','some','such','above','below','between','into','through','after',
    'before','under','until','while','about','into','over','then','once'
  ]);
  return Array.from(new Set(matches.map(w => w.toLowerCase()).filter(w => w.length >= 2 && !stopwords.has(w))));
}

// ── 查詢單字繁體中文釋義（篇章 Glossary 優先、本地字典直查，0 API 呼叫，0 網路延遲）──
export function lookupTranslation(word) {
  if (!word) return null;
  const clean = String(word).trim().toLowerCase();

  // 1. 第一優先：當前測驗篇章的專屬詞彙庫 (Exercise Glossary from Session)
  try {
    const rawCur = sessionStorage.getItem("currentExercise");
    if (rawCur) {
      const curExercise = JSON.parse(rawCur);
      if (curExercise && Array.isArray(curExercise.glossary)) {
        const found = curExercise.glossary.find(g => String(g.word).trim().toLowerCase() === clean);
        if (found) {
          return {
            pos: found.pos || "",
            zh: found.translation || found.zh || ""
          };
        }
      }
    }
  } catch (e) {}

  // 2. 第二優先：自訂字典快取查找 (vocab_custom_dict)
  try {
    const customDict = JSON.parse(localStorage.getItem("vocab_custom_dict") || "{}");
    if (customDict[clean]) {
      const val = customDict[clean];
      if (typeof val === "object") return { pos: val.pos || "", zh: val.zh || "" };
      const posMatch = String(val).match(/^\[(.*?)\]\s*(.*)$/);
      if (posMatch) return { pos: posMatch[1], zh: posMatch[2] };
      return { pos: "", zh: String(val) };
    }
  } catch (e) {}

  // 3. 第三優先：靜態常備字典查找 (LOCAL_DICTIONARY)
  try {
    if (typeof window !== "undefined" && typeof window.getLocalTranslation === "function") {
      const res = window.getLocalTranslation(clean);
      if (res) return res;
    } else if (typeof window !== "undefined" && window.LOCAL_DICTIONARY && window.LOCAL_DICTIONARY[clean]) {
      const entry = window.LOCAL_DICTIONARY[clean];
      return typeof entry === "object" ? { pos: entry.pos || "", zh: entry.zh || "" } : { pos: "", zh: String(entry) };
    }
  } catch (e) {}

  return null;
}

// ── 將單字同步寫入目前使用者單字庫（並同步快取繁中釋義）──
export function addWordToVocabulary(word, translationData = null) {
  if (!word) return false;
  const cleanWord = String(word).trim().toLowerCase();
  if (!cleanWord) return false;

  let banks = [];
  try {
    banks = JSON.parse(localStorage.getItem("vocab_banks") || "[]");
  } catch (e) {
    banks = [];
  }

  if (!Array.isArray(banks) || banks.length === 0) {
    const legacy = JSON.parse(localStorage.getItem("vocab_bank") || "[]");
    banks = [
      { id: "default", name: "主要單字庫", words: legacy.length > 0 ? legacy : ["sustainability", "articulate", "paradigm"] }
    ];
  }

  let currentBankId = localStorage.getItem("current_bank_id") || banks[0].id;
  let activeBank = banks.find(b => b.id === currentBankId) || banks[0];

  if (!activeBank.words.includes(cleanWord)) {
    activeBank.words.push(cleanWord);
  }

  // 存回 localStorage
  localStorage.setItem("vocab_banks", JSON.stringify(banks));
  localStorage.setItem("vocab_bank", JSON.stringify(activeBank.words));

  // 同步記住其中文釋義與詞性到自訂字典
  if (translationData) {
    try {
      const customDict = JSON.parse(localStorage.getItem("vocab_custom_dict") || "{}");
      customDict[cleanWord] = translationData;
      localStorage.setItem("vocab_custom_dict", JSON.stringify(customDict));
    } catch (e) {}
  }

  return true;
}

// ── 檢查單字是否已被單字庫收錄 ──
export function isWordInVocabulary(word) {
  if (!word) return false;
  const cleanWord = String(word).trim().toLowerCase();
  try {
    const banks = JSON.parse(localStorage.getItem("vocab_banks") || "[]");
    for (const b of banks) {
      if (b.words && b.words.some(w => String(w).toLowerCase() === cleanWord)) {
        return true;
      }
    }
  } catch (e) {}
  return false;
}

// ── 反白文字本地繁中釋義調取與一鍵收錄模組 (0 網路請求) ──
export function initTextSelectionTranslator() {
  // 動態掛載全域字典引用以利秒開查表
  import("./gemini.js").then(mod => {
    if (mod && mod.LOCAL_DICTIONARY) {
      window.LOCAL_DICTIONARY = mod.LOCAL_DICTIONARY;
      window.getLocalTranslation = mod.getLocalTranslation;
    }
  }).catch(() => {});

  let tooltip = document.getElementById("selection-translator-tooltip");
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.id = "selection-translator-tooltip";
    tooltip.className = "fixed z-[9999] hidden max-w-sm transition-all duration-200 select-none";
    tooltip.innerHTML = `
      <div class="rounded-2xl bg-neutral-950/95 text-white backdrop-blur-2xl border border-white/20 p-3.5 shadow-2xl flex flex-col gap-2.5 min-w-[240px]">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2 min-w-0">
            <span class="material-symbols-outlined text-feedback-success text-[16px]">menu_book</span>
            <span class="font-bold text-sm text-primary tracking-wide truncate" id="st-word-title">word</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-neutral-300 font-mono hidden" id="st-word-pos"></span>
          </div>
          <button type="button" id="st-close-btn" class="text-text-dim hover:text-white p-0.5 leading-none transition-colors" title="關閉">
            <span class="material-symbols-outlined text-[15px]">close</span>
          </button>
        </div>
        
        <div class="text-xs text-neutral-200 leading-relaxed font-normal min-h-[1.5rem]" id="st-trans-content">
          <!-- 釋義內容動態注入 -->
        </div>

        <div class="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
          <span class="text-[10px] text-neutral-400 flex items-center gap-1">
            <span class="material-symbols-outlined text-[12px] text-feedback-success">offline_bolt</span>
            <span>本地字典</span>
          </span>
          <button type="button" id="st-add-btn" class="px-3 py-1 rounded-full text-xs font-semibold bg-white text-black hover:bg-neutral-200 transition-all flex items-center gap-1 shadow-sm">
            <span class="material-symbols-outlined text-[13px]">bookmark_add</span>
            <span>＋ 收錄至單字庫</span>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(tooltip);
  }

  const wordTitle = tooltip.querySelector("#st-word-title");
  const wordPos = tooltip.querySelector("#st-word-pos");
  const transContent = tooltip.querySelector("#st-trans-content");
  const addBtn = tooltip.querySelector("#st-add-btn");
  const closeBtn = tooltip.querySelector("#st-close-btn");

  let currentSelectedWord = "";
  let currentResult = null; // { pos, zh }

  const hideTooltip = () => {
    tooltip.classList.add("hidden");
    currentSelectedWord = "";
    currentResult = null;
  };

  closeBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    hideTooltip();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideTooltip();
  });

  document.addEventListener("mousedown", (e) => {
    if (!tooltip.contains(e.target)) {
      hideTooltip();
    }
  });

  document.addEventListener("touchstart", (e) => {
    if (!tooltip.contains(e.target)) {
      hideTooltip();
    }
  }, { passive: true });

  const handleSelection = () => {
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;

      const rawText = selection.toString().trim();
      // 過濾前後標點符號與多餘空白，轉為標準查詢字串
      const cleanWord = rawText.replace(/^[^\w\u4e00-\u9fa5]+|[^\w\u4e00-\u9fa5]+$/gi, "").trim();

      // 防呆：純數字、長度小於 2 或大於 30、或者空格分詞超過 3 個字不觸發
      if (!cleanWord || cleanWord.length < 2 || cleanWord.length > 30 || /^\d+$/.test(cleanWord) || cleanWord.split(/\s+/).length > 3) {
        return;
      }

      const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
      if (!range) return;

      const rect = range.getBoundingClientRect();
      if (!rect || (rect.width === 0 && rect.height === 0)) return;

      currentSelectedWord = cleanWord.toLowerCase();
      wordTitle.textContent = cleanWord;

      // ── 本地字典與篇章詞彙庫純記憶體直查 (0 API 呼叫、0 延遲) ──
      let localResult = lookupTranslation(currentSelectedWord);
      if (!localResult && typeof window.getLocalTranslation === "function") {
        localResult = window.getLocalTranslation(currentSelectedWord);
      }

      currentResult = localResult;

      // 渲染詞性與中文釋義
      if (localResult && localResult.zh) {
        if (localResult.pos) {
          wordPos.textContent = localResult.pos;
          wordPos.classList.remove("hidden");
        } else {
          wordPos.classList.add("hidden");
        }
        transContent.innerHTML = `<span class="text-neutral-100 font-medium">${localResult.zh}</span>`;
      } else {
        wordPos.classList.add("hidden");
        transContent.innerHTML = `
          <div class="text-neutral-400 text-[11px] leading-snug">
            <span>本地詞庫暫無此單字釋義</span>
            <div class="mt-1 flex items-center gap-1.5">
              <input type="text" id="st-custom-input" placeholder="可輸入自訂中文釋義..." class="flex-1 bg-white/5 border border-white/10 rounded px-2 py-0.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-primary/50" />
            </div>
          </div>
        `;
      }

      // 檢查是否已在單字庫中
      const alreadyInBank = isWordInVocabulary(currentSelectedWord);
      if (alreadyInBank) {
        addBtn.className = "px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-neutral-400 border border-white/15 cursor-not-allowed flex items-center gap-1";
        addBtn.innerHTML = `<span class="material-symbols-outlined text-[13px]">check</span><span>已在單字庫</span>`;
        addBtn.disabled = true;
      } else {
        addBtn.className = "px-3 py-1 rounded-full text-xs font-semibold bg-white text-black hover:bg-neutral-200 transition-all flex items-center gap-1 shadow-sm";
        addBtn.innerHTML = `<span class="material-symbols-outlined text-[13px]">bookmark_add</span><span>收錄至單字庫</span>`;
        addBtn.disabled = false;
      }

      // 計算彈出框位置（置中浮於選取區域上方）
      tooltip.classList.remove("hidden");
      const tooltipHeight = tooltip.offsetHeight || 120;
      const tooltipWidth = tooltip.offsetWidth || 260;
      let top = rect.top - tooltipHeight - 10;
      let left = rect.left + (rect.width / 2) - (tooltipWidth / 2);

      // 視窗邊界防溢出處理
      if (top < 10) top = rect.bottom + 10;
      if (left < 10) left = 10;
      if (left + tooltipWidth > window.innerWidth - 10) {
        left = window.innerWidth - tooltipWidth - 10;
      }

      tooltip.style.top = `${top}px`;
      tooltip.style.left = `${left}px`;
    }, 60);
  };

  document.addEventListener("mouseup", (e) => {
    if (tooltip.contains(e.target)) return;
    handleSelection();
  });

  document.addEventListener("touchend", (e) => {
    if (tooltip.contains(e.target)) return;
    handleSelection();
  }, { passive: true });

  // 收錄至單字庫按鈕點擊
  addBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!currentSelectedWord) return;

    let payload = currentResult;
    // 若無內建釋義，檢查是否有手動輸入自訂釋義
    if (!payload || !payload.zh) {
      const customInput = tooltip.querySelector("#st-custom-input");
      const customZh = customInput ? customInput.value.trim() : "";
      payload = { pos: "", zh: customZh || "常用詞彙" };
    }

    const ok = addWordToVocabulary(currentSelectedWord, payload);
    if (ok) {
      showToast(`已將「${currentSelectedWord}」收錄至單字庫！`);
      addBtn.className = "px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-neutral-400 border border-white/15 cursor-not-allowed flex items-center gap-1";
      addBtn.innerHTML = `<span class="material-symbols-outlined text-[13px]">check</span><span>已在單字庫</span>`;
      addBtn.disabled = true;

      setTimeout(() => {
        hideTooltip();
      }, 700);
    }
  });
}


