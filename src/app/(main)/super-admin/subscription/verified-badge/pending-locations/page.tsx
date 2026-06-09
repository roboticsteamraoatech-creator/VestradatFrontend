// "use client";

// import React, { useState, useEffect } from 'react';
// import { Search, MapPin, Clock, CheckCircle, XCircle, Eye, MoreVertical } from 'lucide-react';

// interface LocationVerification {
//   profileId: string;
//   locationIndex: number;
//   organizationId: string;
//   organizationName: string;
//   adminEmail: string;
//   adminName: string;
//   location: {
//     brandName: string;
//     locationType: string;
//     cityRegion: string;
//     cityRegionFee: number;
//     address: string;
//     gallery: {
//       images: string[];
//       videos: string[];
//     };
//   };
//   paymentDetails: {
//     transactionId: string;
//     amount: number;
//     paidAt: string;
//   };
// }

// const PendingLocationsPage = () => {
//   const [verifications, setVerifications] = useState<LocationVerification[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedVerification, setSelectedVerification] = useState<LocationVerification | null>(null);
//   const [showActionModal, setShowActionModal] = useState(false);
//   const [actionModalPosition, setActionModalPosition] = useState({ top: 0, left: 0 });
//   const [actionLoading, setActionLoading] = useState(false);

//   // Fetch pending location verifications
//   useEffect(() => {
//     const fetchPendingVerifications = async () => {
//       try {
//         const token = localStorage.getItem('userToken');
//         const response = await fetch(`${BASE_URL}/api/super-admin/location-verifications/pending`, {
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json'
//           }
//         });

//         if (response.ok) {
//           const result = await response.json();
//           if (result.success) {
//             setVerifications(result.data.pendingLocationVerifications || []);
//           }
//         }
//       } catch (error) {
//         console.error('Error fetching pending verifications:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchPendingVerifications();
//   }, []);

//   // Filter verifications based on search term
//   const filteredVerifications = verifications.filter(verification =>
//     verification.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     verification.adminEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     verification.location.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     verification.location.address.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   const handleActionClick = (verification: LocationVerification, e: React.MouseEvent) => {
//     e.preventDefault();
//     setSelectedVerification(verification);
    
//     // Calculate position to ensure modal stays within viewport
//     const buttonRect = (e.target as Element).getBoundingClientRect();
//     const top = buttonRect.bottom + window.scrollY;
//     const left = Math.max(buttonRect.left - 150, 10);
    
//     setActionModalPosition({
//       top,
//       left,
//     });
//     setShowActionModal(true);
//   };

//   const handleApprove = async () => {
//     if (!selectedVerification) return;
    
//     setActionLoading(true);
//     try {
//       const token = localStorage.getItem('userToken');
//       const response = await fetch(
//         `${BASE_URL}/api/super-admin/location-verifications/${selectedVerification.profileId}/${selectedVerification.locationIndex}/approve`,
//         {
//           method: 'PUT',
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json'
//           }
//         }
//       );

//       if (response.ok) {
//         // Remove the approved verification from the list
//         setVerifications(prev => prev.filter(v => 
//           !(v.profileId === selectedVerification.profileId && v.locationIndex === selectedVerification.locationIndex)
//         ));
//         setShowActionModal(false);
//       } else {
//         console.error('Failed to approve verification');
//       }
//     } catch (error) {
//       console.error('Error approving verification:', error);
//     } finally {
//       setActionLoading(false);
//     }
//   };

//   const handleReject = async (reason: string) => {
//     if (!selectedVerification) return;
    
//     setActionLoading(true);
//     try {
//       const token = localStorage.getItem('userToken');
//       const response = await fetch(
//         `${BASE_URL}/api/super-admin/location-verifications/${selectedVerification.profileId}/${selectedVerification.locationIndex}/reject`,
//         {
//           method: 'PUT',
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json'
//           },
//           body: JSON.stringify({ reason })
//         }
//       );

