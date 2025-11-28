import { db } from './firebase-config.js';
import { collection, onSnapshot, query, where } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';

// ===== STATE MANAGEMENT =====
let allComments = [];
let filteredComments = [];
let selectedCommentForDelete = null;

// ===== DOM ELEMENTS =====
const loadingState = document.getElementById('loadingState');
const tableContainer = document.getElementById('tableContainer');
const emptyState = document.getElementById('emptyState');
const errorState = document.getElementById('errorState');
const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('searchInput');
const severityFilter = document.getElementById('severityFilter');
const intentFilter = document.getElementById('intentFilter');
const refreshBtn = document.getElementById('refreshBtn');
const toast = document.getElementById('toast');

// Stat counters
const criticalCount = document.getElementById('criticalCount');
const highCount = document.getElementById('highCount');
const mediumCount = document.getElementById('mediumCount');

// Modal elements
const deleteModal = document.getElementById('deleteModal');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const previewMessage = document.getElementById('previewMessage');
const modalClose = document.querySelector('.modal-close');
const retryBtn = document.getElementById('retryBtn');

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadNegativeComments();
});

// ===== EVENT LISTENERS =====
function initializeEventListeners() {
    searchInput.addEventListener('input', applyFilters);
    severityFilter.addEventListener('change', applyFilters);
    intentFilter.addEventListener('change', applyFilters);
    refreshBtn.addEventListener('click', handleRefresh);

    // Modal handlers
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) {
            closeDeleteModal();
        }
    });
    modalClose.addEventListener('click', closeDeleteModal);
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    confirmDeleteBtn.addEventListener('click', handleConfirmDelete);
    retryBtn.addEventListener('click', loadNegativeComments);
}

// ===== FIRESTORE REALTIME LISTENER =====
function loadNegativeComments() {
    showLoading(true);
    hideError();

    try {
        // Query: processed = true để chỉ lấy comments đã xử lý
        const q = query(collection(db, 'comments_negative'), where('processed', '==', true));

        // Realtime listener
        const unsubscribe = onSnapshot(q, (snapshot) => {
            allComments = [];
            snapshot.forEach((doc) => {
                allComments.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // Sort by createdAt descending
            allComments.sort((a, b) => {
                const timeA = new Date(a.createdAt).getTime();
                const timeB = new Date(b.createdAt).getTime();
                return timeB - timeA;
            });

            // Apply filters & render
            applyFilters();
            showLoading(false);
        }, (error) => {
            console.error('Firestore error:', error);
            showError(error.message);
        });

        // Return unsubscribe function for cleanup if needed
        window.unsubscribeComments = unsubscribe;
    } catch (error) {
        console.error('Error setting up listener:', error);
        showError(error.message);
    }
}

// ===== FILTERING & SEARCHING =====
function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const severityValue = severityFilter.value;
    const intentValue = intentFilter.value;

    filteredComments = allComments.filter((comment) => {
        // Search filter: tên người dùng hoặc nội dung comment
        const matchesSearch =
            !searchTerm ||
            (comment.fromName && comment.fromName.toLowerCase().includes(searchTerm)) ||
            (comment.customerMessage && comment.customerMessage.toLowerCase().includes(searchTerm));

        // Severity filter
        const matchesSeverity = !severityValue || comment.severity === severityValue;

        // Intent filter
        const matchesIntent = !intentValue || comment.intent === intentValue;

        return matchesSearch && matchesSeverity && matchesIntent;
    });

    // Update stats
    updateStatistics();

    // Render table
    renderTable();
}

// ===== STATISTICS =====
function updateStatistics() {
    const critical = allComments.filter((c) => c.severity === 'critical').length;
    const high = allComments.filter((c) => c.severity === 'high').length;
    const medium = allComments.filter((c) => c.severity === 'medium').length;

    criticalCount.textContent = critical;
    highCount.textContent = high;
    mediumCount.textContent = medium;
}

// ===== TABLE RENDERING =====
function renderTable() {
    tableBody.innerHTML = '';

    if (filteredComments.length === 0) {
        showEmpty(true);
        tableContainer.style.display = 'none';
        return;
    }

    showEmpty(false);
    tableContainer.style.display = 'block';

    filteredComments.forEach((comment) => {
        const row = createTableRow(comment);
        tableBody.appendChild(row);
    });
}

function createTableRow(comment) {
    const row = document.createElement('tr');
    const postUrl = `https://facebook.com/${comment.postId}`;
    
    row.innerHTML = `
        <td class="col-name" title="${comment.fromName || 'Ẩn danh'}">${sanitizeHTML(comment.fromName || 'Ẩn danh')}</td>
        <td class="col-message">
            <div class="message-preview" title="${comment.customerMessage || ''}">${sanitizeHTML(comment.customerMessage || '')}</div>
        </td>
        <td class="col-reply">
            <div class="message-preview" title="${comment.botReply || ''}">${sanitizeHTML(comment.botReply || '')}</div>
        </td>
        <td class="col-sentiment">
            ${createSentimentBadge(comment.sentiment)}
        </td>
        <td class="col-severity">
            ${createSeverityBadge(comment.severity)}
        </td>
        <td class="col-intent">
            ${createIntentBadge(comment.intent)}
        </td>
        <td class="col-post">
            <a href="${postUrl}" target="_blank" rel="noopener noreferrer" class="btn-link">🔗 Link bài viết</a>
        </td>
        <td class="col-action">
            <button class="btn-delete" data-id="${comment.id}" data-post-id="${comment.postId}" data-page-id="${comment.pageId}">
                🗑️ Xóa
            </button>
        </td>
    `;

    // Event listener for delete button
    row.querySelector('.btn-delete').addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-delete');
        openDeleteModal(comment, btn.dataset.id, btn.dataset.postId, btn.dataset.pageId);
    });

    return row;
}

