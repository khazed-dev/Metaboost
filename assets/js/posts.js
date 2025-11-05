import { db } from './firebase-config.js';
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

console.log("✅ posts.js loaded");

const tableBody = document.querySelector("#postsTable tbody");
const statusFilter = document.getElementById("statusFilter");

// 🧩 Định dạng ngày
function formatDate(dateValue) {
  if (!dateValue) return "";
  if (dateValue.seconds) {
    const jsDate = new Date(dateValue.seconds * 1000);
    return jsDate.toISOString().split("T")[0];
  }
  if (typeof dateValue === "string") return dateValue;
  if (dateValue instanceof Date) return dateValue.toISOString().split("T")[0];
  return "";
}

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
        <td>${formatDate(d.Date)} ${d.Time || ""}</td>
        <td>${d.Channel || ""}</td>
        <td>${d.ProductName || "-"}</td>
        <td class="status ${d.Status}">${d.Status || ""}</td>
        <td>
          ${d.FBPostID
        ? `<a href="https://facebook.com/${d.FBPostID}" target="_blank" rel="noopener noreferrer" style="color:#1877F2; text-decoration:none;">
                  ${d.FBPostID}
                </a>`
        : ""
      }
        </td>
        <td>
          <button class="edit-btn" data-id="${docSnap.id}" title="Chỉnh sửa">✏️</button>
          <button class="delete-btn" data-id="${docSnap.id}" title="Xóa">🗑️</button>
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
      window.location.href = `form.html?id=${id}`;
    });
  });

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;

      showAlert(
        "warning",
        "🗑️ Xóa bài đăng?",
        "Bạn có chắc chắn muốn xóa bài này không?"
      ).then(async (result) => {
        if (result.isConfirmed) {
          try {
            await deleteDoc(doc(db, "posts", id));
            toastAlert("success", "✅ Đã xóa bài đăng!", "Bài đã được xóa khỏi hệ thống.");
          } catch (err) {
            console.error("❌ Lỗi khi xóa:", err);
            toastAlert("error", "Xóa thất bại", "Không thể xóa bài đăng, vui lòng thử lại!");
          }
        }
      });
    });
  });
}

// 🟧 Theo dõi realtime Firestore
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

// 🟪 Khi người dùng chọn filter
statusFilter?.addEventListener("change", (e) => {
  subscribePosts(e.target.value);
});
