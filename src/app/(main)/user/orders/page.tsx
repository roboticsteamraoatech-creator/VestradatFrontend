"use client";

import { useState, useEffect } from 'react';
import { ArrowLeft, Package, Calendar, Clock, CheckCircle, Clock3, Wallet, CreditCard, Eye, CheckSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/api/hooks/useAuth';
import OrderService from '@/services/OrderService';

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
  itemType?: 'product' | 'service';
}

const OrdersPage = () => {
  const { user, token } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

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
      
      const response = await fetch('https://datacapture-backend.onrender.com/api/orders/user/my-orders', {
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

  const handleCompletePayment = async (order: Order) => {
    setProcessingOrderId(order._id);
    setError(null);

    try {
      const paymentData = {
        productId: order.productId,
        productName: order.productName,
        organizationId: order.organizationId,
        organizationName: order.organizationName,
        productPrice: order.productPrice,
        upfrontPercentage: order.upfrontPercentage,
        userId: order.userId,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        customerPhone: order.customerPhone || '',
        paymentType: 'remaining' as const,
        itemType: order.itemType || 'product',
        platform: 'web' as const,
        redirectUrl: `${window.location.origin}/user/payment/callback`,
      };

      const response = await OrderService.initiatePayment(paymentData, token || undefined);
      
      if (response.success && response.data?.link) {
        window.location.href = response.data.link;
      } else {
        setError(response.message || 'Failed to initiate remaining balance link.');
      }
    } catch (err: any) {
      console.error("Error processing installment callback context:", err);
      setError(err.message || 'Failed to coordinate checkout connection routing.');
    } finally {
      setProcessingOrderId(null);
    }
  };

  // Navigates directly to delivery verification router matching specified details view logic
  const handleConfirmDelivery = (orderId: string) => {
    router.push(`/user/delivery?orderId=${orderId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'partially_paid': return 'bg-orange-100 text-orange-800';
      case 'fully_paid': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'partially_paid': return <Wallet className="w-4 h-4 text-orange-600" />;
      case 'fully_paid': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelled': return <Clock3 className="w-4 h-4 text-red-600" />;
      default: return <Package className="w-4 h-4 text-gray-600" />;
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
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border-2 border-[#5d2a8b]">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-[#5d2a8b] to-[#7a3aa3] p-6 text-white">
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => router.back()}
                  className="flex items-center text-white hover:text-gray-200 transition-colors font-medium text-sm"
                >
                  <ArrowLeft className="w-5 h-5 mr-1" />
                  Back
                </button>
                <h1 className="text-2xl font-bold">My Orders</h1>
                <div className="w-16"></div>
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
                  <p className="text-gray-500 mb-4 text-sm">{error}</p>
                  <button 
                    onClick={fetchUserOrders}
                    className="bg-[#5d2a8b] text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-[#7a3aa3] transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-14 w-14 text-gray-400 mb-4" />
                  <h3 className="text-base font-bold text-gray-900 mb-1">No Orders Found</h3>
                  <p className="text-xs text-gray-500 mb-4">You haven't placed any orders yet</p>
                  <button 
                    onClick={() => router.push('/user/body-care')}
                    className="bg-[#5d2a8b] text-white px-5 py-2.5 rounded-lg font-semibold text-xs hover:bg-[#7a3aa3] transition-colors"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b pb-3">
                    <h2 className="text-lg font-bold text-gray-900">Order History</h2>
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">{orders.length} orders</span>
                  </div>
                  
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order._id} className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                          <div>
                            <h3 className="text-base font-bold text-gray-900">{order.productName}</h3>
                            <p className="text-xs text-purple-700 font-semibold">{order.organizationName}</p>
                            <div className="flex items-center text-[11px] text-gray-400 mt-1">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(order.createdAt)}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 self-start sm:self-center">
                            {getStatusIcon(order.orderStatus)}
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide ${getStatusColor(order.orderStatus)}`}>
                              {order.orderStatus.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50/50 p-3.5 rounded-xl border border-gray-100 mb-4 text-xs">
                          <div>
                            <p className="text-[11px] text-gray-400 font-medium">Product Price</p>
                            <p className="font-bold text-gray-900 mt-0.5">{formatCurrency(order.productPrice)}</p>
                          </div>
                          <div>
                            <p className="text-[11px] text-gray-400 font-medium">Amount Paid</p>
                            <p className="font-bold text-green-600 mt-0.5">{formatCurrency(order.totalAmountPaid)}</p>
                          </div>
                          {order.orderStatus === 'partially_paid' && (
                            <div className="col-span-2 sm:col-span-2">
                              <p className="text-[11px] text-gray-400 font-medium">Remaining Balance</p>
                              <p className="font-bold text-orange-600 mt-0.5">{formatCurrency(order.upfrontRemainingBalance)}</p>
                            </div>
                          )}
                        </div>

                        {order.payments.length > 0 && (
                          <div className="mb-4 bg-gray-50/20 rounded-lg p-3 border border-dashed border-gray-200">
                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Payment History</h4>
                            <div className="space-y-1.5">
                              {order.payments.map((payment, index) => (
                                <div key={index} className="flex justify-between items-center text-xs text-gray-600 border-b border-gray-100/60 pb-1.5 last:border-0 last:pb-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-medium">Payment #{payment.paymentNumber}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${payment.status === 'successful' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                                      {payment.status.toLowerCase()}
                                    </span>
                                  </div>
                                  <div className="font-bold text-gray-900">{formatCurrency(payment.amount)}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="border-t border-gray-100 pt-3.5 flex flex-row gap-2.5">
                          <button 
                            onClick={() => router.push(`/user/orders/${order._id}`)}
                            className="flex-1 py-2.5 px-4 border-2 border-[#5d2a8b] text-[#5d2a8b] hover:bg-purple-50 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Details
                          </button>
                          
                          {/* PARTIALLY PAID ACTION: Complete Outstanding Balance Payment */}
                          {order.orderStatus === 'partially_paid' && (
                            <button 
                              disabled={processingOrderId === order._id}
                              onClick={() => handleCompletePayment(order)}
                              className="flex-1 py-2.5 px-4 bg-[#5d2a8b] hover:bg-[#7a3aa3] text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:bg-gray-300"
                            >
                              {processingOrderId === order._id ? (
                                <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                              ) : (
                                <CreditCard className="w-3.5 h-3.5" />
                              )}
                              Complete Payment
                            </button>
                          )}

                          {/* FULLY PAID ACTION: Dynamic delivery validation hand-off */}
                          {order.orderStatus === 'fully_paid' && (
                            <button 
                              onClick={() => handleConfirmDelivery(order._id)}
                              className="flex-1 py-2.5 px-4 bg-[#5d2a8b] hover:bg-[#7a3aa3] text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                            >
                              <CheckSquare className="w-3.5 h-3.5" /> Confirm Delivery
                            </button>
                          )}
                        </div>

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