import { db } from './firebase-config.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';

/**
 * Lấy dữ liệu comment từ Firestore
 */
async function loadComments() {
  const loadingState = document.getElementById('loadingState');
  const commentsContainer = document.getElementById('commentsContainer');
  const emptyState = document.getElementById('emptyState');

  try {
    const snapshot = await getDocs(collection(db, 'comment_fb'));

    if (snapshot.empty) {
      loadingState.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    allComments = [];
    snapshot.forEach(doc => {
      allComments.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Render comments
    renderComments(allComments);
    loadingState.style.display = 'none';
    commentsContainer.style.display = 'flex';
    emptyState.style.display = 'none';

  } catch (error) {
    console.error('Error loading comments:', error);
    loadingState.style.display = 'none';
    emptyState.style.display = 'block';
    emptyState.textContent = '❌ Lỗi khi tải comment: ' + error.message;
  }
}

let allComments = [];
let filteredComments = [];

/**
 * Render comments với nested structure
 */
function renderComments(comments) {
  const container = document.getElementById('commentsContainer');
  container.innerHTML = '';

  comments.forEach(comment => {
    const threadEl = createCommentThread(comment);
    container.appendChild(threadEl);
  });
}

/**
 * Tạo thread comment (parent + children)
 */
function createCommentThread(comment) {
  const thread = document.createElement('div');
  thread.className = 'comment-thread';

  // Parent comment
  const parentEl = createParentComment(comment);
  thread.appendChild(parentEl);

  // Child comments
  if (comment.child_comments && comment.child_comments.length > 0) {
    const childrenEl = createChildComments(comment.child_comments);
    thread.appendChild(childrenEl);

    // Toggle button
    const toggleBtn = parentEl.querySelector('.toggle-children-btn');
    if (toggleBtn) {
      toggleBtn.style.display = 'flex';
      toggleBtn.addEventListener('click', () => {
        toggleBtn.classList.toggle('expanded');
        childrenEl.classList.toggle('expanded');
      });
    }
  }

  return thread;
}

/**
 * Tạo parent comment element
 */
function createParentComment(comment) {
  const div = document.createElement('div');
  div.className = 'parent-comment';

  // Extract data từ structure
  const commenterName = comment.commenter_name || comment.parent_comment?.commenter_name || 'Anonymous';
  const commentContent = comment.parent_comment?.comment_content || comment.comment_content || '';
  const createdTime = comment.created_time || comment.parent_comment?.created_time || '';
  const postContext = comment.post_context || comment.parent_comment?.post_context || '';
  
  const hasChildren = comment.child_comments && comment.child_comments.length > 0;
  const hasAiReply = comment.parent_comment?.ai_reply;
  const isAnswered = hasAiReply;

  const avatarInitial = commenterName ? commenterName[0].toUpperCase() : 'U';

  div.innerHTML = `
    <div style="display: flex; align-items: flex-start; justify-content: space-between;">
      <div class="comment-header">
        <div class="commenter-avatar">${escapeHtml(avatarInitial)}</div>
        <div class="comment-info">
          <div class="commenter-name">${escapeHtml(commenterName)}</div>
          <div class="comment-time">${formatTime(createdTime)}</div>
        </div>
      </div>
      <span class="comment-badge ${isAnswered ? 'badge-answered' : 'badge-pending'}">
        ${isAnswered ? '✅ Đã trả lời' : '⏳ Chờ trả lời'}
      </span>
    </div>

    <div class="comment-content">
      ${escapeHtml(commentContent)}
    </div>

    ${postContext ? `
      <div style="background: #f0f2f5; padding: 10px; border-radius: 6px; margin-bottom: 12px; font-size: 12px; color: #666; border-left: 3px solid #999;">
        <strong>📝 Bối cảnh bài viết:</strong><br>
        ${escapeHtml(postContext.substring(0, 150))}...
      </div>
    ` : ''}

    ${hasAiReply ? `
      <div class="ai-reply">
        <div class="ai-reply-label">🤖 Trả lời từ AI:</div>
        <div class="ai-reply-content">${escapeHtml(comment.parent_comment.ai_reply)}</div>
      </div>
    ` : ''}

    <div class="comment-actions">
      ${hasChildren ? `
        <button class="toggle-children-btn" style="display: none;">
          <span class="toggle-icon">▶</span>
          <span>${comment.child_comments.length} bình luận liên quan</span>
        </button>
      ` : ''}
      <button class="comment-action-btn">💬 Trả lời</button>
      <button class="comment-action-btn">⭐ Lưu</button>
    </div>
  `;

  return div;
}

/**
 * Tạo child comments container
 */
function createChildComments(childComments) {
  const container = document.createElement('div');
  container.className = 'child-comments';

  childComments.forEach(child => {
    const childEl = createChildCommentElement(child);
    container.appendChild(childEl);
  });

  return container;
}

/**
 * Tạo single child comment element
 */
function createChildCommentElement(child) {
  const div = document.createElement('div');
  div.className = 'child-comment';

  // Extract data từ structure
  const commenterName = child.commenter_name || 'Anonymous';
  const commentContent = child.comment_content || '';
  const createdTime = child.created_time || '';
  const hasAiReply = child.ai_reply;

  const avatarInitial = commenterName ? commenterName[0].toUpperCase() : 'U';

  div.innerHTML = `
    <div class="comment-header">
      <div class="commenter-avatar">${escapeHtml(avatarInitial)}</div>
      <div class="comment-info">
        <div class="commenter-name">${escapeHtml(commenterName)}</div>
        <div class="comment-time">${formatTime(createdTime)}</div>
      </div>
    </div>

    <div class="comment-content">
      ${escapeHtml(commentContent)}
    </div>

    ${hasAiReply ? `
      <div class="ai-reply">
        <div class="ai-reply-label">🤖 Trả lời từ AI:</div>
        <div class="ai-reply-content">${escapeHtml(child.ai_reply)}</div>
      </div>
    ` : ''}

    <div class="comment-actions">
      <button class="comment-action-btn">💬 Trả lời</button>
      <button class="comment-action-btn">⭐ Lưu</button>
    </div>
  `;

  return div;
}

/**
 * Format time từ ISO string
 */
function formatTime(isoString) {
  if (!isoString) return 'Không xác định';
  try {
    const date = new Date(isoString);
    return date.toLocaleString('vi-VN');
  } catch (e) {
    return isoString;
  }
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Search & Filter
 */
function setupFilters() {
  const searchInput = document.getElementById('searchInput');
  const filterStatus = document.getElementById('filterStatus');

  const applyFilters = () => {
    let filtered = allComments;

    // Search
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
      filtered = filtered.filter(c => {
        const content = (c.parent_comment?.comment_content || c.comment_content || '').toLowerCase();
        const name = (c.commenter_name || '').toLowerCase();
        return content.includes(searchTerm) || name.includes(searchTerm);
      });
    }

    // Status filter
    const status = filterStatus.value;
    if (status === 'answered') {
      filtered = filtered.filter(c => c.parent_comment?.ai_reply);
    } else if (status === 'unanswered') {
      filtered = filtered.filter(c => !c.parent_comment?.ai_reply);
    }

    renderComments(filtered);
  };

  searchInput.addEventListener('input', applyFilters);
  filterStatus.addEventListener('change', applyFilters);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadComments();
  setupFilters();
});

// Refresh setiap 60 detik
setInterval(loadComments, 60000);
