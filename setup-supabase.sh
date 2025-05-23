#!/bin/bash

# Color constants
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=========================================${NC}"
echo -e "${YELLOW}      Supabase Setup Script ${NC}"
echo -e "${YELLOW}=========================================${NC}"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo -e "${YELLOW}Creating .env file...${NC}"
  echo "SUPABASE_URL=https://unxdawgtuflaxmkoosyw.supabase.co" > .env
  echo "SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVueGRhd2d0dWZsYXhta29vc3l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5ODM3NTcsImV4cCI6MjA2MzU1OTc1N30.dWbJXhvH1aYewedQepb-rZ_caLknoHR36He8FsOXU_U" >> .env
  echo -e "${GREEN}Created .env file with default Supabase credentials.${NC}"
else
  echo -e "${GREEN}.env file already exists.${NC}"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Installing dependencies...${NC}"
  npm install
  echo -e "${GREEN}Dependencies installed.${NC}"
else
  echo -e "${GREEN}Dependencies already installed.${NC}"
fi

# Create scripts directory if it doesn't exist
if [ ! -d "scripts" ]; then
  echo -e "${YELLOW}Creating scripts directory...${NC}"
  mkdir -p scripts
  echo -e "${GREEN}Created scripts directory.${NC}"
else
  echo -e "${GREEN}Scripts directory already exists.${NC}"
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo -e "${YELLOW}Supabase CLI not found. Setting up Supabase initialization script...${NC}"
  
  # Run the Node.js initialization script
  echo -e "${YELLOW}Running Supabase initialization script...${NC}"
  node supabase-init.js
  
  echo -e "${GREEN}Supabase initialization completed.${NC}"
else
  echo -e "${GREEN}Supabase CLI found. You can use it for advanced operations.${NC}"
  
  # Ask if user wants to run the initialization script anyway
  read -p "Do you want to run the initialization script anyway? (y/n) " answer
  if [[ $answer == "y" || $answer == "Y" ]]; then
    echo -e "${YELLOW}Running Supabase initialization script...${NC}"
    node supabase-init.js
    echo -e "${GREEN}Supabase initialization completed.${NC}"
  fi
fi

# Ask if user wants to generate sample products
read -p "Do you want to generate sample products? (300-500 products will be added) (y/n) " generate_products
if [[ $generate_products == "y" || $generate_products == "Y" ]]; then
  echo -e "${YELLOW}How many products would you like to generate?${NC}"
  read -p "Enter a number (default: 300): " product_count
  product_count=${product_count:-300}
  
  echo -e "${YELLOW}Generating ${product_count} sample products...${NC}"
  npm run generate-products -- ${product_count}
  echo -e "${GREEN}Product generation completed.${NC}"
fi

echo -e "${GREEN}Setup completed successfully.${NC}"
echo -e "${YELLOW}=========================================${NC}"
echo -e "${YELLOW}  Your Supabase project is now ready! ${NC}"
echo -e "${YELLOW}=========================================${NC}"
echo -e "URL: https://unxdawgtuflaxmkoosyw.supabase.co"
echo -e "API Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVueGRhd2d0dWZsYXhta29vc3l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5ODM3NTcsImV4cCI6MjA2MzU1OTc1N30.dWbJXhvH1aYewedQepb-rZ_caLknoHR36He8FsOXU_U"
echo -e "${YELLOW}=========================================${NC}"
echo -e "To start the application, run: npm run dev" 