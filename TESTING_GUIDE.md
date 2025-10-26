# 🧪 Testing Guide

Complete guide for testing all MyLearnHub Backend API endpoints.

---

## 📋 Prerequisites

1. Server is running on `http://localhost:5000`
2. MongoDB is connected
3. Admin user is seeded (automatically on first run)
4. Sample courses are seeded (in development mode)

---

## 🔧 Setup for Testing

### Option 1: Using cURL (Command Line)

All examples below use cURL. Perfect for quick testing.

### Option 2: Using Postman

1. Import `POSTMAN_COLLECTION.json`
2. Set variables:
   - `base_url`: `http://localhost:5000/api`
   - `jwt_token`: (will be filled after login)
   - `admin_token`: (will be filled after admin login)

### Option 3: Using a REST Client (VS Code Extension)

Create a file `test.http` and use the REST Client extension.

---

## 📝 Test Cases

### 1. Health Check

**Purpose:** Verify server is running

```bash
curl http://localhost:5000/health
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

### 2. User Registration

**Purpose:** Create a new user account

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "testuser@example.com",
    "password": "testpass123"
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "Test User",
    "email": "testuser@example.com",
    "avatar": "https://ui-avatars.com/api/?name=Test+User&background=random",
    "role": "user"
  }
}
```

**Test Cases:**
- ✅ Valid registration with all fields
- ❌ Registration with existing email (should return 400)
- ❌ Registration with missing fields (should return 400)
- ❌ Registration with invalid email format (should return 400)

---

### 3. User Login

**Purpose:** Authenticate existing user

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "testpass123"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "Test User",
    "email": "testuser@example.com",
    "avatar": "https://ui-avatars.com/api/?name=Test+User&background=random",
    "role": "user"
  }
}
```

**Save the token for next tests!**

**Test Cases:**
- ✅ Valid login credentials
- ❌ Invalid email (should return 401)
- ❌ Invalid password (should return 401)
- ❌ Missing fields (should return 400)

---

### 4. Get User Profile

**Purpose:** Retrieve authenticated user's profile

```bash
# Replace YOUR_TOKEN with the token from login
curl http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "name": "Test User",
    "email": "testuser@example.com",
    "avatar": "https://ui-avatars.com/api/?name=Test+User&background=random",
    "role": "user",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Test Cases:**
- ✅ Valid token
- ❌ Missing token (should return 401)
- ❌ Invalid token (should return 401)
- ❌ Expired token (should return 401)

---

### 5. Update User Profile

**Purpose:** Update user information

```bash
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Updated Name",
    "avatar": "https://example.com/new-avatar.jpg"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "name": "Updated Name",
    "email": "testuser@example.com",
    "avatar": "https://example.com/new-avatar.jpg",
    "role": "user"
  },
  "message": "Profile updated successfully"
}
```

---

### 6. Get All Published Courses

**Purpose:** Get list of all published courses (public access)

```bash
curl http://localhost:5000/api/courses
```

**Expected Response (200):**
```json
{
  "success": true,
  "count": 5,
  "courses": [
    {
      "id": "...",
      "title": "React.js Complete Course",
      "description": "...",
      "instructor": "John Smith",
      "duration": "8 weeks",
      "price": 4999,
      "image": "https://...",
      "status": "published",
      "category": "Web Development",
      "level": "intermediate",
      "rating": 4.7,
      "enrolledCount": 250,
      "createdAt": "..."
    },
    // ... more courses
  ]
}
```

**Test Cases:**
- ✅ Returns only published courses
- ✅ Does not require authentication
- ✅ Returns correct count

---

### 7. Get Course by ID

**Purpose:** Get details of a specific course

```bash
# Replace COURSE_ID with actual course ID from previous response
curl http://localhost:5000/api/courses/COURSE_ID
```

**Expected Response (200):**
```json
{
  "success": true,
  "course": {
    "id": "...",
    "title": "React.js Complete Course",
    "description": "...",
    "instructor": "John Smith",
    "duration": "8 weeks",
    "price": 4999,
    "image": "https://...",
    "status": "published",
    "createdBy": {
      "name": "Admin User",
      "email": "admin@mylearnhub.com",
      "avatar": "..."
    },
    // ... more details
  }
}
```

