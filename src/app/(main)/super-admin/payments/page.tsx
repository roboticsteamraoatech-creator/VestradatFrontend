
// "use client";

// import React, { useState, useEffect, useRef } from 'react';
// import { Search, Download, X, ChevronLeft, ChevronRight } from 'lucide-react';
// import { toast } from '@/app/components/hooks/use-toast';
// import { useAuthContext } from '@/AuthContext';

// interface UserInfo {
//   fullName: string;
//   email: string;
//   phoneNumber: string;
//   customUserId: string;
// }

// interface Service {
//   serviceId: string;
//   serviceName: string;
//   duration: string;
//   _id: string;
// }

// interface Payment {
//   _id: string;
//   userId: string;
//   userType: string;
//   packageId: string;
//   packageTitle: string;
//   subscriptionDuration: string;
//   startDate: string;
//   endDate: string;
//   status: string;
//   autoRenew: boolean;
//   amountPaid: number;
//   paymentStatus: 'completed' | 'pending' | 'failed';
//   services: Service[];
//   createdAt: string;
//   updatedAt: string;
//   userInfo: UserInfo;
// }

// interface ApiResponse {
//   data: {
//     subscriptions: Payment[];
//     total: number;
//     page: number;
//     limit: number;
//     totalPages: number;
//   };
//   success: boolean;
//   message: string;
// }

// const PaymentsPage = () => {
//   const [payments, setPayments] = useState<Payment[]>([]);
//   const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [totalItems, setTotalItems] = useState(0);
//   const [itemsPerPage, setItemsPerPage] = useState(10);
//   const [showServicesModal, setShowServicesModal] = useState(false);
//   const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
//   const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
//   const { token } = useAuthContext();
  
//   // Fetch payments from API
//   useEffect(() => {
//     fetchPayments();
//   }, [currentPage, itemsPerPage, searchTerm]);
  
//   const fetchPayments = async () => {
//     try {
//       setLoading(true);
      
//       // Check if token exists before making the request
//       if (!token) {
//         throw new Error('Authentication token is missing');
//       }
      
//       // Build query parameters
//       let queryParams = new URLSearchParams({
//         page: currentPage.toString(),
//         limit: itemsPerPage.toString(),
//         sortBy: 'createdAt',
//         sortOrder: 'desc'
//       });
      
//       // Add search parameter if search term exists
//       if (searchTerm) {
//         queryParams.append('search', searchTerm);
//       }
      
//       const response = await fetch(`${BASE_URL}/api/super-admin/paid-subscriptions?${queryParams}`, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });
      
//       if (!response.ok) {
//         const errorText = await response.text();
//         throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
//       }
      
//       const data: ApiResponse = await response.json();
      
//       if (data.success) {
//         setPayments(data.data.subscriptions);
//         setFilteredPayments(data.data.subscriptions);
//         setTotalPages(data.data.totalPages);
//         setTotalItems(data.data.total);
//       } else {
//         toast({
//           title: 'Error',
//           description: data.message || 'Failed to fetch payments',
//           variant: 'destructive',
//         });
//       }
//     } catch (error: any) {
//       console.error('Error fetching payments:', error);
//       toast({
//         title: 'Error',
//         description: error.message || 'An error occurred while fetching payments',
//         variant: 'destructive',
//       });
//     } finally {
//       setLoading(false);
//     }
//   };
  
//   const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setSearchTerm(e.target.value);
//     setCurrentPage(1); // Reset to first page when search changes
//   };
  
//   const handlePageChange = (newPage: number) => {
//     if (newPage >= 1 && newPage <= totalPages) {
//       setCurrentPage(newPage);
//       // Scroll to top of table
//       document.querySelector('.table-container')?.scrollTo({ top: 0, behavior: 'smooth' });
//     }
//   };
  
//   const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     setItemsPerPage(Number(e.target.value));
//     setCurrentPage(1); // Reset to first page when items per page changes
//   };
  
//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'completed':
//         return 'bg-green-100 text-green-800';
//       case 'pending':
//         return 'bg-yellow-100 text-yellow-800';
//       case 'failed':
//         return 'bg-red-100 text-red-800';
//       default:
//         return 'bg-gray-100 text-gray-800';
//     }
//   };
  
//   const formatCurrency = (amount: number, currency: string) => {
//     // Use NGN as default if currency is not provided or invalid
//     const validCurrency = currency && currency.length === 3 ? currency : 'NGN';
//     return new Intl.NumberFormat('en-NG', {
//       style: 'currency',
//       currency: validCurrency,
//     }).format(amount);
//   };
  
