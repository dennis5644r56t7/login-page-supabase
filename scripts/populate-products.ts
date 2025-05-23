import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { createApi } from 'unsplash-js';
import fetch from 'node-fetch';
import faker from '@faker-js/faker';

dotenv.config();

// Initialize Unsplash client
const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY!,
  fetch: fetch as any,
});

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Product categories with their Unsplash search terms
const categories = [
  { name: 'Electronics', searchTerm: 'electronics gadgets' },
  { name: 'Clothing', searchTerm: 'fashion clothing' },
  { name: 'Home & Garden', searchTerm: 'home decor' },
  { name: 'Sports & Outdoors', searchTerm: 'sports equipment' },
  { name: 'Books', searchTerm: 'books library' },
  { name: 'Toys & Games', searchTerm: 'toys games' },
  { name: 'Beauty & Personal Care', searchTerm: 'beauty cosmetics' },
  { name: 'Jewelry', searchTerm: 'jewelry accessories' },
  { name: 'Automotive', searchTerm: 'car accessories' },
  { name: 'Pet Supplies', searchTerm: 'pet supplies' }
];

async function createCategories() {
  console.log('Creating categories...');
  const { data: existingCategories } = await supabase
    .from('categories')
    .select('name');

  const existingNames = new Set(existingCategories?.map(c => c.name));
  const categoriesToCreate = categories.filter(c => !existingNames.has(c.name));

  if (categoriesToCreate.length > 0) {
    const { error } = await supabase
      .from('categories')
      .insert(categoriesToCreate.map(c => ({ name: c.name })));

    if (error) throw error;
  }

  const { data: allCategories } = await supabase
    .from('categories')
    .select('*');

  return allCategories;
}

async function getUnsplashImages(searchTerm: string, count: number) {
  const images = [];
  let page = 1;
  
  while (images.length < count) {
    const result = await unsplash.search.getPhotos({
      query: searchTerm,
      page,
      perPage: 30,
    });

    if (result.errors) {
      console.error('Error fetching images:', result.errors[0]);
      break;
    }

    const newImages = result.response?.results.map(photo => photo.urls.regular) || [];
    images.push(...newImages);
    page++;

    if (!result.response?.total_pages || page > result.response.total_pages) {
      break;
    }
  }

  return images.slice(0, count);
}

async function createProducts(categories: any[]) {
  console.log('Creating products...');
  const productsPerCategory = Math.ceil(1000 / categories.length);

  for (const category of categories) {
    console.log(`Creating products for category: ${category.name}`);
    
    const searchTerm = categories.find(c => c.name === category.name)?.searchTerm || category.name;
    const images = await getUnsplashImages(searchTerm, productsPerCategory);

    const products = Array.from({ length: productsPerCategory }, (_, i) => {
      const price = faker.commerce.price({ min: 10, max: 1000 });
      const hasDiscount = Math.random() > 0.7;
      
      return {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        price: parseFloat(price),
        discount_price: hasDiscount ? parseFloat(price) * 0.8 : null,
        image_url: images[i % images.length],
        category_id: category.id,
        stock_quantity: faker.number.int({ min: 0, max: 100 })
      };
    });

    const chunks = [];
    for (let i = 0; i < products.length; i += 100) {
      chunks.push(products.slice(i, i + 100));
    }

    for (const chunk of chunks) {
      const { error } = await supabase
        .from('products')
        .insert(chunk);

      if (error) {
        console.error('Error inserting products:', error);
        continue;
      }
    }
  }
}

async function main() {
  try {
    const categories = await createCategories();
    await createProducts(categories);
    console.log('Database populated successfully!');
  } catch (error) {
    console.error('Error populating database:', error);
  }
}

main(); 