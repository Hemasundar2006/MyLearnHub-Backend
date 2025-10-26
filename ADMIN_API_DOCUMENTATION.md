```markdown
# 🎯 Admin API Documentation - Extended

Complete API reference for MyLearnHub Backend Admin Management System

## Base URL
```
http://localhost:5000/api/admin
```

## Authentication
All admin routes require JWT token with admin role:
```
Authorization: Bearer <admin_jwt_token>
```

---

## 📊 Dashboard Endpoints

### 1. Get Dashboard Statistics
**Endpoint:** `GET /api/admin/dashboard/stats`

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 150,
    "totalCourses": 25,
    "totalEnrollments": 450,
    "totalRevenue": 567000,
    "usersThisMonth": 25,
    "coursesThisMonth": 3,
    "enrollmentsThisMonth": 78,
    "revenueThisMonth": 89000,
    "growthRates": {
      "users": 15.5,
      "enrollments": 22.3,
      "revenue": 18.7
    }
  }
}
```

---

### 2. Get Recent Activity
**Endpoint:** `GET /api/admin/dashboard/activity`

**Query Parameters:**
- `limit` (optional): Number of activity items (default: 10)

**Response (200):**
```json
{
  "success": true,
  "count": 10,
  "activity": [
    {
      "type": "enrollment",
      "message": "John Doe enrolled in React Masterclass",
      "user": {
        "id": "...",
        "name": "John Doe",
        "avatar": "..."
      },
      "timestamp": "2025-01-15T10:30:00.000Z",
      "icon": "book"
    },
    {
      "type": "user",
      "message": "Jane Smith joined the platform",
      "user": {...},
      "timestamp": "2025-01-15T09:15:00.000Z",
      "icon": "user"
    }
  ]
}
```

---

### 3. Get Performance Metrics
**Endpoint:** `GET /api/admin/dashboard/metrics`

**Response (200):**
```json
{
  "success": true,
  "metrics": {
    "activeUsers": 89,
    "completionRate": 78.5,
    "averageRating": 4.7,
    "retentionRate": 65.2,
    "popularCourses": [
      {
        "title": "React Masterclass",
        "enrolledCount": 250,
        "rating": 4.8
      }
    ]
  }
}
```

---

## 👥 User Management Endpoints

### 4. Get All Users
**Endpoint:** `GET /api/admin/users`

**Query Parameters:**
- `search` (optional): Search by name or email
- `role` (optional): Filter by role (user/admin)
- `status` (optional): Filter by status (active/inactive)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 10)

**Example:** `GET /api/admin/users?search=john&role=user&page=1&limit=10`

**Response (200):**
```json
{
  "success": true,
  "count": 10,
  "total": 150,
  "page": 1,
  "pages": 15,
  "users": [
    {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "...",
      "role": "user",
      "isActive": true,
      "createdAt": "2025-01-10T08:00:00.000Z",
      "enrollmentCount": 5
    }
  ]
}
```

---

### 5. Get User by ID
**Endpoint:** `GET /api/admin/users/:id`

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "...",
    "role": "user",
    "isActive": true,
    "createdAt": "2025-01-10T08:00:00.000Z",
    "enrollments": [
      {
        "course": {
          "title": "React Masterclass",
          "image": "...",
          "price": 4500
        },
        "enrolledAt": "2025-01-12T10:00:00.000Z",
        "status": "active",
        "progress": 45
      }
    ],
    "enrollmentCount": 5
  }
}
```

---

### 6. Update User
**Endpoint:** `PUT /api/admin/users/:id`

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "john.smith@example.com",
  "role": "admin",
  "isActive": true
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "name": "John Smith",
    "email": "john.smith@example.com",
    "role": "admin",
    "isActive": true,
    "avatar": "..."
  },
  "message": "User updated successfully"
}
```

---

### 7. Delete User
**Endpoint:** `DELETE /api/admin/users/:id`

**Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": {}
}
```

---

### 8. Suspend/Unsuspend User
**Endpoint:** `PATCH /api/admin/users/:id/suspend`

**Response (200):**
```json
{
  "success": true,
  "message": "User suspended successfully",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "isActive": false
  }
}
```

---

### 9. Get User Statistics
**Endpoint:** `GET /api/admin/users/stats`

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 150,
    "activeUsers": 145,
    "suspendedUsers": 5,
    "adminUsers": 3,
    "regularUsers": 147,
    "usersByMonth": [
      {
        "_id": { "year": 2025, "month": 1 },
        "count": 25
      }
    ]
  }
}
```

---

## 📈 Analytics Endpoints

### 10. Get Analytics Overview
**Endpoint:** `GET /api/admin/analytics/overview`

**Query Parameters:**
- `period` (optional): Number of days (default: 30)

**Example:** `GET /api/admin/analytics/overview?period=7`