//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit',
//     });
//   };
  
//   const openServicesModal = (payment: Payment) => {
//     setSelectedPayment(payment);
//     setShowServicesModal(true);
//   };
  
//   const closeServicesModal = () => {
//     setShowServicesModal(false);
//     setSelectedPayment(null);
//   };
  
//   // Calculate totals
//   const totalRevenue = payments.reduce((sum, p) => sum + p.amountPaid, 0);
//   const completedPayments = payments.filter(p => p.paymentStatus === 'completed').length;
  
//   // Generate page numbers for pagination
//   const getPageNumbers = () => {
//     const pageNumbers = [];
//     const maxPagesToShow = 5;
    
//     if (totalPages <= maxPagesToShow) {
//       // Show all pages if total pages are less than or equal to maxPagesToShow
//       for (let i = 1; i <= totalPages; i++) {
//         pageNumbers.push(i);
//       }
//     } else {
//       // Always show first page
//       pageNumbers.push(1);
      
//       // Calculate start and end of page range around current page
//       let start = Math.max(2, currentPage - 1);
//       let end = Math.min(totalPages - 1, currentPage + 1);
      
//       // Adjust if at the beginning
//       if (currentPage <= 3) {
//         start = 2;
//         end = 4;
//       }
      
//       // Adjust if at the end
//       if (currentPage >= totalPages - 2) {
//         start = totalPages - 3;
//         end = totalPages - 1;
//       }
      
//       // Add ellipsis after first page if needed
//       if (start > 2) {
//         pageNumbers.push('...');
//       }
      
//       // Add middle pages
//       for (let i = start; i <= end; i++) {
//         pageNumbers.push(i);
//       }
      
//       // Add ellipsis before last page if needed
//       if (end < totalPages - 1) {
//         pageNumbers.push('...');
//       }
      
//       // Always show last page
//       if (totalPages > 1) {
//         pageNumbers.push(totalPages);
//       }
//     }
    
//     return pageNumbers;
//   };
  
//   return (
//     <div className="manrope">
//       <style jsx>{`
//         @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
//         .manrope { font-family: 'Manrope', sans-serif; }
        
//         /* Custom scrollbar */
//         .custom-scrollbar::-webkit-scrollbar {
//           height: 8px;
//           width: 8px;
//         }
//         .custom-scrollbar::-webkit-scrollbar-track {
//           background: #f1f1f1;
//           border-radius: 4px;
//         }
//         .custom-scrollbar::-webkit-scrollbar-thumb {
//           background: #c1c1c1;
//           border-radius: 4px;
//         }
//         .custom-scrollbar::-webkit-scrollbar-thumb:hover {
//           background: #a1a1a1;
//         }
        
//         /* Table container with fixed height for scroll */
//         .table-container {
//           max-height: calc(100vh - 300px);
//           overflow-y: auto;
//         }
        
//         @media (min-width: 768px) {
//           .table-container {
//             max-height: calc(100vh - 280px);
//           }
//         }
//       `}</style>

//       <div className="ml-0 md:ml-[350px] pt-8 md:pt-8 p-4 md:p-8 min-h-screen">
//         {/* Header Section */}
//         <div className="mb-6">
//           <h1 className="text-2xl font-bold text-gray-800 mb-2">Payments</h1>
//           <p className="text-gray-600">Manage and monitor all subscription payments</p>
//         </div>
        
//         {/* Error Message Display */}
//         {errorMessage && (
//           <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
//             <div className="flex items-center">
//               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
//                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
//               </svg>
//               <p className="text-red-700 text-sm font-medium">{errorMessage}</p>
//             </div>
//           </div>
//         )}

//         {/* Stats Cards */}
//         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
//           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-gray-600">Total Revenue</p>
//                 <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue, 'NGN')}</p>
//               </div>
//               <div className="p-3 bg-purple-100 rounded-lg">
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                 </svg>
//               </div>
//             </div>
//           </div>
          
//           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-gray-600">Total Transactions</p>
//                 <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
//               </div>
//               <div className="p-3 bg-blue-100 rounded-lg">
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//                 </svg>
//               </div>
//             </div>
//           </div>
          
//           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-gray-600">Completed</p>
//                 <p className="text-2xl font-bold text-gray-900">{completedPayments}</p>
//               </div>
//               <div className="p-3 bg-green-100 rounded-lg">
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//                 </svg>
//               </div>
//             </div>
//           </div>
          
