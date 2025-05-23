const { createApi } = require('unsplash-js');
const fetch = require('node-fetch');
require('dotenv').config();

// Check if we have the Unsplash access key
if (!process.env.UNSPLASH_ACCESS_KEY) {
  console.error('Error: UNSPLASH_ACCESS_KEY is not set in .env file');
  process.exit(1);
}

console.log('Unsplash Access Key:', process.env.UNSPLASH_ACCESS_KEY);

// Initialize the Unsplash API client
const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY,
  fetch: fetch,
});

// Test function to fetch some images
async function testUnsplashApi() {
  try {
    console.log('Testing Unsplash API...');
    
    // Try to fetch some photos
    const result = await unsplash.photos.getRandom({
      count: 1,
      query: 'product'
    });

    if (result.errors) {
      console.error('Error from Unsplash API:', result.errors);
    } else {
      console.log('Successfully connected to Unsplash API!');
      console.log('Sample image URL:', result.response[0].urls.regular);
    }
  } catch (error) {
    console.error('Error testing Unsplash API:', error.message);
  }
}

// Run the test
testUnsplashApi(); 