**Response (200):**
```json
{
  "success": true,
  "period": "7 days",
  "analytics": {
    "revenue": 45000,
    "newUsers": 15,
    "newEnrollments": 45,
    "activeCourses": 3
  }
}
```

---

### 11. Get Revenue Analytics
**Endpoint:** `GET /api/admin/analytics/revenue`

**Query Parameters:**
- `period` (optional): Number of days (default: 30)

**Response (200):**
```json
{
  "success": true,
  "revenue": {
    "total": 567000,
    "average": "7600.00",
    "byDate": {
      "2025-01-15": 15000,
      "2025-01-14": 12000
    },
    "byCategory": {
      "Web Development": 250000,
      "Data Science": 150000
    },
    "transactions": 450
  }
}
```

---

### 12. Get User Analytics
**Endpoint:** `GET /api/admin/analytics/users`

**Query Parameters:**
- `period` (optional): Number of days (default: 30)

**Response (200):**
```json
{
  "success": true,
  "users": {
    "newUsers": 25,
    "activeUsers": 89,
    "retentionRate": "65.20",
    "byDate": {
      "2025-01-15": 3,
      "2025-01-14": 2
    }
  }
}
```

---

### 13. Get Course Analytics
**Endpoint:** `GET /api/admin/analytics/courses`

**Query Parameters:**
- `period` (optional): Number of days (default: 30)

**Response (200):**
```json
{
  "success": true,
  "courses": {
    "topByEnrollment": [
      {
        "title": "React Masterclass",
        "enrolledCount": 250,
        "rating": 4.8,
        "price": 4500
      }
    ],
    "topByRevenue": [
      {
        "course": {
          "title": "React Masterclass",
          "price": 4500
        },
        "enrollments": 250,
        "revenue": 1125000
      }
    ],
    "completionStats": {
      "active": 320,
      "completed": 98,
      "dropped": 32
    }
  }
}
```

---

### 14. Get Enrollment Analytics
**Endpoint:** `GET /api/admin/analytics/enrollments`

**Query Parameters:**
- `period` (optional): Number of days (default: 30)

**Response (200):**
```json
{
  "success": true,
  "enrollments": {
    "total": 450,
    "byDate": {
      "2025-01-15": 12,
      "2025-01-14": 8
    },
    "byStatus": [
      { "_id": "active", "count": 320 },
      { "_id": "completed", "count": 98 }
    ],
    "averageProgress": "52.50"
  }
}
```

---

## 🔔 Notifications Endpoints

### 15. Get All Notifications
**Endpoint:** `GET /api/admin/notifications`

**Query Parameters:**
- `status` (optional): Filter by status (draft/scheduled/sent/failed)
- `type` (optional): Filter by type (course/system/assignment/general)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 10)

**Response (200):**
```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "pages": 5,
  "notifications": [
    {
      "id": "...",
      "title": "New Course Available",
      "message": "Check out our new React course!",
      "type": "course",
      "targetAudience": "all",
      "priority": "medium",
      "status": "sent",
      "sentAt": "2025-01-15T10:00:00.000Z",
      "sentBy": {
        "name": "Admin User",
        "email": "admin@mylearnhub.com"
      }
    }
  ]
}
```

---

### 16. Create Notification
**Endpoint:** `POST /api/admin/notifications`

**Request Body:**
```json
{
  "title": "New Course Available",
  "message": "Check out our new React Native course!",
  "type": "course",
  "targetAudience": "all",
  "priority": "high",
  "scheduledFor": "2025-01-16T10:00:00.000Z",
  "link": "/courses/12345",
  "icon": "📚"
}
```

**Target Audience Options:**
- `all` - All users
- `students` - Only students (role: user)
- `instructors` - Only instructors
- `premium` - Premium users only
- `specific` - Specific users (provide targetUsers array)

**Response (201):**
```json
{
  "success": true,
  "notification": {
    "id": "...",
    "title": "New Course Available",
    "message": "Check out our new React Native course!",
    "type": "course",
    "status": "scheduled",
    "scheduledFor": "2025-01-16T10:00:00.000Z"
  },
  "message": "Notification scheduled successfully"
}
```

---

### 17. Get Notification by ID
**Endpoint:** `GET /api/admin/notifications/:id`

**Response (200):**
```json
{
  "success": true,
  "notification": {
    "id": "...",
    "title": "New Course Available",
    "message": "...",
    "type": "course",
    "targetAudience": "all",
    "targetUsers": [...],
    "sentBy": {...},
    "readBy": [...]
  }
}
```

---

### 18. Update Notification
**Endpoint:** `PUT /api/admin/notifications/:id`

**Note:** Can only update draft or scheduled notifications

**Request Body:**
```json
{
  "title": "Updated Title",
  "message": "Updated message",
  "scheduledFor": "2025-01-17T10:00:00.000Z"
}
```

