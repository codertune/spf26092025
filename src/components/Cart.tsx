import React, { useState } from 'react';
import { X, ShoppingCart, CreditCard, Trash2, Plus, Minus } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import BkashPayment from './BkashPayment';
import AuthModal from './AuthModal';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Cart({ isOpen, onClose }: CartProps) {
  const { cartItems, removeFromCart, clearCart, getTotalCredits, getTotalPrice } = useCart();
  const { user, creditSettings, login } = useAuth();
  const [showPayment, setShowPayment] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [customCredits, setCustomCredits] = useState(creditSettings.minPurchaseCredits);

  const handlePurchase = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setShowPayment(true);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    setShowPayment(true);
  };

  const handlePaymentSuccess = (paymentData: any) => {
    clearCart();
    setCustomCredits(creditSettings.minPurchaseCredits);
    setShowPayment(false);
    onClose();
  };

  const adjustCustomCredits = (amount: number) => {
    const newAmount = Math.max(creditSettings.minPurchaseCredits, customCredits + amount);
    setCustomCredits(newAmount);
  };

  const getCustomCreditsPrice = () => {
    return Math.round(customCredits / creditSettings.creditsPerBDT);
  };
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
          
          <section className="absolute right-0 top-0 h-full w-full max-w-md flex flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between px-4 py-6 bg-gradient-to-r from-blue-500 to-purple-600">
              <h2 className="text-lg font-medium text-white flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Shopping Cart ({cartItems.length})
              </h2>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 px-4 py-6">
              {cartItems.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Your cart is empty</p>
                  <p className="text-sm text-gray-400 mt-2">Add services to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{item.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">{item.category}</p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-4">
                              <span className="text-sm font-medium text-blue-600">
                                {item.credits} credits
                              </span>
                              <span className="text-sm text-gray-500">
                                ৳{item.price}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="border-t border-gray-200 px-4 py-6 space-y-4">
                {/* Custom Credits Input */}
                <div className="border-t border-gray-200 px-4 py-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Select Credits Amount</h3>
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <button
                      onClick={() => adjustCustomCredits(-50)}
                      className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                      disabled={customCredits <= creditSettings.minPurchaseCredits}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{customCredits}</div>
                      <div className="text-xs text-gray-500">credits</div>
                    </div>
                    
                    <button
                      onClick={() => adjustCustomCredits(50)}
                      className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="mt-3 text-center">
                    <div className="text-sm text-gray-600">
                      Price: <span className="font-semibold text-green-600">৳{getCustomCreditsPrice()}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Rate: ৳{(1/creditSettings.creditsPerBDT).toFixed(2)} per credit
                    </div>
                  </div>
                  
                  {/* Quick Amount Buttons */}
                  <div className="mt-3 flex space-x-2">
                    {[200, 500, 1000, 2000].map(amount => (
                      <button
                        key={amount}
                        onClick={() => setCustomCredits(amount)}
                        className={`flex-1 py-2 px-3 text-xs rounded-lg border transition-colors ${
                          customCredits === amount
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {amount}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center text-lg font-medium">
                  <span>Total Credits:</span>
                  <span className="text-blue-600">{customCredits}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-medium">
                  <span>Total Price:</span>
                  <span className="text-green-600">৳{getCustomCreditsPrice()}</span>
                </div>
                <div className="text-xs text-gray-500">
                  Exchange Rate: ৳{(1/creditSettings.creditsPerBDT).toFixed(2)} = 1 Credit
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handlePurchase}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center"
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Purchase with bKash
                  </button>
                  {cartItems.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      Clear Cart
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

    {/* Auth Modal */}
    {showAuthModal && (
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    )}

      {/* bKash Payment Modal */}
      {showPayment && (
        <BkashPayment
          amount={getCustomCreditsPrice()}
          credits={customCredits}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPayment(false)}
        />
      )}
    </>
  );
}