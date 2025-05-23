import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiHome, FiShoppingCart, FiUser, FiHeart, FiPackage, 
  FiSettings, FiLogOut, FiMenu, FiX, FiSearch,
  FiBell, FiShoppingBag, FiGrid, FiTrendingUp
} from 'react-icons/fi';
import { supabase } from '../lib/supabaseClient';

interface NavItem {
  name: string;
  to: string;
  icon: React.ReactNode;
  roles?: string[];
}

const DashboardLayout = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchCartCount();
      fetchNotifications();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, full_name, avatar_url')
        .eq('id', user?.id)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setUserRole(data.role);
        setProfileData(data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchCartCount = async () => {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('id', { count: 'exact' })
        .eq('user_id', user?.id);
      
      if (error) {
        throw error;
      }
      
      setCartCount(data?.length || 0);
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', user?.id)
        .eq('read', false);
      
      if (error) {
        throw error;
      }
      
      setNotificationCount(data?.length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const navigationItems: NavItem[] = [
    { name: 'Dashboard', to: '/dashboard', icon: <FiHome className="w-5 h-5" /> },
    { name: 'Products', to: '/products', icon: <FiGrid className="w-5 h-5" /> },
    { name: 'Cart', to: '/cart', icon: <FiShoppingCart className="w-5 h-5" /> },
    { name: 'Orders', to: '/orders', icon: <FiPackage className="w-5 h-5" /> },
    { name: 'Favorites', to: '/favorites', icon: <FiHeart className="w-5 h-5" /> },
    { 
      name: 'Sell', 
      to: '/seller/dashboard', 
      icon: <FiShoppingBag className="w-5 h-5" />,
      roles: ['seller', 'admin'] 
    },
    { 
      name: 'Analytics', 
      to: '/admin/analytics', 
      icon: <FiTrendingUp className="w-5 h-5" />,
      roles: ['admin'] 
    },
    { name: 'Profile', to: '/profile', icon: <FiUser className="w-5 h-5" /> },
    { name: 'Settings', to: '/settings', icon: <FiSettings className="w-5 h-5" /> },
  ];

  // Filter navigation items based on user role
  const filteredNavItems = navigationItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(userRole || '');
  });

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
        <div className="fixed inset-y-0 left-0 flex flex-col max-w-xs w-full bg-white shadow-xl">
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <div className="flex items-center">
              <img src="/logo.svg" alt="Logo" className="h-8 w-auto" />
              <span className="ml-2 text-xl font-semibold text-indigo-600">JShop</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-2 py-4 overflow-y-auto">
            {filteredNavItems.map((item) => (
              <Link
                key={item.name}
                to={item.to}
                className={`flex items-center px-2 py-3 text-sm font-medium rounded-md ${
                  isActive(item.to)
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <div className={`mr-3 ${isActive(item.to) ? 'text-indigo-500' : 'text-gray-500'}`}>
                  {item.icon}
                </div>
                {item.name}
                {item.name === 'Cart' && cartCount > 0 && (
                  <div className="ml-auto bg-indigo-100 text-indigo-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {cartCount}
                  </div>
                )}
              </Link>
            ))}
            <button
              onClick={handleSignOut}
              className="w-full mt-6 flex items-center px-2 py-3 text-sm font-medium text-red-600 rounded-md hover:bg-red-50"
            >
              <FiLogOut className="mr-3 h-5 w-5" />
              Sign Out
            </button>
          </nav>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm fixed w-full z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
              >
                <FiMenu className="h-6 w-6" />
              </button>
              <div className="hidden md:flex items-center">
                <img src="/logo.svg" alt="Logo" className="h-8 w-auto" />
                <span className="ml-2 text-xl font-semibold text-indigo-600">JShop</span>
              </div>
            </div>

            <div className="flex-1 max-w-xl mx-auto px-2 flex justify-center lg:ml-6 lg:justify-end">
              <form onSubmit={handleSearch} className="w-full max-w-lg">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for products..."
                    className="block w-full bg-gray-100 border border-transparent rounded-md py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:outline-none focus:bg-white focus:border-indigo-300 focus:ring-indigo-300"
                  />
                </div>
              </form>
            </div>

            <div className="flex items-center">
              <Link
                to="/cart"
                className="p-2 ml-4 text-gray-500 hover:text-gray-700 relative"
              >
                <FiShoppingCart className="h-6 w-6" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center h-4 w-4 text-xs font-bold text-white bg-indigo-600 rounded-full">
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link
                to="/notifications"
                className="p-2 ml-2 text-gray-500 hover:text-gray-700 relative"
              >
                <FiBell className="h-6 w-6" />
                {notificationCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center h-4 w-4 text-xs font-bold text-white bg-red-500 rounded-full">
                    {notificationCount}
                  </span>
                )}
              </Link>
              <Link
                to="/profile"
                className="p-1 ml-2 text-gray-500 hover:text-gray-700"
              >
                {profileData?.avatar_url ? (
                  <img
                    src={profileData.avatar_url}
                    alt="Profile"
                    className="h-8 w-8 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                    {user?.email?.[0].toUpperCase() || 'U'}
                  </div>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar for Desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="fixed flex flex-col w-64 h-screen border-r border-gray-200 bg-white">
          <div className="h-16"></div> {/* Space for header */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.to}
                  className={`flex items-center px-2 py-3 text-sm font-medium rounded-md ${
                    isActive(item.to)
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className={`mr-3 ${isActive(item.to) ? 'text-indigo-500' : 'text-gray-500'}`}>
                    {item.icon}
                  </div>
                  {item.name}
                  {item.name === 'Cart' && cartCount > 0 && (
                    <div className="ml-auto bg-indigo-100 text-indigo-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {cartCount}
                    </div>
                  )}
                </Link>
              ))}
              <button
                onClick={handleSignOut}
                className="w-full mt-6 flex items-center px-2 py-3 text-sm font-medium text-red-600 rounded-md hover:bg-red-50"
              >
                <FiLogOut className="mr-3 h-5 w-5" />
                Sign Out
              </button>
            </nav>
            
            {/* User info */}
            <div className="flex items-center px-4 py-3 border-t">
              <div className="flex-shrink-0">
                {profileData?.avatar_url ? (
                  <img
                    src={profileData.avatar_url}
                    alt="Profile"
                    className="h-8 w-8 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                    {user?.email?.[0].toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {profileData?.full_name || user?.email?.split('@')[0]}
                </div>
                <div className="text-xs text-gray-500 truncate capitalize">
                  {userRole || 'User'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="h-16"></div> {/* Space for fixed header */}
        <main className="flex-1 pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout; 