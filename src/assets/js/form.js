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
// 🎨 MEDIA SELECTION & VALIDATION
// =============================================================
const imageGroup = document.getElementById("imageUploadGroup");
const videoGroup = document.getElementById("videoUploadGroup");
const imageInput = document.getElementById("imageUpload");
const videoInput = document.getElementById("videoUpload");
const previewImages = document.getElementById("imagePreview");
const previewVideo = document.getElementById("videoPreview");
const imageError = document.getElementById("imageError");
const videoError = document.getElementById("videoError");

let uploadedImageURLs = [];
let uploadedVideoURL = null;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_IMAGES = 10;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB per image

// Media Type Toggle
function toggleMediaInput(type) {
  if (type === "multi_image") {
    imageGroup.style.display = "block";
    videoGroup.style.display = "none";
    // Reset video
    videoInput.value = "";
    previewVideo.innerHTML = "";
    videoError.classList.remove("show");
    uploadedVideoURL = null;
  } else {
    imageGroup.style.display = "none";
    videoGroup.style.display = "block";
    // Reset images
    imageInput.value = "";
    previewImages.innerHTML = "";
    imageError.classList.remove("show");
    uploadedImageURLs = [];
  }
}

document.querySelectorAll('input[name="MediaType"]').forEach(radio => {
  radio.addEventListener("change", (e) => toggleMediaInput(e.target.value));
});

// =============================================================
// 📸 IMAGE VALIDATION & PREVIEW
// =============================================================
imageInput?.addEventListener("change", (e) => {
  previewImages.innerHTML = "";
  imageError.classList.remove("show");
  imageError.textContent = "";

  const files = Array.from(e.target.files);

  // Check count
  if (files.length > MAX_IMAGES) {
    const msg = `⚠️ Chỉ được chọn tối đa ${MAX_IMAGES} ảnh! Bạn chọn ${files.length} file.`;
    imageError.textContent = msg;
    imageError.classList.add("show");
    imageInput.value = "";
    uploadedImageURLs = [];
    return;
  }

  let validCount = 0;
  files.forEach((file, index) => {
    // Check type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      console.warn(`❌ File ${index + 1}: ${file.name} không phải định dạng ảnh hỗ trợ`);
      return;
    }

    // Check size
    if (file.size > MAX_IMAGE_SIZE) {
      const msg = `⚠️ File "${file.name}" quá lớn (> 20MB). Vui lòng nén ảnh.`;
      imageError.textContent = msg;
      imageError.classList.add("show");
      return;
    }

    validCount++;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = document.createElement("img");
      img.src = ev.target.result;
      img.title = file.name;
      previewImages.appendChild(img);
    };
    reader.readAsDataURL(file);
  });

  if (validCount === 0 && files.length > 0) {
    const msg = "⚠️ Không có ảnh nào hỗ trợ. Dùng: JPG, PNG, WebP.";
    imageError.textContent = msg;
    imageError.classList.add("show");
    imageInput.value = "";
    uploadedImageURLs = [];
  }
});

// =============================================================
// 🎬 VIDEO VALIDATION & PREVIEW
// =============================================================
videoInput?.addEventListener("change", (e) => {
  previewVideo.innerHTML = "";
  videoError.classList.remove("show");
  videoError.textContent = "";

  const file = e.target.files[0];
  if (!file) return;

  // Check type
  if (file.type !== "video/mp4" && !file.name.endsWith(".mp4")) {
    const msg = "⚠️ Chỉ hỗ trợ định dạng .mp4!";
    videoError.textContent = msg;
    videoError.classList.add("show");
    videoInput.value = "";
    uploadedVideoURL = null;
    return;
  }

  // Check size
  if (file.size > MAX_VIDEO_SIZE) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    const msg = `⚠️ Video quá lớn (${sizeInMB}MB > 100MB). Vui lòng nén video.`;
    videoError.textContent = msg;
    videoError.classList.add("show");
    videoInput.value = "";
    uploadedVideoURL = null;
    return;
  }

  // Preview
  const vid = document.createElement("video");
  vid.src = URL.createObjectURL(file);
  vid.controls = true;
  vid.style.maxWidth = "100%";
  previewVideo.appendChild(vid);
});

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
// 👉 Worker upload endpoint
const R2_UPLOAD_ENDPOINT = "https://metabost-upload.khatranudn.workers.dev/upload";

// Upload file lên R2 Worker (CÓ TRY/CATCH)
async function uploadToR2(file) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(R2_UPLOAD_ENDPOINT, {
      method: "POST",
      body: formData
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