//       if (response.ok) {
//         // Remove the rejected verification from the list
//         setVerifications(prev => prev.filter(v => 
//           !(v.profileId === selectedVerification.profileId && v.locationIndex === selectedVerification.locationIndex)
//         ));
//         setShowActionModal(false);
//       } else {
//         console.error('Failed to reject verification');
//       }
//     } catch (error) {
//       console.error('Error rejecting verification:', error);
//     } finally {
//       setActionLoading(false);
//     }
//   };

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   if (loading) {
//     return (
//       <div className="ml-0 md:ml-[350px] p-6 min-h-screen bg-gray-50">
//         <div className="max-w-7xl mx-auto">
//           <div className="mb-8">
//             <h1 className="text-2xl font-bold text-gray-800">Pending Location Verifications</h1>
//             <p className="text-gray-600">Manage pending location verification requests</p>
//           </div>
          
//           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//             <div className="animate-pulse">
//               <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
//               <div className="h-10 bg-gray-200 rounded w-1/2 mb-6"></div>
//               {[1, 2, 3].map((item) => (
//                 <div key={item} className="flex items-center justify-between py-4 border-b border-gray-100">
//                   <div className="h-4 bg-gray-200 rounded w-1/4"></div>
//                   <div className="h-4 bg-gray-200 rounded w-1/3"></div>
//                   <div className="h-4 bg-gray-200 rounded w-1/6"></div>
//                   <div className="h-4 bg-gray-200 rounded w-1/6"></div>
//                   <div className="h-8 bg-gray-200 rounded w-20"></div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="ml-0 md:ml-[350px] p-6 min-h-screen bg-gray-50">
//       <style jsx>{`
//         @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
//         .manrope { 
//           font-family: 'Manrope', sans-serif; 
//         }
//       `}</style>

//       <div className="max-w-7xl mx-auto manrope">
//         {/* Header */}
//         <div className="mb-6">
//           <h1 className="text-2xl font-bold text-gray-800">Pending Location Verifications</h1>
//           <p className="text-gray-600">Manage pending location verification requests</p>
//         </div>

//         {/* Stats */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
//           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
//             <div className="flex items-center">
//               <div className="p-3 bg-yellow-100 rounded-lg">
//                 <Clock className="w-6 h-6 text-yellow-600" />
//               </div>
//               <div className="ml-4">
//                 <p className="text-sm text-gray-600">Pending Requests</p>
//                 <p className="text-2xl font-bold text-gray-900">{verifications.length}</p>
//               </div>
//             </div>
//           </div>
//           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
//             <div className="flex items-center">
//               <div className="p-3 bg-green-100 rounded-lg">
//                 <MapPin className="w-6 h-6 text-green-600" />
//               </div>
//               <div className="ml-4">
//                 <p className="text-sm text-gray-600">Total Organizations</p>
//                 <p className="text-2xl font-bold text-gray-900">
//                   {new Set(verifications.map(v => v.organizationId)).size}
//                 </p>
//               </div>
//             </div>
//           </div>
//           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
//             <div className="flex items-center">
//               <div className="p-3 bg-blue-100 rounded-lg">
//                 <CheckCircle className="w-6 h-6 text-blue-600" />
//               </div>
//               <div className="ml-4">
//                 <p className="text-sm text-gray-600">Total Amount</p>
//                 <p className="text-2xl font-bold text-gray-900">
//                   ₦{verifications.reduce((sum, v) => sum + v.paymentDetails.amount, 0).toLocaleString()}
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Search and Filter */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
//           <div className="flex flex-col md:flex-row md:items-center gap-4">
//             <div className="relative flex-1">
//               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                 <Search className="h-5 w-5 text-gray-400" />
//               </div>
//               <input
//                 type="text"
//                 placeholder="Search by organization, admin, brand name, or address..."
//                 className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//               />
//             </div>
//           </div>
//         </div>

//         {/* Table */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//           {filteredVerifications.length === 0 ? (
//             <div className="text-center py-12">
//               <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gray-100 mb-4">
//                 <MapPin className="h-6 w-6 text-gray-400" />
//               </div>
//               <h3 className="text-lg font-medium text-gray-900 mb-1">No pending verifications</h3>
//               <p className="text-gray-500">There are currently no pending location verification requests.</p>
//             </div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="min-w-full divide-y divide-gray-200">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Date</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {filteredVerifications.map((verification) => (
//                     <tr key={`${verification.profileId}-${verification.locationIndex}`} className="hover:bg-gray-50">
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex items-center">
//                           <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
//                             <MapPin className="h-5 w-5 text-purple-600" />
//                           </div>
//                           <div className="ml-4">
//                             <div className="text-sm font-medium text-gray-900">{verification.organizationName}</div>
//                             <div className="text-sm text-gray-500">{verification.adminEmail}</div>
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4">
//                         <div className="text-sm text-gray-900 font-medium">{verification.location.brandName}</div>
//                         <div className="text-sm text-gray-500">{verification.location.address}</div>
//                         <div className="text-xs text-gray-400 mt-1">
//                           {verification.location.locationType} • {verification.location.cityRegion}
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-sm text-gray-900">{verification.adminName}</div>
//                         <div className="text-sm text-gray-500">{verification.adminEmail}</div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
//                         ₦{verification.paymentDetails.amount.toLocaleString()}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                         {formatDate(verification.paymentDetails.paidAt)}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                         <div className="flex items-center justify-end gap-2">
//                           <button
//                             onClick={(e) => handleActionClick(verification, e)}
//                             className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
//                             title="More actions"
//                           >
//                             <MoreVertical className="w-4 h-4" />
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Action Modal */}
//       {showActionModal && selectedVerification && (
//         <>
//           <div 
//             className="fixed inset-0 z-40 bg-transparent" 
//             onClick={() => setShowActionModal(false)}
//           />
          
