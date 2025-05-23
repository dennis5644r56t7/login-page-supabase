import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useCart } from '../context/CartContext';
import { PLACEHOLDER_IMAGE, getSafeImageUrl } from '../lib/imageUtils';
import { formatCurrency } from '../lib/currencyUtils';

interface Product {
  id: number;
  name: string;
  price: number;
  discount_price: number | null;
  image_url: string;
  category: {
    name: string;
  };
  rating?: number;
}

interface Category {
  id: number;
  name: string;
}

const Products = () => {
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('category');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const { addToCart } = useCart();

  useEffect(() => {
    Promise.all([fetchProducts(), fetchCategories()])
      .finally(() => setLoading(false));
  }, [categoryId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          price,
          discount_price,
          image_url,
          category:categories (name)
        `);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform the data to match the Product interface
      const transformedData = data?.map(item => ({
        ...item,
        category: item.category[0] || { id: 0, name: 'Uncategorized' }
      })) || [];

      setProducts(transformedData);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleImageError = (productId: number) => {
    setImageErrors(prev => ({ ...prev, [productId]: true }));
  };

  const calculateDiscount = (originalPrice: number, discountPrice: number) => {
    return Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
  };

  const handleAddToCart = async (productId: number) => {
    try {
      await addToCart(productId, 1);
      alert('Product added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add product to cart. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Error</h2>
          <p className="mt-2 text-gray-600">{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchProducts();
            }}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
          {categoryId 
            ? `${categories.find(c => c.id === parseInt(categoryId))?.name || 'Products'}`
            : 'All Products'
          }
        </h1>
        <div className="flex space-x-4">
          <Link
            to="/products"
            className={`px-4 py-2 rounded-md ${
              !categoryId
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/products?category=${category.id}`}
              className={`px-4 py-2 rounded-md ${
                categoryId === category.id.toString()
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No products found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <div key={product.id} className="group relative">
              <div className="w-full aspect-w-1 aspect-h-1 rounded-lg overflow-hidden bg-gray-200">
                <img
                  src={imageErrors[product.id] ? PLACEHOLDER_IMAGE : getSafeImageUrl(product.image_url)}
                  alt={product.name}
                  className="w-full h-full object-center object-cover group-hover:opacity-75"
                  onError={() => handleImageError(product.id)}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
              </div>
              <div className="mt-4 flex justify-between">
                <div>
                  <h3 className="text-sm text-gray-700">
                    <Link to={`/products/${product.id}`}>
                      <span aria-hidden="true" className="absolute inset-0" />
                      {product.name}
                    </Link>
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {product.category?.name || 'Uncategorized'}
                  </p>
                </div>
                <div className="text-right">
                  {product.discount_price ? (
                    <div>
                      <span className="text-indigo-600 font-bold">{formatCurrency(product.discount_price)}</span>
                      <span className="ml-1 text-xs text-gray-500 line-through">{formatCurrency(product.price)}</span>
                      <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-800 text-xs font-semibold rounded">
                        {calculateDiscount(product.price, product.discount_price)}% OFF
                      </span>
                    </div>
                  ) : (
                    <span className="text-indigo-600 font-bold">{formatCurrency(product.price)}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleAddToCart(product.id)}
                className="mt-4 w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Products; 