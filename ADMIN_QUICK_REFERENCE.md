# 🎯 Admin Backend - Quick Reference

## 🚀 What's New?

Your MyLearnHub Backend has been **extended with 33 new admin endpoints** to support your complete admin panel!

---

## 📊 Feature Overview

| Feature | Endpoints | What It Does |
|---------|-----------|--------------|
| **Dashboard** | 3 | Stats, activity, metrics for admin dashboard |
| **User Management** | 6 | Complete user CRUD, suspend, stats |
| **Analytics** | 5 | Revenue, users, courses, enrollments analytics |
| **Notifications** | 6 | Create, send, schedule notifications |
| **Content** | 8 | Manage videos, PDFs, images, documents |
| **Settings** | 5 | User preferences and settings management |

**Total: 33 New Endpoints + 4 New Models!**

---

## 🎯 Mapping Your Admin Screens to Backend

### 1. **AdminDashboard.jsx** → Dashboard Endpoints

```javascript
// Get overview stats (Total users, courses, enrollments, revenue)
GET /api/admin/dashboard/stats

// Get recent activity feed
GET /api/admin/dashboard/activity?limit=10

// Get performance metrics (Active users, completion rate, etc.)
GET /api/admin/dashboard/metrics
```

**What You Get:**
- Total users, courses, enrollments, revenue
- Growth rates (users, enrollments, revenue)
- Recent activity feed (enrollments, new users, new courses)
- Active users, completion rate, average rating, retention rate
- Popular courses list

---

### 2. **UserManagement.jsx** → User Management Endpoints

```javascript
// Get all users with search and filters
GET /api/admin/users?search=john&role=user&page=1&limit=10

// Get user details with enrollments
GET /api/admin/users/:id

// Update user (name, email, role, status)
PUT /api/admin/users/:id

// Suspend/unsuspend user
PATCH /api/admin/users/:id/suspend

// Delete user
DELETE /api/admin/users/:id

// Get user statistics
GET /api/admin/users/stats
```

**What You Get:**
- User list with pagination
- Search by name/email
- Filter by role (user/admin) and status (active/inactive)
- User details with enrollment count
- User enrollments list
- User statistics and trends

---

### 3. **CourseManagement.jsx** → Course Endpoints (Already Exists)

```javascript
// These endpoints already existed
GET    /api/admin/courses
POST   /api/admin/courses
GET    /api/admin/courses/:id
PUT    /api/admin/courses/:id
DELETE /api/admin/courses/:id
```

**What You Get:**
- All courses (including drafts)
- Course CRUD operations
- Course status management

---

### 4. **Analytics.jsx** → Analytics Endpoints

```javascript
// Get analytics overview
GET /api/admin/analytics/overview?period=30

// Get revenue analytics
GET /api/admin/analytics/revenue?period=30

// Get user analytics
GET /api/admin/analytics/users?period=30

// Get course analytics
GET /api/admin/analytics/courses?period=30

// Get enrollment analytics
GET /api/admin/analytics/enrollments?period=30
```

**Period Options:** 7, 30, 90, 365 (days)

**What You Get:**
- Revenue by date and category
- User growth trends
- Top courses by enrollment and revenue
- Enrollment trends and completion stats
- Average order value

---

### 5. **ContentManagement.jsx** → Content Endpoints

```javascript
// Get all content (videos, PDFs, images, etc.)
GET /api/admin/content?type=video&status=published

// Create new content
POST /api/admin/content

// Get content by ID
GET /api/admin/content/:id

// Update content
PUT /api/admin/content/:id

// Delete content
DELETE /api/admin/content/:id

// Get content statistics
GET /api/admin/content/stats

// Increment views
POST /api/admin/content/:id/view

// Increment downloads
POST /api/admin/content/:id/download
```

**Content Types:** video, pdf, image, audio, document, other  
**Content Status:** draft, processing, published, archived

**What You Get:**
- Content library with filters
- Content details (size, duration, views, downloads)
- Upload and manage content
- Storage statistics

---

### 6. **Notifications.jsx** → Notification Endpoints

```javascript
// Get all notifications
GET /api/admin/notifications?status=sent&type=course

// Create notification
POST /api/admin/notifications

// Get notification by ID
GET /api/admin/notifications/:id

// Update notification (draft/scheduled only)
PUT /api/admin/notifications/:id

// Delete notification
DELETE /api/admin/notifications/:id

// Get notification statistics
GET /api/admin/notifications/stats
```

**Notification Types:** course, system, assignment, general, announcement  
**Target Audience:** all, students, instructors, premium, specific

**Example Create Notification:**
```json
{
  "title": "New Course Available",
  "message": "Check out our new React course!",
  "type": "course",
  "targetAudience": "all",
  "priority": "high",
  "scheduledFor": "2025-01-16T10:00:00.000Z"
}
```

---

### 7. **Settings.jsx** → Settings Endpoints

```javascript
// Get all users' settings
GET /api/admin/settings

// Get user settings
GET /api/admin/settings/:userId

// Update user settings
PUT /api/admin/settings/:userId

// Reset user settings to default
POST /api/admin/settings/:userId/reset

// Get settings statistics
GET /api/admin/settings/stats
```

**What You Get:**
- Notification preferences (email, push, SMS)
- Privacy settings (profile visibility, data sharing)
- User preferences (language, timezone, dark mode)
- Security settings (2FA, login alerts, session timeout)