**Test Cases:**
- ✅ Valid course ID (published)
- ❌ Invalid course ID (should return 404)
- ❌ Draft course ID (should return 404 for public)

---

### 8. Admin Login

**Purpose:** Authenticate as admin

```bash
curl -X POST http://localhost:5000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mylearnhub.com",
    "password": "Admin@123"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "Admin User",
    "email": "admin@mylearnhub.com",
    "avatar": "https://ui-avatars.com/api/?name=Admin&background=667eea",
    "role": "admin"
  }
}
```

**Save this admin token for admin tests!**

**Test Cases:**
- ✅ Valid admin credentials
- ❌ User (non-admin) credentials (should return 403)
- ❌ Invalid credentials (should return 401)

---

### 9. Get Admin Profile

**Purpose:** Get admin user details

```bash
curl http://localhost:5000/api/admin/auth/profile \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "name": "Admin User",
    "email": "admin@mylearnhub.com",
    "avatar": "https://ui-avatars.com/api/?name=Admin&background=667eea",
    "role": "admin",
    "createdAt": "..."
  }
}
```

**Test Cases:**
- ✅ Valid admin token
- ❌ User (non-admin) token (should return 403)

---

### 10. Get All Courses (Admin View)

**Purpose:** Get all courses including drafts

```bash
# Get all courses
curl http://localhost:5000/api/admin/courses \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Filter by status
curl http://localhost:5000/api/admin/courses?status=draft \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "count": 6,
  "courses": [
    // All courses including drafts
  ]
}
```

**Test Cases:**
- ✅ Returns all courses (including drafts)
- ✅ Filter by status works
- ❌ Non-admin token (should return 403)

---

### 11. Create Course (Admin Only)

**Purpose:** Create a new course

```bash
curl -X POST http://localhost:5000/api/admin/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "title": "Test Course",
    "description": "This is a test course for learning purposes",
    "instructor": "Test Instructor",
    "duration": "4 weeks",
    "price": 2500,
    "image": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800",
    "status": "published",
    "category": "Testing",
    "level": "beginner"
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "course": {
    "id": "...",
    "title": "Test Course",
    "description": "This is a test course for learning purposes",
    "instructor": "Test Instructor",
    "duration": "4 weeks",
    "price": 2500,
    "image": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800",
    "status": "published",
    "category": "Testing",
    "level": "beginner",
    "enrolledCount": 0,
    "rating": 0,
    "createdBy": "...",
    "createdAt": "..."
  },
  "message": "Course created successfully"
}
```

**Test Cases:**
- ✅ Valid course data
- ❌ Missing required fields (should return 400)
- ❌ Non-admin token (should return 403)
- ❌ No token (should return 401)

---

### 12. Get Course by ID (Admin View)

**Purpose:** Get course details including draft courses

```bash
curl http://localhost:5000/api/admin/courses/COURSE_ID \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "course": {
    // Full course details, even if it's a draft
  }
}
```

---

### 13. Update Course (Admin Only)

**Purpose:** Update existing course

```bash
curl -X PUT http://localhost:5000/api/admin/courses/COURSE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "title": "Updated Course Title",
    "price": 3000,
    "status": "published"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "course": {
    "id": "...",
    "title": "Updated Course Title",
    "price": 3000,
    "status": "published",
    // ... other fields
  },
  "message": "Course updated successfully"
}
```

**Test Cases:**
- ✅ Update single field
- ✅ Update multiple fields
- ✅ All fields are optional
- ❌ Invalid course ID (should return 404)
- ❌ Non-admin token (should return 403)

---

### 14. Delete Course (Admin Only)

**Purpose:** Delete a course permanently

```bash
curl -X DELETE http://localhost:5000/api/admin/courses/COURSE_ID \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Course deleted successfully",
  "data": {}
}
```

**Test Cases:**
- ✅ Valid course ID
- ❌ Invalid course ID (should return 404)
- ❌ Non-admin token (should return 403)
- ❌ Already deleted course (should return 404)

---

## 🎯 Complete Test Script

Save this as `test-api.sh` and run it:

