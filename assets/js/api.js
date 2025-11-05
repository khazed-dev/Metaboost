console.log("✅ api.js loaded");

// 🟦 Các phần tử
const apiBaseUrl = document.getElementById("apiBaseUrl");
const endpointInput = document.getElementById("endpointInput");
const apiResult = document.getElementById("apiResult");
const testBtn = document.getElementById("testBtn");
const tokenInput = document.getElementById("tokenInput");
const updateBtn = document.getElementById("updateTokenBtn");
const updateResult = document.getElementById("updateResult");

// 🟩 Hàm build URL
function buildUrl(path = "") {
  const base = apiBaseUrl.value.trim().replace(/\/+$/, "");
  const endpoint = path.startsWith("/") ? path : `/${path}`;
  return `${base}${endpoint}`;
}

// 🟩 Test endpoint
testBtn.addEventListener("click", async () => {
  const base = apiBaseUrl.value.trim();
  const endpoint = endpointInput.value.trim();
  if (!base || !endpoint) return alert("⚠️ Vui lòng nhập URL và endpoint!");

  apiResult.textContent = "⏳ Đang gửi request...";
  try {
    const res = await fetch(buildUrl(endpoint));
    const text = await res.text();
    try {
      apiResult.textContent = JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      apiResult.textContent = text;
    }
  } catch (err) {
    apiResult.textContent = `❌ Lỗi: ${err.message}`;
  }
});

// 🟩 Cập nhật token mới
updateBtn.addEventListener("click", async () => {
  const base = apiBaseUrl.value.trim();
  const token = tokenInput.value.trim();
  if (!base || !token) return alert("⚠️ Nhập API URL và token!");

  updateResult.textContent = "⏳ Đang gửi token mới...";
  try {
    const res = await fetch(buildUrl("/update-token"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    updateResult.textContent = JSON.stringify(data, null, 2);
    updateResult.style.color = res.ok ? "green" : "red";
  } catch (err) {
    updateResult.textContent = `❌ Lỗi: ${err.message}`;
    updateResult.style.color = "red";
  }
});
