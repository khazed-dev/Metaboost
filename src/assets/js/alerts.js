// 🧠 MetaBoost SweetAlert2 Global Manager
// Phiên bản: Isolated (không ảnh hưởng sidebar, global CSS)

(function () {
    // 1️⃣ Nạp thư viện SweetAlert2
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
    script.onload = () => {
        console.log("✅ SweetAlert2 loaded with isolated MetaBoost theme");

        // 2️⃣ Khai báo hàm toàn cục showAlert
        window.showAlert = (type, title, text) => {
            return Swal.fire({
                icon: type, // success | error | warning | info | question
                title: title,
                text: text || "",
                background: "#222436",
                color: "#f1f1f1",
                confirmButtonColor: "#1877f2",
                cancelButtonColor: "#6c757d",
                confirmButtonText: type === "warning" ? "Xác nhận" : "OK",
                cancelButtonText: "Hủy",
                showCancelButton: type === "warning", // 👈 Hiển thị nút Hủy khi là cảnh báo
                reverseButtons: true, // 👈 Hủy bên trái, Xác nhận bên phải
                backdrop: false,
                iconColor:
                    type === "success"
                        ? "#2ecc71"
                        : type === "error"
                            ? "#e74c3c"
                            : type === "warning"
                                ? "#f1c40f"
                                : type === "info"
                                    ? "#3498db"
                                    : "#fff",
                customClass: {
                    popup: "swal-meta",
                    title: "swal-title",
                    confirmButton: "swal-btn",
                    container: "swal-isolated"
                },
                showClass: { popup: "animate__animated animate__fadeInDown" },
                hideClass: { popup: "animate__animated animate__fadeOutUp" }
            });
        };

        // 3️⃣ Toast mini gọn (hiện ở góc phải)
        window.toastAlert = (type, title) => {
            const Toast = Swal.mixin({
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 2500,
                timerProgressBar: true,
                background: "#1e1e2f",
                color: "#f5f5f5",
                iconColor:
                    type === "success"
                        ? "#2ecc71"
                        : type === "error"
                            ? "#e74c3c"
                            : type === "warning"
                                ? "#f1c40f"
                                : "#3498db",
                customClass: { popup: "swal-toast" }
            });
            Toast.fire({ icon: type, title: title });
        };
    };
    document.head.appendChild(script);

    // 4️⃣ Thêm animate.css (hiệu ứng)
    const animate = document.createElement("link");
    animate.rel = "stylesheet";
    animate.href =
        "https://cdn.jsdelivr.net/npm/animate.css@4.1.1/animate.min.css";
    document.head.appendChild(animate);

    // 5️⃣ CSS cô lập chỉ áp dụng cho SweetAlert (class .swal-isolated)
    const style = document.createElement("style");
    style.textContent = `
    /* ===== MetaBoost SweetAlert theme (Isolated) ===== */
    .swal-isolated .swal-meta {
      border-radius: 18px !important;
      box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35) !important;
      padding: 1.8rem !important;
      backdrop-filter: blur(6px);
      font-family: "Inter", sans-serif;
    }

    .swal-isolated .swal-title {
      font-weight: 600;
      letter-spacing: 0.2px;
    }

    .swal-isolated .swal-btn {
      border-radius: 12px !important;
      padding: 0.65rem 1.6rem !important;
      font-weight: 600;
      font-family: "Inter", sans-serif;
      background: #1877f2 !important;
      color: #fff !important;
      border: none !important;
      box-shadow: 0 3px 8px rgba(24, 119, 242, 0.3);
      transition: all 0.2s ease-in-out;
    }

    .swal-isolated .swal-btn:hover {
      background: #0f5bd5 !important;
      transform: translateY(-1px);
    }

    /* Toast kiểu MetaBoost */
    .swal-toast {
      border-radius: 12px !important;
      font-weight: 500;
      font-family: "Inter", sans-serif;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
      padding: 0.75rem 1.25rem !important;
    }

    /* Không ảnh hưởng button sidebar */
    .sidebar button, .sidebar #logoutBtn {
      all: unset;
      display: block;
      width: 85%;
      margin: 20px auto 10px;
      text-align: center;
      background: #e74c3c;
      color: #fff;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      padding: 10px 0;
      transition: background 0.25s ease;
    }
    .sidebar #logoutBtn:hover {
      background: #c0392b;
    }
  `;
    document.head.appendChild(style);
})();
