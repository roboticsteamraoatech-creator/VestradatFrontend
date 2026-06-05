"use client";

import { useState, useEffect } from 'react';
import { Search, MapPin, CheckCircle, Tag, AlertCircle, Package, Layers } from 'lucide-react';
import { useRouter } from 'next/navigation';

import type { PublicProduct, PublicProductDetails } from '@/types/publicProduct';
import type { ExtendedPublicProductDetails, SubService } from '@/types/BodyCare';
import { PublicProductService } from '@/services/publicProductService.ts';
import ProductDetailsView from '@/modules/user/body-care/ProductDetailsView';
import SubServiceView from '@/modules/user/body-care/SubServiceView';
import ProductCard from '@/modules/user/body-care/ProductCard';

const BodyCarePage = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [platformCodeTerm, setPlatformCodeTerm] = useState(''); // Separate tracking for code submissions
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [itemType, setItemType] = useState<'product' | 'service'>('product');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ExtendedPublicProductDetails | null>(null);
  const [selectedSubService, setSelectedSubService] = useState<SubService | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Filter options
  const [cities, setCities] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<Array<{ 
    id: string; 
    name: string; 
    description: string; 
    industry: { id: string; name: string; }; 
    productCount: number; 
  }>>([]);

  // Fetch products on mount and when base filters change
  useEffect(() => {
    fetchProducts();
    fetchAllCategories();
  }, [pagination.page, itemType]);

  // AUTOMATIC REVERT EFFECT: Instantly restores full catalog when name search or code search is empty
  useEffect(() => {
    if (searchTerm.trim() === '' && platformCodeTerm.trim() === '') {
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchProducts();
    }
  }, [searchTerm, platformCodeTerm]);

  // Extract filter options when products change
  useEffect(() => {
    if (products.length > 0) {
      const locations = PublicProductService.extractLocations(products);
      setCities(locations.cities);
      setStates(locations.states);
    }
  }, [products]);

  const fetchProducts = async (forcedSearchOverride?: string) => {
    setLoading(true);
    setError(null);
    
    // Use explicit code value if passed directly, otherwise fall back to regular search text
    const activeSearchQuery = forcedSearchOverride !== undefined 
      ? forcedSearchOverride 
      : (platformCodeTerm || searchTerm || undefined);

    try {
      const response = await PublicProductService.searchProducts({
        search: activeSearchQuery,
        categoryName: selectedCategoryName || undefined,
        city: selectedCity || undefined,
        state: selectedState || undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        itemType: itemType,
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sortBy || undefined,
        sortOrder: sortOrder || undefined
      });
      
      if (response.success) {
        setProducts(response.data.items as PublicProduct[]);
        setPagination({
          ...pagination,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages
        });
      } else {
        setError(response.message || 'Failed to fetch products');
        setProducts([]);
      }
    } catch (err) {
      setError('An error occurred while fetching products');
      console.error('Error:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Handles text-based filter form requests
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPlatformCodeTerm(''); // Clear code searches to avoid conflicts
    setPagination({ ...pagination, page: 1 });
    fetchProducts();
  };

  // Handles platform code submissions to stream directly into the grid results loader
  const handleGridCodeSearch = (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;
    
    setSearchTerm(''); // Clear text search to handle code matching exclusively
    setPlatformCodeTerm(cleanCode);
    setPagination({ ...pagination, page: 1 });
    
    // Directly pass query through parameters list to guarantee instant render execution
    fetchProducts(cleanCode);
  };

  const fetchAllCategories = async () => {
    try {
      const response = await PublicProductService.getAllCategories();
      if (response.success) {
        setAllCategories(response.data.categories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleViewDetails = async (product: PublicProduct) => {
    try {
      setLoadingDetails(true);
      setError(null);
      const response = await PublicProductService.getProductDetails(product.id);
      
      if (response.success) {
        // console.log("product", product)
        // console.log("response", response.data)
        setSelectedProduct(response.data as unknown as ExtendedPublicProductDetails);
        setSelectedSubService(null);
      } else {
        setError(response.message || 'Failed to fetch product details');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch product details');
      console.error('Error fetching product details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleBack = () => {
    setSelectedProduct(null);
    setSelectedSubService(null);
  };

  const handleBackFromSubService = () => {
    setSelectedSubService(null);
  };

  const handleSubServiceSelect = (subService: SubService) => {
    setSelectedSubService(subService);
  };

  const makePayment = async (product: ExtendedPublicProductDetails, subService?: SubService) => {
    const paymentData = subService ? {
      productId: product.product.id,
      subServiceId: subService.subPlatformUniqueCode,
      name: subService.name,
      description: subService.description,
      price: subService.price,
      upfrontPayment: product.product.pricing.upfrontPaymentAmount,
      organizationId: product.product.organizationId,
      organizationName: product.serviceProvider.producer,
      upfrontPercentage: product.product.pricing.upfrontPaymentPercentage || 10,
      itemType: 'service' as const,
      isSubService: true,
      timestamp: Date.now(),
      bookingLocation: { type: "merchant_location" }
    } : {
      productId: product.product.id,
      name: product.product.name,
      price: product.product.pricing.finalPrice,
      upfrontPayment: product.product.pricing.upfrontPaymentAmount,
      organizationId: product.product.organizationId,
      organizationName: product.serviceProvider.producer,
      upfrontPercentage: product.product.pricing.upfrontPaymentPercentage || 10,
      itemType: product.product.itemType as "product" | "service",
      timestamp: Date.now(),
      bookingLocation: { type: "merchant_location" }
    };
    
    // localStorage.setItem('selectedProduct', JSON.stringify(paymentData));
    localStorage.setItem('selectedProduct', JSON.stringify(product));
    router.push('/user/payment');
  };

  const bookAppointment = (product: ExtendedPublicProductDetails, subService?: SubService) => {
    const appointmentData = subService ? {
      ...product,
      selectedSubService: subService
    } : product;
    
    localStorage.setItem('appointmentProduct', JSON.stringify(appointmentData));
    
    const organizationId = (product.product.organizationId || "").replace(/-\d{3}-\d{3}$/, "");
    const serviceId = product.product.id;
    
    router.push(`/user/book-appointment?organizationId=${organizationId}&serviceId=${serviceId}`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setPlatformCodeTerm('');
    setSelectedCategoryName('');
    setSelectedCity('');
    setSelectedState('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setPagination({ ...pagination, page: 1 });
    fetchProducts('');
  };

  const formatCurrency = PublicProductService.formatNaira;

  if (selectedSubService && selectedProduct) {
    return (
      <SubServiceView
        selectedSubService={selectedSubService}
        selectedProduct={selectedProduct}
        onBack={handleBackFromSubService}
        onMakePayment={makePayment}
        onBookAppointment={bookAppointment}
        formatCurrency={formatCurrency}
      />
    );
  }

  if (selectedProduct) {
    return (
      <ProductDetailsView
        selectedProduct={selectedProduct}
        loading={loadingDetails}
        onBack={handleBack}
        onSubServiceSelect={handleSubServiceSelect}
        onMakePayment={makePayment}
        onBookAppointment={bookAppointment}
        formatCurrency={formatCurrency}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="ml-0 md:ml-[350px] pt-8 md:pt-8 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              <span className="text-[#5d2a8b]">Verified</span> Products & Services
            </h1>
            <p className="text-gray-600 text-lg">Discover quality services and products from verified providers</p>
            
            {/* Toggle for Products/Services */}
            <div className="mt-6 flex justify-center">
              <div className="inline-flex rounded-lg border border-[#5d2a8b] p-1">
                <button
                  type="button"
                  onClick={() => {
                    setItemType('product');
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                    itemType === 'product' ? 'bg-[#5d2a8b] text-white' : 'text-[#5d2a8b] hover:bg-[#5d2a8b]/10'
                  }`}
                >
                  Products
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setItemType('service');
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                    itemType === 'service' ? 'bg-[#5d2a8b] text-white' : 'text-[#5d2a8b] hover:bg-[#5d2a8b]/10'
                  }`}
                >
                  Services
                </button>
              </div>
            </div>
          </div>

          {/* Quick Platform Code Search (Updated to route directly into grid query array updates) */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border-2 border-[#5d2a8b]">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              {/* Quick Search by Platform Code */}
              Quick Search by Product Code
            </h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={platformCodeTerm}
                onChange={(e) => setPlatformCodeTerm(e.target.value)}
                placeholder="Enter product unique code (e.g., ORG1766704354663-008-016)"
                className="flex-1 px-4 py-3 border-2 border-[#5d2a8b] rounded-lg focus:ring-2 focus:ring-[#5d2a8b] focus:border-[#5d2a8b]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleGridCodeSearch(e.currentTarget.value);
                  }
                }}
              />
              <button
                type="button"
                onClick={(e) => {
                  const input = e.currentTarget.parentElement?.querySelector('input');
                  if (input) handleGridCodeSearch(input.value);
                }}
                className="px-6 py-3 bg-[#5d2a8b] text-white rounded-lg hover:bg-[#7a3aa3] transition-colors font-semibold flex items-center"
              >
                <Search className="w-5 h-5 mr-2" />
                Search Code
              </button>
            </div>
          </div>

          {/* Search and Filters Form */}
          <form onSubmit={handleFilterSubmit} className="bg-white rounded-xl shadow-sm p-6 mb-8 border-2 border-[#5d2a8b]">
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#5d2a8b] w-6 h-6" />
              <input
                type="text"
                placeholder="Search by name..."
                className="w-full pl-14 pr-4 py-4 text-lg border-2 border-[#5d2a8b] rounded-lg focus:ring-2 focus:ring-[#5d2a8b] focus:border-[#5d2a8b]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Category Name Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
                <select
                  className="w-full px-4 py-3 border border-[#5d2a8b] rounded-lg focus:ring-2 focus:ring-[#5d2a8b] focus:border-[#5d2a8b]"
                  value={selectedCategoryName}
                  onChange={(e) => setSelectedCategoryName(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {allCategories.map(category => (
                    <option key={category.id} value={category.name}>
                      {category.name} - {category.industry.name} 
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Filters */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <select
                    className="w-full px-3 py-3 border border-[#5d2a8b] rounded-lg focus:ring-2 focus:ring-[#5d2a8b] focus:border-[#5d2a8b] text-sm"
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                  >
                    <option value="">All Cities</option>
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <select
                    className="w-full px-3 py-3 border border-[#5d2a8b] rounded-lg focus:ring-2 focus:ring-[#5d2a8b] focus:border-[#5d2a8b] text-sm"
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                  >
                    <option value="">All States</option>
                    {states.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    className="w-full px-3 py-3 border border-[#5d2a8b] rounded-lg focus:ring-2 focus:ring-[#5d2a8b] focus:border-[#5d2a8b] text-sm"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    min="0"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    className="w-full px-3 py-3 border border-[#5d2a8b] rounded-lg focus:ring-2 focus:ring-[#5d2a8b] focus:border-[#5d2a8b] text-sm"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              {/* Sorting */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    className="w-full px-3 py-3 border border-[#5d2a8b] rounded-lg focus:ring-2 focus:ring-[#5d2a8b] focus:border-[#5d2a8b] text-sm"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="createdAt">Newest</option>
                    <option value="name">Name</option>
                    <option value="price">Price</option>
                    <option value="discount">Discount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                  <select
                    className="w-full px-3 py-3 border border-[#5d2a8b] rounded-lg focus:ring-2 focus:ring-[#5d2a8b] focus:border-[#5d2a8b] text-sm"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                type="submit"
                className="flex-1 bg-[#5d2a8b] text-white py-3 rounded-lg hover:bg-[#7a3aa3] transition-colors font-semibold flex items-center justify-center"
              >
                Apply Filters
              </button>
              <button 
                type="button"
                onClick={clearFilters}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              >
                Clear Filters
              </button>
            </div>
          </form>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">
                <p className="font-medium">Error</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Results Count */}
          <div className="mb-6 flex justify-between items-center">
            <p className="text-gray-600">
              Showing <span className="font-semibold text-[#5d2a8b]">{products.length}</span> of{' '}
              <span className="font-semibold">{pagination.total}</span> {itemType === 'product' ? 'products' : 'services'}
            </p>
            <div className="flex items-center text-sm text-gray-500">
              <Tag className="w-4 h-4 mr-1" />
              Sorted by {sortBy === 'createdAt' ? 'newest' : sortBy} ({sortOrder === 'desc' ? 'desc' : 'asc'})
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5d2a8b]"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onViewDetails={handleViewDetails}
                    formatCurrency={formatCurrency}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center mt-8 gap-2">
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                    className={`px-4 py-2 border rounded-lg ${
                      pagination.page === 1 ? 'border-gray-200 text-gray-400 cursor-not-allowed' : 'border-[#5d2a8b] text-[#5d2a8b] hover:bg-[#5d2a8b] hover:text-white'
                    } transition-colors`}
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                    let pageNum = pagination.page;
                    if (pagination.totalPages <= 5) pageNum = i + 1;
                    else if (pagination.page <= 3) pageNum = i + 1;
                    else if (pagination.page >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i;
                    else pageNum = pagination.page - 2 + i;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPagination({ ...pagination, page: pageNum })}
                        className={`px-4 py-2 border rounded-lg ${
                          pagination.page === pageNum ? 'bg-[#5d2a8b] text-white border-[#5d2a8b]' : 'border-[#5d2a8b] text-[#5d2a8b] hover:bg-[#5d2a8b] hover:text-white'
                        } transition-colors`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page === pagination.totalPages}
                    className={`px-4 py-2 border rounded-lg ${
                      pagination.page === pagination.totalPages ? 'border-gray-200 text-gray-400 cursor-not-allowed' : 'border-[#5d2a8b] text-[#5d2a8b] hover:bg-[#5d2a8b] hover:text-white'
                    } transition-colors`}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}

          {products.length === 0 && !loading && !error && (
            <div className="text-center py-12">
              <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No {itemType === 'product' ? 'products' : 'services'} found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
              <button 
                onClick={clearFilters}
                className="text-[#5d2a8b] hover:text-[#7a3aa3] font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BodyCarePage;