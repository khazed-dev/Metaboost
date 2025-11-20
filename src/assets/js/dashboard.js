import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { collection, addDoc, serverTimestamp, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// 🔒 Kiểm tra đăng nhập
onAuthStateChanged(auth, (user) => {
  if (!user) window.location.href = "login.html";
});

// 🚪 Đăng xuất
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  await signOut(auth);
  alert("Đã đăng xuất!");
  window.location.href = "login.html";
});

// 🧭 Chuyển tab
const tabs = document.querySelectorAll(".sidebar ul li");
const tabContents = document.querySelectorAll(".tab");
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    const target = tab.dataset.tab;
    tabContents.forEach(c => c.classList.remove("active"));
    document.getElementById(target).classList.add("active");
  });
});

// 🖼️ Form logic
const singleImage = document.querySelector('input[name="Image URL"]');
const multiImages = document.querySelector('textarea[name="Image URLs"]');
const video = document.querySelector('input[name="Video URL"]');
document.querySelectorAll('input[name="MediaType"]').forEach(r => {
  r.addEventListener("change", (e) => {
    const val = e.target.value;
    singleImage.disabled = multiImages.disabled = video.disabled = true;
    singleImage.required = multiImages.required = video.required = false;
    if (val === "single_image") { singleImage.disabled = false; singleImage.required = true; }
    if (val === "multi_image") { multiImages.disabled = false; multiImages.required = true; }
    if (val === "video") { video.disabled = false; video.required = true; }
  });
});

// 📤 Submit form
const form = document.getElementById("autoForm");
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  data.Status = "Pending";
  data["FB Post ID"] = "";
  data.LastChecked = "";
  data["Error Message"] = "";
  data.createdAt = serverTimestamp();
  await addDoc(collection(db, "posts"), data);
  alert("✅ Đã lưu dữ liệu!");
  form.reset();
});

// 📋 Load danh sách bài đăng
const tableBody = document.querySelector("#postsTable tbody");
onSnapshot(collection(db, "posts"), (snapshot) => {
  tableBody.innerHTML = "";
  snapshot.forEach((doc) => {
    const d = doc.data();
    tableBody.innerHTML += `
      <tr>
        <td>${d.Date || ""}</td>
        <td>${d.Channel || ""}</td>
        <td>${d.Caption || ""}</td>
        <td>${d.Status || ""}</td>
        <td>${d["FB Post ID"] || ""}</td>
      </tr>`;
  });
});
