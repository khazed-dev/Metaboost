import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

console.log("✅ form.js loaded");

const form = document.getElementById("autoForm");
const formMessage = document.getElementById("formMessage");

const singleImage = document.querySelector('input[name="Image URL"]');
const multiImages = document.querySelector('textarea[name="Image URLs"]');
const video = document.querySelector('input[name="Video URL"]');

// 🟦 Bật / tắt các ô media theo loại
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

// 🟩 Submit form → lưu Firestore
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  data.Status = "Pending";
  data["FB Post ID"] = "";
  data.LastChecked = "";
  data["Error Message"] = "";
  data.createdAt = serverTimestamp();

  formMessage.style.color = "#1877f2";
  formMessage.textContent = "⏳ Đang lưu dữ liệu...";

  try {
    await addDoc(collection(db, "posts"), data);
    formMessage.style.color = "green";
    formMessage.textContent = "✅ Đã lưu bài đăng!";
    form.reset();
  } catch (err) {
    console.error("❌ Firestore error:", err);
    formMessage.style.color = "red";
    formMessage.textContent = "❌ Lỗi khi lưu: " + err.message;
  }
});