//           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-gray-600">Pending</p>
//                 <p className="text-2xl font-bold text-gray-900">{payments.filter(p => p.paymentStatus === 'pending').length}</p>
//               </div>
//               <div className="p-3 bg-yellow-100 rounded-lg">
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//                 </svg>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Search and Action Section */}
//         <div className="mb-6">
//           <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
//             <div className="flex-1 max-w-md">
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//                 <input
//                   type="text"
//                   placeholder="Search payments..."
//                   className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
//                   value={searchTerm}
//                   onChange={handleSearchChange}
//                 />
//               </div>
//             </div>
            
//             {/* Items per page selector */}
//             <div className="flex items-center gap-3">
//               <select
//                 value={itemsPerPage}
//                 onChange={handleItemsPerPageChange}
//                 className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm bg-white min-w-[120px]"
//               >
//                 <option value="5">5 per page</option>
//                 <option value="10">10 per page</option>
//                 <option value="25">25 per page</option>
//                 <option value="50">50 per page</option>
//                 <option value="100">100 per page</option>
//               </select>
//             </div>
//           </div>
//         </div>

//         {/* Payments Table with Scroll */}
//         <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
//           {loading ? (
//             <div className="flex justify-center items-center h-64">
//               <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5D2A8B]"></div>
//             </div>
//           ) : (
//             <>
//               <div className="table-container">
//                 <table className="min-w-full divide-y divide-gray-200">
//                   <thead className="bg-gray-50 sticky top-0 z-10">
//                     <tr>
//                       <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Subscription ID
//                       </th>
//                       <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         User
//                       </th>
//                       <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Package
//                       </th>
//                       <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Duration
//                       </th>
//                       <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Services
//                       </th>
//                       <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Amount Paid
//                       </th>
//                       <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Date
//                       </th>
//                       <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Payment Status
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white divide-y divide-gray-200">
//                     {filteredPayments.length === 0 ? (
//                       <tr>
//                         <td colSpan={8} className="px-6 py-12 text-center">
//                           <div className="flex flex-col items-center justify-center text-gray-500">
//                             <p className="text-lg font-medium">No payments found</p>
//                             <p className="text-sm mt-1">Try adjusting your search</p>
//                           </div>
//                         </td>
//                       </tr>
//                     ) : (
//                       filteredPayments.map((payment) => (
//                         <tr key={payment._id} className="hover:bg-gray-50 transition-colors duration-150">
//                           <td className="px-6 py-4 whitespace-nowrap">
//                             <div className="text-sm font-semibold text-gray-900">{payment._id.slice(-8)}</div>
//                             <div className="text-xs text-gray-500">ID: {payment._id}</div>
//                           </td>
//                           <td className="px-6 py-4 whitespace-nowrap">
//                             <div className="flex items-center">
//                               <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
//                                 <span className="text-purple-600 font-semibold">
//                                   {payment.userInfo.fullName.charAt(0).toUpperCase()}
//                                 </span>
//                               </div>
//                               <div className="ml-4">
//                                 <div className="text-sm font-medium text-gray-900">{payment.userInfo.fullName}</div>
//                                 <div className="text-sm text-gray-500">{payment.userInfo.email}</div>
//                               </div>
//                             </div>
//                           </td>
//                           <td className="px-6 py-4 whitespace-nowrap">
//                             <div className="flex items-center">
//                               <span className="text-sm text-gray-900">{payment.packageTitle}</span>
//                             </div>
//                           </td>
//                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                             <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
//                               {payment.subscriptionDuration}
//                             </span>
//                           </td>
//                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                             <button
//                               onClick={() => openServicesModal(payment)}
//                               className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full hover:bg-purple-200 transition-colors"
//                             >
//                               View Services ({payment.services.length})
//                             </button>
//                           </td>
//                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
//                             {formatCurrency(payment.amountPaid, 'NGN')}
//                           </td>
//                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                             {formatDate(payment.createdAt)}
//                           </td>
//                           <td className="px-6 py-4 whitespace-nowrap">
//                             <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payment.paymentStatus)}`}>
//                               {payment.paymentStatus.charAt(0).toUpperCase() + payment.paymentStatus.slice(1)}
//                             </span>
//                           </td>
//                         </tr>
//                       ))
//                     )}
//                   </tbody>
//                 </table>
//               </div>
              
//               {/* Pagination Controls */}
//               {totalPages > 0 && (
//                 <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
//                   <div className="text-sm text-gray-600 mb-4 sm:mb-0">
//                     Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
//                     {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} payments
//                   </div>
                  
