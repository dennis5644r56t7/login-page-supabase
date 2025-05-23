# ShopEase E-commerce Platform

A full-featured e-commerce application built with React, TypeScript, Tailwind CSS, and Supabase. Features include user authentication with email verification, multi-role functionality (Customer, Seller, Admin), product management, and a beautiful responsive interface.

## Features

- **Authentication**
  - Email/password login with email verification
  - Multi-role user system (Customer, Seller, Admin)
  - Protected routes based on authentication

- **Products**
  - Browse products with filtering and search
  - Product categories and subcategories
  - Featured products section
  - Detailed product information with images and specifications

- **Shopping**
  - Add products to cart
  - View and manage shopping cart
  - Checkout process

- **Seller Dashboard**
  - Product management for sellers
  - Sales analytics

- **Admin Tools**
  - User management
  - Category management
  - System-wide analytics

## Technology Stack

- **Frontend**
  - React 18 with TypeScript
  - React Router for navigation
  - Tailwind CSS for styling
  - React Icons for UI elements

- **Backend**
  - Supabase for authentication, database, and storage
  - PostgreSQL database with row-level security

## Setup Instructions

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/shopease.git
   cd shopease
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Supabase:
   ```bash
   chmod +x setup-supabase.sh
   ./setup-supabase.sh
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Sample Data Generation

The application includes a script to generate sample product data (300-500 products):

1. You can run this during the setup script when prompted
2. Alternatively, run it manually:
   ```bash
   npm run generate-products
   ```

3. To specify a custom number of products:
   ```bash
   npm run generate-products -- 500
   ```

## Email Verification

By default, the application includes email verification during the registration process:

1. Users register with email, password, and role
2. A verification email is sent to the provided email address
3. The verification page guides users through the process
4. After verification, users can log in with their credentials

## Project Structure

```
shopease/
├── public/             # Static files
├── src/
│   ├── assets/         # Images and other assets
│   ├── components/     # React components
│   ├── context/        # Context providers (Auth, Cart)
│   ├── lib/            # Utility functions and configurations
│   ├── App.tsx         # Main application component
│   └── main.tsx        # Application entry point
├── scripts/            # Utility scripts
└── ... configuration files
```

## License

This project is licensed under the MIT License.

## Acknowledgements

- Images from Unsplash
- Icons from React Icons

## Currency

All prices in the application are displayed in KSH (Kenyan Shillings). The conversion rate used is:
1 USD = 150 KSH

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
# Auth-Pages-and-Simple-DB-practice-using-supabase
