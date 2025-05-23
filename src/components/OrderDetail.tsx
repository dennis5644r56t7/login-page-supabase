import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { FiPackage, FiArrowLeft, FiCheck, FiMapPin, FiCreditCard, FiTruck } from 'react-icons/fi';

interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  product: {
    name: string;
    image_url: string;
  };
}

interface OrderDetail {
  id: number;
  user_id: string;
  status: string;
  total_amount: number;
  shipping_fee: number;
  tax_amount: number;
  created_at: string;
  updated_at: string;
  payment_status: string;
  payment_method: string;
  shipping_address: any;
  tracking_number?: string;
  expected_delivery?: string;
  items: OrderItem[];
}

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && id) {
      fetchOrderDetails();
    }
  }, [user, id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch order details
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (orderError) {
        throw orderError;
      }

      if (!orderData) {
        throw new Error('Order not found');
      }

      // Fetch order items with product details
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          product:products(name, image_url)
        `)
        .eq('order_id', id);

      if (itemsError) {
        throw itemsError;
      }

      setOrder({
        ...orderData,
        items: itemsData || []
      });
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError('Failed to load order details.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusSteps = () => {
    const steps = [
      { id: 'confirmed', label: 'Order Confirmed', icon: <FiCheck /> },
      { id: 'processing', label: 'Processing', icon: <FiPackage /> },
      { id: 'shipped', label: 'Shipped', icon: <FiTruck /> },
      { id: 'delivered', label: 'Delivered', icon: <FiCheck /> }
    ];

    const currentStepIndex = steps.findIndex(step => step.id === order?.status) !== -1 
      ? steps.findIndex(step => step.id === order?.status)
      : order?.status === 'pending' ? 0 : order?.status === 'cancelled' ? -1 : steps.length - 1;

    return { steps, currentStepIndex };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-700">{error || 'Order not found'}</p>
        </div>
        <Link
          to="/orders"
          className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-800"
        >
          <FiArrowLeft className="mr-2" /> Back to Orders
        </Link>
      </div>
    );
  }

  const { steps, currentStepIndex } = getStatusSteps();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link
          to="/orders"
          className="mr-4 text-indigo-600 hover:text-indigo-800"
        >
          <FiArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-semibold">Order #{order.id}</h1>
        <div className="ml-auto text-sm text-gray-500">
          {formatDate(order.created_at)}
        </div>
      </div>

      {/* Order Status */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Order Status</h2>
        
        {order.status === 'cancelled' ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
            This order was cancelled.
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 z-0"></div>
            <div 
              className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-indigo-500 z-0" 
              style={{ width: `${currentStepIndex * 100 / (steps.length - 1)}%` }}
            ></div>
            
            <div className="relative z-10 flex justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div 
                    className={`rounded-full w-10 h-10 flex items-center justify-center ${
                      index <= currentStepIndex 
                        ? 'bg-indigo-500 text-white' 
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step.icon}
                  </div>
                  <div className="text-xs mt-2 text-gray-600">{step.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {order.tracking_number && (
          <div className="mt-6">
            <div className="text-sm text-gray-600 mb-2">Tracking Number:</div>
            <div className="flex items-center">
              <div className="font-medium text-gray-900">{order.tracking_number}</div>
              <a 
                href={`https://track.carrier.com/${order.tracking_number}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-4 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                Track Package
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <h2 className="text-lg font-medium p-6 border-b">Order Items</h2>
        <ul className="divide-y divide-gray-200">
          {order.items.map((item) => (
            <li key={item.id} className="p-6 flex items-start">
              <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-md overflow-hidden">
                <img
                  src={item.product.image_url || '/images/placeholder.jpg'}
                  alt={item.product.name}
                  className="w-20 h-20 object-cover"
                />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-sm font-medium text-gray-900">
                  <Link to={`/product/${item.product_id}`} className="hover:text-indigo-600">
                    {item.product.name}
                  </Link>
                </h3>
                <div className="mt-1 flex text-sm text-gray-500">
                  <p>Qty: {item.quantity}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">${item.price.toFixed(2)}</p>
                <p className="mt-1 text-sm text-gray-500">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Order Summary and Shipping */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-medium mb-4">Order Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900 font-medium">
                ${(order.total_amount - order.shipping_fee - order.tax_amount).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span className="text-gray-900 font-medium">${order.shipping_fee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax</span>
              <span className="text-gray-900 font-medium">${order.tax_amount.toFixed(2)}</span>
            </div>
            <div className="border-t pt-4 flex justify-between">
              <span className="text-lg font-medium">Total</span>
              <span className="text-lg text-indigo-600 font-semibold">${order.total_amount.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="mt-6 border-t pt-4">
            <div className="flex items-center">
              <FiCreditCard className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-900 capitalize">Payment Method: {order.payment_method || 'Credit Card'}</span>
            </div>
            <div className="mt-2 flex items-center">
              <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Shipping Info */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-medium mb-4">Shipping Information</h2>
          
          <div className="flex items-start mb-4">
            <FiMapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-gray-900">Shipping Address</h3>
              <address className="text-sm text-gray-600 not-italic mt-1">
                {order.shipping_address.name}<br />
                {order.shipping_address.street}<br />
                {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}<br />
                {order.shipping_address.country}
              </address>
            </div>
          </div>
          
          {order.expected_delivery && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900">Expected Delivery</h3>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(order.expected_delivery).toLocaleDateString(undefined, { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 flex justify-center">
        <Link
          to="/orders"
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
        >
          <FiArrowLeft className="mr-2" />
          Back to Orders
        </Link>
      </div>
    </div>
  );
};

export default OrderDetail; 