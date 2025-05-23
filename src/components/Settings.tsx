import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { FiSettings, FiLock, FiMail, FiBell, FiCreditCard, FiShield, FiAlertCircle } from 'react-icons/fi';

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState({
    orderUpdates: true,
    promotions: false,
    newProducts: true,
    accountAlerts: true
  });
  
  const [pushNotifications, setPushNotifications] = useState({
    orderUpdates: true,
    promotions: true,
    newProducts: false,
    accountAlerts: true
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        throw error;
      }
      
      setSuccess('Password updated successfully!');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      setError('Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailNotificationChange = (key: keyof typeof emailNotifications) => {
    setEmailNotifications({
      ...emailNotifications,
      [key]: !emailNotifications[key]
    });
  };

  const handlePushNotificationChange = (key: keyof typeof pushNotifications) => {
    setPushNotifications({
      ...pushNotifications,
      [key]: !pushNotifications[key]
    });
  };

  const handleSaveNotifications = () => {
    // In a real app, you would save these to the database
    setSuccess('Notification preferences saved!');
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real app, this would be a more complex flow with additional checks
      const { error } = await supabase.rpc('delete_user_account', {
        user_id: user?.id
      });
      
      if (error) {
        throw error;
      }
      
      // Sign out the user
      await supabase.auth.signOut();
      
    } catch (error) {
      console.error('Error deleting account:', error);
      setError('Failed to delete account. Please contact support.');
      setShowDeleteConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6 flex items-center">
        <FiSettings className="mr-2" /> Settings
      </h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('account')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'account'
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Account
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'security'
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Security
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'notifications'
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'payment'
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Payment Methods
          </button>
        </div>
        
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            {error}
          </div>
        )}
        
        {success && (
          <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700">
            {success}
          </div>
        )}
        
        <div className="p-6">
          {activeTab === 'account' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Account Information</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                    <FiMail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    value={user?.email || ''}
                    readOnly
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 bg-gray-50"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">To change your email address, please contact support.</p>
              </div>
              
              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Account</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                  >
                    <FiAlertCircle className="mr-2" /> Delete Account
                  </button>
                ) : (
                  <div className="bg-red-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-red-800 mb-2">Are you sure you want to delete your account?</h4>
                    <p className="text-xs text-red-700 mb-4">
                      This action cannot be undone. All your data will be permanently deleted.
                    </p>
                    <div className="flex space-x-3">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={loading}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        {loading ? 'Processing...' : 'Yes, Delete My Account'}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'security' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FiShield className="mr-2" /> Security
              </h2>
              
              <form onSubmit={handlePasswordChange}>
                <div className="mb-4">
                  <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <div className="flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                      <FiLock className="h-4 w-4" />
                    </span>
                    <input
                      id="current-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                      <FiLock className="h-4 w-4" />
                    </span>
                    <input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                      <FiLock className="h-4 w-4" />
                    </span>
                    <input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
              
              <div className="mt-8 border-t pt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Add an extra layer of security to your account by enabling two-factor authentication.
                </p>
                <button
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Enable 2FA
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FiBell className="mr-2" /> Notification Preferences
              </h2>
              
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Email Notifications</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      id="email-order-updates"
                      type="checkbox"
                      checked={emailNotifications.orderUpdates}
                      onChange={() => handleEmailNotificationChange('orderUpdates')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="email-order-updates" className="ml-3 text-sm text-gray-700">
                      Order updates and shipping notifications
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="email-promotions"
                      type="checkbox"
                      checked={emailNotifications.promotions}
                      onChange={() => handleEmailNotificationChange('promotions')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="email-promotions" className="ml-3 text-sm text-gray-700">
                      Promotions and special offers
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="email-new-products"
                      type="checkbox"
                      checked={emailNotifications.newProducts}
                      onChange={() => handleEmailNotificationChange('newProducts')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="email-new-products" className="ml-3 text-sm text-gray-700">
                      New product announcements
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="email-account-alerts"
                      type="checkbox"
                      checked={emailNotifications.accountAlerts}
                      onChange={() => handleEmailNotificationChange('accountAlerts')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="email-account-alerts" className="ml-3 text-sm text-gray-700">
                      Account alerts (security, payment, etc.)
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Push Notifications</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      id="push-order-updates"
                      type="checkbox"
                      checked={pushNotifications.orderUpdates}
                      onChange={() => handlePushNotificationChange('orderUpdates')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="push-order-updates" className="ml-3 text-sm text-gray-700">
                      Order updates and shipping notifications
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="push-promotions"
                      type="checkbox"
                      checked={pushNotifications.promotions}
                      onChange={() => handlePushNotificationChange('promotions')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="push-promotions" className="ml-3 text-sm text-gray-700">
                      Promotions and special offers
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="push-new-products"
                      type="checkbox"
                      checked={pushNotifications.newProducts}
                      onChange={() => handlePushNotificationChange('newProducts')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="push-new-products" className="ml-3 text-sm text-gray-700">
                      New product announcements
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="push-account-alerts"
                      type="checkbox"
                      checked={pushNotifications.accountAlerts}
                      onChange={() => handlePushNotificationChange('accountAlerts')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="push-account-alerts" className="ml-3 text-sm text-gray-700">
                      Account alerts (security, payment, etc.)
                    </label>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleSaveNotifications}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Save Preferences
              </button>
            </div>
          )}
          
          {activeTab === 'payment' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FiCreditCard className="mr-2" /> Payment Methods
              </h2>
              
              <div className="bg-gray-50 p-4 rounded-md mb-6">
                <p className="text-sm text-gray-600">
                  No payment methods saved yet. Add a credit card or other payment method to enable quick checkout.
                </p>
              </div>
              
              <button
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Add Payment Method
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;