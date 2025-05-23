// @ts-check
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the root directory
config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for admin access

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const categories = [
  { id: 1, name: 'Electronics', image_url: '/images/categories/electronics.jpg' },
  { id: 2, name: 'Clothing', image_url: '/images/categories/clothing.jpg' },
  { id: 3, name: 'Home and Garden', image_url: '/images/categories/home-and-garden.jpg' },
  { id: 4, name: 'Books', image_url: '/images/categories/books.jpg' },
  { id: 5, name: 'Sports and Outdoors', image_url: '/images/categories/sports-and-outdoors.jpg' },
  { id: 6, name: 'Toys and Games', image_url: '/images/categories/toys-and-games.jpg' },
  { id: 7, name: 'Beauty and Personal Care', image_url: '/images/categories/beauty-and-personal-care.jpg' },
  { id: 8, name: 'Automotive', image_url: '/images/categories/automotive.jpg' },
  { id: 9, name: 'Health and Wellness', image_url: '/images/categories/health-and-wellness.jpg' },
  { id: 10, name: 'Food and Beverages', image_url: '/images/categories/food-and-beverages.jpg' }
];

const adjectives = ['Premium', 'Deluxe', 'Professional', 'Classic', 'Modern', 'Luxury', 'Essential', 'Advanced', 'Elite', 'Smart'];
const productTypes = {
  'Electronics': ['Smartphone', 'Laptop', 'Headphones', 'Smartwatch', 'Tablet', 'Camera', 'Speaker', 'Monitor', 'Keyboard', 'Mouse'],
  'Clothing': ['T-Shirt', 'Jeans', 'Dress', 'Jacket', 'Sweater', 'Shoes', 'Hat', 'Socks', 'Scarf', 'Gloves'],
  'Home and Garden': ['Chair', 'Table', 'Lamp', 'Rug', 'Plant', 'Pillow', 'Blanket', 'Vase', 'Clock', 'Mirror'],
  'Books': ['Novel', 'Cookbook', 'Biography', 'Textbook', 'Magazine', 'Comic', 'Journal', 'Guide', 'Dictionary', 'Encyclopedia'],
  'Sports and Outdoors': ['Bicycle', 'Tennis Racket', 'Basketball', 'Yoga Mat', 'Camping Tent', 'Hiking Boots', 'Fishing Rod', 'Golf Club', 'Skateboard', 'Surfboard'],
  'Toys and Games': ['Board Game', 'Puzzle', 'Action Figure', 'Doll', 'Building Blocks', 'Remote Control Car', 'Card Game', 'Video Game', 'Plush Toy', 'Educational Toy'],
  'Beauty and Personal Care': ['Shampoo', 'Moisturizer', 'Perfume', 'Makeup Kit', 'Hair Dryer', 'Face Mask', 'Nail Polish', 'Toothbrush', 'Razor', 'Sunscreen'],
  'Automotive': ['Car Cover', 'Floor Mats', 'Air Freshener', 'Tool Kit', 'Car Charger', 'Seat Covers', 'Windshield Wipers', 'Oil Filter', 'Battery', 'Tire Gauge'],
  'Health and Wellness': ['Vitamin Supplements', 'Fitness Tracker', 'Massage Device', 'Blood Pressure Monitor', 'First Aid Kit', 'Essential Oils', 'Sleep Mask', 'Resistance Bands', 'Foam Roller', 'Meditation Cushion'],
  'Food and Beverages': ['Coffee Maker', 'Blender', 'Food Storage', 'Water Bottle', 'Lunch Box', 'Tea Set', 'Spice Rack', 'Wine Glasses', 'Cooking Utensils', 'Meal Prep Containers']
};

