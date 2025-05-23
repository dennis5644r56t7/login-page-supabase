const { createClient } = require('@supabase/supabase-js');
const { createApi } = require('unsplash-js');
const nodeFetch = require('node-fetch');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize Unsplash API
const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY,
  fetch: nodeFetch,
});

// Categories and their corresponding search terms for Unsplash
const categorySearchTerms = {
  'Electronics': 'electronics',
  'Clothing': 'clothing fashion',
  'Home & Kitchen': 'home kitchen',
  'Books': 'books',
  'Sports & Outdoors': 'sports outdoors',
  'Toys & Games': 'toys games',
  'Beauty & Personal Care': 'beauty cosmetics',
  'Jewelry': 'jewelry',
  'Automotive': 'automotive',
  'Pet Supplies': 'pet supplies',
};

async function updateProductImages() {
  try {
    // Get all categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*');
    
    if (categoriesError) throw categoriesError;
    
    // Process each category
    for (const category of categories) {
      console.log(`Updating images for category: ${category.name}`);
      
      // Get products for this category
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('category_id', category.id);
      
      if (productsError) throw productsError;
      
      // Get search term for this category
      const searchTerm = categorySearchTerms[category.name] || category.name;
      
      // Get images from Unsplash
      const result = await unsplash.photos.getRandom({
        count: products.length,
        query: searchTerm,
        orientation: 'squarish'
      });
      
      if (result.errors) {
        console.error('Error fetching Unsplash images:', result.errors);
        continue;
      }
      
      // Update each product with an image URL
      for (let i = 0; i < products.length; i++) {
        const photoUrl = i < result.response.length 
          ? result.response[i].urls.raw + '&w=400&h=400&fit=crop&q=80'
          : `https://picsum.photos/400/400?random=${i}`;
        
        const { error: updateError } = await supabase
          .from('products')
          .update({ image_url: photoUrl })
          .eq('id', products[i].id);
        
        if (updateError) {
          console.error(`Error updating product ${products[i].id}:`, updateError);
        }
      }
    }
    
    console.log('Product images updated successfully!');
  } catch (error) {
    console.error('Error updating product images:', error);
  }
}

updateProductImages(); 