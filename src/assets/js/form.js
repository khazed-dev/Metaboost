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
// 🟦 Load danh sách Fanpage từ API Flask
// =============================================================
async function loadFanpages() {
  const select = document.querySelector('select[name="Channel"]');
  if (!select) return;

  select.innerHTML = `<option>⏳ Đang tải...</option>`;

  try {
    const res = await fetch("https://metaboost.duckdns.org/api/get-token");
    const data = await res.json();

    select.innerHTML = `<option value="">-- Chọn fanpage --</option>`;
    Object.values(data).forEach(p => {
      let opt = document.createElement("option");
      opt.value = p.name;
      opt.textContent = p.name;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error(err);
    select.innerHTML = `<option>⚠️ Lỗi tải danh sách</option>`;
  }
}

loadFanpages();

// =============================================================
// 🟦 R2 File Upload Logic
// =============================================================
const imageInput = document.getElementById("imageUpload");
const videoInput = document.getElementById("videoUpload");

const previewImages = document.getElementById("imagePreview");
const previewVideo = document.getElementById("videoPreview");

let uploadedImageURLs = [];
let uploadedVideoURL = null;

// 👉 Worker upload endpoint (SỬA ĐÚNG 100%)
const R2_UPLOAD_ENDPOINT = "https://metabost-upload.khatranudn.workers.dev/upload";

// Upload file lên R2 Worker (CÓ TRY/CATCH)
async function uploadToR2(file) {
  try {
    const form = new FormData();
    form.append("file", file);

    const res = await fetch(R2_UPLOAD_ENDPOINT, {
      method: "POST",
      body: form
    });

    if (!res.ok) {
      console.error("❌ Upload failed:", await res.text());
      throw new Error("Upload failed");
    }

    const json = await res.json();
    if (!json.url) throw new Error("R2 không trả về URL");

    return json.url;
  } catch (err) {
    console.error("❌ Lỗi upload:", err);
    alert("Lỗi upload file lên R2: " + err.message);
    return null;
  }
}

// =============================================================
// 🟩 Submit Form → Upload File → Lưu Firestore
// =============================================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  formMessage.style.color = "#1877f2";
  formMessage.textContent = "⏳ Đang upload media...";

  const data = Object.fromEntries(new FormData(form));

  // Upload ảnh
  if (imageInput.files.length > 0) {
    uploadedImageURLs = [];
    for (let file of imageInput.files) {
      const url = await uploadToR2(file);
      if (!url) return;  // Dừng nếu upload lỗi
      uploadedImageURLs.push(url);
    }
  }

  // Upload video
  if (videoInput.files.length === 1) {
    uploadedVideoURL = await uploadToR2(videoInput.files[0]);
    if (!uploadedVideoURL) return;
  }

  // Gán URL vào Firestore
  data["ImageURLs"] = uploadedImageURLs;   // Lưu dạng array gốc
  data["Video URL"] = uploadedVideoURL || "";
  data["MediaType"] =
    uploadedVideoURL ? "video" : "images";

  data.createdAt = serverTimestamp();
  data.Status = "Pending";
  data.LastChecked = "";
  data.ErrorMessage = "";

  formMessage.textContent = "⏳ Đang lưu dữ liệu Firestore...";

  try {
    await addDoc(collection(db, "posts"), data);
    formMessage.style.color = "green";
    formMessage.textContent = "🎉 Đã lưu thành công!";
    console.log("🔥 Saved to Firestore:", data);

    setTimeout(() => (window.location.href = "posts.html"), 600);

  } catch (err) {
    console.error(err);
    formMessage.style.color = "red";
    formMessage.textContent = "❌ Lỗi lưu Firestore";
  }
});
