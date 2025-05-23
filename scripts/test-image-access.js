const fetch = require('node-fetch');
require('dotenv').config();

async function testImageAccess() {
  try {
    // Get a sample image URL from the database
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data, error } = await supabase
      .from('products')
      .select('image_url')
      .limit(1)
      .single();
    
    if (error) throw error;
    
    const imageUrl = data.image_url;
    console.log('Testing access to image URL:', imageUrl);
    
    // Try to fetch the image
    const response = await fetch(imageUrl);
    
    if (response.ok) {
      console.log('Image is accessible! Status:', response.status);
      console.log('Content-Type:', response.headers.get('content-type'));
    } else {
      console.error('Failed to access image. Status:', response.status);
    }
  } catch (error) {
    console.error('Error testing image access:', error);
  }
}

testImageAccess(); 