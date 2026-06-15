"use client";

import React, { useState, useEffect } from 'react';
import { Package, Search, RefreshCw, Eye } from 'lucide-react';
import { toast } from '@/app/components/hooks/use-toast';
import { BASE_URL } from '@/config/api';

interface Order {
  _id: string;
  orderId?: string;
  productId?: string;
  productName?: string;
  organizationId?: string;
  organizationName?: string;
  productPrice?: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  totalAmountPaid?: number;
  orderStatus?: string;
  paymentStatus?: string;
  itemType?: string;
  createdAt?: string;
  updatedAt?: string;
  payments?: any[];
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  partially_paid: 'bg-blue-100 text-blue-800',
  fully_paid: 'bg-green-100 text-green-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  confirmed: 'bg-purple-100 text-purple-800',
};

const formatCurrency = (amount?: number) => {
  if (amount === undefined || amount === null) return '₦0.00';
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Invalid Date';
  }
};

const OrderManagementPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined'
        ? localStorage.getItem('userToken') || sessionStorage.getItem('userToken')
        : null;

      const response = await fetch(`${BASE_URL}/api/orders/admin/all`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const raw = result.data?.orders?.orders ?? result.data?.orders;
          setOrders(Array.isArray(raw) ? raw : []);
        } else {
          toast({ title: 'Error', description: result.message || 'Failed to load orders', variant: 'destructive' });
          setOrders([]);
        }
      } else {
        const err = await response.json().catch(() => ({}));
        toast({ title: 'Error', description: err.message || `Failed to load orders (${response.status})`, variant: 'destructive' });
      }
    } catch (error: any) {
      console.error('Error loading orders:', error);
      toast({ title: 'Error', description: error.message || 'Failed to connect to server', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filtered = orders.filter(order => {
    const matchesSearch =
      !searchTerm ||
      (order.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customerEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.orderId || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.orderStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
        * { font-family: 'Manrope', sans-serif; }
      `}</style>

      <div className="px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
            <p className="text-gray-600 mt-1">View and manage all product and service orders</p>
          </div>
          <button
            onClick={loadOrders}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Orders', value: orders.length, color: 'bg-blue-50 border-blue-200 text-blue-700' },
            { label: 'Pending', value: orders.filter(o => o.orderStatus === 'pending').length, color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
            { label: 'Completed', value: orders.filter(o => ['fully_paid', 'completed'].includes(o.orderStatus || '')).length, color: 'bg-green-50 border-green-200 text-green-700' },
            { label: 'Cancelled', value: orders.filter(o => o.orderStatus === 'cancelled').length, color: 'bg-red-50 border-red-200 text-red-700' },
          ].map(card => (
            <div key={card.label} className={`p-4 rounded-xl border ${card.color}`}>
              <p className="text-sm font-medium opacity-80">{card.label}</p>
              <p className="text-2xl font-bold mt-1">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by product, customer, or order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="fully_paid">Fully Paid</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Order ID', 'Product', 'Customer', 'Amount', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      <Package className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                      <p>No orders found</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">
                        {(order.orderId || order._id || '').slice(-8)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{order.productName || 'N/A'}</div>
                        {order.organizationName && (
                          <div className="text-xs text-gray-500">{order.organizationName}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">{order.customerName || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{order.customerEmail || ''}</div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {formatCurrency(order.totalAmountPaid || order.productPrice)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.orderStatus || ''] || 'bg-gray-100 text-gray-700'}`}>
                          {order.orderStatus?.replace(/_/g, ' ') || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-purple-600 hover:text-purple-800"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Order Details</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              {[
                ['Order ID', (selectedOrder.orderId || selectedOrder._id || '').slice(-12)],
                ['Product', selectedOrder.productName || 'N/A'],
                ['Organization', selectedOrder.organizationName || 'N/A'],
                ['Customer', selectedOrder.customerName || 'N/A'],
                ['Email', selectedOrder.customerEmail || 'N/A'],
                ['Phone', selectedOrder.customerPhone || 'N/A'],
                ['Product Price', formatCurrency(selectedOrder.productPrice)],
                ['Total Paid', formatCurrency(selectedOrder.totalAmountPaid)],
                ['Order Status', selectedOrder.orderStatus?.replace(/_/g, ' ') || 'N/A'],
                ['Payment Status', selectedOrder.paymentStatus || 'N/A'],
                ['Created', formatDate(selectedOrder.createdAt)],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between border-b pb-2">
                  <span className="font-medium text-gray-600">{label}</span>
                  <span className="text-gray-900">{value as string}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagementPage;
