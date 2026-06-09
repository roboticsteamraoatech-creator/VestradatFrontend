

"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { BASE_URL } from '@/config/api';

const RemittancePage = () => {
  const [loading, setLoading] = useState(true);
  
 
  const [confirmedDeliveries, setConfirmedDeliveries] = useState<any[]>([]);
  

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [isRemittanceModalOpen, setIsRemittanceModalOpen] = useState(false);

  useEffect(() => {
    loadConfirmedDeliveries();
  }, []);

  const loadConfirmedDeliveries = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
      
      const response = await fetch(`${BASE_URL}/api/orders/super-admin/confirmed-deliveries/all`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setConfirmedDeliveries(result.data.orders || []);
        }
      } else {
        console.error('Failed to fetch confirmed deliveries:', response.status);
      }
    } catch (error) {
      console.error('Error loading confirmed deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount === undefined || amount === null) return '₦0.00';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount || 0);
  };

  const processRemittance = async (orderId: string, remittanceData: any) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
      
      const response = await fetch(`${BASE_URL}/api/orders/super-admin/${orderId}/process-remittance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(remittanceData)
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        // Refresh the data
        loadConfirmedDeliveries();
        setIsRemittanceModalOpen(false);
        alert('Remittance processed successfully!');
      } else {
        alert(result.message || 'Failed to process remittance');
      }
    } catch (error) {
      console.error('Error processing remittance:', error);
      alert('Error processing remittance');
    }
  };

  const getOrderIdShort = (order: any) => {
    const id = order?._id || order?.id || order?._doc?._id || '';
    if (!id) return 'N/A';
    return id.slice(-8);
  };

  const ProductDetailsModal = ({ order, isOpen, onClose }: { order: any; isOpen: boolean; onClose: () => void }) => {
    if (!isOpen || !order) return null;

    const orderData = order._doc || order;

    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">Product Details</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Product Name</label>
                  <p className="text-lg font-semibold text-gray-900">{orderData?.productName || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Product Price</label>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(orderData?.productPrice)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Organization Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Organization Name</label>
                    <p className="text-gray-900">{orderData?.organizationName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Organization ID</label>
                    <p className="text-gray-900">{orderData?.organizationId || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {orderData?.hasSubServices && orderData?.subServices?.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Sub Services</h3>
                  <div className="space-y-2">
                    {orderData.subServices.map((service: any, index: number) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <p className="font-medium text-gray-900">{service.name}</p>
                        <p className="text-sm text-gray-600">{formatCurrency(service.price)}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 font-medium text-gray-900">Sub Services Total: {formatCurrency(orderData.subServicesTotal)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PaymentDetailsModal = ({ order, isOpen, onClose }: { order: any; isOpen: boolean; onClose: () => void }) => {
    if (!isOpen || !order) return null;

    const orderData = order._doc || order;
    const payments = orderData?.payments || [];

    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">Payment Details</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1">
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-500">Total Amount</label>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(orderData?.totalAmountPaid)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Order Status</label>
                  <p className="text-lg font-semibold capitalize text-gray-900">{orderData?.orderStatus?.replace('_', ' ') || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Upfront</label>
                  <p className="text-gray-900">{orderData?.upfrontPercentage || 0}% ({formatCurrency(orderData?.upfrontAmountPaid)})</p>
                </div>
                {orderData?.upfrontRemainingBalance > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Remaining</label>
                    <p className="text-red-600 font-medium">{formatCurrency(orderData.upfrontRemainingBalance)}</p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Payment History</h3>
                <div className="space-y-3">
                  {payments.length > 0 ? (
                    payments.map((payment: any, index: number) => (
                      <div key={payment._id || index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="text-xs text-gray-500">Payment #{payment.paymentNumber}</label>
                            <p className="font-medium text-gray-900">{formatCurrency(payment.amount)}</p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Status</label>
                            <p className={`capitalize font-medium ${payment.status === 'successful' ? 'text-green-600' : 'text-yellow-600'}`}>
                              {payment.status}
                            </p>
                          </div>
                          {/* <div>
                            <label className="text-xs text-gray-500">Gateway</label>
                            <p className="text-gray-900">{payment.paymentGateway || 'N/A'}</p>
                          </div> */}
                          <div>
                            <label className="text-xs text-gray-500">Date</label>
                            <p className="text-sm text-gray-900">{formatDate(payment.dateTime)}</p>
                          </div>
                       
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No payment records found</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const RemittanceModal = ({ order, isOpen, onClose }: { order: any; isOpen: boolean; onClose: () => void }) => {
    const [formData, setFormData] = useState({
      organizationBankName: '',
      organizationAccountNumber: '',
      organizationAccountName: '',
      amountRemitted: '',
      settlementDate: '',
      superAdminBankName: '',
      superAdminAccountNumber: '',
      paymentEvidenceUrl: ''
    });
    const [processing, setProcessing] = useState(false);

    if (!isOpen || !order) return null;

    const orderData = order._doc || order;
    const orderId = orderData?._id || orderData?.id;
    const orgBankDetails = order?.organizationBankDetails;

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setProcessing(true);
      
      const remittanceData = {
        organizationBankName: formData.organizationBankName || orgBankDetails?.bankName || '',
        organizationAccountNumber: formData.organizationAccountNumber || orgBankDetails?.accountNumber || '',
        organizationAccountName: formData.organizationAccountName || orgBankDetails?.accountName || '',
        amountRemitted: parseFloat(formData.amountRemitted),
        settlementDate: formData.settlementDate,
        superAdminBankName: formData.superAdminBankName,
        superAdminAccountNumber: formData.superAdminAccountNumber,
        paymentEvidenceUrl: formData.paymentEvidenceUrl
      };

      await processRemittance(orderId, remittanceData);
      setProcessing(false);
    };

    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">Process Remittance</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Organization Bank Name</label>
                  <input
                    type="text"
                    value={formData.organizationBankName || orgBankDetails?.bankName || ''}
                    onChange={(e) => setFormData({...formData, organizationBankName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5d2a8b] focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Organization Account Number</label>
                  <input
                    type="text"
                    value={formData.organizationAccountNumber || orgBankDetails?.accountNumber || ''}
                    onChange={(e) => setFormData({...formData, organizationAccountNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5d2a8b] focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Organization Account Name</label>
                  <input
                    type="text"
                    value={formData.organizationAccountName || orgBankDetails?.accountName || ''}
                    onChange={(e) => setFormData({...formData, organizationAccountName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5d2a8b] focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount Remitted (₦)</label>
                  <input
                    type="number"
                    value={formData.amountRemitted}
                    onChange={(e) => setFormData({...formData, amountRemitted: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5d2a8b] focus:border-transparent"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Settlement Date</label>
                  <input
                    type="date"
                    value={formData.settlementDate}
                    onChange={(e) => setFormData({...formData, settlementDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5d2a8b] focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Super Admin Bank Name</label>
                  <input
                    type="text"
                    value={formData.superAdminBankName}
                    onChange={(e) => setFormData({...formData, superAdminBankName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5d2a8b] focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Super Admin Account Number</label>
                  <input
                    type="text"
                    value={formData.superAdminAccountNumber}
                    onChange={(e) => setFormData({...formData, superAdminAccountNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5d2a8b] focus:border-transparent"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Evidence URL</label>
                  <input
                    type="url"
                    value={formData.paymentEvidenceUrl}
                    onChange={(e) => setFormData({...formData, paymentEvidenceUrl: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5d2a8b] focus:border-transparent"
                    placeholder="https://cloudinary.com/evidence.pdf"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#5d2a8b] text-white rounded-md hover:bg-[#4a2270] transition-colors flex items-center"
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Process Remittance'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const DeliveryDetailsModal = ({ order, isOpen, onClose }: { order: any; isOpen: boolean; onClose: () => void }) => {
    if (!isOpen || !order) return null;

    const orderData = order._doc || order;
    const delivery = orderData?.deliveryConfirmation || {};

    const CloudinaryImage = ({ src, alt, className }: { src: string; alt: string; className?: string }) => (
      <img 
        src={src} 
        alt={alt} 
        className={className}
        style={{ objectFit: 'cover' }}
      />
    );

    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">Delivery Details</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Delivery Status</label>
                  <p className={`text-lg font-semibold capitalize ${
                    orderData?.deliveryStatus === 'confirmed' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {orderData?.deliveryStatus || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Delivery Mode</label>
                  <p className="text-lg font-semibold capitalize text-gray-900">{delivery.deliveryMode?.replace('_', ' ') || 'N/A'}</p>
                </div>
              </div>

              {delivery.deliveryMode === 'pickup_center' && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Pickup Center Information</h3>
                  <p className="text-gray-900"><span className="font-medium">Center Name:</span> {delivery.pickupCenterName || 'N/A'}</p>
                  
                  {delivery.productImageUrl && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                      <div className="relative h-48 w-full max-w-md rounded-lg overflow-hidden border">
                        <CloudinaryImage 
                          src={delivery.productImageUrl} 
                          alt="Product"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {delivery.representativeImageUrl && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Representative</label>
                        <div className="relative h-32 w-32 rounded-full overflow-hidden border">
                          <CloudinaryImage 
                            src={delivery.representativeImageUrl} 
                            alt="Representative"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                    
                    {delivery.userImageUrl && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
                        <div className="relative h-32 w-32 rounded-full overflow-hidden border">
                          <CloudinaryImage 
                            src={delivery.userImageUrl} 
                            alt="Customer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {delivery.deliveryMode === 'shipping' && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Shipping Address</h3>
                  <p className="text-gray-900">{delivery.deliveryAddress || 'N/A'}</p>
                </div>
              )}

              {delivery.imageComment && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image Comment</label>
                  <p className="bg-gray-50 p-3 rounded-lg text-gray-900">{delivery.imageComment}</p>
                </div>
              )}

              {delivery.satisfactionDeclaration && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Satisfaction Declaration</label>
                  <p className="bg-gray-50 p-3 rounded-lg italic text-gray-600">"{delivery.satisfactionDeclaration}"</p>
                </div>
              )}

              {delivery.confirmedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirmed At</label>
                  <p className="text-gray-900">{formatDate(delivery.confirmedAt)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="manrope ml-0 md:ml-[350px] pt-8 md:pt-8 p-4 md:p-8 min-h-screen bg-gray-50">
        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
          .manrope { font-family: 'Manrope', sans-serif; }
        `}</style>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Confirmed Deliveries</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-40 mb-6"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="manrope ml-0 md:ml-[350px] pt-8 md:pt-8 p-4 md:p-8 min-h-screen bg-gray-50">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
        .manrope { font-family: 'Manrope', sans-serif; }
      `}</style>

      {/* Modals */}
      <ProductDetailsModal 
        order={selectedOrder} 
        isOpen={isProductModalOpen} 
        onClose={() => setIsProductModalOpen(false)} 
      />
      <PaymentDetailsModal 
        order={selectedOrder} 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
      />
      <DeliveryDetailsModal 
        order={selectedOrder} 
        isOpen={isDeliveryModalOpen} 
        onClose={() => setIsDeliveryModalOpen(false)} 
      />
      <RemittanceModal 
        order={selectedOrder} 
        isOpen={isRemittanceModalOpen} 
        onClose={() => setIsRemittanceModalOpen(false)} 
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Confirmed Deliveries</h1>
        <p className="text-gray-600 mt-1">View and process confirmed deliveries for remittance</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
       
        
        <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Order ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Payment</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Delivery</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Bank</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Remittance</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Process  Remittance</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {confirmedDeliveries.map((order) => {
                const orderData = order._doc || order;
                const orgBankDetails = order?.organizationBankDetails;
                const remittance = orderData?.remittance || {};
                
                return (
                  <tr key={getOrderIdShort(order)} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-600">
                      {getOrderIdShort(order)}
                    </td>
                    
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsProductModalOpen(true);
                        }}
                        className="text-[#5d2a8b] hover:text-[#4a2270] text-sm font-medium hover:underline"
                      >
                        {orderData?.productName || 'N/A'}
                      </button>
                    </td>
                    
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{orderData?.customerName || 'N/A'}</div>
                        <div className="text-gray-500 truncate max-w-[200px]">{orderData?.customerEmail || 'N/A'}</div>
                      </div>
                    </td>
                    
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        orderData?.orderStatus === 'fully_paid' ? 'bg-green-100 text-green-800' :
                        orderData?.orderStatus === 'partially_paid' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {orderData?.orderStatus?.replace('_', ' ') || 'N/A'}
                      </span>
                    </td>
                    
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {formatCurrency(orderData?.totalAmountPaid)}
                    </td>
                    
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsPaymentModalOpen(true);
                        }}
                        className="text-[#5d2a8b] hover:text-[#4a2270] text-sm font-medium hover:underline"
                      >
                        View Details
                      </button>
                    </td>
                    
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsDeliveryModalOpen(true);
                        }}
                        className="text-[#5d2a8b] hover:text-[#4a2270] text-sm font-medium hover:underline"
                      >
                        View Details
                      </button>
                      <div className="text-xs text-gray-500 mt-1 capitalize">
                        {orderData?.deliveryConfirmation?.deliveryMode?.replace('_', ' ') || 'N/A'}
                      </div>
                    </td>
                    
                    <td className="px-4 py-3 whitespace-nowrap">
                      {orgBankDetails ? (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{orgBankDetails.bankName || 'N/A'}</div>
                          <div className="text-gray-500">{orgBankDetails.accountNumber || 'N/A'}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No bank details</span>
                      )}
                    </td>
                    
                    <td className="px-4 py-3 whitespace-nowrap">
                      {remittance && Object.keys(remittance).length > 0 ? (
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            remittance.remittanceStatus === 'completed' ? 'bg-green-100 text-green-800' :
                            remittance.remittanceStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {remittance.remittanceStatus || 'pending'}
                          </span>
                          {remittance.amountRemitted && (
                            <div className="text-xs text-gray-600 mt-1">
                              {formatCurrency(remittance.amountRemitted)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Not processed</span>
                      )}
                    </td>
                    
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsRemittanceModalOpen(true);
                        }}
                        className="bg-[#5d2a8b] hover:bg-[#4a2270] text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
                      >
                        Process
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {confirmedDeliveries.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No confirmed deliveries found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RemittancePage;