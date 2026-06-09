
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { GalleryService } from "@/services/gallery-sub-service";
import { ApiServiceResponse } from "@/types/sub-service";

interface LocationUsage {
  locationIndex: number;
  locationName: string;
  images: number;
  maxImages: number;
  videos: number;
  maxVideos: number;
  verified: boolean;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type SortField = 'name' | 'priceInDollars' | 'createdAt' | 'categoryName';
type SortOrder = 'asc' | 'desc';


const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return dateString;
  }
};

const formatCurrency = (amount: number) => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount / 100);
  } catch (error) {
    return `$${(amount / 100).toFixed(2)}`;
  }
};


const SubServiceModal = ({ isOpen, onClose, title, subServices }: { isOpen: boolean; onClose: () => void; title: string; subServices: any[] }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
    
      <div className="fixed inset-0  bg-opacity-50 transition-opacity" onClick={onClose}></div>
      
  
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl transform overflow-hidden rounded-lg bg-white shadow-2xl transition-all">
         
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-white">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
        
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto bg-white">
            {subServices.length > 0 ? (
              <div className="space-y-3">
                {subServices.map((subService, index) => (
                  <div key={index} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{subService.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{subService.description}</p>
                        {subService.subPlatformUniqueCode && (
                          <p className="text-xs text-gray-400 mt-2 font-mono">
                            Code: {subService.subPlatformUniqueCode}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 text-right">
                        <p className="font-semibold text-[#5d2a8b]">
                          {formatCurrency(subService.price)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No sub-services</h3>
                <p className="mt-1 text-sm text-gray-500">This service has no sub-services configured.</p>
              </div>
            )}
          </div>
          
       
          <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
            <button
              onClick={onClose}
              className="w-full rounded-lg bg-[#5d2a8b] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#4a2170] transition-colors focus:outline-none focus:ring-2 focus:ring-[#5d2a8b] focus:ring-offset-2"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


const DeleteModal = ({ isOpen, onClose, onConfirm, itemName }: { isOpen: boolean; onClose: () => void; onConfirm: () => void; itemName: string }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
    
      <div className="fixed inset-0  bg-opacity-50 transition-opacity" onClick={onClose}></div>
      
 
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-2xl transition-all">
        
          <div className="px-6 pt-5 pb-4 bg-white">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Delete Service</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete <span className="font-semibold text-gray-700">"{itemName}"</span>? 
                    This action cannot be undone and all associated data will be permanently removed.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-3 bg-gray-50 flex flex-row-reverse gap-3">
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="inline-flex justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#5d2a8b] focus:ring-offset-2"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function GalleryPage() {
  const router = useRouter();
  const [items, setItems] = useState<ApiServiceResponse[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  });
  const [locationUsage, setLocationUsage] = useState<LocationUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
 
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVisible, setFilterVisible] = useState<'all' | 'public' | 'private'>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  

  const [showSubServiceModal, setShowSubServiceModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSubServices, setSelectedSubServices] = useState<any[]>([]);
  const [subServiceModalTitle, setSubServiceModalTitle] = useState('');
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);
  
  
  const [currentPage, setCurrentPage] = useState(1);

  const getToken = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userToken') || sessionStorage.getItem('userToken');
    }
    return null;
  };

  const fetchGalleryItems = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      if (!token) {
        router.push('/login');
        return;
      }

      const result = await GalleryService.getGalleryItems(token, {
        page: currentPage,
        limit: 10,
        sortBy: sortField,
        sortOrder: sortOrder
      });
      
      if (result.success && result.data) {
        setItems(result.data.items || []);
        setPagination(result.data.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1
        });
        setLocationUsage(result.data.locationUsage || []);
        setError(null);
      } else {
        setError(result.message || 'Failed to fetch gallery items');
      }
    } catch (err) {
      setError('An error occurred while fetching gallery items');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGalleryItems();
  }, [currentPage, sortField, sortOrder]);

  // Handlers
  const handleSort = (field: SortField) => {
    const newOrder: SortOrder = field === sortField && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newOrder);
  };

  const handleDelete = async (id: string) => {
    try {
      const token = getToken();
      if (!token) return;

      const result = await GalleryService.deleteGalleryItem(token, id);
      
      if (result.success) {
        fetchGalleryItems();
      } else {
        alert(`Failed to delete: ${result.message}`);
      }
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('An error occurred while deleting');
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/admin/gallery/edit/${id}`);
  };

  const handleView = (id: string) => {
    router.push(`/admin/gallery/view/${id}`);
  };

  const handleViewSubServices = (item: ApiServiceResponse) => {
    setSelectedSubServices(item.subServices || []);
    setSubServiceModalTitle(`${item.name} - Sub-services`);
    setShowSubServiceModal(true);
  };

  const handleCreate = () => {
    router.push('/admin/gallery/services/create');
  };

  const handleDeleteClick = (id: string, name: string) => {
    setItemToDelete({ id, name });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (itemToDelete) {
      handleDelete(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  const getLocationName = (index: number) => {
    const location = locationUsage.find(loc => loc.locationIndex === index);
    return location?.locationName || `Location ${index}`;
  };

  const filteredItems = (items || []).filter(item => {
    if (!item) return false;
    
    if (filterVisible === 'public' && !item.visibilityToPublic) return false;
    if (filterVisible === 'private' && item.visibilityToPublic) return false;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        (item.name || '').toLowerCase().includes(searchLower) ||
        (item.description || '').toLowerCase().includes(searchLower) ||
        (item.categoryName || '').toLowerCase().includes(searchLower) ||
        (item.platformUniqueCode || '').toLowerCase().includes(searchLower) ||
        (item.producer || '').toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="ml-1 text-gray-400">↕️</span>;
    return sortOrder === 'asc' ? <span className="ml-1">↑</span> : <span className="ml-1">↓</span>;
  };

  if (loading) {
    return (
      <div className="ml-0 md:ml-[350px] pt-8 md:pt-8 p-4 md:p-8 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#5d2a8b] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading gallery items...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ml-0 md:ml-[350px] pt-8 md:pt-8 p-4 md:p-8 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Gallery</h3>
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchGalleryItems}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-0 md:ml-[350px] pt-8 md:pt-8 p-4 md:p-8 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
    
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#5d2a8b]">Gallery Management</h1>
            <p className="text-gray-600">Manage your services and gallery items</p>
          </div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-[#5d2a8b] text-white rounded-md hover:bg-[#4a2170] transition-colors text-sm flex items-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Service
          </button>
        </div>

     
        {locationUsage.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Location Media Usage</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {locationUsage.map((location) => (
                <div key={location.locationIndex} className="border rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{location.locationName}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      location.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {location.verified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Images</span>
                        <span className="font-medium">{location.images} / {location.maxImages}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[#5d2a8b] h-2 rounded-full"
                          style={{ width: `${(location.images / location.maxImages) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    {location.maxVideos > 0 && (
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Videos</span>
                          <span className="font-medium">{location.videos} / {location.maxVideos}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-[#5d2a8b] h-2 rounded-full"
                            style={{ width: `${(location.videos / location.maxVideos) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5d2a8b] focus:border-transparent w-80"
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>


<div className="bg-white rounded-lg shadow-sm overflow-hidden">
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: "1200px" }}>
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
            S/N
          </th>
          <th
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
            onClick={() => handleSort('name')}
          >
            <div className="flex items-center">
              Name
              <SortIcon field="name" />
            </div>
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Description
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Category
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Location
          </th>
          <th
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
            onClick={() => handleSort('priceInDollars')}
          >
            <div className="flex items-center">
              Base Price
              <SortIcon field="priceInDollars" />
            </div>
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Final Price
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Discount
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Platform Charge
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Code
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Producer
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Sub-services
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
          <th
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
            onClick={() => handleSort('createdAt')}
          >
            <div className="flex items-center">
              Created
              <SortIcon field="createdAt" />
            </div>
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {filteredItems.length === 0 ? (
          <tr>
            <td colSpan={15} className="px-6 py-12 text-center text-gray-500">
              {searchTerm || filterVisible !== 'all' 
                ? 'No items match your filters' 
                : 'No gallery items found'}
            </td>
          </tr>
        ) : (
          filteredItems.map((item, index) => {
         
            const serialNumber = (currentPage - 1) * pagination.limit + index + 1;
            
            return (
              <tr key={item._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-500 font-mono whitespace-nowrap">
                  {serialNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{item.name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500 max-w-xs">
                    {item.description}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                    {item.categoryName || 'Uncategorized'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                  {getLocationName(item.locationIndex)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(item.priceInDollars)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-[#5d2a8b]">
                    {formatCurrency(item.actualAmount)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.discountPercentage > 0 ? (
                    <span className="text-sm text-green-600 font-medium">
                      {item.discountPercentage}%
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600">
                    {item.platformChargePercentage}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-xs text-gray-500 font-mono">
                    {item.platformUniqueCode}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.producer ? (
                    <div className="text-sm text-gray-600">{item.producer}</div>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.hasSubServices ? (
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 mr-2">
                        {item.subServiceCount}
                      </span>
                      <button
                        onClick={() => handleViewSubServices(item)}
                        className="text-xs text-[#5d2a8b] hover:underline"
                      >
                        View
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">None</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      item.visibilityToPublic
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {item.visibilityToPublic ? 'Public' : 'Private'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                  <div>{formatDate(item.createdAt)}</div>
                  <div className="text-xs text-gray-400">
                    {formatDate(item.updatedAt)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleView(item._id)}
                      className="text-blue-600 hover:text-blue-900 p-1.5 rounded-full hover:bg-blue-50 transition-colors"
                      title="View Details"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleEdit(item._id)}
                      className="text-[#5d2a8b] hover:text-[#4a2170] p-1.5 rounded-full hover:bg-purple-50 transition-colors"
                      title="Edit"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteClick(item._id, item.name)}
                      className="text-red-600 hover:text-red-900 p-1.5 rounded-full hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>


  {pagination.totalPages > 1 && (
    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-white">
      <div className="text-sm text-gray-700">
        Showing{' '}
        <span className="font-medium">
          {((pagination.page - 1) * pagination.limit) + 1}
        </span>{' '}
        to{' '}
        <span className="font-medium">
          {Math.min(pagination.page * pagination.limit, pagination.total)}
        </span>{' '}
        of <span className="font-medium">{pagination.total}</span> results
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded-md ${
            currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 shadow-sm'
          }`}
        >
          Previous
        </button>
        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
          let pageNum = currentPage;
          if (pagination.totalPages <= 5) {
            pageNum = i + 1;
          } else if (currentPage <= 3) {
            pageNum = i + 1;
          } else if (currentPage >= pagination.totalPages - 2) {
            pageNum = pagination.totalPages - 4 + i;
          } else {
            pageNum = currentPage - 2 + i;
          }
          return (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`px-3 py-1 rounded-md ${
                currentPage === pageNum
                  ? 'bg-[#5d2a8b] text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 shadow-sm'
              }`}
            >
              {pageNum}
            </button>
          );
        })}
        <button
          onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
          disabled={currentPage === pagination.totalPages}
          className={`px-3 py-1 rounded-md ${
            currentPage === pagination.totalPages
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 shadow-sm'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  )}
</div>
      </div>

      <SubServiceModal
        isOpen={showSubServiceModal}
        onClose={() => setShowSubServiceModal(false)}
        title={subServiceModalTitle}
        subServices={selectedSubServices}
      />

      
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setItemToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        itemName={itemToDelete?.name || ''}
      />
    </div>
  );
}