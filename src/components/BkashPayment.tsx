import React, { useState, useEffect } from 'react';
import { X, Smartphone, Shield, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface BkashPaymentProps {
  amount: number;
  credits: number;
  onSuccess: (paymentData: any) => void;
  onCancel: () => void;
}

export default function BkashPayment({ amount, credits, onSuccess, onCancel }: BkashPaymentProps) {
  const [step, setStep] = useState<'create' | 'redirect' | 'processing' | 'success' | 'failed'>('create');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentData, setPaymentData] = useState<any>(null);
  const { user, addCredits } = useAuth();

  useEffect(() => {
    // Listen for payment callback from popup
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'BKASH_PAYMENT_SUCCESS') {
        handlePaymentSuccess(event.data.paymentData);
      } else if (event.data.type === 'BKASH_PAYMENT_FAILED') {
        handlePaymentFailure(event.data.error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const createPayment = async () => {
    setLoading(true);
    setError('');

    try {
      const merchantInvoiceNumber = `INV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const response = await fetch('/api/bkash/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          merchantInvoiceNumber: merchantInvoiceNumber
        })
      });

      const result = await response.json();

      if (result.success) {
        setPaymentData(result);
        setStep('redirect');
        
        // Open bKash payment in popup
        const popup = window.open(
          result.bkashURL,
          'bkash_payment',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        if (!popup) {
          setError('Please allow popups for bKash payment');
          setStep('create');
          setLoading(false);
          return;
        }

        // Monitor popup
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            setStep('processing');
            checkPaymentStatus(result.paymentID);
          }
        }, 1000);

      } else {
        setError(result.message || 'Failed to create payment');
        setStep('create');
      }
    } catch (error) {
      console.error('Payment creation error:', error);
      setError('Failed to create payment. Please try again.');
      setStep('create');
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async (paymentID: string) => {
    try {
      const response = await fetch('/api/bkash/query-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentID })
      });

      const result = await response.json();

      if (result.success) {
        if (result.transactionStatus === 'Completed') {
          handlePaymentSuccess({
            transactionID: result.trxID,
            paymentID: result.paymentID,
            amount: result.amount,
            status: result.transactionStatus
          });
        } else if (result.transactionStatus === 'Failed' || result.transactionStatus === 'Cancelled') {
          handlePaymentFailure('Payment was cancelled or failed');
        } else {
          // Still processing, check again
          setTimeout(() => checkPaymentStatus(paymentID), 2000);
        }
      } else {
        handlePaymentFailure(result.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Payment status check error:', error);
      handlePaymentFailure('Failed to verify payment status');
    }
  };

  const handlePaymentSuccess = (data: any) => {
    if (user) {
      addCredits(user.id, credits);
    }
    setStep('success');
    
    // Auto close after success
    setTimeout(() => {
      onSuccess({
        transactionId: data.transactionID,
        paymentId: data.paymentID,
        amount,
        credits,
        status: 'completed'
      });
    }, 2000);
  };

  const handlePaymentFailure = (errorMessage: string) => {
    setError(errorMessage);
    setStep('failed');
  };

  const retryPayment = () => {
    setStep('create');
    setError('');
    setPaymentData(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
          <div className="bg-gradient-to-r from-pink-500 to-red-500 px-4 py-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center text-white">
                <Smartphone className="h-6 w-6 mr-2" />
                <span className="font-bold text-lg">bKash Payment</span>
              </div>
              <button onClick={onCancel} className="text-white hover:text-gray-200">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            {/* Payment Summary */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold">৳{amount}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-gray-600">Credits:</span>
                <span className="font-semibold text-blue-600">{credits}</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              </div>
            )}

            {step === 'create' && (
              <div>
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Ready to Pay</h3>
                  <p className="text-blue-700 text-sm">
                    You will be redirected to bKash to complete your payment securely.
                  </p>
                  <div className="mt-3 text-xs text-blue-600">
                    <Shield className="h-4 w-4 inline mr-1" />
                    <strong>Secure Payment:</strong> Official bKash API integration
                  </div>
                </div>
                
                <button
                  onClick={createPayment}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white py-3 px-4 rounded-lg font-medium hover:from-pink-600 hover:to-red-600 disabled:opacity-50 transition-all duration-200 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating Payment...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-5 w-5 mr-2" />
                      Pay with bKash
                    </>
                  )}
                </button>
              </div>
            )}

            {step === 'redirect' && (
              <div className="text-center py-8">
                <ExternalLink className="h-12 w-12 text-pink-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Redirecting to bKash</h3>
                <p className="text-gray-600 mb-2">Complete your payment in the bKash window</p>
                <p className="text-sm text-gray-500">If the popup didn't open, please allow popups and try again</p>
                
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    <strong>Note:</strong> Don't close this window until payment is complete
                  </p>
                </div>
              </div>
            )}

            {step === 'processing' && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Verifying Payment</h3>
                <p className="text-gray-600 mb-2">Please wait while we confirm your payment...</p>
                <p className="text-sm text-gray-500">This may take a few moments</p>
              </div>
            )}

            {step === 'success' && (
              <div className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-700 mb-2">Payment Successful!</h3>
                <p className="text-gray-600 mb-2">৳{amount} paid successfully</p>
                <p className="text-blue-600 font-medium">{credits} credits added to your account</p>
                {paymentData && (
                  <p className="text-xs text-gray-500 mt-2">
                    Transaction ID: {paymentData.transactionID}
                  </p>
                )}
              </div>
            )}

            {step === 'failed' && (
              <div className="text-center py-8">
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-700 mb-2">Payment Failed</h3>
                <p className="text-gray-600 mb-4">Your payment could not be processed</p>
                
                <div className="space-y-2">
                  <button
                    onClick={retryPayment}
                    className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white py-2 px-4 rounded-lg font-medium hover:from-pink-600 hover:to-red-600 transition-all duration-200"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={onCancel}
                    className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-center text-xs text-gray-500">
              <Shield className="h-4 w-4 mr-1" />
              Secured by bKash Official API
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}