```bash
#!/bin/bash

BASE_URL="http://localhost:5000"

echo "🧪 Testing MyLearnHub API"
echo "=========================="

# 1. Health Check
echo "\n1️⃣ Health Check"
curl -s "$BASE_URL/health" | jq

# 2. Get Public Courses
echo "\n2️⃣ Get Public Courses"
curl -s "$BASE_URL/api/courses" | jq '.count'

# 3. Admin Login
echo "\n3️⃣ Admin Login"
ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/admin/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mylearnhub.com",
    "password": "Admin@123"
  }')

ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | jq -r '.token')
echo "Admin Token: ${ADMIN_TOKEN:0:50}..."

# 4. Get All Courses (Admin)
echo "\n4️⃣ Get All Courses (Admin)"
curl -s "$BASE_URL/api/admin/courses" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.count'

# 5. Create Course
echo "\n5️⃣ Create Course"
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/admin/courses" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "title": "Test Course",
    "description": "Test Description",
    "instructor": "Test Instructor",
    "duration": "2 weeks",
    "price": 1000,
    "image": "https://example.com/image.jpg"
  }')

COURSE_ID=$(echo $CREATE_RESPONSE | jq -r '.course.id')
echo "Created Course ID: $COURSE_ID"

# 6. Update Course
echo "\n6️⃣ Update Course"
curl -s -X PUT "$BASE_URL/api/admin/courses/$COURSE_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "title": "Updated Test Course"
  }' | jq '.message'

# 7. Delete Course
echo "\n7️⃣ Delete Course"
curl -s -X DELETE "$BASE_URL/api/admin/courses/$COURSE_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.message'

echo "\n✅ All tests completed!"
```

Make it executable and run:
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## 📊 Expected Results Summary

| Test | Endpoint | Expected Status | Auth Required | Admin Required |
|------|----------|----------------|---------------|----------------|
| Health Check | GET /health | 200 | ❌ | ❌ |
| User Register | POST /api/auth/register | 201 | ❌ | ❌ |
| User Login | POST /api/auth/login | 200 | ❌ | ❌ |
| Get Profile | GET /api/auth/profile | 200 | ✅ | ❌ |
| Update Profile | PUT /api/auth/profile | 200 | ✅ | ❌ |
| Get Courses | GET /api/courses | 200 | ❌ | ❌ |
| Get Course | GET /api/courses/:id | 200 | ❌ | ❌ |
| Admin Login | POST /api/admin/auth/login | 200 | ❌ | ⚠️ |
| Admin Profile | GET /api/admin/auth/profile | 200 | ✅ | ✅ |
| Get All Courses | GET /api/admin/courses | 200 | ✅ | ✅ |
| Create Course | POST /api/admin/courses | 201 | ✅ | ✅ |
| Get Course (Admin) | GET /api/admin/courses/:id | 200 | ✅ | ✅ |
| Update Course | PUT /api/admin/courses/:id | 200 | ✅ | ✅ |
| Delete Course | DELETE /api/admin/courses/:id | 200 | ✅ | ✅ |

---

## 🐛 Common Testing Issues

### Issue: 401 Unauthorized
**Cause:** Missing or invalid token
**Solution:** Make sure you're including the Authorization header with a valid token

### Issue: 403 Forbidden
**Cause:** Trying to access admin endpoint with user token
**Solution:** Use admin token obtained from admin login

### Issue: 404 Not Found
**Cause:** Invalid course ID or trying to access draft course as public user
**Solution:** Check course ID is correct and course is published

### Issue: 400 Bad Request
**Cause:** Missing required fields or invalid data
**Solution:** Check request body matches the required format

---

## ✅ Testing Checklist

- [ ] Health check passes
- [ ] User registration works
- [ ] User login works
- [ ] Get user profile works with token
- [ ] Update profile works
- [ ] Get public courses works
- [ ] Get single course works
- [ ] Admin login works with admin credentials
- [ ] Admin login fails with user credentials
- [ ] Get admin profile works with admin token
- [ ] Get all courses (admin) includes drafts
- [ ] Create course works with admin token
- [ ] Create course fails without admin token
- [ ] Update course works
- [ ] Delete course works
- [ ] Public endpoints don't show draft courses

---

**Happy Testing! 🎉**

