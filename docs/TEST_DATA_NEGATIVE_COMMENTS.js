/**
 * Test Data für Negative Comments
 * 
 * Sample document structure to insert into Firestore collection 'comments_negative'
 * Use Firebase Console or Admin SDK to populate test data
 */

// Document 1: Critical Complaint - High Priority
{
  "commentId": "cmt_001",
  "postId": "post_001",
  "pageId": "page_001",
  "customerMessage": "Sản phẩm này là FAKE! Tôi đã bị lừa, chất lượng rất tệ, không giống hình ảnh quảng cáo. Yêu cầu hoàn lại tiền ngay!",
  "botReply": "Xin lỗi vì sự cố này. Vui lòng liên hệ với chúng tôi để được hỗ trợ xử lý nhanh nhất.",
  "sentiment": "negative",
  "severity": "critical",
  "intent": "complaint",
  "isUrgent": true,
  "fromId": "123456789",
  "fromName": "Nguyễn Văn A",
  "createdAt": "2025-11-28T10:15:30.000Z",
  "processed": true
}

// Document 2: High Severity - Technical Issue Question
{
  "commentId": "cmt_002",
  "postId": "post_002",
  "pageId": "page_002",
  "customerMessage": "Ứng dụng của bạn đột nhiên crash sau bản cập nhật. Làm thế nào để fix? Rất bực bội với điều này!",
  "botReply": "Xin lỗi vì sự cố này. Chúng tôi đã xác nhận lỗi và sẽ patch trong bản cập nhật tiếp theo.",
  "sentiment": "negative",
  "severity": "high",
  "intent": "question",
  "isUrgent": false,
  "fromId": "987654321",
  "fromName": "Trần Thị B",
  "createdAt": "2025-11-28T09:45:15.000Z",
  "processed": true
}

// Document 3: Medium Severity - Suggestion (masked as complaint)
{
  "commentId": "cmt_003",
  "postId": "post_003",
  "pageId": "page_001",
  "customerMessage": "Giá quá đắt so với các đối thủ. Tại sao không giảm giá? Rất buồn khi phải mua nơi khác.",
  "botReply": "Cảm ơn góp ý. Chúng tôi sẽ xem xét điều chỉnh giá cho phù hợp hơn.",
  "sentiment": "negative",
  "severity": "medium",
  "intent": "suggestion",
  "isUrgent": false,
  "fromId": "555555555",
  "fromName": "Lê Minh C",
  "createdAt": "2025-11-28T08:30:00.000Z",
  "processed": true
}

// Document 4: Critical - Payment Issue
{
  "commentId": "cmt_004",
  "postId": "post_004",
  "pageId": "page_003",
  "customerMessage": "Đã thanh toán nhưng không nhận được sản phẩm sau 2 tuần! Đây là lừa đảo sao? Tôi sẽ báo cảnh sát!",
  "botReply": "Vui lòng cung cấp số đơn hàng để chúng tôi kiểm tra ngay.",
  "sentiment": "negative",
  "severity": "critical",
  "intent": "complaint",
  "isUrgent": true,
  "fromId": "111111111",
  "fromName": "Phạm Quốc D",
  "createdAt": "2025-11-27T15:20:45.000Z",
  "processed": true
}

// Document 5: High Severity - Service Quality Complaint
{
  "commentId": "cmt_005",
  "postId": "post_005",
  "pageId": "page_002",
  "customerMessage": "Dịch vụ khách hàng rất tệ! Gọi cả tiếng mà không ai trả lời. Công ty này không chuyên nghiệp chút nào!",
  "botReply": "Chúng tôi xin lỗi vì chậm trễ trong phản hồi. Vui lòng để lại thông tin liên hệ.",
  "sentiment": "negative",
  "severity": "high",
  "intent": "complaint",
  "isUrgent": true,
  "fromId": "222222222",
  "fromName": "Võ Thị E",
  "createdAt": "2025-11-27T14:10:20.000Z",
  "processed": true
}

// Document 6: Medium - General Dissatisfaction (can be resolved)
{
  "commentId": "cmt_006",
  "postId": "post_001",
  "pageId": "page_001",
  "customerMessage": "Không hài lòng với bao bì, rất đơn giản. Nhưng sản phẩm bên trong tốt.",
  "botReply": "Cảm ơn phản hồi. Chúng tôi sẽ cải thiện bao bì để tốt hơn.",
  "sentiment": "negative",
  "severity": "medium",
  "intent": "suggestion",
  "isUrgent": false,
  "fromId": "333333333",
  "fromName": "Đỗ Văn F",
  "createdAt": "2025-11-27T12:00:00.000Z",
  "processed": true
}

/**
 * HOW TO INSERT TEST DATA
 * 
 * Option 1: Firebase Console (Manual)
 * 1. Go to: console.firebase.google.com
 * 2. Select your project
 * 3. Firestore Database → Collections
 * 4. Create collection: comments_negative
 * 5. Add documents manually with above data
 * 
 * Option 2: Firebase Admin SDK (Recommended)
 * 
 * const admin = require('firebase-admin');
 * const serviceAccount = require('./serviceAccountKey.json');
 * 
 * admin.initializeApp({
 *   credential: admin.credential.cert(serviceAccount),
 * });
 * 
 * const db = admin.firestore();
 * 
 * const testData = [
 *   { commentId: 'cmt_001', ... },
 *   { commentId: 'cmt_002', ... },
 * ];
 * 
 * async function insertTestData() {
 *   const batch = db.batch();
 *   testData.forEach((doc) => {
 *     const docRef = db.collection('comments_negative').doc(doc.commentId);
 *     batch.set(docRef, doc);
 *   });
 *   await batch.commit();
 *   console.log('Test data inserted!');
 * }
 * 
 * insertTestData();
 * 
 * Option 3: Using Browser Console (if authenticated)
 * 
 * import { db } from './firebase-config.js';
 * import { collection, addDoc } from 'firebase/firestore';
 * 
 * const testDocs = [ ... ];
 * 
 * for (let doc of testDocs) {
 *   await addDoc(collection(db, 'comments_negative'), doc);
 * }
 * 
 * console.log('All test data added!');
 * 
 * ===== QUERY EXAMPLES =====
 * 
 * // Get all critical comments
 * db.collection('comments_negative')
 *   .where('severity', '==', 'critical')
 *   .where('processed', '==', true)
 *   .orderBy('createdAt', 'desc')
 *   .limit(10)
 *   .get()
 * 
 * // Get by date range
 * db.collection('comments_negative')
 *   .where('createdAt', '>=', '2025-11-27T00:00:00.000Z')
 *   .where('createdAt', '<=', '2025-11-28T23:59:59.999Z')
 *   .where('processed', '==', true)
 *   .get()
 * 
 * // Get by intent type
 * db.collection('comments_negative')
 *   .where('intent', '==', 'complaint')
 *   .where('processed', '==', true)
 *   .orderBy('createdAt', 'desc')
 *   .get()
 * 
 * ===== DELETION TEST =====
 * 
 * // Test delete comment via API
 * fetch('https://my-n8n.com/webhook/delete-comment', {
 *   method: 'DELETE',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     commentId: 'cmt_001',
 *     postId: 'post_001',
 *     pageId: 'page_001'
 *   })
 * })
 * .then(res => res.json())
 * .then(data => console.log('Deleted:', data))
 * .catch(err => console.error('Error:', err))
 */