---

## 🔐 Authentication

All admin endpoints require:
1. JWT token in `Authorization` header
2. User role must be `admin`

```javascript
// Example API call
const response = await fetch('http://localhost:5000/api/admin/dashboard/stats', {
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  }
});
```

---

## 📱 Frontend Integration Examples

### Dashboard Stats
```javascript
import { adminService } from './services/adminService';

const fetchDashboardStats = async () => {
  try {
    const response = await adminService.getDashboardStats();
    setStats(response.stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
  }
};
```

### User Management
```javascript
// Get all users with search
const fetchUsers = async (search, page = 1) => {
  const response = await adminService.getUsers({ search, page, limit: 10 });
  setUsers(response.users);
  setTotalPages(response.pages);
};

// Suspend user
const suspendUser = async (userId) => {
  await adminService.suspendUser(userId);
  // Refresh user list
  fetchUsers();
};
```

### Analytics
```javascript
// Get revenue analytics for last 30 days
const fetchRevenue = async () => {
  const response = await adminService.getRevenueAnalytics(30);
  setRevenueData(response.revenue);
};
```

### Notifications
```javascript
// Create and send notification
const sendNotification = async (notificationData) => {
  const response = await adminService.createNotification({
    title: notificationData.title,
    message: notificationData.message,
    type: notificationData.type,
    targetAudience: 'all',
    priority: 'high'
  });
  alert('Notification sent successfully!');
};
```

---

## 🗄️ New Database Models

### Enrollment
Tracks user course enrollments with progress

### Notification
Manages platform notifications to users

### Content
Stores course content (videos, PDFs, etc.)

### Settings
User preferences and settings

---

## 🎯 Quick Testing

### 1. Start Server
```bash
npm run dev
```

### 2. Login as Admin
```bash
curl -X POST http://localhost:5000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mylearnhub.com",
    "password": "Admin@123"
  }'
```

### 3. Test Dashboard
```bash
# Save token from login response
TOKEN="your_token_here"

# Get dashboard stats
curl http://localhost:5000/api/admin/dashboard/stats \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Test User Management
```bash
# Get all users
curl http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Test Analytics
```bash
# Get analytics overview for last 30 days
curl http://localhost:5000/api/admin/analytics/overview?period=30 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📖 Documentation Files

| File | Purpose |
|------|---------|
| **ADMIN_API_DOCUMENTATION.md** | Complete API reference for all 33 new endpoints |
| **EXTENDED_FEATURES_SUMMARY.md** | Detailed feature breakdown |
| **API_DOCUMENTATION.md** | Original API documentation |
| **INTEGRATION_GUIDE.md** | Frontend integration guide |

---

## ✅ Checklist for Your Admin Screens

### AdminDashboard.jsx
- [ ] Call `/admin/dashboard/stats` for overview cards
- [ ] Call `/admin/dashboard/activity` for activity feed
- [ ] Call `/admin/dashboard/metrics` for performance metrics
- [ ] Display growth rate indicators
- [ ] Show quick action buttons

### UserManagement.jsx
- [ ] Call `/admin/users` with search and filters
- [ ] Implement pagination
- [ ] Add user detail modal with `/admin/users/:id`
- [ ] Add suspend button calling `/admin/users/:id/suspend`
- [ ] Add delete button calling `DELETE /admin/users/:id`
- [ ] Show enrollment count badge

### Analytics.jsx
- [ ] Add period selector (7d, 30d, 90d, 1yr)
- [ ] Call `/admin/analytics/revenue?period=X` for revenue chart
- [ ] Call `/admin/analytics/users?period=X` for user growth chart
- [ ] Call `/admin/analytics/courses?period=X` for top courses
- [ ] Display revenue by category pie chart

### ContentManagement.jsx
- [ ] Call `/admin/content` with type and status filters
- [ ] Show content grid/list with thumbnails
- [ ] Display size, duration, views, downloads
- [ ] Add upload content form
- [ ] Call `/admin/content/stats` for storage info

### Notifications.jsx
- [ ] List notifications with `/admin/notifications`
- [ ] Add create notification form
- [ ] Implement target audience selector
- [ ] Add schedule date picker
- [ ] Show notification history
- [ ] Display send confirmation

### Settings.jsx
- [ ] Load user settings with `/admin/settings/:userId`
- [ ] Group by category (notifications, privacy, preferences, security)
- [ ] Add save button to update settings
- [ ] Add reset button to restore defaults

---

## 🚀 You're Ready!

Your backend now supports **ALL** the features your admin panel needs:

✅ Dashboard Statistics  
✅ User Management (CRUD)  
✅ Analytics & Reports  
✅ Notifications System  
✅ Content Management  
✅ Settings Management  

**Start integrating with your React Native admin screens now!** 🎉

---

## 📞 Quick Reference

```
Base URL: http://localhost:5000/api/admin
Admin Login: admin@mylearnhub.com / Admin@123

Dashboard:     /admin/dashboard/*
Users:         /admin/users/*
Analytics:     /admin/analytics/*
Notifications: /admin/notifications/*
Content:       /admin/content/*
Settings:      /admin/settings/*
```

**Total: 44 API Endpoints | 6 Models | 100% Complete!** 🎊

