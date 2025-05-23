// This script helps set up a Supabase project
// Run with: node supabase-init.js

import { execSync } from 'child_process';
import fs from 'fs';
import readline from 'readline';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('Supabase Project Initialization');
console.log('===============================');

// Supabase project credentials
const SUPABASE_URL = 'https://unxdawgtuflaxmkoosyw.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVueGRhd2d0dWZsYXhta29vc3l3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzk4Mzc1NywiZXhwIjoyMDYzNTU5NzU3fQ.l7Om70BIjYdk3pJwUlxfHyDYml94htadIelsWMQ-i14';

// Initialize Supabase admin client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function executeSql(sql) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY
      },
      body: JSON.stringify({
        sql: sql
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to execute SQL');
    }

    return await response.json();
  } catch (error) {
    console.error('Error executing SQL:', error);
    throw error;
  }
}

async function initializeDatabase() {
  try {
    console.log('Initializing database...');

    // Create profiles table
    await executeSql(`
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID REFERENCES auth.users(id) PRIMARY KEY,
        email TEXT,
        role TEXT DEFAULT 'customer',
        full_name TEXT,
        phone TEXT,
        address TEXT,
        birth_date DATE,
        avatar_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
      );
    `);
    console.log('Created profiles table');

    // Create categories table
    await executeSql(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        parent_id INTEGER REFERENCES categories(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
      );
    `);
    console.log('Created categories table');

    // Create products table
    await executeSql(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        discount_price DECIMAL(10, 2),
        rating DECIMAL(2, 1) DEFAULT 0.0,
        stock_quantity INTEGER DEFAULT 0,
        category_id INTEGER REFERENCES categories(id),
        image_url TEXT,
        image_urls TEXT[],
        featured BOOLEAN DEFAULT false,
        specifications JSONB,
        seller_id UUID REFERENCES auth.users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
      );
    `);
    console.log('Created products table');

    // Insert sample categories
    await executeSql(`
      INSERT INTO categories (name, description, image_url)
      VALUES
        ('Electronics', 'Electronic devices and accessories', 'https://images.unsplash.com/photo-1550009158-9ebf69173e03'),
        ('Fashion', 'Clothing, shoes, and accessories', 'https://images.unsplash.com/photo-1483985988355-763728e1935b'),
        ('Home & Kitchen', 'Furniture, decor, and kitchen items', 'https://images.unsplash.com/photo-1484154218962-a197022b5858')
      ON CONFLICT (name) DO NOTHING;
    `);
    console.log('Inserted sample categories');

    // Enable Row Level Security
    await executeSql(`
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
      ALTER TABLE products ENABLE ROW LEVEL SECURITY;
    `);
    console.log('Enabled Row Level Security');

    // Create RLS policies
    await executeSql(`
      CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
      CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
      CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);
    `);
    console.log('Created RLS policies');

    console.log('Database initialization completed successfully!');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run initialization
initializeDatabase();

rl.question('Enter your Supabase project URL: ', (supabaseUrl) => {
  rl.question('Enter your Supabase anon key: ', (supabaseAnonKey) => {
    // Update the supabaseClient.ts file
    const clientContent = `import { createClient } from '@supabase/supabase-js';

// Supabase client configuration
const supabaseUrl = '${supabaseUrl}';
const supabaseAnonKey = '${supabaseAnonKey}';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);`;

    fs.writeFileSync('./src/lib/supabaseClient.ts', clientContent);
    console.log('Updated supabaseClient.ts with your credentials');

    // Create SQL for database setup
    const sqlContent = `-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  role TEXT DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  seller_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Set up RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE USING (auth.uid() = id);

-- Create policies for products
CREATE POLICY "Products are viewable by everyone" 
ON products FOR SELECT USING (true);

CREATE POLICY "Sellers can insert their own products" 
ON products FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own products" 
ON products FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their own products" 
ON products FOR DELETE USING (auth.uid() = seller_id);

-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function on new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`;

    fs.writeFileSync('./supabase-setup.sql', sqlContent);
    console.log('Created supabase-setup.sql with database setup SQL');
    
    console.log('\nSetup complete!');
    console.log('\nNext steps:');
    console.log('1. Run the development server: npm run dev');
    console.log('2. Go to your Supabase project and run the SQL from supabase-setup.sql in the SQL editor');
    console.log('3. Test your application at http://localhost:5173');
    
    rl.close();
  });
}); 