**Response (200):**
```json
{
  "success": true,
  "notification": {...},
  "message": "Notification updated successfully"
}
```

---

### 19. Delete Notification
**Endpoint:** `DELETE /api/admin/notifications/:id`

**Response (200):**
```json
{
  "success": true,
  "message": "Notification deleted successfully",
  "data": {}
}
```

---

### 20. Get Notification Statistics
**Endpoint:** `GET /api/admin/notifications/stats`

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "total": 50,
    "sent": 40,
    "scheduled": 5,
    "draft": 5,
    "byType": [
      { "_id": "course", "count": 25 },
      { "_id": "system", "count": 15 }
    ],
    "averageReadRate": "65.50"
  }
}
```

---

## 📁 Content Management Endpoints

### 21. Get All Content
**Endpoint:** `GET /api/admin/content`

**Query Parameters:**
- `type` (optional): Filter by type (video/pdf/image/audio/document)
- `status` (optional): Filter by status (draft/processing/published/archived)
- `course` (optional): Filter by course ID
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 10)

**Response (200):**
```json
{
  "success": true,
  "count": 10,
  "total": 100,
  "page": 1,
  "pages": 10,
  "content": [
    {
      "id": "...",
      "title": "Introduction to React",
      "type": "video",
      "url": "https://...",
      "thumbnail": "https://...",
      "size": 52428800,
      "duration": "15:30",
      "status": "published",
      "downloads": 125,
      "views": 450,
      "course": {
        "title": "React Masterclass"
      },
      "uploadedBy": {
        "name": "Admin User"
      },
      "createdAt": "2025-01-10T08:00:00.000Z"
    }
  ]
}
```

---

### 22. Create Content
**Endpoint:** `POST /api/admin/content`

**Request Body:**
```json
{
  "title": "Introduction to React Hooks",
  "type": "video",
  "url": "https://example.com/video.mp4",
  "thumbnail": "https://example.com/thumb.jpg",
  "size": 52428800,
  "duration": "15:30",
  "description": "Learn about React Hooks",
  "course": "course_id_here",
  "status": "published",
  "tags": ["react", "hooks", "javascript"]
}
```

**Response (201):**
```json
{
  "success": true,
  "content": {...},
  "message": "Content created successfully"
}
```

---

### 23. Get Content by ID
**Endpoint:** `GET /api/admin/content/:id`

**Response (200):**
```json
{
  "success": true,
  "content": {
    "id": "...",
    "title": "Introduction to React",
    "type": "video",
    "url": "...",
    "size": 52428800,
    "duration": "15:30",
    "views": 450,
    "downloads": 125
  }
}
```

---

### 24. Update Content
**Endpoint:** `PUT /api/admin/content/:id`

**Request Body:**
```json
{
  "title": "Updated Title",
  "status": "archived"
}
```

**Response (200):**
```json
{
  "success": true,
  "content": {...},
  "message": "Content updated successfully"
}
```

---

### 25. Delete Content
**Endpoint:** `DELETE /api/admin/content/:id`

**Response (200):**
```json
{
  "success": true,
  "message": "Content deleted successfully",
  "data": {}
}
```

---

### 26. Get Content Statistics
**Endpoint:** `GET /api/admin/content/stats`

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "total": 100,
    "byType": [
      { "_id": "video", "count": 50, "totalSize": 5242880000 },
      { "_id": "pdf", "count": 30, "totalSize": 524288000 }
    ],
    "byStatus": [
      { "_id": "published", "count": 85 },
      { "_id": "draft", "count": 15 }
    ],
    "totalStorage": 5767168000,
    "totalViews": 12500,
    "totalDownloads": 3200
  }
}
```

---

### 27. Increment Content Views
**Endpoint:** `POST /api/admin/content/:id/view`

**Response (200):**
```json
{
  "success": true,
  "views": 451
}
```

---

### 28. Increment Content Downloads
**Endpoint:** `POST /api/admin/content/:id/download`

**Response (200):**
```json
{
  "success": true,
  "downloads": 126
}
```

---

## ⚙️ Settings Endpoints

### 29. Get User Settings
**Endpoint:** `GET /api/admin/settings/:userId`

**Response (200):**
```json
{
  "success": true,
  "settings": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "notifications": {
      "email": {
        "enabled": true,
        "courseUpdates": true,
        "newContent": true,
        "systemAlerts": true,
        "marketing": false
      },
      "push": {
        "enabled": true,
        "courseReminders": true,
        "assignments": true,
        "messages": true
      },
      "sms": {
        "enabled": false,
        "urgentOnly": true
      }
    },
    "privacy": {
      "profileVisibility": "students",
      "showEnrollments": true,
      "showProgress": true,
      "allowMessages": true,
      "dataSharing": false
    },
    "preferences": {
      "language": "en",
      "timezone": "UTC",
      "darkMode": false,
      "autoBackup": true,
      "emailDigest": "weekly"
    },
    "security": {
      "twoFactorEnabled": false,
      "loginAlerts": true,
      "sessionTimeout": 30
    }
  }
}
```

