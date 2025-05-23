import fetch from 'node-fetch';
import * as fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config();

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

if (!UNSPLASH_ACCESS_KEY) {
  console.error('Missing UNSPLASH_ACCESS_KEY in .env file');
  process.exit(1);
}

// Category definitions with specific Unsplash photo IDs
const categories = [
  { id: 1, name: 'Electronics', photoId: 'ZtxED1cpB1E' }, // Electronics setup
  { id: 2, name: 'Clothing', photoId: 'JzJSybPFb3s' }, // Fashion clothing
  { id: 3, name: 'Home and Garden', photoId: 'XbwHrt87mQ0' }, // Modern furniture
  { id: 4, name: 'Books', photoId: 'YLSwjSy7stw' }, // Books collection
  { id: 5, name: 'Sports and Outdoors', photoId: 'h4i9G-de7Po' }, // Sports equipment
  { id: 6, name: 'Toys and Games', photoId: 'PUDQgqV6kBo' }, // Gaming setup
  { id: 7, name: 'Beauty and Personal Care', photoId: 'YGmk9UZMdZg' }, // Beauty products
  { id: 8, name: 'Automotive', photoId: 'N9Pf2J656aQ' }, // Car
  { id: 9, name: 'Health and Wellness', photoId: 'L2jk-uxb1MY' }, // Fitness equipment
  { id: 10, name: 'Food and Beverages', photoId: '08bOYnH_r_E' } // Food presentation
];

async function downloadImage(category) {
  try {
    const imageUrl = `https://source.unsplash.com/${category.photoId}/800x600`;
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to download image for ${category.name}`);
    }

    const buffer = await response.buffer();
    const publicDir = path.join(__dirname, '..', 'public', 'images', 'categories');
    
    // Create directories if they don't exist
    await fs.mkdir(publicDir, { recursive: true });
    
    const filename = path.join(publicDir, `${category.name.toLowerCase().replace(/\s+/g, '-')}.jpg`);
    await fs.writeFile(filename, buffer);
    
    console.log(`Downloaded image for ${category.name}`);
    
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (error) {
    console.error(`Error downloading image for ${category.name}:`, error);
  }
}

async function downloadAllImages() {
  try {
    console.log('Downloading category images...');
    
    for (const category of categories) {
      await downloadImage(category);
    }
    
    // Download a default placeholder
    console.log('Downloading default placeholder...');
    const placeholderCategory = { name: 'placeholder-product', photoId: 'qkCTQKBQzKk' };
    await downloadImage(placeholderCategory);
    
    console.log('All images downloaded successfully!');
  } catch (error) {
    console.error('Error downloading images:', error);
    process.exit(1);
  }
}

// Run the download
downloadAllImages(); 