# MyLearnHub Frontend Integration Guide

This guide will help you integrate the MyLearnHub Backend API with your React Native or React frontend application.

## 🎯 Overview

The backend provides a complete admin authentication and course management system with JWT-based authentication and role-based access control.

---

## 📦 Installation & Setup

### 1. Install Backend Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration (MongoDB URI, JWT secret, etc.)

### 3. Start MongoDB

Make sure MongoDB is running on your machine:

```bash
# Windows
net start MongoDB

# Mac/Linux
sudo systemctl start mongod
```

### 4. Start the Backend Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

---

## 🔌 Frontend Integration Steps

### Step 1: Create API Service Layer

Create a new file `src/services/api.js` in your frontend:

```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:5000/api';
// For Android emulator: http://10.0.2.2:5000/api
// For iOS simulator: http://localhost:5000/api
// For physical device: http://YOUR_IP_ADDRESS:5000/api

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access (e.g., logout user)
      AsyncStorage.removeItem('token');
      AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

### Step 2: Create Auth Service

Create `src/services/authService.js`:

```javascript
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
  // User Registration
  register: async (name, email, password) => {
    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
      });
      
      if (response.data.success) {
        await AsyncStorage.setItem('token', response.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  // User Login
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });
      
      if (response.data.success) {
        await AsyncStorage.setItem('token', response.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  // Get User Profile
  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch profile' };
    }
  },

  // Update Profile
  updateProfile: async (name, avatar) => {
    try {
      const response = await api.put('/auth/profile', { name, avatar });
      
      if (response.data.success) {
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update profile' };
    }
  },

  // Logout
  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  },

  // Check if user is admin
  checkAdminStatus: async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (!userStr) return false;
      
      const user = JSON.parse(userStr);
      return user.role === 'admin';
    } catch (error) {
      return false;
    }
  },
};
```

---

### Step 3: Create Admin Service

Create `src/services/adminService.js`:

```javascript
import api from './api';

