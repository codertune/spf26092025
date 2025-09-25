import React, { useState } from 'react';
import { X, Search, Truck, MapPin, Calendar, Package, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface DamcoTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TrackingResult {
  containerNumber: string;
  bookingNumber: string;
  vessel: string;
  voyage: string;
  status: string;
  location: string;
  estimatedArrival: string;
  actualArrival?: string;
  events: TrackingEvent[];
}

interface TrackingEvent {
  date: string;
  time: string;
  event: string;
  location: string;
  status: 'completed' | 'current' | 'pending';
}

export default function DamcoTrackingModal({ isOpen, onClose }: DamcoTrackingModalProps) {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [trackingResult, setTrackingResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState('');

  const demoTrackingData: { [key: string]: TrackingResult } = {
    // Demo data removed - will be populated with real tracking data
  };

  const handleTrack = async () => {
    if (!trackingNumber.trim()) {
      setError('Please enter a tracking number');
      return;
    }

    setIsTracking(true);
    setError('');
    setTrackingResult(null);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    const result = demoTrackingData[trackingNumber.toUpperCase()];
    
    if (result) {
      setTrackingResult(result);
    } else {
      setError('Tracking number not found. Please check the number and try again.');
    }

    setIsTracking(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in transit':
        return <Truck className="h-5 w-5 text-blue-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getEventIcon = (status: 'completed' | 'current' | 'pending') => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'current':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center text-white">
                <Truck className="h-6 w-6 mr-2" />
                <span className="font-bold text-lg">Damco Container Tracking</span>
              </div>
              <button onClick={onClose} className="text-white hover:text-gray-200">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            {/* Search Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Container/Booking Number
              </label>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter container or booking number"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
                />
                <button
                  onClick={handleTrack}
                  disabled={isTracking}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 transition-all duration-200 flex items-center"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {isTracking ? 'Tracking...' : 'Track'}
                </button>
              </div>
              
              <div className="mt-2 text-sm text-gray-500">
                <strong>Note:</strong> Enter your actual FCR/Container number for tracking
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-red-700">{error}</span>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isTracking && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Tracking your shipment...</p>
              </div>
            )}

            {/* Tracking Results */}
            {trackingResult && (
              <div className="space-y-6">
                {/* Summary Card */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Shipment Summary</h3>
                    <div className="flex items-center">
                      {getStatusIcon(trackingResult.status)}
                      <span className="ml-2 font-semibold text-gray-900">{trackingResult.status}</span>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Package className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-sm text-gray-600">Container:</span>
                        <span className="ml-2 font-semibold">{trackingResult.containerNumber}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-sm text-gray-600">Current Location:</span>
                        <span className="ml-2 font-semibold">{trackingResult.location}</span>
                      </div>
                      <div className="flex items-center">
                        <Truck className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-sm text-gray-600">Vessel:</span>
                        <span className="ml-2 font-semibold">{trackingResult.vessel}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Search className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-sm text-gray-600">Booking:</span>
                        <span className="ml-2 font-semibold">{trackingResult.bookingNumber}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-sm text-gray-600">ETA:</span>
                        <span className="ml-2 font-semibold">{trackingResult.estimatedArrival}</span>
                      </div>
                      {trackingResult.actualArrival && (
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                          <span className="text-sm text-gray-600">Delivered:</span>
                          <span className="ml-2 font-semibold text-green-600">{trackingResult.actualArrival}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Shipment Timeline</h3>
                  
                  <div className="space-y-4">
                    {trackingResult.events.map((event, index) => (
                      <div key={index} className="flex items-start">
                        <div className="flex-shrink-0 mr-4">
                          {getEventIcon(event.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${
                              event.status === 'completed' ? 'text-gray-900' :
                              event.status === 'current' ? 'text-blue-600' : 'text-gray-500'
                            }`}>
                              {event.event}
                            </p>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">{event.date}</p>
                              <p className="text-xs text-gray-400">{event.time}</p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{event.location}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => alert('PDF report downloaded!')}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Download PDF Report
                  </button>
                  <button
                    onClick={() => {
                      setTrackingResult(null);
                      setTrackingNumber('');
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Track Another
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}