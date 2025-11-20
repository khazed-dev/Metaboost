import { db } from './firebase-config.js';
import {
  collection,
  addDoc,
  getDoc,
  doc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

console.log("✅ form.js loaded");

const form = document.getElementById("autoForm");
const formMessage = document.getElementById("formMessage");

// =============================================================
// 🧩 TỰ ĐỘNG TẢI DANH SÁCH FANPAGE TỪ API PYTHON
// =============================================================
async function loadFanpages() {
  const select = document.querySelector('select[name="Channel"]');
  if (!select) return;

  select.innerHTML = `<option>⏳ Đang tải danh sách...</option>`;

  try {
    const res = await fetch("https://metaboost.duckdns.org/api/get-token");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Làm sạch danh sách cũ
    select.innerHTML = `<option value="">-- Chọn fanpage --</option>`;

    Object.values(data).forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.name; // lưu pageId, an toàn hơn name
      opt.textContent = `${p.name}`;
      select.appendChild(opt);
    });

    toastAlert("success", "✅ Đã tải danh sách fanpage!");
  } catch (err) {
    console.error("❌ Lỗi load fanpage:", err);
    select.innerHTML = `<option value="">⚠️ Không tải được danh sách fanpage</option>`;
    showAlert("error", "Không thể tải danh sách page", "Kiểm tra lại API Flask hoặc token Facebook.");
  }
}

loadFanpages(); // gọi khi trang load

// =============================================================
// 🟦 Media switch (ẩn/hiện input theo loại bài đăng)
// =============================================================
const singleImage = document.querySelector('input[name="Image URL"]');
const multiImages = document.querySelector('textarea[name="Image URLs"]');
const video = document.querySelector('input[name="Video URL"]');

document.querySelectorAll('input[name="MediaType"]').forEach(radio => {
  radio.addEventListener("change", e => {
    const type = e.target.value;
    [singleImage, multiImages, video].forEach(el => {
      el.disabled = true;
      el.required = false;
      el.value = "";
    });

    if (type === "single_image") { singleImage.disabled = false; singleImage.required = true; }
    if (type === "multi_image") { multiImages.disabled = false; multiImages.required = true; }
    if (type === "video") { video.disabled = false; video.required = true; }
  });
});
const defaultRadio = document.querySelector('input[value="multi_image"]');
if (defaultRadio) {
  defaultRadio.checked = true;
  defaultRadio.dispatchEvent(new Event("change")); // Kích hoạt sự kiện để mở input tương ứng
}
// =============================================================
// 🟨 CHỈNH SỬA BÀI VIẾT (nếu có id trên URL)
// =============================================================
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get("id");

if (postId) {
  (async () => {
    try {
      const docRef = doc(db, "posts", postId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        Object.keys(data).forEach(key => {
          const input = form.querySelector(`[name="${key}"]`);
          if (input) input.value = data[key];
        });
        formMessage.textContent = "✏️ Đang chỉnh sửa bài đăng...";
        formMessage.style.color = "#f39c12";
      }
    } catch (err) {
      console.error("Lỗi load dữ liệu:", err);
    }
  })();
}

// =============================================================
// 🟩 GỬI FORM LÊN FIRESTORE
// =============================================================
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));

  data.LastChecked = "";
  data.createdAt = serverTimestamp();

  if (data["FB Post ID"]) {
    data.FBPostID = data["FB Post ID"];
    delete data["FB Post ID"];
  }
  if (data["Error Message"]) {
    data.ErrorMessage = data["Error Message"];
    delete data["Error Message"];
  }
  if (data["Last Checked"]) {
    data.LastChecked = data["Last Checked"];
    delete data["Last Checked"];
  }

  formMessage.style.color = "#1877f2";
  formMessage.textContent = "⏳ Đang lưu dữ liệu...";

  try {
    if (postId) {
      await updateDoc(doc(db, "posts", postId), data);
      toastAlert("success", "✅ Đã cập nhật thành công!");
    } else {
      data.PostID = "POST_" + Date.now();
      data.FBPostID2 = "";
      data.Status = "Pending";
      data.FBPostID = "";
      data.ErrorMessage = "";
      await addDoc(collection(db, "posts"), data);
      toastAlert("success", "✅ Thêm bài đăng thành công!");
    }

    setTimeout(() => (window.location.href = "posts.html"), 1000);

  } catch (err) {
    console.error("❌ Firestore error:", err);
    formMessage.style.color = "red";
    formMessage.textContent = "❌ Lỗi khi lưu: " + err.message;
  }
});

// =============================================================
// 🟧 GỬI DỮ LIỆU SANG N8N (sẽ dùng sau)
// =============================================================
async function sendToN8N(postData) {
  try {
    const res = await fetch("https://autopostfb.duckdns.org/webhook-test/fb-autoposter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(postData)
    });

    const data = await res.json();
    console.log("📡 n8n response:", data);
  } catch (err) {
    console.error("❌ Error sending to n8n:", err);
  }
}
