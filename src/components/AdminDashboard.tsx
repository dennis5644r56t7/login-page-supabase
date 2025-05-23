import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { FiUsers, FiShoppingBag, FiDollarSign, FiTrendingUp, FiBarChart2, FiPieChart } from 'react-icons/fi';

interface AdminStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  newUsers: number;
  activeUsers: number;
}

interface RevenueData {
  date: string;
  amount: number;
}

interface CategoryData {
  category: string;
  count: number;
}

interface CategoryStats {
  category: {
    name: string | null;
  } | null;
  count: string;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    newUsers: 0,
    activeUsers: 0
  });
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchAdminData();
    }
  }, [user]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is admin
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;
      if (profileData.role !== 'admin') {
        throw new Error('Unauthorized access');
      }

      // Fetch total users
      const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      if (usersError) throw usersError;

      // Fetch new users (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: newUsersCount, error: newUsersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (newUsersError) throw newUsersError;

      // Fetch orders and revenue
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('total_amount, created_at');

      if (ordersError) throw ordersError;

      const totalRevenue = ordersData?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

      // Fetch products count
      const { count: productsCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact' });

      if (productsError) throw productsError;

      // Fetch revenue by date (last 30 days)
      const revenueByDate = ordersData
        ?.filter(order => new Date(order.created_at) >= thirtyDaysAgo)
        .reduce((acc: { [key: string]: number }, order) => {
          const date = new Date(order.created_at).toISOString().split('T')[0];
          acc[date] = (acc[date] || 0) + order.total_amount;
          return acc;
        }, {});

      const revenueDataArray = Object.entries(revenueByDate || {}).map(([date, amount]) => ({
        date,
        amount
      })).sort((a, b) => a.date.localeCompare(b.date));

      // Fetch product categories distribution
      const { data: categoriesData, error: categoriesError } = await supabase
        .rpc('get_category_counts');

      if (categoriesError) throw categoriesError;

      const categoryStats = (categoriesData as CategoryStats[] || []).map(item => ({
        category: item.category?.name || 'Uncategorized',
        count: parseInt(item.count)
      })) || [];

      setStats({
        totalUsers: usersCount || 0,
        totalOrders: ordersData?.length || 0,
        totalRevenue,
        totalProducts: productsCount || 0,
        newUsers: newUsersCount || 0,
        activeUsers: Math.floor((usersCount || 0) * 0.4) // Example: assuming 40% are active
      });

      setRevenueData(revenueDataArray);
      setCategoryData(categoryStats);

    } catch (error) {
      console.error('Error fetching admin data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
              <FiUsers className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Users</p>
              <h3 className="text-xl font-semibold">{stats.totalUsers}</h3>
              <p className="text-sm text-green-600">+{stats.newUsers} new (30d)</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <FiShoppingBag className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Orders</p>
              <h3 className="text-xl font-semibold">{stats.totalOrders}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <FiDollarSign className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Revenue</p>
              <h3 className="text-xl font-semibold">{formatCurrency(stats.totalRevenue)}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-medium mb-4">Revenue Trend</h2>
          <div className="h-64">
            {/* Implement your preferred charting library here */}
            <div className="flex items-center justify-center h-full text-gray-500">
              <FiBarChart2 className="h-8 w-8 mr-2" />
              Revenue chart will be displayed here
            </div>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-medium mb-4">Product Categories</h2>
          <div className="h-64">
            {/* Implement your preferred charting library here */}
            <div className="flex items-center justify-center h-full text-gray-500">
              <FiPieChart className="h-8 w-8 mr-2" />
              Category distribution chart will be displayed here
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity or Additional Stats can be added here */}
    </div>
  );
};

export default AdminDashboard; 