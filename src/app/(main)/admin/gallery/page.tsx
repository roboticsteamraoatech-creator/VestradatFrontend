"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Image as ImageIcon,
  Video,
  Tag,
  BarChart3,
  MapPin,
  CheckCircle,
  XCircle,
  Package,
  Briefcase,
  List
} from 'lucide-react';
import DeleteConfirmationModal from '@/app/components/DeleteConfirmationModal';
import { GalleryService } from '@/services/GalleryService';
import { useAuthContext } from '@/AuthContext';

interface GalleryItem {
  _id: string;
  name: string;
  description: string;
  category: string;
  categoryId: string;
  categoryName?: string;
  industryId: string;
  industryName?: string;
  itemType: 'product' | 'service';
  sku?: string;
  upc?: string;
  platformUniqueCode?: string;
  totalAvailableQuantity: number;
  priceInDollars: number;
  discountPercentage: number;
  upfrontPaymentPercentage?: number;
  upfrontPaymentAmount?: number;
  actualAmount?: number;
  platformChargePercentage: number;
  commissionName?: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  visibilityToPublic: boolean;
  notes?: string;
  locationIndex: number;
  imageUrl?: string;
  videoUrl?: string;
  images: string[];
  videos: string[];
  createdAt: string;
  updatedAt: string;
}

interface LocationUsage {
  locationIndex: number;
  locationName: string;
  images: number;
  maxImages: number;
  videos: number;
  maxVideos: number;
  verified: boolean;
}

