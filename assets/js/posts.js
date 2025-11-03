import { db } from './firebase-config.js';
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

console.log("✅ posts.js loaded");

const tableBody = document.querySelector("#postsTable tbody");
const statusFilter = document.getElementById("statusFilter");

// 🟩 Hàm render bảng
function renderPosts(snapshot, filter = "all") {
  tableBody.innerHTML = "";
  let hasData = false;

  snapshot.forEach(doc => {
    const d = doc.data();
    if (filter !== "all" && d.Status !== filter) return;

    hasData = true;
    tableBody.innerHTML += `
      <tr>
        <td>${d.Date || ""}</td>
        <td>${d.Channel || ""}</td>
        <td>${d.Caption || ""}</td>
        <td class="status ${d.Status}">${d.Status || ""}</td>
        <td>${d["FB Post ID"] || ""}</td>
      </tr>
    `;
  });

  if (!hasData) {
    tableBody.innerHTML = `<tr><td colspan="5">⚠️ Không có dữ liệu phù hợp.</td></tr>`;
  }
}

// 🟦 Theo dõi realtime Firestore
let unsubscribe = null;

function subscribePosts(filter) {
  if (unsubscribe) unsubscribe(); // hủy listener cũ
  const ref = collection(db, "posts");
  unsubscribe = onSnapshot(ref, (snapshot) => {
    renderPosts(snapshot, filter);
  });
}

// 🟨 Bắt đầu load
subscribePosts("all");

// 🟧 Khi người dùng chọn filter
statusFilter?.addEventListener("change", (e) => {
  subscribePosts(e.target.value);
});
