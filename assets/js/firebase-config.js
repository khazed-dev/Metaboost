// ✅ Import SDK trực tiếp từ CDN Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-analytics.js";

// ✅ Cấu hình Firebase (copy đúng từ console)
const firebaseConfig = {
  apiKey: "AIzaSyB4IPPNSrWaGGqNFMslo6mSbDLdzSR757U",
  authDomain: "autoposter-635e1.firebaseapp.com",
  projectId: "autoposter-635e1",
  storageBucket: "autoposter-635e1.appspot.com",
  messagingSenderId: "492226816129",
  appId: "1:492226816129:web:4c0b88711caaec538ac580",
  measurementId: "G-3NW76QPJJS"
};

// ✅ Khởi tạo Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
