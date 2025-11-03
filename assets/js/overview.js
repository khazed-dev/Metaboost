import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const pendingCountEl = document.getElementById("pendingCount");
const postedCountEl = document.getElementById("postedCount");
const errorCountEl = document.getElementById("errorCount");

async function loadStats() {
  const snapshot = await getDocs(collection(db, "posts"));
  let pending = 0, posted = 0, errors = 0;

  snapshot.forEach(doc => {
    const d = doc.data();
    if (d.Status === "Pending") pending++;
    else if (d.Status === "Posted") posted++;
    if (d["Error Message"]) errors++;
  });

  pendingCountEl.textContent = pending;
  postedCountEl.textContent = posted;
  errorCountEl.textContent = errors;
}

loadStats();
