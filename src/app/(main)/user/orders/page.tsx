"use client";

import { useState, useEffect } from 'react';
import { ArrowLeft, Package, Calendar, Clock, CheckCircle, Clock3, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
  createdAt: string;
  updatedAt: string;
}

const OrdersPage = () => {
  const { user, token } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && token) {
      fetchUserOrders();
    } else {
      setLoading(false);
      setError("Please log in to view your orders");
    }
  }, [user, token]);

  const fetchUserOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${BASE_URL}/api/orders/user/my-orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setOrders(result.data.orders || []);
      } else {
        setError(result.message || 'Failed to fetch orders');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error fetching orders:', err);
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
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'partially_paid': return <Wallet className="w-4 h-4" />;
      case 'fully_paid': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <Clock3 className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="ml-0 md:ml-[350px] pt-8 md:pt-8 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border-2 border-[#5d2a8b]">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#5d2a8b] to-[#7a3aa3] p-6 text-white">
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => router.back()}
                  className="flex items-center text-white hover:text-gray-200 transition-colors"
                >
                  <ArrowLeft className="w-6 h-6 mr-2" />
                  Back
                </button>
                <h1 className="text-3xl font-bold">My Orders</h1>
                <div className="w-16"></div> {/* Spacer for alignment */}
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5d2a8b]"></div>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="text-red-500 mb-4">
                    <Package className="mx-auto h-16 w-16" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Orders</h3>
                  <p className="text-gray-500 mb-4">{error}</p>
                  <button 
                    onClick={fetchUserOrders}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Try Again
                  </button>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
                  <p className="text-gray-500 mb-4">You haven't placed any orders yet</p>
                  <button 
                    onClick={() => router.push('/user/body-care')}
                    className="bg-[#5d2a8b] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#7a3aa3] transition-colors"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Order History</h2>
                    <span className="text-sm text-gray-500">{orders.length} orders</span>
                  </div>
                  
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{order.productName}</h3>
                            <p className="text-gray-600">From {order.organizationName}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(order.orderStatus)}
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                              {order.orderStatus.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-500">Total Price</p>
                            <p className="font-semibold">{formatCurrency(order.productPrice)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Upfront %</p>
                            <p className="font-semibold">{order.upfrontPercentage}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Amount Paid</p>
                            <p className="font-semibold text-green-600">{formatCurrency(order.totalAmountPaid)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Remaining</p>
                            <p className="font-semibold text-orange-600">{formatCurrency(order.upfrontRemainingBalance)}</p>
                          </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="w-4 h-4 mr-1" />
                              Ordered on {formatDate(order.createdAt)}
                            </div>
                            <button 
                              onClick={() => router.push(`/user/orders/${order._id}`)}
                              className="text-[#5d2a8b] hover:text-[#7a3aa3] font-medium text-sm"
                            >
                              View Details
                            </button>
                          </div>
                        </div>

                        {order.payments.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Payment History</h4>
                            <div className="space-y-2">
                              {order.payments.map((payment, index) => (
                                <div key={index} className="flex justify-between items-center text-sm">
                                  <div className="flex items-center">
                                    <span className="text-gray-600">Payment {payment.paymentNumber}</span>
                                    <span className="mx-2 text-gray-300">•</span>
                                    <span className={`font-medium ${payment.status === 'successful' ? 'text-green-600' : 'text-yellow-600'}`}>
                                      {payment.status.toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold">{formatCurrency(payment.amount)}</span>
                                    <Clock className="w-3 h-3 text-gray-400" />
                                    <span className="text-gray-500">
                                      {new Date(payment.dateTime).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
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

export default OrdersPage;