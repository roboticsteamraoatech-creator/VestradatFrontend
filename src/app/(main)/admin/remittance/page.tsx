"use client";

import React, { useState, useEffect } from 'react';
import BankDetailsService from '@/services/BankDetailsService';
import { toast } from '@/app/components/hooks/use-toast';
import { AlertCircle, Plus } from 'lucide-react';

const RemittancePage = () => {
  
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bankError, setBankError] = useState('');

  useEffect(() => {
    loadBankDetails();
  }, []);

  const loadBankDetails = async () => {
    try {
      setLoading(true);
      const result = await BankDetailsService.getBankDetails();
      
      if (result) {
        setBankDetails(result);
      } else {
        setBankDetails(null);
      }
    } catch (error: any) {
      console.error('Error loading bank details:', error);
      setBankError(error.message || 'Failed to load bank details');
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bank details...</p>
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

      <div className="pt-8 p-4 md:p-8 min-h-screen">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Organization Bank Details</h2>
          <p className="text-gray-600">View and manage your organization bank account information.</p>
        </div>
        
        {/* Actions */}
        <div className="flex justify-between mb-4">
          <div></div>
          <a 
            href="/admin/remittance/create"
            onClick={() => {
              console.log('🔴 Clicking "Add New Bank Details" button');
              console.log('🔴 Navigating to:', '/admin/remittance/create');
              console.log('🔴 Current token exists:', typeof window !== 'undefined' ? !!localStorage.getItem('userToken') : false);
            }}
            className="px-4 py-2 bg-[#5d2a8b] text-white rounded-lg hover:bg-[#7a3aa3] transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Bank Details
          </a>
        </div>
      
        
        {/* Bank Details Table */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Number</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bankDetails ? (
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bankDetails.bankName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bankDetails.accountNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bankDetails.accountName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(bankDetails.updatedAt).toLocaleDateString()}</td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                      No bank details added yet. Click "Add New Bank Details" to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemittancePage;