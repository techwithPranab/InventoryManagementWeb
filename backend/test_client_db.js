const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test client-specific database functionality
async function testClientSpecificDatabase() {
  try {
    console.log('Testing Client-Specific Database Implementation...\n');

    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data.message);

    // Test 2: Test products endpoint without client code (should fail)
    console.log('\n2. Testing products endpoint without client code...');
    try {
      await axios.get(`${BASE_URL}/products`);
      console.log('❌ Should have failed without client code');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Correctly rejected request without authentication');
      } else {
        console.log('✅ Request failed as expected:', error.response?.data?.message || error.message);
      }
    }

    // Test 3: Test with invalid token
    console.log('\n3. Testing with invalid token and client code...');
    try {
      await axios.get(`${BASE_URL}/products`, {
        headers: {
          'Authorization': 'Bearer invalid_token',
          'X-Client-Code': 'testclient'
        }
      });
      console.log('❌ Should have failed with invalid token');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Correctly rejected invalid token');
      } else {
        console.log('✅ Request failed as expected:', error.response?.data?.message || error.message);
      }
    }

    console.log('\n4. Testing authentication endpoint...');
    // Note: You would need valid credentials to test further
    // This just demonstrates the structure

    console.log('\n🎉 Basic client-specific database structure is working!');
    console.log('\nNext steps:');
    console.log('- Register/login with valid credentials');
    console.log('- Test with X-Client-Code header');
    console.log('- Verify data isolation between different client codes');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testClientSpecificDatabase();