export const adminService = {
  // Admin Login
  login: async (email, password) => {
    try {
      const response = await api.post('/admin/auth/login', {
        email,
        password,
      });
      
      if (response.data.success) {
        await AsyncStorage.setItem('token', response.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Admin login failed' };
    }
  },

  // Get Admin Profile
  getProfile: async () => {
    try {
      const response = await api.get('/admin/auth/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch admin profile' };
    }
  },

  // Get All Courses (including drafts)
  getAllCourses: async (status = null) => {
    try {
      const url = status ? `/admin/courses?status=${status}` : '/admin/courses';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch courses' };
    }
  },

  // Create Course
  createCourse: async (courseData) => {
    try {
      const response = await api.post('/admin/courses', courseData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create course' };
    }
  },

  // Update Course
  updateCourse: async (courseId, courseData) => {
    try {
      const response = await api.put(`/admin/courses/${courseId}`, courseData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update course' };
    }
  },

  // Delete Course
  deleteCourse: async (courseId) => {
    try {
      const response = await api.delete(`/admin/courses/${courseId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete course' };
    }
  },

  // Get Course by ID
  getCourse: async (courseId) => {
    try {
      const response = await api.get(`/admin/courses/${courseId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch course' };
    }
  },
};
```

---

### Step 4: Create Course Service (Public)

Create `src/services/courseService.js`:

```javascript
import api from './api';

export const courseService = {
  // Get All Published Courses
  getCourses: async () => {
    try {
      const response = await api.get('/courses');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch courses' };
    }
  },

  // Get Course by ID
  getCourse: async (courseId) => {
    try {
      const response = await api.get(`/courses/${courseId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch course' };
    }
  },
};
```

---

### Step 5: Update Auth Context

Update your `AuthContext` to handle admin roles:

```javascript
import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Load user data on mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAdmin(userData.role === 'admin');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      
      if (response.success) {
        setToken(response.token);
        setUser(response.user);
        setIsAdmin(response.user.role === 'admin');
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await authService.register(name, email, password);
      
      if (response.success) {
        setToken(response.token);
        setUser(response.user);
        setIsAdmin(response.user.role === 'admin');
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await authService.logout();
    setToken(null);
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAdmin,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

---

### Step 6: Create Admin Screens

#### Create Course Screen Example:

```javascript
import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { adminService } from '../services/adminService';

const CreateCourseScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructor: '',
    duration: '',
    price: '',
    image: '',
    category: '',
    level: 'beginner',
    status: 'published',
  });

  const handleCreate = async () => {
    try {
      const response = await adminService.createCourse({
        ...formData,
        price: parseFloat(formData.price),
      });

      if (response.success) {
        Alert.alert('Success', 'Course created successfully');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create course');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Course Title"
        value={formData.title}
        onChangeText={(text) => setFormData({ ...formData, title: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Description"
        value={formData.description}
        onChangeText={(text) => setFormData({ ...formData, description: text })}
        multiline
      />
      <TextInput
        style={styles.input}
        placeholder="Instructor"
        value={formData.instructor}
        onChangeText={(text) => setFormData({ ...formData, instructor: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Duration (e.g., 4 weeks)"
        value={formData.duration}
        onChangeText={(text) => setFormData({ ...formData, duration: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Price"
        value={formData.price}
        onChangeText={(text) => setFormData({ ...formData, price: text })}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Image URL"
        value={formData.image}
        onChangeText={(text) => setFormData({ ...formData, image: text })}
      />
      <Button title="Create Course" onPress={handleCreate} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
});

export default CreateCourseScreen;
```

---

### Step 7: Conditional UI for Admin

In your navigation or home screen:

```javascript
import { useAuth } from '../context/AuthContext';

const HomeScreen = () => {
  const { isAdmin } = useAuth();

  return (
    <View>
      {/* Regular user content */}
      
      {isAdmin && (
        <Button
          title="Admin Dashboard"
          onPress={() => navigation.navigate('AdminDashboard')}
        />
      )}
    </View>
  );
};
```

---

## 🔑 Default Admin Credentials

For testing purposes:

```
Email: admin@mylearnhub.com
Password: Admin@123
```

**⚠️ IMPORTANT:** Change these credentials in production!

---

## 📝 Example Usage

### Login Example:

```javascript
const handleLogin = async () => {
  try {
    const response = await authService.login(
      'admin@mylearnhub.com',
      'Admin@123'
    );
    
    if (response.success) {
      console.log('User role:', response.user.role);
      // Navigate based on role
      if (response.user.role === 'admin') {
        navigation.navigate('AdminDashboard');
      } else {
        navigation.navigate('Home');
      }
    }
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};
```

### Create Course Example:

```javascript
const createCourse = async () => {
  try {
    const response = await adminService.createCourse({
      title: 'React Native Advanced',
      description: 'Learn advanced React Native concepts',
      instructor: 'John Doe',
      duration: '6 weeks',
      price: 4500,
      image: 'https://example.com/image.jpg',
      category: 'Mobile Development',
      level: 'advanced',
      status: 'published',
    });
    
    console.log('Course created:', response.course);
  } catch (error) {
    console.error('Error:', error.message);
  }
};
```

---

## 🐛 Troubleshooting

### Connection Issues

**Problem:** Cannot connect to backend from mobile device

**Solution:**
- Use your computer's IP address instead of `localhost`
- Make sure your device and computer are on the same network
- For Android emulator, use `http://10.0.2.2:5000/api`

### 401 Unauthorized Errors

**Problem:** Getting 401 errors on protected routes

**Solution:**
- Check if token is being stored and retrieved correctly
- Verify token is being sent in Authorization header
- Check if token has expired (default: 7 days)

### Admin Access Denied

**Problem:** Admin endpoints returning 403 Forbidden

**Solution:**
- Verify you're logged in with admin credentials
- Check that `role: "admin"` is present in user object
- Confirm Authorization header is being sent

---

## 📚 Additional Resources

- [API Documentation](./API_DOCUMENTATION.md)
- [Postman Collection](./POSTMAN_COLLECTION.json)
- [README](./README.md)

---

## 🤝 Support

If you encounter any issues, please check the API documentation or create an issue in the repository.

