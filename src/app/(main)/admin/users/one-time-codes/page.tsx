"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OneTimeCodeService, OneTimeCodeRequest } from '@/services/OneTimeCodeService';
import GenerateCodeModal from '@/app/components/generateCodeModal';

const OneTimeCodesPage = () => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [codes, setCodes] = useState<any[]>([]);
  const [codesLoading, setCodesLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCodes, setTotalCodes] = useState<number>(0);
  const [selectedCode, setSelectedCode] = useState<any>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
  const [emailInput, setEmailInput] = useState<string>('');
  const [emailSending, setEmailSending] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [successTimeoutId, setSuccessTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Fetch one-time codes from API
  useEffect(() => {
    const fetchCodes = async () => {
      try {
        const service = new OneTimeCodeService();
        const response = await service.getOneTimeCodes(currentPage, 10);
        setCodes(response.data.codes || []);
        setTotalPages(response.data.pagination.totalPages);
        setTotalCodes(response.data.pagination.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load one-time codes');
        console.error('Error fetching codes:', err);
      } finally {
        setCodesLoading(false);
      }
    };
    
    fetchCodes();
  }, [currentPage]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutId) {
        clearTimeout(successTimeoutId);
      }
    };
  }, [successTimeoutId]);

  const handleGenerateCode = async (formData: OneTimeCodeRequest) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Clear any existing success timeout
      if (successTimeoutId) {
        clearTimeout(successTimeoutId);
        setSuccessTimeoutId(null);
      }
      
      const service = new OneTimeCodeService();
      const response = await service.generateOneTimeCode(formData);
      
      setSuccess(response.data.message);
      setIsModalOpen(false);
      
      // Set timeout to clear success message after 3 seconds
      const timeoutId = setTimeout(() => {
        setSuccess(null);
      }, 3000);
      setSuccessTimeoutId(timeoutId);
      
      // Refresh the codes list
      const codesResponse = await service.getOneTimeCodes(currentPage, 10);
      setCodes(codesResponse.data.codes || []);
      setTotalPages(codesResponse.data.pagination.totalPages);
      setTotalCodes(codesResponse.data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate one-time code');
      console.error('Error generating code:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const goBack = () => {
    router.back();
  };

  const handleSendEmail = async () => {
    if (!selectedCode) return;
    
    setEmailSending(true);
    setEmailError(null);
    
    // Clear any existing success timeout
    if (successTimeoutId) {
      clearTimeout(successTimeoutId);
      setSuccessTimeoutId(null);
    }
    
    try {
      const service = new OneTimeCodeService();
      // The backend expects just the code value, not the ID or email
      await service.sendOneTimeCodeEmail(selectedCode.code);
      
      setSuccess('Email sent successfully');
      
      // Close the modal after a delay
      setTimeout(() => {
        setIsEmailModalOpen(false);
        setEmailInput('');
        // Clear the success message after modal closes
        setTimeout(() => setSuccess(null), 300);
      }, 2000); // Close modal after 2 seconds
    } catch (err: any) {
      // Handle 404/501 errors specifically for missing endpoint
      if (err.status === 404 || err.status === 501) {
        setEmailError('Email sending functionality is not yet available on the server');
      } else {
        setEmailError(err instanceof Error ? err.message : 'Failed to send email');
      }
      console.error('Error sending email:', err);
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <div className="manrope pt-8 md:pt-8 p-4 md:p-8 min-h-screen">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
        .manrope { font-family: 'Manrope', sans-serif; }
      `}</style>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <button 
              onClick={goBack}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 mb-4"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold text-gray-800">One-Time Codes</h1>
            <p className="text-gray-600">Manage generated access codes for external users</p>
          </div>
          <div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-[#5D2A8B] text-white rounded-md hover:bg-[#4a216e]"
            >
              Generate Code
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            Error: {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-white rounded-lg p-4 text-black">
            Success: {success}
          </div>
        )}
      
      {/* Codes Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">One-Time Codes</h2>
          
          {codesLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#5D2A8B]"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">Error loading codes: {error}</div>
          ) : codes.length === 0 ? (
            <div className="text-center py-8 text-gray-600">No one-time codes generated yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires At</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {codes.map((code) => (
                    <tr key={code._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{code.code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{code.userEmail}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{code.organizationId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(code.expiresAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(code.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedCode(code);
                            setIsEmailModalOpen(true);
                          }}
                          className="text-[#5d2a8b]"
                        >
                          Send Email
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && !codesLoading && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Showing page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span> 
                ({totalCodes} codes total)
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Generate Code Modal */}
      <GenerateCodeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleGenerateCode}
        loading={loading}
      />
      
      {/* Send Email Modal */}
      {isEmailModalOpen && selectedCode && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Send One-Time Code via Email</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Email</label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Enter email address"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
              <div className="p-2 bg-gray-100 rounded-md text-center font-mono">
                {selectedCode.code}
              </div>
            </div>
            
            {emailError && (
              <div className="mb-4 text-red-600 text-sm">{emailError}</div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsEmailModalOpen(false);
                  setEmailInput('');
                  setEmailError(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={emailSending}
                className="px-4 py-2 bg-transparent text-[#5D2A8B] border border-[#5D2A8B] rounded-md hover:bg-[#5D2A8B] hover:text-white disabled:opacity-50"
              >
                {emailSending ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}

export default OneTimeCodesPage;