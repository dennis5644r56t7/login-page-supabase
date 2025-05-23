const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const { createApi } = require('unsplash-js');
const fetch = require('node-fetch');
const { faker } = require('@faker-js/faker');

// Load environment variables
dotenv.config();

console.log('All environment variables:', process.env);

// Check for required environment variables
if (!process.env.VITE_SUPABASE_URL) {
  throw new Error('VITE_SUPABASE_URL is required');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
}
if (!process.env.UNSPLASH_ACCESS_KEY) {
  throw new Error('UNSPLASH_ACCESS_KEY is required');
}

console.log('Environment variables loaded:', {
  supabaseUrl: process.env.VITE_SUPABASE_URL,
  hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  hasUnsplashKey: !!process.env.UNSPLASH_ACCESS_KEY
});

// Initialize Unsplash client
const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY,
  fetch: fetch,
});

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Product categories with their Unsplash search terms and specific details
const categories = [
  {
    name: 'Electronics',
    searchTerm: 'electronics gadgets',
    brands: ['Apple', 'Samsung', 'Sony', 'Dell', 'LG', 'Lenovo', 'HP'],
    priceRange: { min: 199, max: 2999 },
    specifications: ['Processor', 'RAM', 'Storage', 'Display', 'Battery Life']
  },
  {
    name: 'Clothing',
    searchTerm: 'fashion clothing',
    brands: ['Nike', 'Adidas', 'Zara', 'H&M', 'Uniqlo', 'Levi\'s'],
    priceRange: { min: 19, max: 299 },
    specifications: ['Material', 'Size', 'Color', 'Style', 'Fit']
  },
  {
    name: 'Home & Garden',
    searchTerm: 'home decor',
    brands: ['IKEA', 'Wayfair', 'Ashley', 'West Elm', 'Crate & Barrel'],
    priceRange: { min: 29, max: 1999 },
    specifications: ['Material', 'Dimensions', 'Style', 'Color', 'Assembly Required']
  },
  {
    name: 'Sports & Outdoors',
    searchTerm: 'sports equipment',
    brands: ['Nike', 'Adidas', 'Under Armour', 'The North Face', 'Columbia'],
    priceRange: { min: 15, max: 499 },
    specifications: ['Material', 'Size', 'Sport Type', 'Weather Resistance']
  },
  {
    name: 'Books',
    searchTerm: 'books library',
    brands: ['Penguin', 'HarperCollins', 'Random House', 'Simon & Schuster'],
    priceRange: { min: 9, max: 99 },
    specifications: ['Format', 'Language', 'Pages', 'Publisher', 'Publication Year']
  },
  {
    name: 'Toys & Games',
    searchTerm: 'toys games',
    brands: ['LEGO', 'Hasbro', 'Mattel', 'Nintendo', 'Fisher-Price'],
    priceRange: { min: 9, max: 299 },
    specifications: ['Age Range', 'Category', 'Number of Players', 'Material']
  },
  {
    name: 'Beauty & Personal Care',
    searchTerm: 'beauty cosmetics',
    brands: ['L\'Oreal', 'MAC', 'Estee Lauder', 'Clinique', 'Neutrogena'],
    priceRange: { min: 5, max: 299 },
    specifications: ['Skin Type', 'Benefits', 'Volume/Weight', 'Ingredients']
  },
  {
    name: 'Jewelry',
    searchTerm: 'jewelry accessories',
    brands: ['Pandora', 'Swarovski', 'Tiffany & Co.', 'Cartier', 'Alex and Ani'],
    priceRange: { min: 19, max: 9999 },
    specifications: ['Material', 'Style', 'Gemstone', 'Size', 'Occasion']
  },
  {
    name: 'Automotive',
    searchTerm: 'car accessories',
    brands: ['Bosch', '3M', 'Michelin', 'Castrol', 'Meguiar\'s'],
    priceRange: { min: 9, max: 499 },
    specifications: ['Compatibility', 'Material', 'Installation', 'Warranty']
  },
  {
    name: 'Pet Supplies',
    searchTerm: 'pet supplies',
    brands: ['Purina', 'Royal Canin', 'Pedigree', 'Kong', 'Whiskas'],
    priceRange: { min: 5, max: 299 },
    specifications: ['Pet Type', 'Age Range', 'Size', 'Material', 'Features']
  }
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

async function getUnsplashImages(searchTerm, count) {
  const images = [];
  
  try {
    // Try to fetch photos from Unsplash
    const result = await unsplash.photos.getRandom({
      count: count,
      query: searchTerm,
      orientation: 'squarish'
    });

    if (result.errors) {
      console.error('Error fetching Unsplash images:', result.errors);
      // Fallback to using placeholder images
      for (let i = 0; i < count; i++) {
        images.push(`https://picsum.photos/400/400?random=${i}`);
      }
    } else {
      // Use the Unsplash images with direct URLs
      result.response.forEach(photo => {
        // Use the raw URL for direct linking as per Unsplash API guidelines
        images.push(photo.urls.raw + '&w=400&h=400&fit=crop&q=80');
      });
    }
  } catch (error) {
    console.error('Error with Unsplash API:', error);
    // Fallback to using placeholder images
    for (let i = 0; i < count; i++) {
      images.push(`https://picsum.photos/400/400?random=${i}`);
    }
  }
  
  return images;
}

// Helper function to generate random colors
function getRandomColor() {
  const colors = [
    'ff9b9b', 'ffb366', 'ffff66', '99ff99', '99ffff', '9999ff', 'ff99ff',
    'ff6666', 'ff8533', 'ffff33', '66ff66', '66ffff', '6666ff', 'ff66ff'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function generateProductDescription(category, brand, specs) {
  const benefits = [
    'Perfect for everyday use',
    'Premium quality materials',
    'Designed for maximum comfort',
    'Built to last',
    'Exceptional value for money'
  ];

  const features = specs.map(spec => 
    `${spec}: ${faker.commerce.productAdjective()} ${faker.commerce.productMaterial()}`
  );

  return `${faker.commerce.productDescription()}

Brand: ${brand}
${features.join('\n')}

Key Benefits:
- ${benefits[Math.floor(Math.random() * benefits.length)]}
- ${faker.commerce.productAdjective()} design
- ${faker.commerce.productAdjective()} performance

${Math.random() > 0.5 ? 'Limited time offer!' : 'Best seller in its category!'}`;
}

async function createProducts(dbCategories) {
  console.log('Creating products...');
  const productsPerCategory = Math.ceil(1000 / categories.length);

  for (const dbCategory of dbCategories) {
    console.log(`Creating products for category: ${dbCategory.name}`);
    
    const categoryConfig = categories.find(c => c.name === dbCategory.name);
    const images = await getUnsplashImages(categoryConfig.searchTerm, productsPerCategory);

    const products = Array.from({ length: productsPerCategory }, (_, i) => {
      const brand = categoryConfig.brands[Math.floor(Math.random() * categoryConfig.brands.length)];
      const basePrice = faker.number.float({
        min: categoryConfig.priceRange.min,
        max: categoryConfig.priceRange.max,
        precision: 0.01
      });
      const hasDiscount = Math.random() > 0.7;
      const discountPercent = Math.random() * 0.3 + 0.1; // 10-40% discount
      
      return {
        name: `${brand} ${faker.commerce.productName()}`,
        description: generateProductDescription(categoryConfig, brand, categoryConfig.specifications),
        price: basePrice,
        discount_price: hasDiscount ? basePrice * (1 - discountPercent) : null,
        image_url: images[i % images.length],
        category_id: dbCategory.id,
        stock_quantity: faker.number.int({ min: 0, max: 100 }),
        brand: brand,
        specifications: JSON.stringify(
          Object.fromEntries(
            categoryConfig.specifications.map(spec => 
              [spec, faker.commerce.productAdjective()]
            )
          )
        )
      };
    });

    const chunks = [];
    for (let i = 0; i < products.length; i += 50) {
      chunks.push(products.slice(i, i + 50));
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
    console.log('Starting database population...');
    const categories = await createCategories();
    console.log(`Created ${categories.length} categories`);
    await createProducts(categories);
    console.log('Database populated successfully!');
  } catch (error) {
    console.error('Error populating database:', error);
  }
}

main(); 