//           <div 
//             className="fixed bg-white shadow-lg rounded-lg z-50"
//             style={{
//               top: `${actionModalPosition.top}px`,
//               left: `${actionModalPosition.left}px`,
//               width: '200px',
//               borderRadius: '20px',
//               padding: '16px',
//               boxShadow: '0px 2px 8px 0px #5D2A8B1A',
//               border: '1px solid #E4D8F3'
//             }}
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div className="flex flex-col gap-2">
//               <button 
//                 className="text-left hover:bg-gray-50 p-2 rounded transition-colors flex items-center gap-2"
//                 style={{
//                   fontSize: '14px',
//                   color: '#1A1A1A',
//                   border: 'none',
//                   background: 'none',
//                   width: '100%'
//                 }}
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   handleApprove();
//                 }}
//                 disabled={actionLoading}
//               >
//                 <CheckCircle className="w-4 h-4 text-green-600" />
//                 Approve
//               </button>
              
//               <button 
//                 className="text-left hover:bg-gray-50 p-2 rounded transition-colors flex items-center gap-2"
//                 style={{
//                   fontSize: '14px',
//                   color: '#FF6161',
//                   border: 'none',
//                   background: 'none',
//                   width: '100%'
//                 }}
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   const reason = prompt('Enter rejection reason:');
//                   if (reason) {
//                     handleReject(reason);
//                   }
//                 }}
//                 disabled={actionLoading}
//               >
//                 <XCircle className="w-4 h-4 text-red-600" />
//                 Reject
//               </button>
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// export default PendingLocationsPage;

"use client";

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Clock, CheckCircle, XCircle, Eye, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import { BASE_URL } from '@/config/api';

interface LocationVerification {
  profileId: string;
  locationIndex: number;
  organizationId: string;
  organizationName: string;
  adminEmail: string;
  adminName: string;
  location: {
    brandName: string;
    locationType: string;
    cityRegion: string;
    cityRegionFee: number;
    address: string;
    gallery: {
      images: string[];
      videos: string[];
    };
  };
  paymentDetails: {
    transactionId: string;
    amount: number;
    paidAt: string;
  };
}

