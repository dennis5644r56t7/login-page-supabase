import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiPackage, FiUsers, FiSettings, FiLogOut, FiHeart, FiSearch, FiGrid, FiFilter, FiMenu, FiStar } from 'react-icons/fi';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  discount_price?: number;
  image_url: string;
  category_id: number;
  specifications?: any;
  rating?: number;
  featured?: boolean;
  stock_quantity?: number;
}

interface Category {
  id: number;
  name: string;
  description?: string;
  image_url?: string;
  parent_id?: number;
}

const Dashboard = () => {
  const { user, signOut, userRole } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .is('parent_id', null);

        if (categoriesError) throw categoriesError;
        if (categoriesData) setCategories(categoriesData);

        // Fetch featured products
        const { data: featuredData, error: featuredError } = await supabase
          .from('products')
          .select('*')
          .eq('featured', true)
          .limit(5);

        if (featuredError) throw featuredError;
        if (featuredData) setFeaturedProducts(featuredData);

        // Fetch all products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .limit(20); // Start with a limited number of products

        if (productsError) throw productsError;
        if (productsData) setProducts(productsData);

        // Get cart count
        if (user) {
          const { count, error: cartError } = await supabase
            .from('cart_items')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          if (!cartError && count !== null) setCartCount(count);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .ilike('name', `%${searchQuery}%`);
    
    if (error) {
      console.error('Error searching products:', error);
    } else if (data) {
      setProducts(data);
    }
    setLoading(false);
  };

  const filterByCategory = async (categoryId: number) => {
    setActiveCategory(categoryId);
    setLoading(true);
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category_id', categoryId);
    
    if (error) {
      console.error('Error filtering products:', error);
    } else if (data) {
      setProducts(data);
    }
    setLoading(false);
  };

  const resetFilters = async () => {
    setActiveCategory(null);
    setSearchQuery('');
    setLoading(true);
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(20);
    
    if (error) {
      console.error('Error fetching products:', error);
    } else if (data) {
      setProducts(data);
    }
    setLoading(false);
  };

  const addToCart = async (productId: number) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    try {
      // Check if product already exists in cart
      const { data: existingItems } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', productId);
      
      if (existingItems && existingItems.length > 0) {
        // Update quantity
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existingItems[0].quantity + 1 })
          .eq('id', existingItems[0].id);
          
        if (error) throw error;
      } else {
        // Add new item
        const { error } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: productId,
            quantity: 1
          });
          
        if (error) throw error;
      }
      
      setCartCount(cartCount + 1);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const calculateDiscount = (price: number, discountPrice?: number) => {
    if (!discountPrice) return null;
    const discountPercentage = ((price - discountPrice) / price) * 100;
    return Math.round(discountPercentage);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-indigo-600 text-white shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold">ShopEase</span>
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-4">
                  <a href="#" className="px-3 py-2 rounded-md text-sm font-medium bg-indigo-700">Home</a>
                  <a href="#" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">Categories</a>
                  <a href="#" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">Deals</a>
                  <a href="#" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">New Arrivals</a>
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="relative mx-4 lg:mx-0 hidden md:block">
                <div className="flex items-center">
                  <input
                    type="text"
                    className="bg-indigo-100 text-gray-900 rounded-l-lg px-3 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button 
                    className="bg-indigo-500 text-white px-3 py-2 rounded-r-lg hover:bg-indigo-700"
                    onClick={handleSearch}
                  >
                    <FiSearch />
                  </button>
                </div>
              </div>
              
              <div className="hidden md:flex items-center space-x-4">
                <button className="p-2 rounded-full hover:bg-indigo-700 focus:outline-none relative">
                  <FiHeart />
                </button>
                <button className="p-2 rounded-full hover:bg-indigo-700 focus:outline-none relative">
                  <FiShoppingCart />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>
                <div className="relative">
                  <button className="flex items-center space-x-1">
                    <span>{user?.email?.split('@')[0]}</span>
                  </button>
                </div>
                <button 
                  onClick={handleSignOut}
                  className="p-2 rounded-full hover:bg-indigo-700 focus:outline-none"
                >
                  <FiLogOut />
                </button>
              </div>
              
              <div className="md:hidden">
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
                  <FiMenu size={24} />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="#" className="block px-3 py-2 rounded-md text-base font-medium bg-indigo-700">Home</a>
              <a href="#" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-700">Categories</a>
              <a href="#" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-700">Deals</a>
              <a href="#" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-700">New Arrivals</a>
              <div className="relative my-2">
                <div className="flex items-center">
                  <input
                    type="text"
                    className="bg-indigo-100 text-gray-900 rounded-l-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button 
                    className="bg-indigo-500 text-white px-3 py-2 rounded-r-lg hover:bg-indigo-700"
                    onClick={handleSearch}
                  >
                    <FiSearch />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center px-3 py-2">
                <button className="p-2 rounded-full hover:bg-indigo-700 focus:outline-none relative flex items-center">
                  <FiHeart />
                  <span className="ml-2">Wishlist</span>
                </button>
                <button className="p-2 rounded-full hover:bg-indigo-700 focus:outline-none relative flex items-center">
                  <FiShoppingCart />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                  <span className="ml-2">Cart</span>
                </button>
              </div>
              <button 
                onClick={handleSignOut}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-700"
              >
                <div className="flex items-center">
                  <FiLogOut />
                  <span className="ml-2">Sign Out</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg text-white p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">Welcome to ShopEase, {user?.email?.split('@')[0]}!</h1>
              <p className="mb-4">Discover amazing products at the best prices.</p>
              <button className="bg-white text-indigo-600 font-semibold px-4 py-2 rounded-md shadow hover:bg-gray-100">
                Explore Deals
              </button>
            </div>
            <div className="mt-4 md:mt-0">
              <img src="https://via.placeholder.com/300x150?text=New+Arrivals" alt="Promotional banner" className="rounded-lg" />
            </div>
          </div>
        </div>

        {/* Categories Row */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {categories.map(category => (
              <div 
                key={category.id}
                onClick={() => filterByCategory(category.id)}
                className={`bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow text-center ${activeCategory === category.id ? 'ring-2 ring-indigo-500' : ''}`}
              >
                <div className="h-20 flex items-center justify-center">
                  {category.image_url ? (
                    <img src={category.image_url} alt={category.name} className="h-16 w-16 object-contain" />
                  ) : (
                    <FiGrid className="h-12 w-12 text-indigo-500" />
                  )}
                </div>
                <p className="mt-2 text-sm font-medium">{category.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Products Carousel */}
        {featuredProducts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Featured Products</h2>
            <div className="relative rounded-lg overflow-hidden">
              <div className="flex overflow-x-auto pb-4 hide-scrollbar">
                {featuredProducts.map(product => (
                  <div key={product.id} className="flex-none w-64 mr-4">
                    <div className="bg-white rounded-lg shadow-md overflow-hidden h-full">
                      <div className="relative h-48">
                        <img 
                          src={product.image_url || 'https://via.placeholder.com/300x200'} 
                          alt={product.name} 
                          className="w-full h-full object-cover"
                        />
                        {product.discount_price && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold">
                            {calculateDiscount(product.price, product.discount_price)}% OFF
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-md font-semibold truncate">{product.name}</h3>
                        <div className="flex items-center mt-1">
                          {[...Array(5)].map((_, i) => (
                            <FiStar key={i} className={`w-4 h-4 ${i < (product.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                          ))}
                        </div>
                        <div className="mt-2 flex items-center">
                          {product.discount_price ? (
                            <>
                              <span className="text-indigo-600 font-bold">${product.discount_price.toFixed(2)}</span>
                              <span className="ml-2 text-gray-500 text-sm line-through">${product.price.toFixed(2)}</span>
                            </>
                          ) : (
                            <span className="text-indigo-600 font-bold">${product.price.toFixed(2)}</span>
                          )}
                        </div>
                        <button 
                          onClick={() => addToCart(product.id)}
                          className="mt-3 w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex flex-col md:flex-row">
          {/* Sidebar Filters */}
          <div className="w-full md:w-64 mb-6 md:mb-0 md:mr-6">
            <div className="bg-white rounded-lg shadow-md p-4 sticky top-20">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Filters</h3>
                <button 
                  onClick={resetFilters}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Reset All
                </button>
              </div>
              
              <div className="mb-4">
                <h4 className="font-medium mb-2">Price Range</h4>
                <div className="flex items-center">
                  <input 
                    type="range"
                    min="0"
                    max="1000"
                    className="w-full"
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-sm text-gray-600">$0</span>
                  <span className="text-sm text-gray-600">$1000</span>
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="font-medium mb-2">Categories</h4>
                <div className="space-y-2">
                  {categories.map(category => (
                    <div key={category.id} className="flex items-center">
                      <input 
                        type="checkbox"
                        id={`category-${category.id}`}
                        checked={activeCategory === category.id}
                        onChange={() => filterByCategory(category.id)}
                        className="mr-2"
                      />
                      <label htmlFor={`category-${category.id}`} className="text-sm">{category.name}</label>
                    </div>
                  ))}
                </div>
              </div>
              
              {userRole === 'seller' || userRole === 'admin' ? (
                <div className="mt-6 pt-4 border-t">
                  <h3 className="font-semibold mb-2">Seller Tools</h3>
                  <a href="#" className="block py-2 text-indigo-600 hover:underline">
                    <FiPackage className="inline mr-2" />
                    Manage Products
                  </a>
                  {userRole === 'admin' && (
                    <a href="#" className="block py-2 text-indigo-600 hover:underline">
                      <FiUsers className="inline mr-2" />
                      Manage Users
                    </a>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">
                {activeCategory 
                  ? `${categories.find(c => c.id === activeCategory)?.name} Products` 
                  : 'All Products'}
              </h2>
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">Sort by:</span>
                <select className="bg-white border rounded-md px-2 py-1 text-sm">
                  <option>Featured</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Customer Rating</option>
                  <option>Newest</option>
                </select>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <>
                {products.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-md py-8 text-center">
                    <FiFilter className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No products found</h3>
                    <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
                    <button 
                      onClick={resetFilters}
                      className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      View All Products
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map((product) => (
                      <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="relative h-48">
                          <img 
                            src={product.image_url || 'https://via.placeholder.com/300x200'} 
                            alt={product.name} 
                            className="w-full h-full object-cover"
                          />
                          {product.discount_price && (
                            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold">
                              {calculateDiscount(product.price, product.discount_price)}% OFF
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="text-md font-semibold truncate">{product.name}</h3>
                          <p className="text-gray-600 text-sm mt-1 line-clamp-2">{product.description}</p>
                          <div className="flex items-center mt-2">
                            {[...Array(5)].map((_, i) => (
                              <FiStar key={i} className={`w-4 h-4 ${i < (product.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                            ))}
                          </div>
                          <div className="mt-2 flex items-center">
                            {product.discount_price ? (
                              <>
                                <span className="text-indigo-600 font-bold">${product.discount_price.toFixed(2)}</span>
                                <span className="ml-2 text-gray-500 text-sm line-through">${product.price.toFixed(2)}</span>
                              </>
                            ) : (
                              <span className="text-indigo-600 font-bold">${product.price.toFixed(2)}</span>
                            )}
                          </div>
                          <button 
                            onClick={() => addToCart(product.id)}
                            className="mt-3 w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {products.length > 0 && (
                  <div className="mt-8 flex justify-center">
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
                      Load More Products
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">ShopEase</h3>
              <p className="text-gray-400">Your one-stop shop for all your needs with great deals and fast delivery.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Home</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Products</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Categories</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Deals</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Customer Service</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">FAQs</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Shipping Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Returns & Refunds</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Newsletter</h3>
              <p className="text-gray-400 mb-2">Subscribe to receive updates on new arrivals and special offers.</p>
              <div className="flex">
                <input 
                  type="email"
                  placeholder="Your email address"
                  className="bg-gray-700 text-white px-3 py-2 rounded-l-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} ShopEase. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard; 