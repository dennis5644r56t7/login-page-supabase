import { useState } from 'react';
import { FiMail, FiAlertCircle, FiCheck } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

interface EmailVerificationProps {
  email: string;
}

const EmailVerification = ({ email }: EmailVerificationProps) => {
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [message, setMessage] = useState('');
  const { user } = useAuth();

  const handleResendVerification = async () => {
    try {
      setResendDisabled(true);
      setMessage('Verification email sent! Please check your inbox.');
      
      // Start countdown
      let timeLeft = 60;
      setCountdown(timeLeft);
      
      const timer = setInterval(() => {
        timeLeft -= 1;
        setCountdown(timeLeft);
        
        if (timeLeft <= 0) {
          clearInterval(timer);
          setResendDisabled(false);
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error resending verification email:', error);
      setMessage('Failed to resend verification email. Please try again.');
      setResendDisabled(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full">
          <FiMail className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-gray-800">Verify Your Email</h2>
      </div>
      
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start">
          <FiAlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 mr-2" />
          <div>
            <p className="text-sm text-gray-700">
              We've sent a verification email to <strong>{email}</strong>. 
              Please check your inbox and click the verification link to complete your registration.
            </p>
          </div>
        </div>
      </div>
      
      {message && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start">
            <FiCheck className="w-5 h-5 text-green-500 mt-0.5 mr-2" />
            <p className="text-sm text-gray-700">{message}</p>
          </div>
        </div>
      )}
      
      <div className="text-center">
        <p className="mb-4 text-sm text-gray-600">
          Didn't receive the email? Check your spam folder or try resending the verification email.
        </p>
        <button
          onClick={handleResendVerification}
          disabled={resendDisabled}
          className={`w-full py-2 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            resendDisabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {resendDisabled ? `Resend Email (${countdown}s)` : 'Resend Verification Email'}
        </button>
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already verified your email? <a href="/login" className="text-indigo-600 hover:text-indigo-800 font-medium">Login here</a>
        </p>
      </div>
    </div>
  );
};

export default EmailVerification; 