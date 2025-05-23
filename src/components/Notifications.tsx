import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { FiBell, FiCheck, FiShoppingBag, FiPackage, FiCreditCard, FiMail, FiUserPlus, FiAlertCircle } from 'react-icons/fi';

interface Notification {
  id: number;
  user_id: string;
  title: string;
  content: string;
  type: string;
  read: boolean;
  created_at: string;
  related_id?: string | number;
  link?: string;
}

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAsRead, setMarkingAsRead] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      setMarkingAsRead(true);
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId ? { ...notification, read: true } : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setError('Failed to update notification. Please try again.');
    } finally {
      setMarkingAsRead(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      setMarkingAsRead(true);
      
      const unreadIds = notifications
        .filter(notification => !notification.read)
        .map(notification => notification.id);
      
      if (unreadIds.length === 0) return;
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', unreadIds);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      setError('Failed to update notifications. Please try again.');
    } finally {
      setMarkingAsRead(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <FiShoppingBag className="h-6 w-6 text-indigo-500" />;
      case 'shipping':
        return <FiPackage className="h-6 w-6 text-green-500" />;
      case 'payment':
        return <FiCreditCard className="h-6 w-6 text-purple-500" />;
      case 'account':
        return <FiUserPlus className="h-6 w-6 text-blue-500" />;
      case 'message':
        return <FiMail className="h-6 w-6 text-yellow-500" />;
      case 'alert':
        return <FiAlertCircle className="h-6 w-6 text-red-500" />;
      default:
        return <FiBell className="h-6 w-6 text-gray-500" />;
    }
  };

  const getNotificationLink = (notification: Notification) => {
    if (notification.link) return notification.link;
    
    switch (notification.type) {
      case 'order':
        return notification.related_id ? `/orders/${notification.related_id}` : '/orders';
      case 'shipping':
        return notification.related_id ? `/orders/${notification.related_id}` : '/orders';
      case 'payment':
        return notification.related_id ? `/payments/${notification.related_id}` : '/account';
      case 'account':
        return '/profile';
      case 'message':
        return '/messages';
      default:
        return '/dashboard';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMilliseconds = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
    const diffInHours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        {notifications.some(notification => !notification.read) && (
          <button
            onClick={markAllAsRead}
            disabled={markingAsRead}
            className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            <FiCheck className="mr-1 h-4 w-4" />
            Mark all as read
          </button>
        )}
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          {error}
        </div>
      )}
      
      {notifications.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <FiBell className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-medium text-gray-900 mb-2">No notifications</h2>
          <p className="text-gray-600">You don't have any notifications at the moment.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <li 
                key={notification.id} 
                className={`p-4 ${notification.read ? 'bg-white' : 'bg-indigo-50'}`}
              >
                <a 
                  href={getNotificationLink(notification)}
                  className="block hover:bg-gray-50 transition duration-150 ease-in-out"
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between">
                        <p className={`text-sm font-medium ${notification.read ? 'text-gray-900' : 'text-indigo-900'}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(notification.created_at)}
                        </p>
                      </div>
                      <p className={`mt-1 text-sm ${notification.read ? 'text-gray-600' : 'text-indigo-800'}`}>
                        {notification.content}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="ml-4 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="rounded-full p-1 text-indigo-600 hover:bg-indigo-100"
                        >
                          <FiCheck className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Notifications; 