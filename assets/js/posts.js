import { db } from './firebase-config.js';
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

console.log("✅ posts.js loaded");

const tableBody = document.querySelector("#postsTable tbody");
const statusFilter = document.getElementById("statusFilter");

// 🟩 Hàm render bảng
function renderPosts(snapshot, filter = "all") {
  tableBody.innerHTML = "";
  let hasData = false;

  snapshot.forEach(docSnap => {
    const d = docSnap.data();
    if (filter !== "all" && d.Status !== filter) return;

    hasData = true;
    tableBody.innerHTML += `
      <tr>
        <td>${d.Date || ""}</td>
        <td>${d.Channel || ""}</td>
        <td>${d.Caption || ""}</td>
        <td class="status ${d.Status}">${d.Status || ""}</td>
        <td>${d["FB Post ID"] || ""}</td>
        <td>
          <button class="edit-btn" data-id="${docSnap.id}">✏️</button>
          <button class="delete-btn" data-id="${docSnap.id}">🗑️</button>
        </td>
      </tr>
    `;
  });

  if (!hasData) {
    tableBody.innerHTML = `<tr><td colspan="6">⚠️ Không có dữ liệu phù hợp.</td></tr>`;
  }

  attachEventHandlers();
}

// 🟦 Gán sự kiện cho nút
function attachEventHandlers() {
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = e.target.dataset.id;
      // mở lại form với ID tương ứng
      window.location.href = `form.html?id=${id}`;
    });
  });

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      if (confirm("🗑️ Bạn có chắc muốn xóa bài này không?")) {
        await deleteDoc(doc(db, "posts", id));
        alert("✅ Đã xóa bài đăng!");
      }
    });
  });
}

// 🟦 Theo dõi realtime Firestore
let unsubscribe = null;

function subscribePosts(filter) {
  if (unsubscribe) unsubscribe();
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
