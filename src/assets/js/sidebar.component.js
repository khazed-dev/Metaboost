class SidebarComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.highlightActiveNav();
  }

  render() {
    const styles = `
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        :host {
          --sidebar-width: 240px;
          --sidebar-bg: #0d1026;
          --text-color: #c5cae9;
          --text-hover: #ffffff;
          --active-bg: #26326c;
          --hover-bg: #1a1e3f;
        }

        .sidebar {
          width: var(--sidebar-width);
          background: var(--sidebar-bg);
          color: var(--text-color);
          display: flex;
          flex-direction: column;
          padding: 20px;
          box-shadow: 2px 0 6px rgba(0, 0, 0, 0.2);
          min-height: 100vh;
        }

        .sidebar-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 25px;
        }

        .sidebar-logo {
          width: 200px;
          height: 160px;
          border-radius: 12px;
          margin-bottom: 10px;
          object-fit: contain;
          background: white;
          padding: 6px;
        }

        .sidebar-menu {
          flex: 1;
          margin-bottom: 20px;
        }

        .sidebar-menu ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .sidebar-menu li {
          list-style: none;
          margin-bottom: 10px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .sidebar-menu li a {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          color: var(--text-color);
          text-decoration: none;
          border-radius: 8px;
          transition: all 0.2s ease;
          cursor: pointer;
          font-size: 14px;
        }

        .sidebar-menu li a:hover {
          background: var(--hover-bg);
          color: var(--text-hover);
        }

        .sidebar-menu li.active a {
          background: var(--active-bg);
          color: var(--text-hover);
          font-weight: 600;
        }

        .sidebar-menu li a span {
          font-size: 18px;
          width: 24px;
          display: inline-block;
        }

        #logoutBtn {
          background: #e94560;
          border: none;
          padding: 12px;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
          font-size: 14px;
          transition: background 0.2s ease;
        }

        #logoutBtn:hover {
          background: #d42d4f;
        }
      </style>
    `;

    const template = `
      <aside class="sidebar">
        <div class="sidebar-header">
          <img src="./assets/img/logo.png" alt="Logo" class="sidebar-logo" onerror="this.src='../assets/img/logo.png'" />
        </div>

        <div class="sidebar-menu">
          <ul>
            <li id="nav-overview"><a href="index.html"><span>🏠</span> Tổng quan</a></li>
            <li id="nav-form"><a href="form.html"><span>🧾</span> Thêm bài đăng</a></li>
            <li id="nav-posts"><a href="posts.html"><span>📋</span> Danh sách bài đăng</a></li>
            <li id="nav-logs"><a href="logs.html"><span>⚠️</span> Log lỗi</a></li>
            <li id="nav-api"><a href="api.html"><span>🧠</span> API</a></li>
          </ul>
        </div>

        <button id="logoutBtn">Đăng xuất</button>
      </aside>
    `;

    this.shadowRoot.innerHTML = styles + template;
  }

  setupEventListeners() {
    const logoutBtn = this.shadowRoot.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          await fetch('https://metaboost-auth.khatranudn.workers.dev/logout', {
            method: 'POST',
            credentials: 'include'
          });
        } catch (err) {
          console.error('Logout error:', err);
        }
        window.location.href = 'login.html';
      });
    }
  }

  highlightActiveNav() {
    const navMap = {
      'index.html': 'nav-overview',
      'form.html': 'nav-form',
      'posts.html': 'nav-posts',
      'logs.html': 'nav-logs',
      'api.html': 'nav-api'
    };

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const activeNavId = navMap[currentPage];

    if (activeNavId) {
      const activeItem = this.shadowRoot.getElementById(activeNavId);
      if (activeItem) {
        activeItem.classList.add('active');
      }
    }
  }
}

customElements.define('app-sidebar', SidebarComponent);