// ===== BADGE CREATION =====
function createSentimentBadge(sentiment) {
    const sentimentMap = {
        negative: { label: 'Tiêu cực', class: 'negative' },
        neutral: { label: 'Trung lập', class: 'neutral' },
        positive: { label: 'Tích cực', class: 'positive' }
    };

    const data = sentimentMap[sentiment] || { label: sentiment, class: 'neutral' };
    return `<span class="sentiment-badge ${data.class}">${data.label}</span>`;
}

function createSeverityBadge(severity) {
    const severityMap = {
        critical: '🔴 CRITICAL',
        high: '🟠 HIGH',
        medium: '🟡 MEDIUM'
    };

    const label = severityMap[severity] || 'UNKNOWN';
    return `<span class="severity-badge ${severity}">${label}</span>`;
}

function createIntentBadge(intent) {
    const intentMap = {
        complaint: '📢 Phàn nàn',
        question: '❓ Câu hỏi',
        suggestion: '💡 Đề xuất',
        other: '📝 Khác'
    };

    const label = intentMap[intent] || intent;
    return `<span class="intent-badge">${label}</span>`;
}

// ===== DELETE MODAL HANDLERS =====
function openDeleteModal(comment, commentId, postId, pageId) {
    selectedCommentForDelete = { comment, commentId, postId, pageId };
    previewMessage.textContent = comment.customerMessage || 'N/A';
    deleteModal.style.display = 'flex';
}

function closeDeleteModal() {
    deleteModal.style.display = 'none';
    selectedCommentForDelete = null;
}

// ===== DELETE API CALL =====
async function handleConfirmDelete() {
    if (!selectedCommentForDelete) return;

    const { comment, commentId, postId, pageId } = selectedCommentForDelete;
    const deleteBtn = document.querySelector(`[data-id="${commentId}"]`);

    try {
        // Disable button & show loading
        if (deleteBtn) deleteBtn.disabled = true;
        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.textContent = '⏳ Đang xóa...';

        // Call n8n webhook
        const response = await fetch('https://autopostfb.duckdns.org/webhook/delete-comment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                commentId: commentId,
                postId: postId,
                pageId: pageId
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        // Success
        closeDeleteModal();
        showToast('✅ Comment đã được xóa thành công!', 'success');

        // Reset button state
        if (deleteBtn) deleteBtn.disabled = false;
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.textContent = 'Xóa';
    } catch (error) {
        console.error('Delete error:', error);
        showToast(`❌ Lỗi: ${error.message}`, 'error');

        // Reset button state
        if (deleteBtn) deleteBtn.disabled = false;
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.textContent = 'Xóa';
    }
}

// ===== UI STATE HANDLERS =====
function showLoading(show) {
    if (show) {
        loadingState.style.display = 'flex';
        tableContainer.style.display = 'none';
        emptyState.style.display = 'none';
        errorState.style.display = 'none';
    } else {
        loadingState.style.display = 'none';
    }
}

function showEmpty(show) {
    emptyState.style.display = show ? 'flex' : 'none';
}

function showError(message) {
    loadingState.style.display = 'none';
    tableContainer.style.display = 'none';
    emptyState.style.display = 'none';
    errorState.style.display = 'flex';
    document.getElementById('errorMessage').textContent = message || 'Có lỗi xảy ra';
}

function hideError() {
    errorState.style.display = 'none';
}

// ===== REFRESH HANDLER =====
function handleRefresh() {
    refreshBtn.style.animation = 'none';
    setTimeout(() => {
        refreshBtn.style.animation = 'spin 0.8s linear';
    }, 10);

    loadNegativeComments();
}

// ===== TOAST NOTIFICATION =====
function showToast(message, type = 'info') {
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.style.display = 'block';

    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// ===== UTILITY FUNCTIONS =====
function formatDate(dateValue) {
    if (!dateValue) return 'N/A';

    try {
        let date;

        // Xử lý Firestore Timestamp object (có toDate() method)
        if (dateValue && typeof dateValue.toDate === 'function') {
            date = dateValue.toDate();
        }
        // Xử lý ISO string hoặc timestamp số
        else if (typeof dateValue === 'string') {
            date = new Date(dateValue);
        } else if (typeof dateValue === 'number') {
            date = new Date(dateValue);
        } else {
            return 'N/A';
        }

        // Kiểm tra có phải valid date không
        if (isNaN(date.getTime())) {
            return 'N/A';
        }

        const today = new Date();
        const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const dateOnlyDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        const yesterday = new Date(todayDate);
        yesterday.setDate(yesterday.getDate() - 1);

        // Format: HH:MM (ngày hôm nay), Hôm qua HH:MM, DD/MM/YYYY (ngày khác)
        if (dateOnlyDate.getTime() === todayDate.getTime()) {
            return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        } else if (dateOnlyDate.getTime() === yesterday.getTime()) {
            return `Hôm qua ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
        } else {
            return date.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }
    } catch (error) {
        console.error('Date format error:', error);
        return 'N/A';
    }
}

function sanitizeHTML(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== EXPORT FOR DEBUGGING =====
window.DEBUG = {
    allComments,
    filteredComments,
    selectedCommentForDelete,
    showToast,
    loadNegativeComments
};
