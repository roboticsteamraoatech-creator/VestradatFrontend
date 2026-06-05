"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProductPaymentView from './ProductPaymentView';
import ServicePaymentView from './ServicePaymentView';

const PaymentPage = () => {
  const router = useRouter();
  const [orderData, setOrderData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedProduct = localStorage.getItem('selectedProduct');
    if (savedProduct) {
      try {
        setOrderData(JSON.parse(savedProduct));
      } catch {
        setError('Failed to parse order data.');
      }
    } else {
      setError('No active order data found. Please select an item first.');
    }
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-6 rounded-xl shadow-sm border border-red-200 max-w-sm">
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button onClick={() => router.back()} className="px-4 py-2 bg-[#5d2a8b] text-white rounded-lg text-sm">
            Go Back
          </button>
        </div>
      </div>
    );
  }


  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5d2a8b]"></div>
      </div>
    );
  }

  // Dynamically route based on itemType
  if (orderData.product.itemType === 'service') {
    return <ServicePaymentView initialOrderData={orderData} />;
  }

  return <ProductPaymentView initialOrderData={orderData} />;
};

export default PaymentPage;
