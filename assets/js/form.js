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

// 🟦 Media switch
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

// 🟨 Kiểm tra nếu là chế độ chỉnh sửa
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get("id");

if (postId) {
  // Load dữ liệu để chỉnh sửa
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

// 🟩 Submit form
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  data.LastChecked = "";
  data.createdAt = serverTimestamp();

  formMessage.style.color = "#1877f2";
  formMessage.textContent = "⏳ Đang lưu dữ liệu...";

  try {
    if (postId) {
      // 🟨 Cập nhật
      await updateDoc(doc(db, "posts", postId), data);
      formMessage.textContent = "✅ Đã cập nhật thành công!";
    } else {
      // 🟩 Tạo mới
      data.PostID = "POST_" + Date.now();
      data.Status = "Pending";
      data["FB Post ID"] = "";
      data["Error Message"] = "";
      await addDoc(collection(db, "posts"), data);
      formMessage.textContent = "✅ Đã thêm bài đăng!";
    }

    setTimeout(() => (window.location.href = "posts.html"), 1000);
  } catch (err) {
    console.error("❌ Firestore error:", err);
    formMessage.style.color = "red";
    formMessage.textContent = "❌ Lỗi khi lưu: " + err.message;
  }
});


// 🟨 Hàm gửi dữ liệu sang n8n webhook
async function sendToN8N(postData) {
  try {
    const res = await fetch("https://autopostfb.duckdns.org/webhook-test/fb-autoposter", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(postData)
    });

    const data = await res.json();
    console.log("📡 n8n response:", data);
  } catch (err) {
    console.error("❌ Error sending to n8n:", err);
  }
}
