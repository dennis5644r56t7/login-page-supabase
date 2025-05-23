import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { FiHeart, FiTrash2, FiShoppingCart } from 'react-icons/fi';

interface FavoriteProduct {
  id: number;
  user_id: string;
  product_id: number;
  created_at: string;
  product: {
    id: number;
    name: string;
    price: number;
    discount_price?: number;
    image_url: string;
    category: {
      id: number;
      name: string;
    };
  };
}

const Favorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          product:products(
            id, name, price, discount_price, image_url,
            category:categories(id, name)
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setFavorites(data || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setError('Failed to load your favorites.');
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (favoriteId: number) => {
    try {
      setRemoving(true);
      
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setFavorites(prev => prev.filter(fav => fav.id !== favoriteId));
    } catch (error) {
      console.error('Error removing favorite:', error);
      setError('Failed to remove from favorites. Please try again.');
    } finally {
      setRemoving(false);
    }
  };

  const addToCart = async (productId: number) => {
    try {
      // Check if product is already in cart
      const { data: existingItems, error: checkError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user?.id)
        .eq('product_id', productId);
      
      if (checkError) {
        throw checkError;
      }
      
      if (existingItems && existingItems.length > 0) {
        // Update quantity
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ 
            quantity: existingItems[0].quantity + 1 
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
            user_id: user?.id,
            product_id: productId,
            quantity: 1
          });
          
        if (insertError) {
          throw insertError;
        }
      }
      
      alert('Added to cart successfully!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      setError('Failed to add product to cart.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6 flex items-center">
        <FiHeart className="mr-2 text-red-500" /> Your Favorites
      </h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          {error}
        </div>
      )}
      
      {favorites.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <FiHeart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-medium text-gray-900 mb-2">No favorites yet</h2>
          <p className="text-gray-600 mb-6">You haven't added any products to your favorites yet.</p>
          <Link
            to="/products"
            className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 inline-flex items-center"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map((favorite) => (
            <div key={favorite.id} className="bg-white rounded-lg shadow-md overflow-hidden relative">
              <Link to={`/product/${favorite.product.id}`}>
                <div className="aspect-w-1 aspect-h-1 bg-gray-200">
                  <img 
                    src={favorite.product.image_url || '/images/placeholder.jpg'} 
                    alt={favorite.product.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="text-xs text-indigo-600 uppercase tracking-wide font-semibold">
                    {favorite.product.category.name}
                  </div>
                  <h3 className="mt-1 text-sm font-medium text-gray-900 truncate">
                    {favorite.product.name}
                  </h3>
                  <div className="mt-2 flex justify-between items-center">
                    {favorite.product.discount_price ? (
                      <div>
                        <span className="text-indigo-600 font-bold">${favorite.product.discount_price.toFixed(2)}</span>
                        <span className="ml-1 text-xs text-gray-500 line-through">${favorite.product.price.toFixed(2)}</span>
                      </div>
                    ) : (
                      <span className="text-indigo-600 font-bold">${favorite.product.price.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </Link>
              
              <div className="absolute top-2 right-2 flex flex-col space-y-2">
                <button
                  onClick={() => removeFavorite(favorite.id)}
                  disabled={removing}
                  className="p-2 bg-white rounded-full shadow-md text-red-500 hover:text-red-700"
                >
                  <FiTrash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => addToCart(favorite.product.id)}
                  className="p-2 bg-white rounded-full shadow-md text-indigo-600 hover:text-indigo-800"
                >
                  <FiShoppingCart className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites; 