//                   <div className="flex items-center gap-2">
//                     {/* Previous button */}
//                     <button
//                       onClick={() => handlePageChange(currentPage - 1)}
//                       disabled={currentPage === 1}
//                       className={`px-3 py-2 rounded-lg border transition-colors ${
//                         currentPage === 1
//                           ? 'border-gray-300 text-gray-400 cursor-not-allowed'
//                           : 'border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400'
//                       }`}
//                     >
//                       <ChevronLeft className="w-5 h-5" />
//                     </button>
                    
//                     {/* Page numbers */}
//                     <div className="flex items-center gap-1">
//                       {getPageNumbers().map((page, index) => (
//                         page === '...' ? (
//                           <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">...</span>
//                         ) : (
//                           <button
//                             key={`page-${page}`}
//                             onClick={() => handlePageChange(page as number)}
//                             className={`min-w-[40px] h-10 rounded-lg transition-colors ${
//                               currentPage === page
//                                 ? 'bg-[#5D2A8B] text-white'
//                                 : 'border border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400'
//                             }`}
//                           >
//                             {page}
//                           </button>
//                         )
//                       ))}
//                     </div>
                    
//                     {/* Next button */}
//                     <button
//                       onClick={() => handlePageChange(currentPage + 1)}
//                       disabled={currentPage >= totalPages}
//                       className={`px-3 py-2 rounded-lg border transition-colors ${
//                         currentPage >= totalPages
//                           ? 'border-gray-300 text-gray-400 cursor-not-allowed'
//                           : 'border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400'
//                       }`}
//                     >
//                       <ChevronRight className="w-5 h-5" />
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </>
//           )}
//         </div>
        
//         {/* Services Modal */}
//         {showServicesModal && selectedPayment && (
//           <div className="fixed inset-0 ml-0 md:ml-[350px] pt-8 md:pt-8 p-4 md:p-8 flex items-start justify-center z-50">
//             <div className="absolute inset-0 bg-white bg-opacity-70 backdrop-blur-sm"></div>
//             <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full max-h-[70vh] overflow-hidden mt-16">
//               <div className="p-6 border-b border-gray-200">
//                 <div className="flex items-center justify-between">
//                   <h3 className="text-lg font-semibold text-gray-900">
//                     Services for {selectedPayment.userInfo.fullName}
//                   </h3>
//                   <button
//                     onClick={closeServicesModal}
//                     className="text-gray-400 hover:text-gray-600 transition-colors"
//                   >
//                     <X className="w-6 h-6" />
//                   </button>
//                 </div>
//                 <p className="text-sm text-gray-500 mt-1">
//                   Package: {selectedPayment.packageTitle}
//                 </p>
//               </div>
              
//               <div className="p-6 overflow-y-auto max-h-[60vh]">
//                 <div className="space-y-4">
//                   {selectedPayment.services.map((service) => (
//                     <div key={service._id} className="border border-gray-200 rounded-lg p-4">
//                       <div className="flex items-center justify-between">
//                         <h4 className="font-medium text-gray-900">{service.serviceName}</h4>
//                         <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
//                           {service.duration}
//                         </span>
//                       </div>
//                       <p className="text-sm text-gray-500 mt-2">
//                         Service ID: {service.serviceId.slice(-8)}
//                       </p>
//                     </div>
//                   ))}
                  
//                   {selectedPayment.services.length === 0 && (
//                     <div className="text-center py-8 text-gray-500">
//                       <p>No services found for this subscription</p>
//                     </div>
//                   )}
//                 </div>
//               </div>
              
//               <div className="p-6 border-t border-gray-200 bg-gray-50">
//                 <button
//                   onClick={closeServicesModal}
//                   className="w-full px-4 py-2 bg-[#5D2A8B] text-white rounded-lg hover:bg-purple-700 transition-colors"
//                 >
//                   Close
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default PaymentsPage;



"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, Download, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from '@/app/components/hooks/use-toast';
import { useAuthContext } from '@/AuthContext';
import { BASE_URL } from '@/config/api';

interface UserInfo {
  fullName: string;
  email: string;
  phoneNumber: string;
  customUserId: string;
}

interface Service {
  serviceId: string;
  serviceName: string;
  duration: string;
  _id: string;
}