const generateDescription = (category, productName) => {
  const features = {
    'Electronics': ['High-performance', 'Wireless', 'Long battery life', 'HD display', 'Fast charging'],
    'Clothing': ['Comfortable fit', 'Breathable fabric', 'Machine washable', 'Durable material', 'Stylish design'],
    'Home and Garden': ['Modern design', 'Easy to clean', 'Space-saving', 'Eco-friendly', 'Versatile use'],
    'Books': ['Bestseller', 'Award-winning', 'Comprehensive guide', 'Illustrated', 'Educational'],
    'Sports and Outdoors': ['Professional grade', 'Weather-resistant', 'Lightweight', 'Durable construction', 'High performance'],
    'Toys and Games': ['Educational value', 'Age-appropriate', 'Safe materials', 'Interactive', 'Fun for all ages'],
    'Beauty and Personal Care': ['Natural ingredients', 'Dermatologist tested', 'Long-lasting', 'Gentle formula', 'Quick-absorbing'],
    'Automotive': ['Universal fit', 'Easy installation', 'Premium quality', 'Durable construction', 'Weather-resistant'],
    'Health and Wellness': ['Clinically tested', 'Natural ingredients', 'Easy to use', 'Effective results', 'Safe and reliable'],
    'Food and Beverages': ['BPA-free', 'Dishwasher safe', 'Premium quality', 'Easy to clean', 'Durable design']
  };

  const categoryFeatures = features[category] || features['Electronics'];
  const selectedFeatures = categoryFeatures
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);

  return `${productName} - ${selectedFeatures.join(', ')}. Perfect for everyday use and designed with quality in mind. Made with premium materials and attention to detail.`;
};

const generateImageUrl = (category, productType) => {
  // Using placeholder images with category-specific parameters
  return `https://source.unsplash.com/featured/600x400?${encodeURIComponent(category + ',' + productType)}`;
};

const generatePrice = (category) => {
  const priceRanges = {
    'Electronics': { min: 99, max: 1999 },
    'Clothing': { min: 19, max: 299 },
    'Home and Garden': { min: 29, max: 599 },
    'Books': { min: 9, max: 99 },
    'Sports and Outdoors': { min: 19, max: 499 },
    'Toys and Games': { min: 14, max: 199 },
    'Beauty and Personal Care': { min: 9, max: 149 },
    'Automotive': { min: 19, max: 299 },
    'Health and Wellness': { min: 14, max: 199 },
    'Food and Beverages': { min: 9, max: 149 }
  };

  const range = priceRanges[category] || { min: 19, max: 199 };
  return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
};

const generateProducts = async () => {
  try {
    // First, ensure categories exist
    for (const category of categories) {
      const { error: categoryError } = await supabase
        .from('categories')
        .upsert([category], { onConflict: 'id' });

      if (categoryError) {
        console.error('Error inserting category:', categoryError);
        return;
      }
    }

    console.log('Categories created successfully');

    const products = [];
    const totalProducts = 1000;
    let insertedCount = 0;

    for (let i = 0; i < totalProducts; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
      const productType = productTypes[category.name][Math.floor(Math.random() * productTypes[category.name].length)];
      const name = `${adjective} ${productType}`;
      const price = generatePrice(category.name);
      const hasDiscount = Math.random() < 0.3; // 30% chance of having a discount
      const discountPrice = hasDiscount ? Math.floor(price * (0.7 + Math.random() * 0.2)) : null; // 10-30% discount

      products.push({
        name,
        description: generateDescription(category.name, name),
        price,
        discount_price: discountPrice,
        image_url: category.image_url, // Use the category image for products
        category_id: category.id
      });

      // Insert in batches of 50 to avoid overwhelming the database
      if (products.length === 50 || i === totalProducts - 1) {
        const { error } = await supabase
          .from('products')
          .insert(products);

        if (error) {
          console.error('Error inserting products:', error);
          return;
        }

        insertedCount += products.length;
        console.log(`Inserted ${products.length} products (Total: ${insertedCount}/${totalProducts})`);
        products.length = 0; // Clear the array for the next batch
      }
    }

    console.log('Finished generating products');
  } catch (error) {
    console.error('Error in generate products:', error);
  }
};

// Run the generator
generateProducts().catch(console.error); 