const GalleryManagementPage = () => {
  const router = useRouter();
  const { token } = useAuthContext();
  
  console.log('Gallery page: Component mounted, token available:', !!token);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [locationUsage, setLocationUsage] = useState<LocationUsage[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedItemType, setSelectedItemType] = useState<'product' | 'service' | ''>('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [totalProductCount, setTotalProductCount] = useState(0);
  const [totalServiceCount, setTotalServiceCount] = useState(0);
  const [mediaUsageVideos, setMediaUsageVideos] = useState<number | null>(null);

  // Fetch server-side product/service totals and media usage (Bugs 7/8/9)
  const fetchTypeCounts = async () => {
    if (!token) return;
    try {
      const [productResult, serviceResult, mediaResult] = await Promise.all([
        GalleryService.getGalleryItems(token, 1, 1, undefined, undefined, undefined, undefined, undefined, undefined, 'createdAt', 'desc', undefined, undefined, undefined, undefined, 'product'),
        GalleryService.getGalleryItems(token, 1, 1, undefined, undefined, undefined, undefined, undefined, undefined, 'createdAt', 'desc', undefined, undefined, undefined, undefined, 'service'),
        GalleryService.getMediaUsage(token),
      ]);
      if (productResult.success) setTotalProductCount(productResult.data?.pagination?.total || 0);
      if (serviceResult.success) setTotalServiceCount(serviceResult.data?.pagination?.total || 0);
      if (mediaResult.success && mediaResult.data) setMediaUsageVideos(mediaResult.data.currentVideos ?? null);
    } catch (e) {
      // Non-critical: fall back to page-level counts
    }
  };

  // Fetch gallery items
  const fetchGalleryItems = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      console.log('Gallery page: Fetching gallery items');
      
      const result = await GalleryService.getGalleryItems(
        token,
        currentPage,
        10,
        selectedCategory || undefined,
        searchTerm || undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        sortBy,
        sortOrder,
        undefined,
        selectedIndustry || undefined,
        undefined,
        undefined,
        selectedItemType === '' ? undefined : selectedItemType
      );
      
      if (result.success && result.data) {
        setItems(result.data.items || []);
        setLocationUsage(result.data.locationUsage || []);
        setTotalPages(result.data.pagination?.totalPages || 1);
        setTotalItems(result.data.pagination?.total || 0);
        
        // Extract unique categories and industries from items
        if (result.data.items && result.data.items.length > 0) {
          const uniqueCategories = [...new Set(result.data.items.map(item => item.categoryName || item.category))];
          const uniqueIndustries = [...new Set(result.data.items.map(item => item.industryName || '').filter(Boolean))];
          setCategories(uniqueCategories);
          setIndustries(uniqueIndustries);
        } else {
          setCategories([]);
          setIndustries([]);
        }
      } else {
        console.error('Failed to fetch gallery items:', result.message);
      }
    } catch (error: any) {
      console.error('Error fetching gallery items:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update categories when items change
  useEffect(() => {
    if (items.length > 0) {
      const uniqueCategories = [...new Set(items.map(item => item.categoryName || item.category))];
      const uniqueIndustries = [...new Set(items.map(item => item.industryName || '').filter(Boolean))];
      setCategories(uniqueCategories);
      setIndustries(uniqueIndustries);
    }
  }, [items]);

  useEffect(() => {
    if (token) {
      fetchGalleryItems();
    }
  }, [token, currentPage, sortBy, sortOrder, searchTerm, selectedCategory, selectedIndustry, selectedLocation, selectedItemType]);

  useEffect(() => {
    if (token) {
      fetchTypeCounts();
    }
  }, [token]);

  const handleCreateItem = () => {
    router.push('/admin/gallery/create');
  };

  const handleEditItem = (item: GalleryItem) => {
    router.push(`/admin/gallery/edit/${item._id}`);
  };

  const handleViewItem = (item: GalleryItem) => {
    router.push(`/admin/gallery/view/${item._id}`);
  };

  const handleDeleteItem = (item: GalleryItem) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const confirmDeleteItem = async () => {
    if (!selectedItem || !token) return;

    setDeleteLoading(true);
    try {
      console.log('Gallery page: Deleting item', selectedItem._id);
      const result = await GalleryService.deleteGalleryItem(token, selectedItem._id);
      
      if (result.success) {
        fetchGalleryItems();
        setShowDeleteModal(false);
        setSelectedItem(null);
      } else {
        alert(result.message || 'Failed to delete gallery item');
      }
    } catch (error: any) {
      console.error('Error deleting gallery item:', error);
      alert(error.message || 'An error occurred while deleting the gallery item');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleIndustryFilter = (industry: string) => {
    setSelectedIndustry(industry);
    setCurrentPage(1);
  };

  const handleLocationFilter = (locationIndex: string) => {
    setSelectedLocation(locationIndex);
    setCurrentPage(1);
  };

  const handleItemTypeFilter = (itemType: string) => {
    if (itemType === 'product' || itemType === 'service') {
      setSelectedItemType(itemType);
    } else {
      setSelectedItemType('');
    }
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedIndustry('');
    setSelectedLocation('');
    setSelectedItemType('');
    setCurrentPage(1);
  };

  const calculateActualAmount = (price: number, discount: number, platformCharge: number) => {
    return price - (price * discount / 100) + (price * platformCharge / 100);
  };

  const getLocationName = (locationIndex: number) => {
    const location = locationUsage.find(loc => loc.locationIndex === locationIndex);
    return location?.locationName || `Location ${locationIndex + 1}`;
  };

  const getCategoryCount = (categoryName: string) => {
    return items.filter(item => (item.categoryName || item.category) === categoryName).length;
  };

  const getIndustryCount = (industryName: string) => {
    return items.filter(item => item.industryName === industryName).length;
  };

  const getItemTypeCount = (itemType: 'product' | 'service') => {
    return items.filter(item => item.itemType === itemType).length;
  };

  const getLocationUsageStats = () => {
    const totalImages = locationUsage.reduce((sum, loc) => sum + loc.images, 0);
    const totalVideos = locationUsage.reduce((sum, loc) => sum + loc.videos, 0);
    const verifiedLocations = locationUsage.filter(loc => loc.verified).length;
    return { totalImages, totalVideos, verifiedLocations };
  };

  const locationStats = getLocationUsageStats();

  // Use server-side totals when available, fall back to page-level counts
  const productCount = totalProductCount || getItemTypeCount('product');
  const serviceCount = totalServiceCount || getItemTypeCount('service');

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main content shifted right to account for sidebar */}
      <div className="ml-0 lg:ml-[280px] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gallery Management</h1>
                <p className="text-gray-600 mt-2">Manage your gallery items and locations</p>
              </div>
              <button
                onClick={handleCreateItem}
                className="inline-flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors shadow-sm w-full sm:w-auto"
              >
                <Plus className="w-5 h-5" />
                <span>Create Item</span>
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-purple-100">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600">Total Items</p>
                  <p className="text-xl font-bold text-gray-900">{totalItems}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600">Products</p>
                  <p className="text-xl font-bold text-gray-900">{productCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-indigo-100">
                  <Briefcase className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600">Services</p>
                  <p className="text-xl font-bold text-gray-900">{serviceCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-cyan-100">
                  <Tag className="w-5 h-5 text-cyan-600" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600">Categories</p>
                  <p className="text-xl font-bold text-gray-900">{categories.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-green-100">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600">Locations</p>
                  <p className="text-xl font-bold text-gray-900">{locationUsage.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <ImageIcon className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600">Images</p>
                  <p className="text-xl font-bold text-gray-900">{locationStats.totalImages}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-rose-100">
                  <Video className="w-5 h-5 text-rose-600" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600">Videos</p>
                  <p className="text-xl font-bold text-gray-900">{mediaUsageVideos !== null ? mediaUsageVideos : locationStats.totalVideos}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Location Usage Summary */}
          {locationUsage.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-md font-semibold text-gray-800">Location Usage</h2>
                <span className="text-xs text-gray-500">
                  {locationStats.verifiedLocations} of {locationUsage.length} verified
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {locationUsage.map((location) => (
                  <div key={location.locationIndex} className="border border-gray-200 rounded-lg p-3 hover:border-purple-200 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-800 text-sm">{location.locationName}</span>
                      {location.verified ? (
                        <span className="flex items-center text-green-600 text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </span>
                      ) : (
                        <span className="flex items-center text-amber-600 text-xs">
                          <XCircle className="w-3 h-3 mr-1" />
                          Unverified
                        </span>
                      )}
                    </div>
                    <div className="flex gap-4 text-xs">
                      <div>
                        <span className="text-gray-500">Images:</span>
                        <span className="ml-1 font-semibold text-gray-700">{location.images}/{location.maxImages}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Videos:</span>
                        <span className="ml-1 font-semibold text-gray-700">{location.videos}/{location.maxVideos}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters and Controls */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
            <div className="flex flex-col lg:flex-row gap-3">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by name, description, or SKU..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Industry Filter */}
                {industries.length > 0 && (
                  <select
                    value={selectedIndustry}
                    onChange={(e) => handleIndustryFilter(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent min-w-[140px] bg-white"
                  >
                    <option value="">All Industries</option>
                    {industries.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry} ({getIndustryCount(industry)})
                      </option>
                    ))}
                  </select>
                )}

                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent min-w-[140px] bg-white"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category} ({getCategoryCount(category)})
                    </option>
                  ))}
                </select>

                {/* Item Type Filter */}
                <select
                  value={selectedItemType}
                  onChange={(e) => handleItemTypeFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent min-w-[140px] bg-white"
                >
                  <option value="">All Types</option>
                  <option value="product">Product ({productCount})</option>
                  <option value="service">Service ({serviceCount})</option>
                </select>

                {/* Location Filter */}
                {locationUsage.length > 0 && (
                  <select
                    value={selectedLocation}
                    onChange={(e) => handleLocationFilter(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent min-w-[140px] bg-white"
                  >
                    <option value="">All Locations</option>
                    {locationUsage.map((location) => (
                      <option key={location.locationIndex} value={location.locationIndex.toString()}>
                        {location.locationName} {location.verified ? '✓' : ''}
                      </option>
                    ))}
                  </select>
                )}
                
                {/* Sort Options */}
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [newSortBy, newSortOrder] = e.target.value.split('-');
                    setSortBy(newSortBy);
                    setSortOrder(newSortOrder as 'asc' | 'desc');
                  }}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent min-w-[140px] bg-white"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="priceInDollars-desc">Price: High to Low</option>
                  <option value="priceInDollars-asc">Price: Low to High</option>
                  <option value="name-asc">Name: A to Z</option>
                  <option value="name-desc">Name: Z to A</option>
                </select>

                {/* View Mode Indicator - Just showing list icon to indicate table view */}
                <div className="flex items-center border border-gray-300 rounded-lg bg-purple-50">
                  <div className="p-2 text-purple-600">
                    <List className="w-4 h-4" />
                  </div>
                </div>

                {/* Clear Filters */}
                {(searchTerm || selectedCategory || selectedIndustry || selectedLocation || selectedItemType) && (
                  <button
                    onClick={clearFilters}
                    className="px-3 py-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table View - Only View */}
          {items.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Industry</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className="h-8 w-8 flex-shrink-0">
                              {(item.imageUrl || (item.images && item.images.length > 0)) ? (
                                <img
                                  src={item.imageUrl || item.images[0]}
                                  alt={item.name || item.description}
                                  className="h-8 w-8 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-lg bg-gray-200 flex items-center justify-center">
                                  <ImageIcon className="w-4 h-4 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="ml-3">
                              <div className="text-xs font-medium text-gray-900">{item.name || item.description}</div>
                              <div className="text-xs text-gray-500">ID: {item._id.slice(-6)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            item.itemType === 'product' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {item.itemType === 'product' ? 'Prod' : 'Serv'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700">
                          {item.industryName || 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                            {item.categoryName || item.category}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs font-medium text-gray-900">
                            {formatNaira(item.actualAmount || calculateActualAmount(
                              item.priceInDollars,
                              item.discountPercentage,
                              item.platformChargePercentage
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-900">{item.totalAvailableQuantity}</td>
                        <td className="px-4 py-3">
                          <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                            {item.platformUniqueCode || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            #{item.platformUniqueCode?.split('-').pop() || item._id.slice(-6)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {item.visibilityToPublic ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Public</span>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Private</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => handleViewItem(item)}
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleEditItem(item)}
                              className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteItem(item)}
                              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
              <div className="max-w-md mx-auto">
                <div className="bg-gray-100 rounded-full p-3 inline-flex mx-auto mb-3">
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-md font-medium text-gray-900 mb-1">No gallery items found</h3>
                <p className="text-xs text-gray-500 mb-4">
                  {searchTerm || selectedCategory || selectedIndustry || selectedLocation || selectedItemType
                    ? 'No items match your search criteria. Try adjusting your filters.'
                    : 'Get started by creating your first gallery item.'}
                </p>
                {!searchTerm && !selectedCategory && !selectedIndustry && !selectedLocation && !selectedItemType && (
                  <button
                    onClick={handleCreateItem}
                    className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-xs font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Create Your First Item
                  </button>
                )}
                {(searchTerm || selectedCategory || selectedIndustry || selectedLocation || selectedItemType) && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-xs font-medium"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-3">
              <div className="text-xs text-gray-600">
                Showing {items.length} of {totalItems} items • Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`min-w-[32px] h-8 rounded-lg text-xs font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-purple-600 text-white'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          <DeleteConfirmationModal
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false);
              setSelectedItem(null);
            }}
            onConfirm={confirmDeleteItem}
            itemName={selectedItem?.name || selectedItem?.description || ''}
            loading={deleteLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default GalleryManagementPage;



