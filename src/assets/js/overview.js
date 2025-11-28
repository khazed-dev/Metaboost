import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const pendingCountEl = document.getElementById("pendingCount");
const postedCountEl = document.getElementById("postedCount");
const errorCountEl = document.getElementById("errorCount");

// ===============================
// 🔥 1) Load Pending / Posted từ collection "posts"
// ===============================
async function loadPostStats() {
  const snapshot = await getDocs(collection(db, "posts"));

  let pending = 0;
  let posted = 0;

  snapshot.forEach(doc => {
    const d = doc.data();
    if (d.Status === "Pending") pending++;
    else if (d.Status === "Posted") posted++;
  });

  pendingCountEl.textContent = pending;
  postedCountEl.textContent = posted;
}

// ===============================
// 🔥 2) Load Error từ collection "error_logs"
// ===============================
async function loadErrorStats() {
  const errorSnap = await getDocs(collection(db, "error_logs"));

  let errors = 0;

  errorSnap.forEach(doc => {
    const d = doc.data();
    if (d.message || d.errorMessage) errors++;  
  });

  errorCountEl.textContent = errors;
}

// ===============================
// 🚀 Gọi tất cả function
// ===============================
async function loadStats() {
  await Promise.all([
    loadPostStats(),
    loadErrorStats()
  ]);
}

loadStats();
