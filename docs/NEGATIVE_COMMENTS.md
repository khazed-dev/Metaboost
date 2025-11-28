# Negative Comments Management System

## 📋 Tổng quan

Hệ thống quản lý comment tiêu cực tích hợp Firestore realtime, ngôn ngữ tự nhiên xử lý (sentiment analysis), và API n8n cho xóa comments.

## 🎯 Tính năng chính

### 1. **Realtime Data Sync**
- Kết nối Firestore collection `comments_negative` realtime
- Tự động cập nhật khi có comment mới được xử lý (`processed: true`)
- Listening on all documents with `processed: true`

### 2. **Advanced Filtering**
- **Search**: Tìm kiếm theo tên người dùng hoặc nội dung comment
- **Severity Filter**: Lọc theo mức độ (Medium, High, Critical)
- **Intent Filter**: Lọc theo ý định (Phàn nàn, Câu hỏi, Đề xuất, Khác)
- Bộ lọc kết hợp hoạt động cùng lúc

### 3. **Statistics Dashboard**
- Hiển thị 3 stat cards:
  - 🔴 **Critical**: Số lượng comment nghiêm trọng
  - 🟠 **High**: Số lượng comment mức cao
  - 🟡 **Medium**: Số lượng comment mức trung bình
- Update realtime khi data thay đổi

### 4. **Rich Table Display**
Các cột hiển thị:

| Cột | Mô tả | Tính năng |
|-----|-------|----------|
| Avatar | Ảnh đại diện từ Facebook Graph API | Click mở profile Facebook |
| Tên người dùng | Tên từ field `fromName` | Hover xem tooltip full name |
| Nội dung Comment | Customer message (truncated) | 2 dòng, ellipsis nếu dài |
| Phản hồi Bot | Bot reply message (truncated) | 2 dòng, ellipsis nếu dài |
| Sentiment | Negative/Neutral/Positive | Badge có màu |
| Mức độ | Severity badge | Color-coded: Red/Orange/Yellow |
| Ý định | Intent badge | Emoji + label |
| Ngày | Formatted date/time | Relative: "Today HH:MM", "Yesterday", "DD/MM/YYYY" |
| Hành động | Delete button | Click → Xác nhận → Call API |

### 5. **Smart Badges**

#### Severity Badges
```
Critical (Mức độ: critical) → 🔴 RED (#e74c3c)
High (Mức độ: high) → 🟠 ORANGE (#f39c12)
Medium (Mức độ: medium) → 🟡 YELLOW (#f1c40f)
```

#### Sentiment Badges
```
Negative → Red (#e74c3c)
Neutral → Blue (#3498db)
Positive → Green (#27ae60)
```

#### Intent Badges
```
complaint → 📢 Phàn nàn
question → ❓ Câu hỏi
suggestion → 💡 Đề xuất
other → 📝 Khác
```

### 6. **Delete Confirmation**
- Modal confirmation trước khi xóa
- Preview nội dung comment
- Xác nhận bằng nút "Xóa"
- Cannot be undone

### 7. **n8n Webhook Integration**
DELETE API endpoint: `https://my-n8n.com/webhook/delete-comment`

**Request Format:**
```json
{
  "method": "DELETE",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "commentId": "string",
    "postId": "string",
    "pageId": "string"
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

### 8. **Avatar Handling**
- **Primary**: Facebook Graph API: `https://graph.facebook.com/{fromId}/picture?type=normal`
- **Fallback**: Initials avatar (gradient background) với 2 ký tự đầu của tên
- Automatic fallback nếu fromId invalid

## 📊 Data Structure

### Firestore Collection: `comments_negative`

```javascript
{
  commentId: string,           // Unique comment ID
  postId: string,              // Post ID (for API delete)
  pageId: string,              // Page ID (for API delete)
  customerMessage: string,     // Original comment text
  botReply: string,            // Automated bot response
  sentiment: string,           // "negative" | "neutral" | "positive"
  severity: string,            // "medium" | "high" | "critical"
  intent: string,              // "complaint" | "question" | "suggestion" | "other"
  isUrgent: boolean,           // Priority flag
  fromId: string,              // Facebook User ID
  fromName: string,            // User display name
  createdAt: string,           // ISO 8601 timestamp
  processed: boolean           // Only show if true
}
```

## 🔧 File Structure

```
src/
├── pages/
│   └── negative-comments.html          # Main UI markup
├── assets/
│   ├── css/
│   │   └── negative-comments.css       # Component styling (1000+ lines)
│   ├── js/
│   │   ├── negative-comments.js        # Main logic (400+ lines)
│   │   ├── sidebar.component.js        # Navigation (updated with new route)
│   │   └── firebase-config.js          # Firebase initialization
```

