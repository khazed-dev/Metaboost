// footer.js — load footer.html vào cuối trang
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("/footer.html");
    const html = await res.text();

    // tạo thẻ div chứa footer và thêm vào cuối body
    const footerContainer = document.createElement("div");
    footerContainer.innerHTML = html;
    document.body.appendChild(footerContainer);
  } catch (error) {
    console.error("⚠️ Lỗi khi tải footer:", error);
  }
});
