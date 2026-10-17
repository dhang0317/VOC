const fs = require('fs');

let html = fs.readFileSync('stitch_vocabfill_glassmorphism_vocabulary_platform/word_bank_adaptive_ai_generator/code.html', 'utf8');

// Replace nav links
html = html.replace(/data-path=" generator\ href=\#\/g, 'href=\generate.html\');
html = html.replace(/data-path=\practice\ href=\#\/g, 'href=\practice.html\');
html = html.replace(/data-path=\history\ href=\#\/g, 'href=\history.html\');
html = html.replace(/data-path=\login\ href=\#\/g, 'id=\logout-btn\ href=\#\');

// User avatar/name
html = html.replace('Alex Lin', '<span id=\nav-user-name\>User</span>');
html = html.replace('>AL<', '><span id=\nav-user-initial\>U</span><');

// Extract script
const sStart = html.indexOf('<script>');
const sEnd = html.lastIndexOf('</script>');

const scriptContent = <script type=\module\>
 import { requireAuth, logout, getMyExercises } from \./firebase-config.js\;
 import { generateExercise, buildOptions } from \./gemini.js\;
 import { saveToSession, smartExtractWords } from \./app.js\;

 let wordBank = JSON.parse(localStorage.getItem(\vocab_bank\) || \[]\);
 let selectedWords = new Set(wordBank);

 let currentLang = \en\;
 let currentWordsPerArticle = 3;
 let currentNumArticles = 2;

 requireAuth((user) => {
 const nameEl = document.getElementById(\nav-user-name\);
 const initialEl = document.getElementById(\nav-user-initial\);
 if (nameEl) nameEl.textContent = user.displayName || user.email.split('@')[0];
 if (initialEl) initialEl.textContent = (user.displayName || user.email)[0].toUpperCase();
 });

 document.getElementById(\logout-btn\)?.addEventListener(\click\, (e) => {
 e.preventDefault();
 logout().then(() => window.location.href = \index.html\);
 });

 const toast = document.getElementById('toast-banner');
 const toastText = document.getElementById('toast-text');
 function showToast(msg) {
 if (!toast) return;
 toastText.textContent = msg;
 toast.classList.remove('hidden');
 toast.classList.add('flex');
 setTimeout(() => {
 toast.classList.add('hidden');
 toast.classList.remove('flex');
 }, 2800);
 }

 const container = document.getElementById('chips-container');
 const counterEl = document.getElementById('selected-counter');
 const bankCountBadge = document.getElementById('bank-count-badge');
 const btnSelectAll = document.getElementById('btn-select-all');
 const btnDeselectAll = document.getElementById('btn-deselect-all');
 const btnClearBank = document.getElementById('btn-clear-bank');
 const btnDetect = document.getElementById('btn-detect');
 const rawInputTextarea = document.getElementById('raw-input-textarea');
 const btnSynthesize = document.getElementById('btn-synthesize');
 const adaptiveToggle = document.getElementById('adaptive-toggle');

 function saveWordBank() {
 localStorage.setItem(\vocab_bank\, JSON.stringify(wordBank));
 }

 function renderChips() {
 container.innerHTML = '';
 if (wordBank.length === 0) {
 container.innerHTML = '<div class=\text-text-dim text-caption py-3 px-2\>Word bank is empty. Paste source text below to auto-detect terms.</div>';
 counterEl.textContent = '0';
 bankCountBadge.textContent = '0 Items';
 return;
 }

 wordBank.forEach(word => {
 const isSelected = selectedWords.has(word);
 const div = document.createElement('div');
 div.setAttribute('data-word', word);
 div.className = isSelected
 ? 'chip active group flex items-center gap-1.5 px-4 py-2 rounded-full cursor-pointer bg-white/20 border border-white text-primary shadow-[0_0_16px_rgba(255,255,255,0.22)] transition-all'
 : 'chip group flex items-center gap-1.5 px-4 py-2 rounded-full cursor-pointer bg-surface-glass-medium border border-border-glass-hairline text-on-surface-variant transition-all';
 div.innerHTML = \
 <span class=\font-label-md text-label-md \ tracking-tight\>\</span>
 <button type=\button\ class=\chip-remove text-primary/60 hover:text-primary p-0.5 leading-none transition-colors\ title=\Remove item\>
 <span class=\material-symbols-outlined text-[15px]\>close</span>
 </button>
 \;
 container.appendChild(div);
 });

 counterEl.textContent = selectedWords.size;
 bankCountBadge.textContent = wordBank.length + ' Items';
 }

 container.addEventListener('click', (e) => {
 const removeBtn = e.target.closest('.chip-remove');
 const chip = e.target.closest('.chip');
 if (!chip) return;
 const word = chip.getAttribute('data-word');

 if (removeBtn) {
 e.stopPropagation();
 wordBank = wordBank.filter(w => w !== word);
 selectedWords.delete(word);
 saveWordBank();
 renderChips();
 showToast(\Removed \\\ from vocabulary bank\);
 return;
 }

 if (selectedWords.has(word)) {
 selectedWords.delete(word);
 } else {
 selectedWords.add(word);
 }
 renderChips();
 });

 btnSelectAll?.addEventListener('click', () => {
 selectedWords = new Set(wordBank);
 renderChips();
 showToast('All vocabulary items selected');
 });

 btnDeselectAll?.addEventListener('click', () => {
 selectedWords.clear();
 renderChips();
 showToast('All selections cleared');
 });

 btnClearBank?.addEventListener('click', () => {
 if (confirm('Clear all items from your vocabulary bank?')) {
 wordBank = [];
 selectedWords.clear();
 saveWordBank();
 renderChips();
 showToast('Vocabulary bank emptied');
 }
 });

 btnDetect?.addEventListener('click', () => {
 const rawText = rawInputTextarea.value.trim();
 if (!rawText) {
 showToast('Please paste some text into the box first.');
 return;
 }
 const extracted = smartExtractWords(rawText);
 if (extracted.length === 0) {
 showToast('No recognizable vocabulary terms found.');
 return;
 }
 let addedCount = 0;
 extracted.forEach(w => {
 if (!wordBank.includes(w)) {
 wordBank.push(w);
 selectedWords.add(w);
 addedCount++;
 }
 });
 saveWordBank();
 renderChips();
 rawInputTextarea.value = '';
 showToast(\Ingested \ new vocabulary term(s)!\);
 });

 function setupPills(containerSelector, onSelect) {
 const btns = document.querySelectorAll(containerSelector);
 btns.forEach((btn, idx) => {
 btn.addEventListener('click', () => {
 btns.forEach(b => {
 b.classList.remove('active', 'bg-white', 'text-canvas-black', 'shadow-[0_0_12px_rgba(255,255,255,0.3)]', 'font-semibold');
 b.classList.add('text-on-surface-variant', 'font-normal');
 });
 btn.classList.add('active', 'bg-white', 'text-canvas-black', 'shadow-[0_0_12px_rgba(255,255,255,0.3)]', 'font-semibold');
 btn.classList.remove('text-on-surface-variant', 'font-normal');
 onSelect(btn, idx);
 });
 });
 }

 setupPills('.lang-pill', (btn, idx) => {
 currentLang = idx === 0 ? 'en' : 'zh';
 showToast(\Language: \\);
 });

 setupPills('.words-pill', (btn, idx) => {
 const counts = [2, 3, 5, 8, 10];
 currentWordsPerArticle = counts[idx] || 3;
 showToast(\Words per article: \\);
 });

 setupPills('.articles-pill', (btn, idx) => {
 const articles = [null, 1, 2, 3];
 currentNumArticles = articles[idx];
 showToast(\Articles: \\);
 });

 if (wordBank.length === 0) {
 wordBank = ['sustainability', 'articulate', 'paradigm', 'comprehensive', 'resilient', 'benchmark'];
 selectedWords = new Set(wordBank);
 saveWordBank();
 }
 renderChips();

 btnSynthesize?.addEventListener('click', async () => {
 if (selectedWords.size === 0) {
 showToast('Please select at least 1 vocabulary term.');
 return;
 }

 let wordsToUse = Array.from(selectedWords);
 if (currentNumArticles) {
 const needed = currentNumArticles * currentWordsPerArticle;
 if (wordsToUse.length > needed) {
 wordsToUse = wordsToUse.slice(0, needed);
 }
 } else {
 if (wordsToUse.length > 20) {
 wordsToUse = wordsToUse.slice(0, 20);
 }
 }

 const useHistory = adaptiveToggle ? adaptiveToggle.checked : true;
 btnSynthesize.disabled = true;
 btnSynthesize.innerHTML = \
 <span class=\material-symbols-outlined text-[22px] animate-spin\>progress_activity</span>
 <span>Synthesizing Adaptive Exercises (AI Working)...</span>
 \;
 showToast('Synthesizing reading passages & clozes with Gemini AI...');

 try {
 let historySummary = null;
 if (useHistory) {
 try {
 const pastList = await getMyExercises();
 if (pastList && pastList.length > 0) {
 const recent = pastList.slice(0, 5);
 const weakWords = new Set();
 recent.forEach(r => {
 if (r.incorrectWords && Array.isArray(r.incorrectWords)) {
 r.incorrectWords.forEach(w => weakWords.add(w));
 }
 });
 historySummary = \The student has completed \ past exercises. \ +
 (weakWords.size > 0 ? \Historically missed/weak words include: \. \ : \\) +
 \Average recent score: \%.\;
 }
 } catch (histErr) {
 console.warn(\Could not load past history for context:\, histErr);
 }
 }

 let exerciseData = await generateExercise(wordsToUse, currentLang, 'middle', {
 wordsPerArticle: currentWordsPerArticle,
 numArticles: currentNumArticles,
 historySummary
 });

 exerciseData = buildOptions(exerciseData);
 saveToSession('currentExercise', exerciseData);
 window.location.href = 'practice.html';
 } catch (err) {
 console.error(err);
 showToast('Generation failed: ' + err.message);
 btnSynthesize.disabled = false;
 btnSynthesize.innerHTML = \
 <span class=\material-symbols-outlined text-[22px]\>bolt</span>
 <span>Synthesize Interactive Exercises</span>
 <span class=\material-symbols-outlined text-[18px] opacity-70\>arrow_forward</span>
 \;
 }
 });
</script>;

html = html.substring(0, sStart) + scriptContent + html.substring(sEnd + 9);
fs.writeFileSync('generate.html', html, 'utf8');
console.log('generate.html integrated successfully!');