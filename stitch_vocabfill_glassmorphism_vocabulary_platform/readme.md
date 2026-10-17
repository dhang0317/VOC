# 🚀 單字填空練習網站

AI 驅動的單字填空練習，支援文章填空和句子填空，適合中小學生使用。

## 功能特色

- 🤖 使用 Gemini AI 自動生成文章與例句
- 📖 文章填空 + ✍️ 句子填空（同時生成）
- 🌐 支援中文與英文
- 📚 難度分級（小學 / 國中 / 高中）
- ☁️ Firebase Firestore 雲端儲存練習紀錄
- 🌙 深色太空海風格 UI

---

## 部署前設定（必做！）

### 步驟 1：取得 Gemini API Key

1. 前往 [Google AI Studio](https://aistudio.google.com/app/apikey)
2. 建立 API Key
3. 開啟 `gemini.js`，找到這行並替換：
   ```js
   const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";
   ```

### 步驟 2：建立 Firebase 專案

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 點擊「新增專案」，輸入名稱後建立
3. 在專案中點擊「</> 新增應用程式」（Web）
4. 複製 firebaseConfig 物件
5. 開啟 `firebase-config.js`，將 `firebaseConfig` 替換為你的設定：
   ```js
   const firebaseConfig = {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     ...
   };
   ```

### 步驟 3：啟用 Firebase Authentication

1. 在 Firebase Console 左側選 **Authentication**
2. 點擊「開始使用」
3. 選擇「Sign-in method」→ 啟用 **Google**

### 步驟 4：啟用 Firestore

1. 在 Firebase Console 左側選 **Firestore Database**
2. 點擊「建立資料庫」
3. 選擇「**以測試模式開始**」（之後再改安全規則）
4. 選擇資料中心位置（建議 `asia-east1` 台灣較近）

### 步驟 5：設定 Firestore 安全規則

在 Firestore → 規則 頁面，貼上以下規則：

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /exercises/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null;
    }
  }
}
```

---

## 部署到 GitHub Pages

1. 在 GitHub 建立新的 Repository（公開）
2. 將 `vocab-fill` 資料夾內所有檔案上傳（或 git push）
3. 進入 Repository → **Settings** → **Pages**
4. Source 選擇 `main` branch，根目錄 `/`
5. 儲存後等待幾分鐘，即可取得公開網址

> ⚠️ **注意**：GitHub Pages 需要將 `vocab-fill` 資料夾作為 repo 根目錄，
> 或上傳到 repo 後設定 Pages 的子目錄。

---

## 本機測試

由於使用 ES Modules (`import/export`)，需要透過本機伺服器開啟，不能直接雙擊 HTML 檔案。

使用 VS Code：
1. 安裝 **Live Server** 插件
2. 右鍵點擊 `index.html` → Open with Live Server

或使用 Python：
```bash
cd vocab-fill
python -m http.server 8080
# 開啟 http://localhost:8080
```

---

## 檔案結構

```
vocab-fill/
├── index.html          # 登入頁
├── generate.html       # 出題頁
├── practice.html       # 填空練習頁
├── history.html        # 歷史紀錄頁
├── style.css           # 深色太空風格樣式
├── app.js              # 共用工具函式
├── gemini.js           # Gemini API 呼叫
├── firebase-config.js  # Firebase 設定
└── README.md           # 說明文件
```
