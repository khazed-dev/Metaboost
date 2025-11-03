console.log("✅ auth.js loaded");

import { auth } from './firebase-config.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const message = document.getElementById("message");

// 🟦 Hiển thị trạng thái
function setMessage(text, color = "#333") {
  message.textContent = text;
  message.style.color = color;
}

// 🟩 Đăng nhập
loginBtn?.addEventListener("click", async () => {
  setMessage("⏳ Đang đăng nhập...", "#1877f2");
  try {
    const userCred = await signInWithEmailAndPassword(
      auth,
      emailInput.value,
      passwordInput.value
    );
    console.log("✅ Đăng nhập:", userCred.user.email);
    setMessage("✅ Đăng nhập thành công! Đang chuyển hướng...", "green");
    setTimeout(() => (window.location.href = "index.html"), 1000);
  } catch (e) {
    console.error("❌ Lỗi đăng nhập:", e.message);
    setMessage("❌ " + e.message, "red");
  }
});

// 🟨 Tạo tài khoản
signupBtn?.addEventListener("click", async () => {
  setMessage("⏳ Đang tạo tài khoản...", "#ff9800");
  try {
    const userCred = await createUserWithEmailAndPassword(
      auth,
      emailInput.value,
      passwordInput.value
    );
    console.log("✅ Tạo tài khoản:", userCred.user.email);
    setMessage("✅ Tạo tài khoản thành công! Bạn có thể đăng nhập ngay.", "green");
  } catch (e) {
    console.error("❌ Lỗi tạo tài khoản:", e.message);
    setMessage("❌ " + e.message, "red");
  }
});

// 🔁 Nếu đã đăng nhập, chuyển sang Dashboard
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("🔄 Đã đăng nhập sẵn:", user.email);
    window.location.href = "index.html";
  }
});
