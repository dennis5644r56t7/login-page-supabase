import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';
import CartDrawer from './CartDrawer';

export default function Navigation() {
  const { user, signOut } = useAuth();
  const { cartCount } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <>
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-indigo-600">E-Shop</span>
              </Link>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
                >
                  Home
                </Link>
                <Link
                  to="/products"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  Products
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-gray-600 hover:text-gray-900"
              >
                <ShoppingBagIcon className="h-6 w-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-indigo-600 rounded-full">
                    {cartCount}
                  </span>
                )}
              </button>
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                {user ? (
                  <div className="ml-3 relative flex items-center space-x-4">
                    <Link
                      to="/profile"
                      className="text-sm font-medium text-gray-500 hover:text-gray-900"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => signOut()}
                      className="text-sm font-medium text-gray-500 hover:text-gray-900"
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  <div className="space-x-4">
                    <Link
                      to="/login"
                      className="text-sm font-medium text-gray-500 hover:text-gray-900"
                    >
                      Sign in
                    </Link>
                    <Link
                      to="/register"
                      className="text-sm font-medium text-white bg-indigo-600 px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <CartDrawer open={isCartOpen} setOpen={setIsCartOpen} />
    </>
  );
} 