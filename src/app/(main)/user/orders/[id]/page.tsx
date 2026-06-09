"use client";

import { useState, useEffect } from 'react';
import { ArrowLeft, Package, Calendar, Clock, CheckCircle, Clock3, Wallet, Download } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/api/hooks/useAuth';
import { BASE_URL } from '@/config/api';

interface Payment {
  paymentNumber: number;
  amount: number;
  status: string;
  transactionReference: string;
  paymentGateway?: string;
  dateTime: string;
}

interface Order {
  _id: string;
  productId: string;
  productName: string;
  organizationId: string;
  organizationName: string;
  productPrice: number;
  upfrontPercentage: number;
  upfrontAmountPaid: number;
  upfrontRemainingBalance: number;
  totalAmountPaid: number;
  amountSavedByUpfront: number;
  userId: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  payments: Payment[];
  orderStatus: 'pending' | 'partially_paid' | 'fully_paid' | 'cancelled';
  deliveryStatus?: 'pending' | 'confirmed' | 'disputed';
  deliveryConfirmation?: {
    deliveryMode: 'pickup_center' | 'shipping' | 'organization_location';
    deliveryAddress?: string;
    pickupCenterName?: string;
    productImageUrl?: string;
    representativeImageUrl?: string;
    userImageUrl?: string;
    imageComment?: string;
    videoUrl?: string;
    satisfactionDeclaration: string;
    confirmedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

const OrderDetailsPage = () => {
  const { user, token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && token && orderId) {
      fetchOrderDetails();
    } else {
      setLoading(false);
      setError("Please log in to view order details");
    }
  }, [user, token, orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${BASE_URL}/api/orders/user/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        setOrder(result.data.order);
      } else {
        setError(result.message || 'Failed to fetch order details');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error fetching order details:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'partially_paid': return 'bg-blue-100 text-blue-800';
      case 'fully_paid': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5" />;
      case 'partially_paid': return <Wallet className="w-5 h-5" />;
      case 'fully_paid': return <CheckCircle className="w-5 h-5" />;
      case 'cancelled': return <Clock3 className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleConfirmDelivery = () => {
    router.push(`/user/delivery?orderId=${orderId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="ml-0 md:ml-[350px] pt-8 md:pt-8 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5d2a8b]"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="ml-0 md:ml-[350px] pt-8 md:pt-8 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">
                <Package className="mx-auto h-16 w-16" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Order</h3>
              <p className="text-gray-500 mb-4">{error || 'Order not found'}</p>
              <button 
                onClick={() => router.push('/user/orders')}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Back to Orders
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="ml-0 md:ml-[350px] pt-8 md:pt-8 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border-2 border-[#5d2a8b] mb-6">
            <div className="bg-gradient-to-r from-[#5d2a8b] to-[#7a3aa3] p-6 text-white">
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => router.push('/user/orders')}
                  className="flex items-center text-white hover:text-gray-200 transition-colors"
                >
                  <ArrowLeft className="w-6 h-6 mr-2" />
                  Back to Orders
                </button>
                <h1 className="text-3xl font-bold">Order Details</h1>
                <div className="w-16"></div>
              </div>
            </div>

            <div className="p-6">
              {/* Order Summary */}
              <div className="mb-8 pb-6 border-b border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{order.productName}</h2>
                    <p className="text-gray-600">From {order.organizationName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(order.orderStatus)}
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.orderStatus)}`}>
                      {order.orderStatus.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total Price</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(order.productPrice)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Upfront Percentage</p>
                    <p className="text-xl font-bold text-gray-900">{order.upfrontPercentage}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Amount Paid</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(order.totalAmountPaid)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Remaining Balance</p>
                    <p className="text-xl font-bold text-orange-600">{formatCurrency(order.upfrontRemainingBalance)}</p>
                  </div>
                </div>
              </div>

              {/* Order Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Order ID:</span>
                      <span className="font-mono text-sm">{order._id}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Product ID:</span>
                      <span className="font-mono text-sm">{order.productId}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Organization ID:</span>
                      <span className="font-mono text-sm">{order.organizationId}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Customer Name:</span>
                      <span className="font-medium">{order.customerName}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Customer Email:</span>
                      <span className="font-medium">{order.customerEmail}</span>
                    </div>
                    {order.customerPhone && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Customer Phone:</span>
                        <span className="font-medium">{order.customerPhone}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Order Date:</span>
                      <span className="font-medium">{formatDate(order.createdAt)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="font-medium">{formatDate(order.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery Status */}
                {order.deliveryStatus && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Delivery Status:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          order.deliveryStatus === 'confirmed' ? 'bg-green-100 text-green-800' :
                          order.deliveryStatus === 'disputed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.deliveryStatus.toUpperCase()}
                        </span>
                      </div>
                      
                      {order.deliveryConfirmation && (
                        <>
                          <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-600">Delivery Mode:</span>
                            <span className="font-medium capitalize">{order.deliveryConfirmation.deliveryMode.replace('_', ' ')}</span>
                          </div>
                          {order.deliveryConfirmation.pickupCenterName && (
                            <div className="flex justify-between py-2 border-b border-gray-100">
                              <span className="text-gray-600">Pickup Center:</span>
                              <span className="font-medium">{order.deliveryConfirmation.pickupCenterName}</span>
                            </div>
                          )}
                          {order.deliveryConfirmation.deliveryAddress && (
                            <div className="flex justify-between py-2 border-b border-gray-100">
                              <span className="text-gray-600">Delivery Address:</span>
                              <span className="font-medium">{order.deliveryConfirmation.deliveryAddress}</span>
                            </div>
                          )}
                          {order.deliveryConfirmation.confirmedAt && (
                            <div className="flex justify-between py-2 border-b border-gray-100">
                              <span className="text-gray-600">Confirmed At:</span>
                              <span className="font-medium">{formatDate(order.deliveryConfirmation.confirmedAt)}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Confirm Delivery Button */}
                    {order.orderStatus === 'fully_paid' && order.deliveryStatus !== 'confirmed' && (
                      <button
                        onClick={handleConfirmDelivery}
                        className="mt-6 w-full bg-[#5d2a8b] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#7a3aa3] transition-colors flex items-center justify-center"
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Confirm Delivery
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Payment History */}
              {order.payments.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment #</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {order.payments.map((payment, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              Payment {payment.paymentNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                              {formatCurrency(payment.amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                payment.status === 'successful' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {payment.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(payment.dateTime)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                              {payment.transactionReference}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