## 🚀 Installation & Setup

### 1. Firebase Configuration
Ensure `src/assets/js/firebase-config.js` exports `db` object:

```javascript
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';

const firebaseConfig = {
  // Your config...
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

### 2. n8n Webhook Setup
Configure your n8n workflow to:
1. **Trigger**: HTTP Delete method
2. **Input**: JSON body with commentId, postId, pageId
3. **Process**: Your deletion logic (delete from Firestore, Facebook, etc.)
4. **Response**: HTTP 200 OK with success message

### 3. Firestore Security Rules
```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /comments_negative/{document=**} {
      allow read: if request.auth != null;  // Authenticated users only
      allow delete: if false;               // Only via n8n API
    }
  }
}
```

### 4. Facebook Graph API
Ensure your app has permissions for:
- `user_picture` - Access user profile picture

## 🎨 Styling Customization

### Color Scheme
- **Primary**: #3498db (Blue)
- **Success**: #27ae60 (Green)
- **Warning**: #f39c12 (Orange)
- **Danger**: #e74c3c (Red)
- **Background**: #f5f7fa → #c3cfe2 (gradient)

### Responsive Breakpoints
```css
1024px - Tablet adjustments
768px - Mobile layout
480px - Small mobile optimization
```

### CSS Variables
Edit in sidebar styles (if needed):
```css
--sidebar-width: 240px
--sidebar-bg: #0d1026
--text-color: #c5cae9
```

## 📱 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ⚠️ IE 11 (not supported - ES6+ required)

## 🔐 Security Considerations

1. **Frontend Validation**: Always sanitize HTML output (using `sanitizeHTML()`)
2. **API Calls**: Only DELETE to n8n endpoint, no direct Firestore deletes
3. **Authentication**: Requires authenticated Firebase session
4. **Rate Limiting**: Implement on n8n side for DELETE operations
5. **Audit Logs**: Log all deletions via n8n for compliance

## 🐛 Debugging

### Console Access
Open browser DevTools (F12):

```javascript
// Access state
DEBUG.allComments           // All loaded comments
DEBUG.filteredComments      // Current filtered results
DEBUG.selectedCommentForDelete // Currently selected for deletion

// Manual actions
DEBUG.loadNegativeComments()  // Force reload
DEBUG.showToast('Message', 'success')  // Show notification
```

### Common Issues

**Issue: Comments not loading**
- Check Firestore collection `comments_negative` exists
- Verify `processed: true` filter is working
- Check browser console for Firebase errors

**Issue: Avatar not showing**
- Verify `fromId` is valid Facebook User ID
- Check Facebook Graph API permissions
- Fallback initials should always appear

**Issue: Delete button not working**
- Verify n8n webhook URL is correct
- Check CORS headers: `Access-Control-Allow-Origin: *`
- Monitor n8n logs for webhook hits

**Issue: Filters not working**
- Clear browser cache
- Reload page
- Check console for JavaScript errors

## 📈 Performance Tips

1. **Limit Initial Load**: Use query `where('processed', '==', true)` to reduce documents
2. **Pagination**: Consider adding pagination for 1000+ comments
3. **Virtual Scrolling**: Use virtual scroll library for large tables
4. **Search Debouncing**: Already implemented 300ms debounce on search
5. **Batch Operations**: Implement batch delete for multiple comments

## 🔄 Realtime Listener Lifecycle

```javascript
onSnapshot(
  query(collection(db, 'comments_negative'), where('processed', '==', true)),
  (snapshot) => {
    // Triggered on:
    // - Initial load
    // - Document added
    // - Document modified
    // - Document deleted
  },
  (error) => {
    // Handle errors
  }
);
```

## 🎯 Next Steps / Enhancement Ideas

1. **Batch Delete**: Select multiple comments, delete together
2. **Bulk Actions**: Mark as resolved, export to CSV
3. **Analytics**: Charts showing sentiment trends, severity distribution
4. **Automation**: Auto-delete rules (e.g., old comments, specific keywords)
5. **Integration**: Slack notifications for critical comments
6. **Reply System**: Direct reply to comments from UI
7. **Comment Threading**: Show context of full conversation
8. **AI Suggestions**: Auto-suggest responses using AI

## 📞 Support

For issues or questions:
1. Check console for errors (F12)
2. Verify Firestore data structure
3. Test n8n webhook separately (use Postman)
4. Check browser Network tab for API calls
5. Review Firebase rules and permissions

---

**Last Updated**: 2025-11-28  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
