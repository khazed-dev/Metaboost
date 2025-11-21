console.log("✅ API tab loaded");

const API_BASE = "https://metaboost.duckdns.org/api";
const resBox = document.getElementById("apiResponse");
const formattedBox = document.getElementById("formattedResult");

function showLoading(text = "⏳ Đang xử lý...") {
  resBox.textContent = text;
  formattedBox.innerHTML = "";
}

// 🟩 Format JSON đẹp
function renderFormattedJSON(data) {
  formattedBox.innerHTML = ""; // reset

  // Nếu trả về là object theo dạng nhiều page_id
  if (typeof data === "object" && !Array.isArray(data)) {
    Object.entries(data).forEach(([id, info]) => {
      const div = document.createElement("div");
      div.className = "token-card";

      div.innerHTML = `
        <h3>📄 ${info.name || "Không rõ tên"}</h3>
        <p><b>Page ID:</b> ${id}</p>
        <p><b>Access Token:</b></p>
        <textarea readonly>${info.access_token || "Không có token"}</textarea>
        <button class="copy-btn" data-token="${info.access_token}">📋 Copy Token</button>
      `;
      formattedBox.appendChild(div);
    });

    // gán sự kiện copy
    document.querySelectorAll(".copy-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        navigator.clipboard.writeText(btn.dataset.token);
        btn.textContent = "✅ Copied!";
        setTimeout(() => (btn.textContent = "📋 Copy Token"), 1500);
      });
    });
  } else {
    formattedBox.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
  }
}

// 🟩 GET TOKEN
document.getElementById("btnGetToken")?.addEventListener("click", async () => {
  showLoading();
  try {
    const res = await fetch(`${API_BASE}/get-token`);
    const data = await res.json();
    resBox.textContent = "✅ GET TOKEN thành công!";
    renderFormattedJSON(data);
  } catch (err) {
    resBox.textContent = "❌ Lỗi khi gọi GET TOKEN:\n" + err.message;
  }
});

// 🟢 HEALTH
document.getElementById("btnHealth")?.addEventListener("click", async () => {
  showLoading();
  try {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    resBox.textContent = "✅ API Health Check OK";
    renderFormattedJSON(data);
  } catch (err) {
    resBox.textContent = "❌ Lỗi khi gọi HEALTH:\n" + err.message;
  }
});

// 🔁 UPDATE TOKEN
document.getElementById("btnUpdateToken")?.addEventListener("click", async () => {
  const token = document.getElementById("newToken").value.trim();
  if (!token)
    return showAlert("warning", "⚠️ Vui lòng nhập token mới!", "Hãy nhập token trước khi cập nhật.");

  try {
    const res = await fetch("https://metaboost.duckdns.org/api/update-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    });

    if (!res.ok) throw new Error("Lỗi khi cập nhật token!");
    const data = await res.json();

    showAlert("success", "✅ Đã cập nhật thành công!", `Token mới đã được lưu.`);
    console.log("📡 Response:", data);
  } catch (err) {
    showAlert("error", "❌ Cập nhật thất bại!", err.message || "Vui lòng thử lại sau.");
  }
});

