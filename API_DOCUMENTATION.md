# MyLearnHub API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📝 User Authentication Endpoints

### 1. Register User
**Endpoint:** `POST /api/auth/register`

**Access:** Public

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "https://ui-avatars.com/api/?name=John+Doe&background=random",
    "role": "user"
  }
}
```

---

### 2. User Login
**Endpoint:** `POST /api/auth/login`

**Access:** Public

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "https://ui-avatars.com/api/?name=John+Doe&background=random",
    "role": "user"
  }
}
```

---

### 3. Get User Profile
**Endpoint:** `GET /api/auth/profile`

**Access:** Private (Requires JWT Token)

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "https://ui-avatars.com/api/?name=John+Doe&background=random",
    "role": "user",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### 4. Update User Profile
**Endpoint:** `PUT /api/auth/profile`

**Access:** Private (Requires JWT Token)

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "John Smith",
  "avatar": "https://example.com/new-avatar.jpg"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Smith",
    "email": "john@example.com",
    "avatar": "https://example.com/new-avatar.jpg",
    "role": "user"
  },
  "message": "Profile updated successfully"
}
```

---

## 📚 Public Course Endpoints

### 5. Get All Published Courses
**Endpoint:** `GET /api/courses`

**Access:** Public

**Response (200):**
```json
{
  "success": true,
  "count": 2,
  "courses": [
    {
      "id": "507f1f77bcf86cd799439012",
      "title": "React Masterclass",
      "description": "Learn React from basics to advanced",
      "instructor": "Jane Doe",
      "duration": "6 weeks",
      "price": 4500,
      "image": "https://example.com/react-course.jpg",
      "status": "published",
      "category": "Web Development",
      "level": "intermediate",
      "enrolledCount": 150,
      "rating": 4.5,
      "createdAt": "2025-01-10T08:00:00.000Z"
    }
  ]
}
```

---

### 6. Get Course by ID
**Endpoint:** `GET /api/courses/:id`

**Access:** Public

**Response (200):**
```json
{
  "success": true,
  "course": {
    "id": "507f1f77bcf86cd799439012",
    "title": "React Masterclass",
    "description": "Learn React from basics to advanced",
    "instructor": "Jane Doe",
    "duration": "6 weeks",
    "price": 4500,
    "image": "https://example.com/react-course.jpg",
    "status": "published",
    "category": "Web Development",
    "level": "intermediate",
    "enrolledCount": 150,
    "rating": 4.5,
    "createdBy": {
      "name": "Admin User",
      "email": "admin@mylearnhub.com",
      "avatar": "https://ui-avatars.com/api/?name=Admin&background=667eea"
    },
    "createdAt": "2025-01-10T08:00:00.000Z"
  }
}
```

---

## 🔐 Admin Authentication Endpoints

### 7. Admin Login
**Endpoint:** `POST /api/admin/auth/login`

**Access:** Public (Admin credentials required)

**Request Body:**
```json
{
  "email": "admin@mylearnhub.com",
  "password": "Admin@123"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439010",
    "name": "Admin User",
    "email": "admin@mylearnhub.com",
    "avatar": "https://ui-avatars.com/api/?name=Admin&background=667eea",
    "role": "admin"
  }
}
```

**Important:** The `role: "admin"` field is crucial for client-side checks.

---

### 8. Get Admin Profile
**Endpoint:** `GET /api/admin/auth/profile`

**Access:** Private/Admin

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439010",
    "name": "Admin User",
    "email": "admin@mylearnhub.com",
    "avatar": "https://ui-avatars.com/api/?name=Admin&background=667eea",
    "role": "admin",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

## 🛠️ Admin Course Management Endpoints

### 9. Get All Courses (Admin View)
**Endpoint:** `GET /api/admin/courses`

**Access:** Private/Admin

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters (Optional):**
- `status`: Filter by status (draft, published, archived)

**Example:** `GET /api/admin/courses?status=draft`

**Response (200):**
```json
{
  "success": true,
  "count": 5,
  "courses": [
    {
      "id": "507f1f77bcf86cd799439012",
      "title": "React Masterclass",
      "description": "Learn React from basics to advanced",
      "instructor": "Jane Doe",
      "duration": "6 weeks",
      "price": 4500,
      "image": "https://example.com/react-course.jpg",
      "status": "published",
      "category": "Web Development",
      "level": "intermediate",
      "enrolledCount": 150,
      "rating": 4.5,
      "createdAt": "2025-01-10T08:00:00.000Z"
    },
    {
      "id": "507f1f77bcf86cd799439013",
      "title": "Node.js Advanced",
      "status": "draft",
      "...": "..."
    }
  ]
}
```

---

### 10. Create Course
**Endpoint:** `POST /api/admin/courses`

**Access:** Private/Admin

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "title": "New Course Title",
  "description": "Detailed description of the new course...",
  "instructor": "Jane Doe",
  "duration": "4 weeks",
  "price": 3000,
  "image": "https://example.com/new-course.jpg",
  "status": "published",
  "category": "Web Development",
  "level": "beginner"
}
```

**Required Fields:**
- title
- description
- instructor
- duration
- price
- image

**Optional Fields:**
- status (default: "published")
- category
- level (default: "beginner")

**Response (201):**
```json
{
  "success": true,
  "course": {
    "id": "507f1f77bcf86cd799439014",
    "title": "New Course Title",
    "description": "Detailed description of the new course...",
    "instructor": "Jane Doe",
    "duration": "4 weeks",
    "price": 3000,
    "image": "https://example.com/new-course.jpg",
    "status": "published",
    "category": "Web Development",
    "level": "beginner",
    "enrolledCount": 0,
    "rating": 0,
    "createdBy": "507f1f77bcf86cd799439010",
    "createdAt": "2025-01-15T12:00:00.000Z"
  },
  "message": "Course created successfully"
}
```

---

### 11. Update Course
**Endpoint:** `PUT /api/admin/courses/:id`

**Access:** Private/Admin

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body (all fields optional):**
```json
{
  "title": "Updated Course Title",
  "price": 3500,
  "status": "published"
}
```

**Response (200):**
```json
{
  "success": true,
  "course": {
    "id": "507f1f77bcf86cd799439014",
    "title": "Updated Course Title",
    "price": 3500,
    "status": "published",
    "...": "..."
  },
  "message": "Course updated successfully"
}
```

---

### 12. Delete Course
**Endpoint:** `DELETE /api/admin/courses/:id`

**Access:** Private/Admin

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Course deleted successfully",
  "data": {}
}
```

---

### 13. Get Course by ID (Admin View)
**Endpoint:** `GET /api/admin/courses/:id`

**Access:** Private/Admin

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "course": {
    "id": "507f1f77bcf86cd799439012",
    "title": "React Masterclass",
    "description": "Learn React from basics to advanced",
    "status": "draft",
    "...": "..."
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Please provide all required fields"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Admin privileges required."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Course not found"
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Server error",
  "error": "Error details..."
}
```

---

## Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |

---

## Notes

1. **JWT Token Expiration:** Tokens expire after 7 days by default (configurable in `.env`)
2. **Default Admin Credentials:**
   - Email: `admin@mylearnhub.com`
   - Password: `Admin@123`
   - **⚠️ Change these in production!**
3. **Course Status Values:**
   - `draft`: Not visible to public
   - `published`: Visible to public
   - `archived`: Hidden but not deleted
4. **Role-based Access:**
   - `user`: Can view published courses
   - `admin`: Can manage all courses and users

