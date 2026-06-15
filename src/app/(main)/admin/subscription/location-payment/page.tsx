'use client';

import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/AuthContext';
import { BASE_URL } from '@/config/api';
import {
  Search,
  Package, 
  Calendar, 
  Users, 
  MapPin, 
  CreditCard, 
  DollarSign, 
  AlertCircle,
  CheckCircle 
} from 'lucide-react';

interface LocationFee {
  location: string;
  fee: number;
}

interface LocationPaymentResponse {
  success: boolean;
  data: {
    totalAmount: number;
    locationFees: LocationFee[];
    totalLocations: number;
    unpaidLocations: number;
    currency: string;
    description: string;
    debug: {
      calculatedTotal: number;
      locationCount: number;
      feeBreakdown: {
        location: string;
        amount: number;
      }[];
    };
  };
}

interface PaymentStatusResponse {
  success: boolean;
  data: {
    paymentRequired: boolean;
    unpaidLocations: number;
    totalLocations: number;
    verificationStatus: string;
  };
}

const LocationPaymentPage = () => {
  const { token } = useAuthContext();
  const [locationFees, setLocationFees] = useState<LocationFee[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch location payment details
  useEffect(() => {
    const fetchLocationPayments = async () => {
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch location fees breakdown
        const pricingResponse = await fetch(`${BASE_URL}/api/payment/verified-badge/pricing`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!pricingResponse.ok) {
          throw new Error(`Failed to fetch location fees: ${pricingResponse.status}`);
        }

        const pricingData: LocationPaymentResponse = await pricingResponse.json();
        setLocationFees(pricingData.data.locationFees || []);

        // Fetch payment status
        const statusResponse = await fetch(`${BASE_URL}/api/payment/verified-badge/check-payment-required`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!statusResponse.ok) {
          throw new Error(`Failed to fetch payment status: ${statusResponse.status}`);
        }

        const statusData: PaymentStatusResponse = await statusResponse.json();
        setPaymentStatus(statusData.data);
      } catch (err) {
        console.error('Error fetching location payments:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while fetching location payments');
      } finally {
        setLoading(false);
      }
    };

    fetchLocationPayments();
  }, [token]);


  const filteredLocationFees = locationFees.filter(fee => 
    fee.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate payment statistics from the payment status data
  const totalLocations = paymentStatus?.totalLocations || 0;
  const unpaidLocations = paymentStatus?.unpaidLocations || 0;
  const paidLocations = totalLocations - unpaidLocations;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="manrope ml-0 md:ml-[350px] pt-8 md:pt-8 p-4 md:p-8 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5D2A8B] mb-4 mx-auto"></div>
          <p className="text-lg font-medium text-gray-600">Loading location payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manrope ml-0 md:ml-[350px] pt-8 md:pt-8 p-4 md:p-8 min-h-screen">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
        .manrope { font-family: 'Manrope', sans-serif; }
        
        /* Custom scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }
        
        /* Table container with fixed height for scroll */
        .table-container {
          max-height: calc(100vh - 300px);
          overflow-y: auto;
        }
      `}</style>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Location Payments</h1>
        <p className="text-gray-600">Manage and track location payment statuses</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Locations</p>
              <p className="text-2xl font-bold text-gray-900">{totalLocations}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Paid Locations</p>
              <p className="text-2xl font-bold text-green-600">{paidLocations}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unpaid Locations</p>
              <p className="text-2xl font-bold text-red-600">{unpaidLocations}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search locations..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Locations Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="table-container custom-scrollbar">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fee
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLocationFees.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <MapPin className="w-12 h-12 mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No locations found</p>
                      <p className="text-sm mt-1">No location payment records to display</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLocationFees.map((locationFee: LocationFee, index: number) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <MapPin className="w-5 h-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{locationFee.location}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatCurrency(locationFee.fee)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        paymentStatus?.paymentRequired 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {paymentStatus?.paymentRequired ? (
                          <>
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Unpaid
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Paid
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LocationPaymentPage;