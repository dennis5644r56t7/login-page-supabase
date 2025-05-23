import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { FiFilter, FiGrid, FiList, FiSearch, FiStar, FiChevronDown } from 'react-icons/fi';
import { PLACEHOLDER_IMAGE, getSafeImageUrl } from '../lib/imageUtils';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  discount_price?: number;
  rating?: number;
  stock_quantity: number;
  category_id: number;
  image_url: string;
  seller_id: string;
  created_at: string;
  category: { name: string; id: number; };
}

interface Category {
  id: number;
  name: string;
  image_url?: string;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [sortOption, setSortOption] = useState('newest');
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 1000 });
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  const productsPerPage = 12;

  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, sortOption, currentPage, searchQuery, priceRange]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) {
        throw error;
      }
      
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name)
        `)
        .gte('price', priceRange.min)
        .lte('price', priceRange.max);
      
      // Add category filter if selected
      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }
      
      // Add search query if provided
      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }
      
      // Get count for pagination
      const countQuery = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .gte('price', priceRange.min)
        .lte('price', priceRange.max);
      
      // Apply same filters to count query
      if (selectedCategory) {
        countQuery.eq('category_id', selectedCategory);
      }
      
      if (searchQuery) {
        countQuery.ilike('name', `%${searchQuery}%`);
      }
      
      const { count, error: countError } = await countQuery;
      
      if (countError) {
        throw countError;
      }
      
      setTotalPages(Math.ceil((count || 0) / productsPerPage));
      
      // Sort products
      switch (sortOption) {
        case 'price-low':
          query = query.order('price');
          break;
        case 'price-high':
          query = query.order('price', { ascending: false });
          break;
        case 'popular':
          query = query.order('rating', { ascending: false });
          break;
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }
      
      // Add pagination
      const from = (currentPage - 1) * productsPerPage;
      const to = from + productsPerPage - 1;
      query = query.range(from, to);
      
      // Execute query
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  const handleCategoryChange = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
  };

  const handleSortChange = (option: string) => {
    setSortOption(option);
    setCurrentPage(1);
  };

  const handlePriceRangeChange = (min: number, max: number) => {
    setPriceRange({ min, max });
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const toggleFilters = () => {
    setFiltersOpen(!filtersOpen);
  };

  const renderStars = (rating: number = 0) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <FiStar 
            key={i} 
            className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
          />
        ))}
      </div>
    );
  };

  const calculateDiscount = (price: number, discountPrice?: number) => {
    if (!discountPrice) return null;
    const discountPercentage = ((price - discountPrice) / price) * 100;
    return Math.round(discountPercentage);
  };

  const handleImageError = (productId: number) => {
    setImageErrors(prev => ({ ...prev, [productId]: true }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">All Products</h1>
      
      {/* Search and Filters Bar */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="block w-full border border-gray-300 rounded-md py-2 pl-10 pr-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </form>
          
          <div className="flex space-x-2">
            <button
              onClick={toggleFilters}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FiFilter className="h-4 w-4 mr-2" />
              Filters
            </button>
            
            <div className="hidden md:flex items-center space-x-2">
              <button
                onClick={() => setViewType('grid')}
                className={`p-2 rounded-md ${viewType === 'grid' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <FiGrid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewType('list')}
                className={`p-2 rounded-md ${viewType === 'list' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <FiList className="h-5 w-5" />
              </button>
            </div>
            
            <div className="relative">
              <select
                value={sortOption}
                onChange={(e) => handleSortChange(e.target.value)}
                className="block appearance-none w-full border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="popular">Popular</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <FiChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
        
        {filtersOpen && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Categories</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    id="category-all"
                    type="radio"
                    checked={selectedCategory === null}
                    onChange={() => handleCategoryChange(null)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="category-all" className="ml-2 text-sm text-gray-700">All Categories</label>
                </div>
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center">
                    <input
                      id={`category-${category.id}`}
                      type="radio"
                      checked={selectedCategory === category.id}
                      onChange={() => handleCategoryChange(category.id)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <label htmlFor={`category-${category.id}`} className="ml-2 text-sm text-gray-700">{category.name}</label>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Price Range</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="price-min" className="sr-only">Minimum Price</label>
                    <input
                      type="number"
                      id="price-min"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) => handlePriceRangeChange(Number(e.target.value), priceRange.max)}
                      className="block w-full border border-gray-300 rounded-md py-1.5 px-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="price-max" className="sr-only">Maximum Price</label>
                    <input
                      type="number"
                      id="price-max"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) => handlePriceRangeChange(priceRange.min, Number(e.target.value))}
                      className="block w-full border border-gray-300 rounded-md py-1.5 px-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <button
                  onClick={() => fetchProducts()}
                  className="w-full py-1.5 px-3 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {/* Products Grid or List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl font-medium text-gray-900 mb-2">No products found</h2>
          <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
        </div>
      ) : (
        <div className={viewType === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
          {products.map((product) => (
            viewType === 'grid' ? (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <Link to={`/product/${product.id}`}>
                  <div className="aspect-w-1 aspect-h-1 bg-gray-200">
                    <img 
                      src={imageErrors[product.id] ? PLACEHOLDER_IMAGE : getSafeImageUrl(product.image_url)} 
                      alt={product.name} 
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(product.id)}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                    />
                  </div>
                  <div className="p-4">
                    <div className="text-xs text-indigo-600 uppercase tracking-wide font-semibold">{product.category.name}</div>
                    <h3 className="mt-1 text-sm font-medium text-gray-900 truncate">{product.name}</h3>
                    <div className="mt-1">
                      {renderStars(product.rating || 0)}
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                      {product.discount_price ? (
                        <div>
                          <span className="text-indigo-600 font-bold">${product.discount_price.toFixed(2)}</span>
                          <span className="ml-1 text-xs text-gray-500 line-through">${product.price.toFixed(2)}</span>
                          <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-800 text-xs font-semibold rounded">
                            {calculateDiscount(product.price, product.discount_price)}% OFF
                          </span>
                        </div>
                      ) : (
                        <span className="text-indigo-600 font-bold">${product.price.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            ) : (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="flex">
                  <div className="w-48 h-48 flex-shrink-0">
                    <img 
                      src={imageErrors[product.id] ? PLACEHOLDER_IMAGE : getSafeImageUrl(product.image_url)} 
                      alt={product.name} 
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(product.id)}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                    />
                  </div>
                  <div className="p-4 flex-1">
                    <div className="text-xs text-indigo-600 uppercase tracking-wide font-semibold">{product.category.name}</div>
                    <Link to={`/product/${product.id}`} className="block mt-1">
                      <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                    </Link>
                    <div className="mt-1">
                      {renderStars(product.rating || 0)}
                    </div>
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">{product.description}</p>
                    <div className="mt-4 flex justify-between items-center">
                      {product.discount_price ? (
                        <div>
                          <span className="text-indigo-600 font-bold text-lg">${product.discount_price.toFixed(2)}</span>
                          <span className="ml-1 text-gray-500 line-through">${product.price.toFixed(2)}</span>
                          <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-800 text-xs font-semibold rounded">
                            {calculateDiscount(product.price, product.discount_price)}% OFF
                          </span>
                        </div>
                      ) : (
                        <span className="text-indigo-600 font-bold text-lg">${product.price.toFixed(2)}</span>
                      )}
                      <Link 
                        to={`/product/${product.id}`} 
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        View Product
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center mt-8">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-2 py-2 rounded-l-md border ${
                currentPage === 1 
                  ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className="sr-only">Previous</span>
              &laquo;
            </button>
            
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => handlePageChange(i + 1)}
                className={`relative inline-flex items-center px-4 py-2 border ${
                  currentPage === i + 1
                    ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center px-2 py-2 rounded-r-md border ${
                currentPage === totalPages 
                  ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className="sr-only">Next</span>
              &raquo;
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default Products; 