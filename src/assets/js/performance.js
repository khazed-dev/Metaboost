import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js';
import { getFirestore, collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js';

// Firebase config (lấy từ firebase-config.js hoặc define here)
const firebaseConfig = {
  apiKey: "AIzaSyB4IPPNSrWaGGqNFMslo6mSbDLdzSR757U",
  authDomain: "autoposter-635e1.firebaseapp.com",
  projectId: "autoposter-635e1",
  storageBucket: "autoposter-635e1.appspot.com",
  messagingSenderId: "492226816129",
  appId: "1:492226816129:web:4c0b88711caaec538ac580",
  measurementId: "G-3NW76QPJJS"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Lấy dữ liệu bài viết từ Firestore
 * Nhóm theo pageName và tính stats
 */
async function loadPerformanceData() {
  const loadingState = document.getElementById('loadingState');
  const performanceTable = document.getElementById('performanceTable');
  const tableBody = document.getElementById('tableBody');
  const emptyState = document.getElementById('emptyState');

  try {
    // Lấy toàn bộ bài viết từ collection posts
    const postsSnapshot = await getDocs(collection(db, 'posts'));
    
    // Nếu không có dữ liệu
    if (postsSnapshot.empty) {
      loadingState.style.display = 'none';
      emptyState.style.display = 'block';
      performanceTable.style.display = 'none';
      return;
    }

    // Nhóm dữ liệu theo pageName
    const pageStats = {};

    postsSnapshot.forEach(doc => {
      const data = doc.data();
      const pageName = data.pageName || data.Channel || 'Unknown';
      const status = data.Status || 'Pending';
      const errorMessage = data.ErrorMessage || null;

      // Khởi tạo nếu pageName chưa có
      if (!pageStats[pageName]) {
        pageStats[pageName] = {
          posted: 0,
          pending: 0,
          errors: 0
        };
      }

      // Tính toán
      if (status === 'Posted') {
        pageStats[pageName].posted++;
      } else if (status === 'Pending') {
        pageStats[pageName].pending++;
      }

      // Đếm lỗi
      if (errorMessage) {
        pageStats[pageName].errors++;
      }
    });

    // Render bảng
    tableBody.innerHTML = '';
    
    Object.entries(pageStats).forEach(([pageName, stats]) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${escapeHtml(pageName)}</strong></td>
        <td><span class="stat-number success">${stats.posted}</span></td>
        <td><span class="stat-number pending">${stats.pending}</span></td>
        <td><span class="stat-number error">${stats.errors}</span></td>
      `;
      tableBody.appendChild(row);
    });

    // Ẩn loading, hiển thị bảng
    loadingState.style.display = 'none';
    performanceTable.style.display = 'table';
    emptyState.style.display = 'none';

  } catch (error) {
    console.error('Error loading performance data:', error);
    loadingState.style.display = 'none';
    emptyState.style.display = 'block';
    emptyState.textContent = '❌ Lỗi khi tải dữ liệu';
  }
}

/**
 * Escape HTML để tránh XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Load dữ liệu khi DOM ready
document.addEventListener('DOMContentLoaded', () => {
  loadPerformanceData();
});

// Refresh data mỗi 30 giây (optional)
setInterval(loadPerformanceData, 30000);
