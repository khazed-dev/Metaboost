// Facebook Graph API helper
// Yêu cầu: Page Access Token để lấy thông tin user

const FB_PAGE_ACCESS_TOKEN = 'EAAZAmeBmEFmIBPw4fLsBJKa0IVZC9wG3XENKBV4dCBMC2ZCu2jfJwEDAqIEppHYFdUwJ9tteuagBglEf6zEiX1SakTJNHE8E7Iu1uTRImHBZCfeUbMzwx62uU9bVZAJwGWAz5EJiZC5tHgkwNshBzFQh0virkCoJ2KJqkUl5WmrR709ZBa5h3VmK5UtdI95m6xmh7YXYpjHSsbZAyWdjjnEZD';

// Cache để tránh gọi API nhiều lần
const profileCache = new Map();

/**
 * Lấy thông tin profile từ Facebook Graph API
 * @param {string} userId - Facebook user ID (PSID)
 * @returns {Promise<{name: string, profile_pic: string, id: string}>}
 */
export async function getFacebookProfile(userId) {
  if (!userId) return null;
  
  // Check cache first
  if (profileCache.has(userId)) {
    return profileCache.get(userId);
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${userId}?fields=name,profile_pic&access_token=${FB_PAGE_ACCESS_TOKEN}`
    );
    
    if (!response.ok) {
      console.warn(`Failed to fetch Facebook profile for ${userId}:`, response.status);
      return null;
    }

    const data = await response.json();
    
    if (data.error) {
      console.warn('Facebook API error:', data.error);
      return null;
    }

    const profile = {
      id: userId,
      name: data.name || userId,
      profile_pic: data.profile_pic || getDefaultAvatar(userId)
    };

    // Cache kết quả
    profileCache.set(userId, profile);
    
    return profile;
  } catch (err) {
    console.error('Error fetching Facebook profile:', err);
    return null;
  }
}

/**
 * Lấy nhiều profiles cùng lúc (batch request)
 * @param {string[]} userIds - Array of Facebook user IDs
 * @returns {Promise<Map<string, {name: string, profile_pic: string}>>}
 */
export async function getFacebookProfiles(userIds) {
  const uncachedIds = userIds.filter(id => !profileCache.has(id));
  
  if (uncachedIds.length === 0) {
    // Tất cả đã có trong cache
    const results = new Map();
    userIds.forEach(id => results.set(id, profileCache.get(id)));
    return results;
  }

  try {
    // Batch request (lấy tối đa 50 users mỗi lần)
    const batchSize = 50;
    const batches = [];
    
    for (let i = 0; i < uncachedIds.length; i += batchSize) {
      batches.push(uncachedIds.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const ids = batch.join(',');
      const response = await fetch(
        `https://graph.facebook.com/v18.0/?ids=${ids}&fields=name,profile_pic&access_token=${FB_PAGE_ACCESS_TOKEN}`
      );

      if (response.ok) {
        const data = await response.json();
        
        for (const [userId, userData] of Object.entries(data)) {
          if (!userData.error) {
            const profile = {
              id: userId,
              name: userData.name || userId,
              profile_pic: userData.profile_pic || getDefaultAvatar(userId)
            };
            profileCache.set(userId, profile);
          }
        }
      }
    }

    // Return all results (from cache)
    const results = new Map();
    userIds.forEach(id => {
      results.set(id, profileCache.get(id) || {
        id,
        name: id,
        profile_pic: getDefaultAvatar(id)
      });
    });
    
    return results;
  } catch (err) {
    console.error('Error in batch fetch:', err);
    return new Map();
  }
}

/**
 * Avatar mặc định nếu không lấy được từ Facebook
 */
function getDefaultAvatar(userId) {
  // UI Avatars - tạo avatar từ tên/ID
  const initial = userId ? userId.substring(0, 2).toUpperCase() : '??';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=0D8ABC&color=fff&size=128`;
}

/**
 * Clear cache (dùng khi cần refresh)
 */
export function clearProfileCache() {
  profileCache.clear();
}