---

### 30. Update User Settings
**Endpoint:** `PUT /api/admin/settings/:userId`

**Request Body:**
```json
{
  "notifications": {
    "email": {
      "enabled": true,
      "courseUpdates": false
    }
  },
  "preferences": {
    "darkMode": true
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "settings": {...},
  "message": "Settings updated successfully"
}
```

---

### 31. Reset User Settings
**Endpoint:** `POST /api/admin/settings/:userId/reset`

**Response (200):**
```json
{
  "success": true,
  "settings": {...},
  "message": "Settings reset to default successfully"
}
```

---

### 32. Get All Settings
**Endpoint:** `GET /api/admin/settings`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 10)

**Response (200):**
```json
{
  "success": true,
  "count": 10,
  "total": 150,
  "page": 1,
  "pages": 15,
  "settings": [...]
}
```

---

### 33. Get Settings Statistics
**Endpoint:** `GET /api/admin/settings/stats`

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "total": 150,
    "darkModeUsers": 75,
    "twoFactorUsers": 45,
    "emailNotificationsEnabled": 140,
    "pushNotificationsEnabled": 130,
    "languageStats": [
      { "_id": "en", "count": 120 },
      { "_id": "es", "count": 30 }
    ],
    "privacyStats": [
      { "_id": "students", "count": 100 },
      { "_id": "public", "count": 30 },
      { "_id": "private", "count": 20 }
    ]
  }
}
```

---

## 🔒 Authentication Required

All endpoints require:
1. Valid JWT token in Authorization header
2. User role must be "admin"

**Example:**
```bash
curl -X GET http://localhost:5000/api/admin/dashboard/stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

---

## 📊 Response Format

All responses follow this format:

**Success:**
```json
{
  "success": true,
  "data": {...},
  "message": "Optional success message"
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## 🎯 Complete Endpoint List

| Category | Endpoint | Method | Description |
|----------|----------|--------|-------------|
| **Dashboard** | `/admin/dashboard/stats` | GET | Dashboard statistics |
| **Dashboard** | `/admin/dashboard/activity` | GET | Recent activity feed |
| **Dashboard** | `/admin/dashboard/metrics` | GET | Performance metrics |
| **Users** | `/admin/users` | GET | Get all users |
| **Users** | `/admin/users/:id` | GET | Get user by ID |
| **Users** | `/admin/users/:id` | PUT | Update user |
| **Users** | `/admin/users/:id` | DELETE | Delete user |
| **Users** | `/admin/users/:id/suspend` | PATCH | Suspend/unsuspend user |
| **Users** | `/admin/users/stats` | GET | User statistics |
| **Analytics** | `/admin/analytics/overview` | GET | Analytics overview |
| **Analytics** | `/admin/analytics/revenue` | GET | Revenue analytics |
| **Analytics** | `/admin/analytics/users` | GET | User analytics |
| **Analytics** | `/admin/analytics/courses` | GET | Course analytics |
| **Analytics** | `/admin/analytics/enrollments` | GET | Enrollment analytics |
| **Notifications** | `/admin/notifications` | GET | Get all notifications |
| **Notifications** | `/admin/notifications` | POST | Create notification |
| **Notifications** | `/admin/notifications/:id` | GET | Get notification by ID |
| **Notifications** | `/admin/notifications/:id` | PUT | Update notification |
| **Notifications** | `/admin/notifications/:id` | DELETE | Delete notification |
| **Notifications** | `/admin/notifications/stats` | GET | Notification statistics |
| **Content** | `/admin/content` | GET | Get all content |
| **Content** | `/admin/content` | POST | Create content |
| **Content** | `/admin/content/:id` | GET | Get content by ID |
| **Content** | `/admin/content/:id` | PUT | Update content |
| **Content** | `/admin/content/:id` | DELETE | Delete content |
| **Content** | `/admin/content/stats` | GET | Content statistics |
| **Content** | `/admin/content/:id/view` | POST | Increment views |
| **Content** | `/admin/content/:id/download` | POST | Increment downloads |
| **Settings** | `/admin/settings` | GET | Get all settings |
| **Settings** | `/admin/settings/:userId` | GET | Get user settings |
| **Settings** | `/admin/settings/:userId` | PUT | Update user settings |
| **Settings** | `/admin/settings/:userId/reset` | POST | Reset user settings |
| **Settings** | `/admin/settings/stats` | GET | Settings statistics |

---

**Total: 33 New Admin Endpoints!** 🎉
```

Save this file and refer to it for complete API documentation.

