// =============================================
// FIREBASE CONFIG - 請填入您的 Firebase 設定
// =============================================
// 步驟：
// 1. 前往 https://console.firebase.google.com/
// 2. 建立新專案（或使用現有專案）
// 3. 新增 Web 應用程式
// 4. 複製設定碼貼到下方 firebaseConfig 物件中
// 5. 在 Firebase Console 中啟用：
//    - Authentication → Sign-in method → Google
//    - Firestore Database → 建立資料庫（測試模式）

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, doc, getDoc }
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase 設定 (happy-6b5bb)
const firebaseConfig = {
  apiKey: "AIzaSyAXSyYp1HPW2-RMpikqRSoFRmPH-f8AIek",
  authDomain: "happy-6b5bb.firebaseapp.com",
  databaseURL: "https://happy-6b5bb-default-rtdb.firebaseio.com",
  projectId: "happy-6b5bb",
  storageBucket: "happy-6b5bb.firebasestorage.app",
  messagingSenderId: "274950039210",
  appId: "1:274950039210:web:1ff6bdc332aa9c2689d2d3"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// ── Auth helpers ───────────────────────────
export async function registerWithEmail(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function loginWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export async function logout() {
  return signOut(auth);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

export function requireAuth(callbackOrRedirect = "index.html") {
  return onAuthStateChanged(auth, (user) => {
    if (typeof callbackOrRedirect === "function") {
      if (user) {
        callbackOrRedirect(user);
      } else {
        window.location.href = "index.html";
      }
    } else {
      if (!user) {
        window.location.href = callbackOrRedirect;
      }
    }
  });
}

export function getCurrentUser() {
  return auth.currentUser;
}


// ── Firestore helpers ──────────────────────
/**
 * 儲存一組練習題到 Firestore
 * @param {object} exerciseData - 練習題資料
 * @returns {string} - 文件 ID
 */
export async function saveExercise(exerciseData) {
  const user = getCurrentUser();
  if (!user) throw new Error("未登入");

  const docRef = await addDoc(collection(db, "exercises"), {
    ...exerciseData,
    uid: user.uid,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
}

/**
 * 取得目前使用者的所有練習紀錄
 * @returns {Array} - 練習紀錄陣列
 */
export async function getMyExercises() {
  const user = getCurrentUser();
  if (!user) return [];

  try {
    // 優先嘗試複合查詢（若專案已建立索引）
    const q = query(
      collection(db, "exercises"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    // 若尚未建立複合索引 (The query requires an index)，降級為只用 where 查詢並在前端記憶體進行排序
    console.warn("Firestore index not found, falling back to memory sort:", err.message);
    const fallbackQ = query(
      collection(db, "exercises"),
      where("uid", "==", user.uid)
    );
    const snapshot = await getDocs(fallbackQ);
    const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    // 依據時間降序排序（最新在最前）
    return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }
}

/**
 * 依 ID 取得單一練習紀錄
 * @param {string} exerciseId
 * @returns {object|null}
 */
export async function getExerciseById(exerciseId) {
  const docRef = doc(db, "exercises", exerciseId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}
