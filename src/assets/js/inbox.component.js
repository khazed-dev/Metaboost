import { supabase } from './supabase.js';
import { getFacebookProfile, getFacebookProfiles } from './facebook-helper.js';

// Replace with your Page ID (the ID that represents your business page)
const PAGE_ID = '107521941056856';

// Helper to normalize sender/recipient IDs that may be stored as:
// - plain string number ("25724043730513203")
// - JSON string: '{"id":"107521941056856"}'
// - object: { id: '107521941056856' }
// Returns a plain string with the underlying numeric id.
function normalizeId(value) {
  if (value === null || value === undefined) return '';
  
  // Handle object first
  if (typeof value === 'object' && value !== null) {
    if (value.id) return String(value.id);
    return '';
  }
  
  // Handle string (most common case)
  if (typeof value === 'string') {
    const trimmed = value.trim();
    
    // Try JSON parse first (for '{"id":"107521941056856"}')
    if (trimmed.startsWith('{')) {
      try {
        const obj = JSON.parse(trimmed);
        if (obj && obj.id) return String(obj.id);
      } catch {
        // If parse fails, fall through to regex extraction
      }
    }
    
    // Direct return if already numeric string
    if (/^[0-9]+$/.test(trimmed)) return trimmed;
    
    // Fallback: extract first long digit sequence
    const match = trimmed.match(/[0-9]{10,}/);
    if (match) return match[0];
    
    return trimmed;
  }
  
  return String(value);
}

// Robust detection: treat as page if the normalized id equals PAGE_ID OR raw string contains PAGE_ID
function isPageSender(rawSender) {
  const norm = normalizeId(rawSender);
  if (norm === PAGE_ID) return true;
  const rawStr = String(rawSender);
  return rawStr.includes(PAGE_ID);
}

class InboxComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.messages = []; // cache of recent messages
    this.conversations = [];
    this.selectedConversationId = null;
    this.channel = null;
  }

  connectedCallback() {
    this.render();
    this.loadMessages().then(() => this.buildConversations());
    this.setupRealtime();
    
    // Check if this is used as fullpage (inbox.html) or popup
    const isFullpage = this.hasAttribute('data-fullpage') || this.id === 'mainInbox';
    if (isFullpage) {
      this.setAttribute('data-fullpage', '');
      // Auto-open for fullpage mode
      setTimeout(() => this.open(), 100);
    }
    
    // close when clicking outside (only for popup mode)
    if (!isFullpage) {
      document.addEventListener('click', this._outClick = (e) => {
        if (!this.shadowRoot) return;
        const panel = this.shadowRoot.querySelector('.inbox-panel');
        if (!panel) return;
        if (!panel.contains(e.target) && !e.target.closest || !e.target.closest('app-topbar')) {
          this.close();
        }
      });
    }
  }

  disconnectedCallback() {
    if (this.channel && this.channel.unsubscribe) {
      this.channel.unsubscribe();
    }
    document.removeEventListener('click', this._outClick);
  }

  async loadMessages(limit = 500) {
    try {
      // Only load messages that involve the page (either as sender or recipient)
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${PAGE_ID},recipient_id.eq.${PAGE_ID}`)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      // Normalize sender/recipient IDs for easier rendering
      this.messages = (data || []).map(m => ({
        ...m,
        _sender_norm: normalizeId(m.sender_id),
        _recipient_norm: normalizeId(m.recipient_id),
        _is_from_page: isPageSender(m.sender_id),
        _direction_norm: m.direction || (isPageSender(m.sender_id) ? 'outbound' : 'inbound')
      }));
    } catch (err) {
      console.error('loadMessages error', err);
      this.messages = [];
    }
  }

  buildConversations() {
    // group messages by conversation_id and compute last message + unread count
    const convMap = new Map();
    for (const msg of this.messages) {
      // determine the "other" party using normalized IDs
      const other = (msg._sender_norm === PAGE_ID) ? msg._recipient_norm : msg._sender_norm;
      const id = other || 'unknown';
      if (!convMap.has(id)) convMap.set(id, { id, last: null, unread: 0, messages: [], displayName: null, avatarUrl: null });
      const entry = convMap.get(id);
      entry.messages.push(msg);
      if (!entry.last || new Date(msg.created_at) > new Date(entry.last.created_at)) {
        entry.last = msg;
      }
      // Count unread only for messages that are incoming to the page
      if (msg._recipient_norm === PAGE_ID && msg.status === 'unread') entry.unread++;
    }

    // sort conversations by last message desc
    this.conversations = Array.from(convMap.values()).sort((a, b) => new Date(b.last.created_at) - new Date(a.last.created_at));
    
    // Fetch Facebook profiles for all conversations
    this.loadFacebookProfiles();
    
    this.renderConversationsList();
    // auto-select first
    if (!this.selectedConversationId && this.conversations.length) {
      this.selectConversation(this.conversations[0].id);
    }
  }

  async loadFacebookProfiles() {
    // Lấy tất cả user IDs cần fetch
    const userIds = this.conversations.map(c => c.id).filter(id => id !== 'unknown');
    
    if (userIds.length === 0) return;

    try {
      const profiles = await getFacebookProfiles(userIds);
      
      // Update conversations với profile info
      for (const conv of this.conversations) {
        const profile = profiles.get(conv.id);
        if (profile) {
          conv.displayName = profile.name;
          conv.avatarUrl = profile.profile_pic;
        }
      }
      
      // Re-render conversation list với tên và avatar mới
      this.renderConversationsList();
    } catch (err) {
      console.warn('Failed to load Facebook profiles:', err);
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { position: fixed; right: 12px; top: 72px; z-index: 60; display: block; }
        .inbox-panel { width: 980px; height: 72vh; background: #fff; border-radius: 8px; box-shadow: 0 12px 40px rgba(0,0,0,0.12); overflow: hidden; display: none; font-family: Inter, sans-serif }
        
        /* When used as main page (inbox.html), allow full width/height */
        :host([data-fullpage]) { position: static !important; width: 100%; height: 100%; right: auto; top: auto; z-index: 1; }
        :host([data-fullpage]) .inbox-panel { display: flex !important; width: 100% !important; height: 100% !important; border-radius: 0 !important; box-shadow: none !important; }
        
        .inbox-grid { display: grid; grid-template-columns: 320px 1fr 300px; height: 100%; }
        .left { border-right:1px solid #eee; overflow:auto; background:#fbfdff }
        .center { display:flex; flex-direction:column; overflow:hidden }
        .right { border-left:1px solid #eee; padding:12px; overflow:auto; background:#fafafa }
        .header { display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #eee; flex-shrink:0 }

        /* Conversation list */
        .search { padding:10px 12px; border-bottom:1px solid #f0f0f0 }
        .search input { width:100%; padding:8px 12px; border-radius:8px; border:1px solid #e6eaf0 }
        .tabs { display:flex; gap:8px; padding:8px 12px; border-bottom:1px solid #f0f0f0 }
        .tab { padding:8px 10px; border-radius:8px; cursor:pointer; font-size:13px }
        .tab.active { background:#f0f6ff; font-weight:600 }

        .conv { padding:12px; display:flex; gap:12px; align-items:center; border-bottom:1px solid #fafafa; cursor:pointer }
        .conv:hover { background:#f7f9fc }
        .conv.selected { background:#eef6ff }
  .conv.unread .title { font-weight:700 }
  .conv.unread .preview { font-weight:600; color:#333 }
  .conv.unread .time { font-weight:700; color:#333 }
        .avatar { width:44px; height:44px; border-radius:50%; background:#ddd; overflow:hidden; display:inline-block }
        .avatar img { width:100%; height:100%; object-fit:cover }
        .meta { flex:1; min-width:0 }
        .title { font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
        .preview { color:#666; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
        .time { font-size:12px; color:#999 }
        .badge { background:#e94560; color:#fff; padding:2px 8px; border-radius:12px; font-size:12px }

        /* Thread (center) */
        .thread-area { display:flex; flex-direction:column; height:100%; overflow:hidden }
        .thread { padding:18px; overflow-y:auto; flex:1; display:flex; flex-direction:column; gap:8px; max-height:100% }
        .msg { max-width:72%; padding:10px 12px; border-radius:18px; word-wrap:break-word }
        .msg.incoming { background:#9ca5b2; align-self:flex-start; border-bottom-left-radius:6px }
        .msg.outgoing { background:#9ca5b2; color:#fff; align-self:flex-end; border-bottom-right-radius:6px }
        .msg .time { display:block; font-size:11px; color:#ffffff; margin-top:6px }
        .msg.outgoing .time { color:#ffffff }
        .thread-input { padding:12px; border-top:1px solid #615858de; display:flex; gap:8px; align-items:center; flex-shrink:0 }
        .thread-input textarea { flex:1; height:52px; padding:10px; border-radius:12px; border:1px solid #0a0a0aff; resize:none; font-family:inherit }
        .thread-input button { background:#1877f2; color:white; border:none; padding:10px 16px; border-radius:10px; cursor:pointer; white-space:nowrap }
        .thread-input button:hover { background:#166fe5 }

        /* Right panel */
        .details-avatar { width:72px; height:72px; border-radius:12px; overflow:hidden; background:#ddd; margin-bottom:12px }
    .details .row { margin-bottom:8px }
    .details div { margin-bottom:12px; font-size:14px; line-height:1.6; color:#2c3e50 }
    .details strong { color:#1a1a1a; font-weight:600 }
    #details { color:#2c3e50 }
      </style>

      <div class="inbox-panel" role="dialog" aria-hidden="true">
        <div class="inbox-grid">
          <div class="left">
            <div class="header"><strong>Hộp thư</strong><button id="closeBtn">✕</button></div>
            <div class="search"><input id="searchInput" placeholder="Tìm kiếm" /></div>
            <div class="tabs"><div class="tab active" data-filter="all">Tất cả</div><div class="tab" data-filter="messenger">Messenger</div></div>
            <div id="conversations"></div>
          </div>
          <div class="center">
            <div class="header"><div id="threadTitle">Chọn cuộc trò chuyện</div><div id="threadActions"></div></div>
            <div class="thread-area">
              <div id="thread" class="thread"></div>
              <div class="thread-input"><textarea id="replyText" placeholder="Viết trả lời..."></textarea><button id="sendBtn">Gửi</button></div>
            </div>
          </div>
          <div class="right">
            <div class="header"><strong>Chi tiết liên hệ</strong></div>
            <div id="details"></div>
          </div>
        </div>
      </div>
    `;

    this.shadowRoot.getElementById('closeBtn').addEventListener('click', () => this.close());
    this.shadowRoot.getElementById('sendBtn').addEventListener('click', () => this.sendReply());
    this.shadowRoot.getElementById('searchInput').addEventListener('input', (e) => this.renderConversationsList(e.target.value));
    this.shadowRoot.querySelectorAll('.tab').forEach(t => t.addEventListener('click', (ev) => {
      this.shadowRoot.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
      ev.target.classList.add('active');
      const filter = ev.target.getAttribute('data-filter');
      this.renderConversationsList(this.shadowRoot.getElementById('searchInput').value || '', filter);
    }));
  }

  renderConversationsList() {
    const container = this.shadowRoot.getElementById('conversations');
    if (!container) return;
    // allow optional search/filter parameters
    const args = Array.from(arguments);
    const q = (args[0] || '').toLowerCase();
    const filter = args[1] || 'all';

    const rows = this.conversations.filter(conv => {
      if (filter === 'messenger') {
        // simple filter: direction contains messenger? keep all for now
      }
      if (!q) return true;
      const last = conv.last || {};
      return String(conv.id).toLowerCase().includes(q) || String(last.message_text||'').toLowerCase().includes(q);
    });

    container.innerHTML = rows.map(conv => {
      const last = conv.last || {};
      const time = last.created_at ? new Date(last.created_at).toLocaleTimeString() : '';
      const preview = (last.message_text || '').slice(0, 80);
      // Use Facebook avatar if available, otherwise fallback
      const avatar = conv.avatarUrl || '/src/assets/img/logo.png';
      const displayName = conv.displayName || conv.id;
      const selected = this.selectedConversationId == conv.id ? 'selected' : '';
      const unreadCls = conv.unread ? 'unread' : '';
      return `
        <div class="conv ${selected} ${unreadCls}" data-id="${conv.id}">
          <div class="avatar"><img src="${avatar}" onerror="this.src='/src/assets/img/logo.png'" /></div>
          <div class="meta">
            <div class="title">${displayName}</div>
            <div class="preview">${preview}</div>
          </div>
          <div style="text-align:right">
            <div class="time">${time}</div>
            ${conv.unread ? `<div class="badge">${conv.unread}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');

    // attach click
    this.shadowRoot.querySelectorAll('.conv').forEach(el => {
      el.addEventListener('click', () => this.selectConversation(el.getAttribute('data-id')));
    });
  }

  selectConversation(id) {
    this.selectedConversationId = id;
    const conv = this.conversations.find(c => c.id == id);
    const title = this.shadowRoot.getElementById('threadTitle');
    
    // Hiển thị tên Facebook thay vì ID
    const displayName = conv ? (conv.displayName || conv.id) : 'Cuộc trò chuyện';
    title.textContent = displayName;
    
    // render thread messages (ascending)
    const msgs = this.messages.filter(m => {
      const other = (m._sender_norm === PAGE_ID) ? m._recipient_norm : m._sender_norm;
      return other == id;
    }).sort((a,b)=> new Date(a.created_at)-new Date(b.created_at));
    const thread = this.shadowRoot.getElementById('thread');
    thread.innerHTML = msgs.map(m => {
      const isFromPage = m._is_from_page;
      const cls = isFromPage ? 'outgoing' : 'incoming';
      const time = new Date(m.created_at).toLocaleString();
      return `<div class="msg ${cls}"><div class="body">${m.message_text || ''}</div><div class="time" style="font-size:11px;color:#ffffff;margin-top:6px">${time}</div></div>`;
    }).join('');

    this.shadowRoot.getElementById('replyText').value = '';
    this.renderDetails(conv);
    // highlight selected in conversation list
    this.shadowRoot.querySelectorAll('.conv').forEach(el => el.classList.remove('selected'));
    const sel = this.shadowRoot.querySelector(`.conv[data-id="${id}"]`);
    if (sel) sel.classList.add('selected');
    // mark unread -> read
    this.markConversationRead(id);
  }

  renderDetails(conv) {
    const details = this.shadowRoot.getElementById('details');
    if (!conv) { 
      details.innerHTML = '<div>Không có chi tiết</div>'; 
      return; 
    }
    
    const displayName = conv.displayName || conv.id;
    const avatar = conv.avatarUrl || '/src/assets/img/logo.png';
    
    details.innerHTML = `
      <div class="details-avatar">
        <img src="${avatar}" onerror="this.src='/src/assets/img/logo.png'" style="width:100%;height:100%;object-fit:cover;border-radius:12px" />
      </div>
      <div><strong>Tên:</strong> ${displayName}</div>
      <div><strong>ID:</strong> ${conv.id}</div>
      <div><strong>Tin cuối:</strong> ${conv.last ? conv.last.message_text : ''}</div>
      <div><strong>Chưa đọc:</strong> ${conv.unread}</div>
    `;
  }

  async markConversationRead(id) {
    try {
      // Mark incoming messages from this other party to the page as read
      await supabase
        .from('messages')
        .update({ status: 'read' })
        .eq('sender_id', id)
        .eq('recipient_id', PAGE_ID)
        .eq('status', 'unread');
      // update local cache
      this.messages = this.messages.map(m => {
        const other = (m._sender_norm === PAGE_ID) ? m._recipient_norm : m._sender_norm;
        return (other==id && m.status=='unread' && m._recipient_norm===PAGE_ID) ? { ...m, status: 'read' } : m;
      });
      this.buildConversations();
    } catch (err) {
      console.error('markConversationRead error', err);
    }
  }                                                                                                                                                                         

  async sendReply() {
    const text = this.shadowRoot.getElementById('replyText').value.trim();
    if (!text || !this.selectedConversationId) return;
    try {
      const payload = {
        conversation_id: this.selectedConversationId,
        // Store sender_id as plain string for consistency (avoid JSON wrapper)
        sender_id: PAGE_ID,
        recipient_id: this.selectedConversationId,
        message_text: text,
        direction: 'outbound',
        status: 'sent',
        created_at: new Date().toISOString()
      };
      const { data, error } = await supabase.from('messages').insert([payload]).select();
      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
      
      // Send message to webhook for delivery
      await this.sendToWebhook({
        conversation_id: this.selectedConversationId,
        message_text: text,
        sender_id: PAGE_ID,
        recipient_id: this.selectedConversationId
      });
      
      // Notify n8n that admin has taken over (cancel bot auto-reply)
      await this.notifyAdminTakeover(this.selectedConversationId);
      
      // append to local cache and re-render
      if (data && data[0]) {
        const inserted = data[0];
        this.messages.unshift({
          ...inserted,
          _sender_norm: normalizeId(inserted.sender_id),
          _recipient_norm: normalizeId(inserted.recipient_id),
          _is_from_page: true,
          _direction_norm: 'outbound'
        });
        this.buildConversations();
        this.selectConversation(this.selectedConversationId);
      }
    } catch (err) {
      console.error('sendReply error', err);
    }
  }

  async sendToWebhook(messageData) {
    try {
      const webhookUrl = 'https://autopostfb.duckdns.org/webhook-test/admin-reply';
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversation_id: messageData.conversation_id,
          message_text: messageData.message_text,
          sender_id: messageData.sender_id,
          recipient_id: messageData.recipient_id,
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        console.warn('Webhook response not OK:', response.status);
      } else {
        console.log('Message sent to webhook successfully');
      }
    } catch (err) {
      console.error('sendToWebhook error:', err);
    }
  }

  async notifyAdminTakeover(conversationId) {
    try {
      // Update conversation tracking table to mark admin is handling
      await supabase
        .from('conversation_tracking')
        .upsert({
          conversation_id: conversationId,
          last_admin_reply: new Date().toISOString(),
          admin_active: true,
          bot_paused: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'conversation_id' });
    } catch (err) {
      console.warn('notifyAdminTakeover error', err);
    }
  }

  setupRealtime() {
    try {
      this.channel = supabase
        .channel('public:messages_inbox')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
          // update local cache according to event
          if (payload.eventType === 'INSERT') {
            const n = payload.new;
            this.messages.unshift({
              ...n,
              _sender_norm: normalizeId(n.sender_id),
              _recipient_norm: normalizeId(n.recipient_id),
              _is_from_page: isPageSender(n.sender_id),
              _direction_norm: n.direction || (isPageSender(n.sender_id) ? 'outbound' : 'inbound')
            });
          } else if (payload.eventType === 'UPDATE') {
            const n = payload.new;
            this.messages = this.messages.map(m => (m.id === n.id ? {
              ...n,
              _sender_norm: normalizeId(n.sender_id),
              _recipient_norm: normalizeId(n.recipient_id),
              _is_from_page: isPageSender(n.sender_id),
              _direction_norm: n.direction || (isPageSender(n.sender_id) ? 'outbound' : 'inbound')
            } : m));
          } else if (payload.eventType === 'DELETE') {
            this.messages = this.messages.filter(m => m.id !== payload.old.id);
          }
          this.buildConversations();
          // if a conversation is open, refresh its messages
          if (this.selectedConversationId) this.selectConversation(this.selectedConversationId);
        })
        .subscribe();
    } catch (err) {
      console.warn('setupRealtime failed', err);
    }
  }

  open() {
    const panel = this.shadowRoot.querySelector('.inbox-panel');
    if (panel) panel.style.display = 'block';
  }

  close() {
    const panel = this.shadowRoot.querySelector('.inbox-panel');
    if (panel) panel.style.display = 'none';
  }
}

customElements.define('app-inbox', InboxComponent);
