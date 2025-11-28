import { db } from './firebase-config.js';
import { collection, onSnapshot, orderBy, query } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

console.log("🔥 logs.js loaded");

const container = document.getElementById("logsContainer");

function formatTime(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleString("vi-VN", {
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  } catch {
    return "—";
  }
}

function renderLogs(snapshot) {
  container.innerHTML = "";

  if (snapshot.empty) {
    container.innerHTML = `<div class="loading">✅ Không có log lỗi nào.</div>`;
    return;
  }

  snapshot.forEach(doc => {
    const d = doc.data();
    const logItem = document.createElement("div");
    logItem.classList.add("log-entry");

    logItem.innerHTML = `
      <div class="log-header">
        <h3>${d.workflowName || "Không rõ workflow"}</h3>
        <small>ID: ${d.workflowId || "—"}</small>
      </div>

      <div class="log-body">
        <p><b>⛔ Node lỗi:</b> ${d.nodeName || "—"}</p>
        <p><b>🕒 Thời gian:</b> ${formatTime(d.timestamp)}</p>
        <p><b>📄 Message:</b> ${d.message || "(không rõ)"}</p>
      </div>
    `;

    container.appendChild(logItem);
  });
}

// 🟦 Lấy real-time từ Firestore
const q = query(collection(db, "error_logs"), orderBy("timestamp", "desc"));
onSnapshot(q, renderLogs);
