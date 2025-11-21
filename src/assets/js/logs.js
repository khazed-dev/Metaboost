import { db } from './firebase-config.js';
import { collection, onSnapshot, orderBy, query } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

console.log("✅ logs.js loaded");

const container = document.getElementById("logsContainer");

function renderLogs(snapshot) {
  container.innerHTML = "";

  let hasLogs = false;
  snapshot.forEach(doc => {
    const d = doc.data();
    if (!d["Error Message"]) return; // bỏ qua bài không lỗi
    hasLogs = true;

    const logItem = document.createElement("div");
    logItem.classList.add("log-entry");
    logItem.innerHTML = `
      <div class="log-header">
        <h3>${d.Channel || "Không rõ kênh"}</h3>
        <span>${d.LastChecked || "—"}</span>
      </div>
      <div class="log-body">
        <p><b>Ngày:</b> ${d.Date || "—"} • <b>Giờ:</b> ${d.Time || "—"}</p>
        <p><b>Caption:</b> ${d.Caption || "(không có)"}</p>
        <p><b>Lỗi:</b> ${d["Error Message"]}</p>
      </div>
    `;
    container.appendChild(logItem);
  });

  if (!hasLogs) {
    container.innerHTML = `<div class="loading">✅ Không có lỗi nào được ghi nhận.</div>`;
  }
}

// 🟦 Realtime log theo Firestore
const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
onSnapshot(q, renderLogs);
