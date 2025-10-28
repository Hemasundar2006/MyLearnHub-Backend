// Test script for the doubt system
// Run this after starting the server to test the implementation

const baseURL = 'http://localhost:5000';

// Test data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123'
};

const testAdmin = {
  email: 'admin@example.com',
  password: 'admin123'
};

const testDoubt = {
  question: 'How do I implement authentication in Node.js?'
};

const testAnswer = {
  title: 'Node.js Authentication Guide',
  description: 'Here\'s a comprehensive guide on implementing authentication in Node.js using JWT tokens...',
  url: 'https://example.com/auth-guide'
};

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', data = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${baseURL}${endpoint}`, options);
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    return { status: 500, data: { error: error.message } };
  }
}

// Test functions
async function testUserRegistration() {
  console.log('🧪 Testing user registration...');
  const result = await apiCall('/api/auth/register', 'POST', testUser);
  
  if (result.status === 201) {
    console.log('✅ User registration successful');
    return result.data.token;
  } else {
    console.log('❌ User registration failed:', result.data);
    return null;
  }
}

async function testUserLogin() {
  console.log('🧪 Testing user login...');
  const result = await apiCall('/api/auth/login', 'POST', {
    email: testUser.email,
    password: testUser.password
  });
  
  if (result.status === 200) {
    console.log('✅ User login successful');
    return result.data.token;
  } else {
    console.log('❌ User login failed:', result.data);
    return null;
  }
}

async function testAdminLogin() {
  console.log('🧪 Testing admin login...');
  const result = await apiCall('/api/admin/auth/login', 'POST', testAdmin);
  
  if (result.status === 200) {
    console.log('✅ Admin login successful');
    return result.data.token;
  } else {
    console.log('❌ Admin login failed:', result.data);
    return null;
  }
}

async function testSubmitDoubt(userToken) {
  console.log('🧪 Testing doubt submission...');
  const result = await apiCall('/api/doubts', 'POST', testDoubt, userToken);
  
  if (result.status === 201) {
    console.log('✅ Doubt submission successful');
    return result.data.data._id;
  } else {
    console.log('❌ Doubt submission failed:', result.data);
    return null;
  }
}

async function testGetUserDoubts(userToken) {
  console.log('🧪 Testing get user doubts...');
  const result = await apiCall('/api/doubts/my-doubts', 'GET', null, userToken);
  
  if (result.status === 200) {
    console.log('✅ Get user doubts successful');
    console.log(`   Found ${result.data.data.doubts.length} doubts`);
    return true;
  } else {
    console.log('❌ Get user doubts failed:', result.data);
    return false;
  }
}

async function testGetAllDoubts(adminToken) {
  console.log('🧪 Testing get all doubts (admin)...');
  const result = await apiCall('/api/admin/doubts', 'GET', null, adminToken);
  
  if (result.status === 200) {
    console.log('✅ Get all doubts successful');
    console.log(`   Found ${result.data.data.doubts.length} doubts`);
    return result.data.data.doubts[0]?._id;
  } else {
    console.log('❌ Get all doubts failed:', result.data);
    return null;
  }
}

async function testAnswerDoubt(adminToken, doubtId) {
  console.log('🧪 Testing answer doubt...');
  const result = await apiCall(`/api/admin/doubts/${doubtId}/answer`, 'POST', testAnswer, adminToken);
  
  if (result.status === 200) {
    console.log('✅ Answer doubt successful');
    return true;
  } else {
    console.log('❌ Answer doubt failed:', result.data);
    return false;
  }
}

async function testGetLeaderboard() {
  console.log('🧪 Testing get leaderboard...');
  const result = await apiCall('/api/doubts/leaderboard');
  
  if (result.status === 200) {
    console.log('✅ Get leaderboard successful');
    console.log(`   Found ${result.data.data.leaderboard.length} users in leaderboard`);
    return true;
  } else {
    console.log('❌ Get leaderboard failed:', result.data);
    return false;
  }
}

async function testGetUserStats(userToken) {
  console.log('🧪 Testing get user doubt stats...');
  const result = await apiCall('/api/doubts/my-stats', 'GET', null, userToken);
  
  if (result.status === 200) {
    console.log('✅ Get user stats successful');
    console.log(`   Total doubts: ${result.data.data.totalDoubts}`);
    console.log(`   Coins earned: ${result.data.data.totalCoinsEarned}`);
    return true;
  } else {
    console.log('❌ Get user stats failed:', result.data);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Doubt System Tests...\n');
  
  // Test user flow
  let userToken = await testUserLogin();
  if (!userToken) {
    userToken = await testUserRegistration();
  }
  
  if (!userToken) {
    console.log('❌ Cannot proceed without user authentication');
    return;
  }
  
  // Test admin flow
  const adminToken = await testAdminLogin();
  if (!adminToken) {
    console.log('❌ Cannot proceed without admin authentication');
    return;
  }
  
  // Test doubt submission
  const doubtId = await testSubmitDoubt(userToken);
  if (!doubtId) {
    console.log('❌ Cannot proceed without doubt submission');
    return;
  }
  
  // Test getting user doubts
  await testGetUserDoubts(userToken);
  
  // Test getting all doubts (admin)
  const adminDoubtId = await testGetAllDoubts(adminToken);
  
  // Test answering doubt
  if (adminDoubtId) {
    await testAnswerDoubt(adminToken, adminDoubtId);
  }
  
  // Test getting user stats after answer
  await testGetUserStats(userToken);
  
  // Test leaderboard
  await testGetLeaderboard();
  
  console.log('\n🎉 All tests completed!');
}

// Run tests if this script is executed directly
if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  runTests().catch(console.error);
} else {
  // Browser environment
  runTests().catch(console.error);
}
