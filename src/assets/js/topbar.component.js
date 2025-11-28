import { supabase, getUnreadCount, fetchRecentMessages } from './supabase.js';

class TopbarComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.pollInterval = null;
  }

  connectedCallback() {
    this.render();
    this.shadowRoot
      .getElementById('messengerBtn')
      .addEventListener('click', () => {
        // open the full inbox panel if present (prefer same root)
        const inbox = this.findInbox();
        if (inbox && typeof inbox.open === 'function') {
          inbox.open();
        } else {
          // fallback to legacy modal if inbox not available
          this.openMessenger();
        }
      });

    // Update unread badge immediately
    this.updateUnread();

    // Subscribe to realtime changes on `messages` table so badge updates instantly
    try {
      this.channel = supabase
        .channel('public:messages')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'messages' },
          (payload) => {
            // Payload arrives for INSERT/UPDATE/DELETE
            // Simply refresh the unread count to keep logic simple
            this.updateUnread();

            // If messenger modal is open and it's an INSERT, prepend message to list
            // if the full inbox panel is open, let it handle the UI update
            const inbox = this.findInbox();
            if (inbox && typeof inbox.buildConversations === 'function') {
              // the inbox component listens to realtime as well, but ensure it refreshes
              inbox.buildConversations();
            } else {
              const modal = this.shadowRoot.getElementById('messengerModal');
              const list = this.shadowRoot.getElementById('messagesList');
              if (modal && modal.style.display === 'block' && payload.eventType === 'INSERT') {
                const r = payload.new;
                const who = r.sender_id || r.recipient_id || 'unknown';
                const text = (r.message_text || '').slice(0, 120);
                const time = new Date(r.created_at).toLocaleString();
                const status = r.status || '';
                const li = document.createElement('li');
                li.className = `msg ${status}`;
                li.innerHTML = `<div class="meta"><strong>${who}</strong><span class="time">${time}</span></div><div class="body">${text}</div>`;
                list.prepend(li);
              }
            }
          }
        )
        .subscribe();

      // Polling fallback every 15s in case realtime misses
      this.pollInterval = setInterval(() => this.updateUnread(), 15000);
    } catch (err) {
      console.warn('Realtime subscription failed, falling back to polling', err);
      this.pollInterval = setInterval(() => this.updateUnread(), 15000);
    }
  }

  disconnectedCallback() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    // cleanup realtime channel
    try {
      if (this.channel && this.channel.unsubscribe) {
        this.channel.unsubscribe();
      } else if (this.channel && supabase.removeChannel) {
        supabase.removeChannel(this.channel);
      }
    } catch (err) {
      console.warn('Error unsubscribing realtime channel', err);
    }
  }

  // Find app-inbox: prefer same root (shadow) then fallback to document
  findInbox() {
    try {
      const root = this.getRootNode && this.getRootNode();
      if (root && root.querySelector) {
        const local = root.querySelector('app-inbox');
        if (local) return local;
      }
    } catch (e) {
      // ignore
    }
    return document.querySelector('app-inbox');
  }

  async updateUnread() {
    try {
      const { count } = await getUnreadCount();
      const badge = this.shadowRoot.getElementById('unreadBadge');
      if (!badge) return;
      if (count && count > 0) {
        badge.textContent = count;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    } catch (err) {
      console.error('updateUnread error', err);
    }
  }

  async openMessenger() {
    const modal = this.shadowRoot.getElementById('messengerModal');
    modal.style.display = 'block';
    const list = this.shadowRoot.getElementById('messagesList');
    list.innerHTML = '<li class="loading">Đang tải...</li>';
    try {
      const { data, error } = await fetchRecentMessages(30);
      if (error) throw error;
      if (!data || data.length === 0) {
        list.innerHTML = '<li class="empty">Không có tin nhắn</li>';
        return;
      }
      list.innerHTML = data
        .map((r) => {
          const who = r.sender_id || r.recipient_id || 'unknown';
          const text = (r.message_text || '').slice(0, 120);
          const time = new Date(r.created_at).toLocaleString();
          const status = r.status || '';
          return `<li class="msg ${status}"><div class="meta"><strong>${who}</strong><span class="time">${time}</span></div><div class="body">${text}</div></li>`;
        })
        .join('');
    } catch (err) {
      console.error('openMessenger error', err);
      list.innerHTML = `<li class="error">Lỗi tải tin nhắn</li>`;
    }
  }

  closeMessenger() {
    const modal = this.shadowRoot.getElementById('messengerModal');
    modal.style.display = 'none';
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .topbar {
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          background: white;
          border-bottom: 1px solid #eee;
          box-shadow: 0 1px 0 rgba(0,0,0,0.04);
          position: sticky;
          top: 0;
          z-index: 20;
        }
        .left { display:flex; align-items:center; gap:12px }
        .brand { font-weight:700; color:#222 }
        .controls { display:flex; gap:12px; align-items:center }
        .icon-btn { position:relative; width:40px; height:40px; display:inline-flex; align-items:center; justify-content:center; border-radius:8px; cursor:pointer; border:1px solid transparent }
        .icon-btn:hover { background:#f5f7fb }
        .badge { position:absolute; top:4px; right:4px; min-width:18px; height:18px; line-height:18px; padding:0 6px; background:#e94560; color:white; border-radius:12px; font-size:12px; display:none }

        /* Messenger modal */
        .modal { position:fixed; right:20px; top:80px; width:360px; max-height:70vh; background:white; border-radius:10px; box-shadow:0 8px 24px rgba(0,0,0,0.12); overflow:auto; display:none; z-index:40 }
        .modal header{ display:flex; justify-content:space-between; padding:12px 14px; border-bottom:1px solid #eee }
        .modal ul{ list-style:none; margin:0; padding:8px }
        .modal li.msg{ padding:8px; border-bottom:1px solid #fafafa }
        .modal li.msg .meta{ display:flex; justify-content:space-between; gap:8px; font-size:12px; color:#555 }
        .modal li.msg .body{ margin-top:6px; color:#222 }
        .modal .empty, .modal .loading, .modal .error{ padding:12px; color:#666 }
      </style>

      <div class="topbar">
        <div class="left">
          <div class="brand">MetaBoost</div>
        </div>
        <div class="controls">
          <div id="messengerBtn" class="icon-btn" title="Hộp thoại">
            💬
            <span id="unreadBadge" class="badge">0</span>
          </div>
          <div id="fbPanelBtn" class="icon-btn" title="Bình luận Facebook">
            👍
          </div>
        </div>
      </div>

      <div id="messengerModal" class="modal" aria-hidden="true">
        <header>
          <div>Hộp thoại</div>
          <button id="closeMessenger">Đóng</button>
        </header>
        <ul id="messagesList"></ul>
      </div>
    `;
  }
}

customElements.define('app-topbar', TopbarComponent);