const PendingLocationsPage = () => {
  const [verifications, setVerifications] = useState<LocationVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVerification, setSelectedVerification] = useState<LocationVerification | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionModalPosition, setActionModalPosition] = useState({ top: 0, left: 0 });
  const [actionLoading, setActionLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch pending location verifications
  useEffect(() => {
    const fetchPendingVerifications = async () => {
      try {
        const token = localStorage.getItem('userToken');
        const response = await fetch(`${BASE_URL}/api/super-admin/location-verifications/pending`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setVerifications(result.data.pendingLocationVerifications || []);
          }
        }
      } catch (error) {
        console.error('Error fetching pending verifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingVerifications();
  }, []);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Filter verifications based on search term
  const filteredVerifications = verifications.filter(verification =>
    verification.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    verification.adminEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    verification.location.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    verification.location.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredVerifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredVerifications.slice(startIndex, endIndex);

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleActionClick = (verification: LocationVerification, e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedVerification(verification);
    
    // Calculate position to ensure modal stays within viewport
    const buttonRect = (e.target as Element).getBoundingClientRect();
    const top = buttonRect.bottom + window.scrollY;
    const left = Math.max(buttonRect.left - 150, 10);
    
    setActionModalPosition({
      top,
      left,
    });
    setShowActionModal(true);
  };

  const handleApprove = async () => {
    if (!selectedVerification) return;
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(
        `${BASE_URL}/api/super-admin/location-verifications/${selectedVerification.profileId}/${selectedVerification.locationIndex}/approve`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        // Remove the approved verification from the list
        setVerifications(prev => prev.filter(v => 
          !(v.profileId === selectedVerification.profileId && v.locationIndex === selectedVerification.locationIndex)
        ));
        setShowActionModal(false);
        // If current page becomes empty after removal, go to previous page if not on first page
        if (currentItems.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } else {
        console.error('Failed to approve verification');
      }
    } catch (error) {
      console.error('Error approving verification:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (!selectedVerification) return;
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(
        `${BASE_URL}/api/super-admin/location-verifications/${selectedVerification.profileId}/${selectedVerification.locationIndex}/reject`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reason })
        }
      );

      if (response.ok) {
        // Remove the rejected verification from the list
        setVerifications(prev => prev.filter(v => 
          !(v.profileId === selectedVerification.profileId && v.locationIndex === selectedVerification.locationIndex)
        ));
        setShowActionModal(false);
        // If current page becomes empty after removal, go to previous page if not on first page
        if (currentItems.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } else {
        console.error('Failed to reject verification');
      }
    } catch (error) {
      console.error('Error rejecting verification:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="ml-0 md:ml-[350px] p-6 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Pending Location Verifications</h1>
            <p className="text-gray-600">Manage pending location verification requests</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="h-10 bg-gray-200 rounded w-1/2 mb-6"></div>
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center justify-between py-4 border-b border-gray-100">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-0 md:ml-[350px] p-6 min-h-screen bg-gray-50">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
        .manrope { 
          font-family: 'Manrope', sans-serif; 
        }
      `}</style>

      <div className="max-w-7xl mx-auto manrope">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Pending Location Verifications</h1>
          <p className="text-gray-600">Manage pending location verification requests</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold text-gray-900">{verifications.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <MapPin className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Organizations</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(verifications.map(v => v.organizationId)).size}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₦{verifications.reduce((sum, v) => sum + v.paymentDetails.amount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by organization, admin, brand name, or address..."
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {currentItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gray-100 mb-4">
                <MapPin className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No pending verifications</h3>
              <p className="text-gray-500">There are currently no pending location verification requests.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.map((verification) => (
                      <tr key={`${verification.profileId}-${verification.locationIndex}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                              <MapPin className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{verification.organizationName}</div>
                              <div className="text-sm text-gray-500">{verification.adminEmail}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 font-medium">{verification.location.brandName}</div>
                          <div className="text-sm text-gray-500">{verification.location.address}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {verification.location.locationType} • {verification.location.cityRegion}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{verification.adminName}</div>
                          <div className="text-sm text-gray-500">{verification.adminEmail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          ₦{verification.paymentDetails.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(verification.paymentDetails.paidAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => handleActionClick(verification, e)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                              title="More actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(endIndex, filteredVerifications.length)}</span> of{' '}
                    <span className="font-medium">{filteredVerifications.length}</span> results
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded-md border ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`px-3 py-1 rounded-md border ${
                          currentPage === page
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded-md border ${
                        currentPage === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Action Modal */}
      {showActionModal && selectedVerification && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-transparent" 
            onClick={() => setShowActionModal(false)}
          />
          
          <div 
            className="fixed bg-white shadow-lg rounded-lg z-50"
            style={{
              top: `${actionModalPosition.top}px`,
              left: `${actionModalPosition.left}px`,
              width: '200px',
              borderRadius: '20px',
              padding: '16px',
              boxShadow: '0px 2px 8px 0px #5D2A8B1A',
              border: '1px solid #E4D8F3'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-2">
              <button 
                className="text-left hover:bg-gray-50 p-2 rounded transition-colors flex items-center gap-2"
                style={{
                  fontSize: '14px',
                  color: '#1A1A1A',
                  border: 'none',
                  background: 'none',
                  width: '100%'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleApprove();
                }}
                disabled={actionLoading}
              >
                <CheckCircle className="w-4 h-4 text-green-600" />
                Approve
              </button>
              
              <button 
                className="text-left hover:bg-gray-50 p-2 rounded transition-colors flex items-center gap-2"
                style={{
                  fontSize: '14px',
                  color: '#FF6161',
                  border: 'none',
                  background: 'none',
                  width: '100%'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  const reason = prompt('Enter rejection reason:');
                  if (reason) {
                    handleReject(reason);
                  }
                }}
                disabled={actionLoading}
              >
                <XCircle className="w-4 h-4 text-red-600" />
                Reject
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PendingLocationsPage;