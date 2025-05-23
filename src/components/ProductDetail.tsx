import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { FiShoppingCart, FiHeart, FiShare2, FiChevronLeft, FiChevronRight, FiStar, FiCheckCircle } from 'react-icons/fi';
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
  image_urls?: string[];
  specifications: any;
  seller_id: string;
  category: { name: string; id: number; };
  seller: { email: string; };
}

interface Review {
  id: number;
  product_id: number;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  user: { email: string; };
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [adding, setAdding] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string | number, boolean>>({});

  useEffect(() => {
    if (id) {
      fetchProduct(parseInt(id));
    }
  }, [id]);

  const fetchProduct = async (productId: number) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch product details
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name),
          seller:profiles(email)
        `)
        .eq('id', productId)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setProduct(data);
        setActiveImage(0);
        
        // Fetch related products
        fetchRelatedProducts(data.category_id);
        
        // Fetch reviews
        fetchReviews(productId);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Failed to load product details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async (categoryId: number) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', categoryId)
        .neq('id', parseInt(id || '0'))
        .limit(4);

      if (error) {
        throw error;
      }

      setRelatedProducts(data || []);
    } catch (error) {
      console.error('Error fetching related products:', error);
    }
  };

  const fetchReviews = async (productId: number) => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          user:profiles(email)
        `)
        .eq('product_id', productId);

      if (error) {
        throw error;
      }

      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const addToCart = async () => {
    if (!user || !product) {
      navigate('/login');
      return;
    }
    
    try {
      setAdding(true);
      
      // Check if product is already in cart
      const { data: existingItems, error: checkError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', product.id);
      
      if (checkError) {
        throw checkError;
      }
      
      if (existingItems && existingItems.length > 0) {
        // Update quantity
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ 
            quantity: existingItems[0].quantity + quantity 
          })
          .eq('id', existingItems[0].id);
          
        if (updateError) {
          throw updateError;
        }
      } else {
        // Add new item
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: product.id,
            quantity: quantity
          });
          
        if (insertError) {
          throw insertError;
        }
      }
      
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 3000);
    } catch (error) {
      console.error('Error adding to cart:', error);
      setError('Failed to add product to cart.');
    } finally {
      setAdding(false);
    }
  };

  const handleQuantityChange = (value: number) => {
    if (value < 1) return;
    if (product && value > product.stock_quantity) return;
    setQuantity(value);
  };

  const calculateDiscount = (price: number, discountPrice?: number) => {
    if (!discountPrice) return null;
    const discountPercentage = ((price - discountPrice) / price) * 100;
    return Math.round(discountPercentage);
  };

  const formatSpecifications = (specs: any) => {
    if (!specs) return [];
    return Object.entries(specs).map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      value: value as string
    }));
  };

  const handleImageError = (productId: string | number) => {
    setImageErrors(prev => ({ ...prev, [productId]: true }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-700">{error || 'Product not found'}</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <ol className="flex text-sm">
          <li>
            <a href="/" className="text-indigo-600 hover:text-indigo-800">Home</a>
          </li>
          <li className="mx-2">/</li>
          <li>
            <a href={`/category/${product.category?.id}`} className="text-indigo-600 hover:text-indigo-800">
              {product.category?.name}
            </a>
          </li>
          <li className="mx-2">/</li>
          <li className="text-gray-500">{product.name}</li>
        </ol>
      </nav>

      {/* Success Message */}
      {addedToCart && (
        <div className="fixed top-6 right-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md shadow-lg z-50 animate-fadeIn">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiCheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Product added to your cart!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
          {/* Product Images */}
          <div>
            <div className="aspect-w-16 aspect-h-16 bg-gray-100 rounded-md overflow-hidden mb-4">
              <img 
                src={imageErrors[product.id] ? PLACEHOLDER_IMAGE : getSafeImageUrl(product.image_url)} 
                alt={product.name} 
                className="w-full h-full object-contain"
                onError={() => handleImageError(product.id)}
                loading="lazy"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
              />
            </div>
            
            {/* Thumbnails */}
            {(product.image_urls && product.image_urls.length > 0) && (
              <div className="flex space-x-2 mt-4 relative">
                <button 
                  onClick={() => setActiveImage(prev => Math.max(0, prev - 1))}
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-1 shadow-md z-10"
                >
                  <FiChevronLeft className="h-5 w-5 text-gray-500" />
                </button>
                
                <div className="flex space-x-2 overflow-x-auto flex-nowrap mx-8 py-2">
                  <div 
                    onClick={() => setActiveImage(0)}
                    className={`h-16 w-16 rounded-md overflow-hidden cursor-pointer border-2 ${activeImage === 0 ? 'border-indigo-500' : 'border-transparent'}`}
                  >
                    <img 
                      src={imageErrors[product.id] ? PLACEHOLDER_IMAGE : getSafeImageUrl(product.image_url)} 
                      alt={product.name} 
                      className="h-full w-full object-cover"
                      onError={() => handleImageError(product.id)}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                    />
                  </div>
                  
                  {product.image_urls.map((url, index) => (
                    <div 
                      key={index}
                      onClick={() => setActiveImage(index + 1)}
                      className={`h-16 w-16 rounded-md overflow-hidden cursor-pointer border-2 ${activeImage === index + 1 ? 'border-indigo-500' : 'border-transparent'}`}
                    >
                      <img 
                        src={imageErrors[`${product.id}-${index}`] ? PLACEHOLDER_IMAGE : getSafeImageUrl(url)} 
                        alt={`${product.name} ${index + 1}`} 
                        className="h-full w-full object-cover"
                        onError={() => handleImageError(`${product.id}-${index}`)}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                      />
                    </div>
                  ))}
                </div>
                
                <button 
                  onClick={() => setActiveImage(prev => Math.min((product.image_urls?.length || 0), prev + 1))}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-1 shadow-md z-10"
                >
                  <FiChevronRight className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            )}
          </div>
          
          {/* Product Info */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
            
            <div className="flex items-center mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <FiStar 
                    key={i} 
                    className={`w-5 h-5 ${i < (product.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                  />
                ))}
              </div>
              <span className="ml-2 text-sm text-gray-600">
                {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </span>
            </div>
            
            <div className="mb-4">
              {product.discount_price ? (
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-indigo-600">${product.discount_price.toFixed(2)}</span>
                  <span className="ml-2 text-lg text-gray-500 line-through">${product.price.toFixed(2)}</span>
                  <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">
                    {calculateDiscount(product.price, product.discount_price)}% OFF
                  </span>
                </div>
              ) : (
                <span className="text-2xl font-bold text-indigo-600">${product.price.toFixed(2)}</span>
              )}
            </div>
            
            <div className="border-t border-b py-4 my-4">
              <div className="text-sm text-gray-700 leading-relaxed">
                {product.description}
              </div>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <span className="text-gray-700 mr-4">Quantity:</span>
                <div className="flex items-center border rounded-md">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className="px-3 py-1 text-gray-600 hover:text-indigo-600"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                    min="1"
                    max={product.stock_quantity}
                    className="w-12 text-center border-x py-1"
                  />
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="px-3 py-1 text-gray-600 hover:text-indigo-600"
                  >
                    +
                  </button>
                </div>
              </div>
              
              <div className="flex items-center text-sm text-gray-600 mb-4">
                <span className={product.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                  {product.stock_quantity > 0 
                    ? `In Stock (${product.stock_quantity} available)` 
                    : 'Out of Stock'}
                </span>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={addToCart}
                disabled={adding || product.stock_quantity === 0}
                className={`px-6 py-3 rounded-md flex-1 flex items-center justify-center ${
                  product.stock_quantity === 0 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {adding ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <>
                    <FiShoppingCart className="mr-2" />
                    Add to Cart
                  </>
                )}
              </button>
              
              <button className="p-3 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50">
                <FiHeart />
              </button>
              
              <button className="p-3 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50">
                <FiShare2 />
              </button>
            </div>
          </div>
        </div>
        
        {/* Product Specifications and Reviews */}
        <div className="border-t">
          <div className="px-6 py-4">
            <h2 className="text-xl font-semibold mb-4">Specifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formatSpecifications(product.specifications).map((spec, index) => (
                <div key={index} className="flex">
                  <span className="w-1/3 text-gray-600">{spec.name}:</span>
                  <span className="w-2/3 font-medium">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
          
          {reviews.length > 0 && (
            <div className="border-t px-6 py-4">
              <h2 className="text-xl font-semibold mb-4">Customer Reviews</h2>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b pb-4 last:border-b-0">
                    <div className="flex justify-between mb-2">
                      <div className="flex items-center">
                        <div className="bg-indigo-100 rounded-full h-8 w-8 flex items-center justify-center mr-2">
                          <span className="text-indigo-800 font-semibold text-sm">
                            {review.user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium">{review.user.email.split('@')[0]}</span>
                      </div>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <FiStar 
                            key={i} 
                            className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{review.comment}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-6">Related Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <div key={relatedProduct.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <a href={`/product/${relatedProduct.id}`} className="block">
                  <div className="aspect-w-1 aspect-h-1 bg-gray-200">
                    <img 
                      src={getSafeImageUrl(relatedProduct.image_url)} 
                      alt={relatedProduct.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = PLACEHOLDER_IMAGE;
                      }}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-900 truncate">{relatedProduct.name}</h3>
                    <div className="mt-2 flex justify-between items-center">
                      {relatedProduct.discount_price ? (
                        <div>
                          <span className="text-indigo-600 font-bold">${relatedProduct.discount_price.toFixed(2)}</span>
                          <span className="ml-1 text-xs text-gray-500 line-through">${relatedProduct.price.toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="text-indigo-600 font-bold">${relatedProduct.price.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;