interface Payment {
  _id: string;
  userId: string;
  userType: string;
  packageId: string;
  packageTitle: string;
  subscriptionDuration: string;
  startDate: string;
  endDate: string;
  status: string;
  autoRenew: boolean;
  amountPaid: number;
  paymentStatus: 'completed' | 'pending' | 'failed';
  services: Service[];
  createdAt: string;
  updatedAt: string;
  userInfo: UserInfo;
}

interface ApiResponse {
  data: {
    subscriptions: Payment[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  success: boolean;
  message: string;
}

const PaymentsPage = () => {
  const [allPayments, setAllPayments] = useState<Payment[]>([]); // Store all payments
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [displayedPayments, setDisplayedPayments] = useState<Payment[]>([]); // For current page
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const { token } = useAuthContext();
  
  // Fetch all payments from API
  useEffect(() => {
    fetchAllPayments();
  }, []);
  
  const fetchAllPayments = async () => {
    try {
      setLoading(true);
      
      if (!token) {
        throw new Error('Authentication token is missing');
      }
      
      // First, get total count
      const initialResponse = await fetch(`${BASE_URL}/api/super-admin/paid-subscriptions?page=1&limit=1`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const initialData: ApiResponse = await initialResponse.json();
      const totalPages = initialData.data.totalPages;
      
      // Fetch all pages
      let allSubscriptions: Payment[] = [];
      
      for (let page = 1; page <= totalPages; page++) {
        const response = await fetch(`${BASE_URL}/api/super-admin/paid-subscriptions?page=${page}&limit=100&sortBy=createdAt&sortOrder=desc`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: ApiResponse = await response.json();
        
        if (data.success) {
          allSubscriptions = [...allSubscriptions, ...data.data.subscriptions];
        }
      }
      
      setAllPayments(allSubscriptions);
      setFilteredPayments(allSubscriptions);
      setTotalItems(allSubscriptions.length);
      setTotalPages(Math.ceil(allSubscriptions.length / itemsPerPage));
      
    } catch (error: any) {
      console.error('Error fetching payments:', error);
      toast({
        title: 'Error',
        description: error.message || 'An error occurred while fetching payments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Update displayed payments when page or filtered payments change
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedPayments(filteredPayments.slice(startIndex, endIndex));
  }, [currentPage, itemsPerPage, filteredPayments]);
  
  // Client-side filter function
  const filterPaymentsLocally = (term: string) => {
    if (!term.trim()) {
      setFilteredPayments(allPayments);
      setTotalItems(allPayments.length);
      setTotalPages(Math.ceil(allPayments.length / itemsPerPage));
      setCurrentPage(1);
      return;
    }

    const searchLower = term.toLowerCase().trim();
    
    const filtered = allPayments.filter(payment => {
      // Search by name
      const nameMatch = payment.userInfo.fullName.toLowerCase().includes(searchLower);
      
      // Search by email
      const emailMatch = payment.userInfo.email.toLowerCase().includes(searchLower);
      
      // Search by package
      const packageMatch = payment.packageTitle.toLowerCase().includes(searchLower);
      
      // Search by duration
      const durationMatch = payment.subscriptionDuration.toLowerCase().includes(searchLower);
      
      // Search by payment status
      const statusMatch = payment.paymentStatus.toLowerCase().includes(searchLower);
      
      // Search by subscription ID (last 8 chars)
      const idMatch = payment._id.slice(-8).toLowerCase().includes(searchLower);
      
      // Search by amount (convert to string for search)
      const amountMatch = payment.amountPaid.toString().includes(searchLower);
      
      return nameMatch || emailMatch || packageMatch || durationMatch || statusMatch || idMatch || amountMatch;
    });
    
    setFilteredPayments(filtered);
    setTotalItems(filtered.length);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setCurrentPage(1);
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    filterPaymentsLocally(e.target.value);
  };
  
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      document.querySelector('.table-container')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newItemsPerPage = Number(e.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    setTotalPages(Math.ceil(filteredPayments.length / newItemsPerPage));
  };
  
  const clearSearch = () => {
    setSearchTerm("");
    setFilteredPayments(allPayments);
    setTotalItems(allPayments.length);
    setTotalPages(Math.ceil(allPayments.length / itemsPerPage));
    setCurrentPage(1);
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatCurrency = (amount: number, currency: string) => {
    const validCurrency = currency && currency.length === 3 ? currency : 'NGN';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: validCurrency,
    }).format(amount);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const openServicesModal = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowServicesModal(true);
  };
  
  const closeServicesModal = () => {
    setShowServicesModal(false);
    setSelectedPayment(null);
  };
  
  // Calculate totals based on filtered payments
  const totalRevenue = filteredPayments.reduce((sum, p) => sum + p.amountPaid, 0);
  const completedPayments = filteredPayments.filter(p => p.paymentStatus === 'completed').length;
  
  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 3) {
        start = 2;
        end = 4;
      }
      
      if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
        end = totalPages - 1;
      }
      
      if (start > 2) {
        pageNumbers.push('...');
      }
      
      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }
      
      if (end < totalPages - 1) {
        pageNumbers.push('...');
      }
      
      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };
  
  return (
    <div className="manrope">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
        .manrope { font-family: 'Manrope', sans-serif; }
        
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
        
        .table-container {
          max-height: calc(100vh - 300px);
          overflow-y: auto;
        }
        
        @media (min-width: 768px) {
          .table-container {
            max-height: calc(100vh - 280px);
          }
        }
      `}</style>

      <div className="ml-0 md:ml-[350px] pt-8 md:pt-8 p-4 md:p-8 min-h-screen">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Payments</h1>
          <p className="text-gray-600">Manage and monitor all subscription payments</p>
        </div>
        
        {/* Error Message Display */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-700 text-sm font-medium">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue, 'NGN')}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedPayments}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{filteredPayments.filter(p => p.paymentStatus === 'pending').length}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Action Section */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, email, package, duration..."
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              {searchTerm && (
                <p className="text-sm text-gray-500 mt-2">
                  Found {totalItems} result{totalItems !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            
            {/* Items per page selector */}
            <div className="flex items-center gap-3">
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm bg-white min-w-[120px]"
              >
                <option value="5">5 per page</option>
                <option value="10">10 per page</option>
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
              </select>
            </div>
          </div>
        </div>

        {/* Payments Table with Scroll */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5D2A8B]"></div>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subscription ID
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Package
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Services
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount Paid
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {displayedPayments.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <p className="text-lg font-medium">No payments found</p>
                            <p className="text-sm mt-1">Try adjusting your search</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      displayedPayments.map((payment) => (
                        <tr key={payment._id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">{payment._id.slice(-8)}</div>
                            <div className="text-xs text-gray-500">ID: {payment._id}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <span className="text-purple-600 font-semibold">
                                  {payment.userInfo.fullName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{payment.userInfo.fullName}</div>
                                <div className="text-sm text-gray-500">{payment.userInfo.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-sm text-gray-900">{payment.packageTitle}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {payment.subscriptionDuration}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <button
                              onClick={() => openServicesModal(payment)}
                              className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full hover:bg-purple-200 transition-colors"
                            >
                              View Services ({payment.services.length})
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {formatCurrency(payment.amountPaid, 'NGN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(payment.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payment.paymentStatus)}`}>
                              {payment.paymentStatus.charAt(0).toUpperCase() + payment.paymentStatus.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="text-sm text-gray-600 mb-4 sm:mb-0">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                    {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} payments
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-3 py-2 rounded-lg border transition-colors ${
                        currentPage === 1
                          ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400'
                      }`}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {getPageNumbers().map((page, index) => (
                        page === '...' ? (
                          <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">...</span>
                        ) : (
                          <button
                            key={`page-${page}`}
                            onClick={() => handlePageChange(page as number)}
                            className={`min-w-[40px] h-10 rounded-lg transition-colors ${
                              currentPage === page
                                ? 'bg-[#5D2A8B] text-white'
                                : 'border border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      ))}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className={`px-3 py-2 rounded-lg border transition-colors ${
                        currentPage >= totalPages
                          ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400'
                      }`}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Services Modal */}
        {showServicesModal && selectedPayment && (
          <div className="fixed inset-0 ml-0 md:ml-[350px] pt-8 md:pt-8 p-4 md:p-8 flex items-start justify-center z-50">
            <div className="absolute inset-0 bg-white bg-opacity-70 backdrop-blur-sm"></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full max-h-[70vh] overflow-hidden mt-16">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Services for {selectedPayment.userInfo.fullName}
                  </h3>
                  <button
                    onClick={closeServicesModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Package: {selectedPayment.packageTitle}
                </p>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-4">
                  {selectedPayment.services.map((service) => (
                    <div key={service._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">{service.serviceName}</h4>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {service.duration}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Service ID: {service.serviceId.slice(-8)}
                      </p>
                    </div>
                  ))}
                  
                  {selectedPayment.services.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No services found for this subscription</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={closeServicesModal}
                  className="w-full px-4 py-2 bg-[#5D2A8B] text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentsPage;