
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { GalleryService } from "@/services/gallery-sub-service";
import { ArrowLeft, Save } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface Industry {
  id: string;
  name: string;
}


interface ApiSubService {
  name: string;
  description: string;
  price: number;
  subPlatformUniqueCode?: string;
  uploadPicture?: string;
}


interface UpdateServicePayload {
  name?: string;
  description?: string;
  categoryId?: string;
  industryId?: string;
  locationIndex?: number;
  sku?: string;
  upc?: string;
  producer?: string;
  totalAvailableServiceProviders?: number;
  priceInDollars?: number;
  discountPercentage?: number;
  platformChargePercentage?: number;
  upfrontPaymentPercentage?: number;
  visibilityToPublic?: boolean;
  notes?: string;
  subServices?: Array<{
    name: string;
    description: string;
    price: number;
    subPlatformUniqueCode?: string;
    uploadPicture?: string;
  }>;
  availability?: {
    type: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
  };
}

interface GalleryItem {
  _id: string;
  name: string;
  description: string;
  categoryId: string;
  industryId: string;
  locationIndex: number;
  sku?: string;
  upc?: string;
  producer?: string;
  totalAvailableServiceProviders?: number;
  priceInDollars: number;
  discountPercentage: number;
  platformChargePercentage: number;
  upfrontPaymentPercentage: number;
  upfrontPaymentAmount: number;
  actualAmount: number;
  hasSubServices: boolean;
  subServiceCount: number;
  subServices: ApiSubService[];
  availability?: {
    type: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
  };
  visibilityToPublic: boolean;
  notes?: string;
  imageUrl?: string;
  categoryName?: string;
  industryName?: string;
}

export default function EditServicePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    industryId: '',
    locationIndex: 0,
    sku: '',
    upc: '',
    producer: '',
    totalProviders: '',
    priceInDollars: '',
    discountPercentage: '',
    platformChargePercentage: '',
    upfrontPayment: false,
    visibilityToPublic: true,
    availabilityType: 'unlimited' as 'unlimited' | 'period',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    notes: '',
    subServices: [] as ApiSubService[]
  });

  const getToken = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userToken') || sessionStorage.getItem('userToken');
    }
    return null;
  };


//   useEffect(() => {
//     const fetchLookupData = async () => {
//       const token = getToken();
//       if (!token) return;

//       try {
//         const [categoriesResult, industriesResult] = await Promise.all([
//           GalleryService.getCategories(token),
//           GalleryService.getIndustries(token)
//         ]);

//         if (categoriesResult.success && categoriesResult.data) {
//           setCategories(categoriesResult.data);
//         }
//         if (industriesResult.success && industriesResult.data) {
//           setIndustries(industriesResult.data);
//         }
//       } catch (error) {
//         console.error('Error fetching lookup data:', error);
//       }
//     };

//     fetchLookupData();
//   }, []);

  // Fetch service data
  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true);
        const token = getToken();
        
        if (!token) {
          router.push('/login');
          return;
        }

        const result = await GalleryService.getGalleryItem(token, id);
        
        if (result.success && result.data) {
          const item = result.data as GalleryItem;
          
          setFormData({
            name: item.name || '',
            description: item.description || '',
            categoryId: item.categoryId || '',
            industryId: item.industryId || '',
            locationIndex: item.locationIndex || 0,
            sku: item.sku || '',
            upc: item.upc || '',
            producer: item.producer || '',
            totalProviders: item.totalAvailableServiceProviders?.toString() || '',
            priceInDollars: item.priceInDollars?.toString() || '',
            discountPercentage: item.discountPercentage?.toString() || '',
            platformChargePercentage: item.platformChargePercentage?.toString() || '',
            upfrontPayment: (item.upfrontPaymentPercentage || 0) > 0,
            visibilityToPublic: item.visibilityToPublic,
            availabilityType: item.availability?.type as 'unlimited' | 'period' || 'unlimited',
            startDate: item.availability?.startDate?.split('T')[0] || '',
            endDate: item.availability?.endDate?.split('T')[0] || '',
            startTime: item.availability?.startTime || '',
            endTime: item.availability?.endTime || '',
            notes: item.notes || '',
            subServices: item.subServices || []
          });
        } else {
          setError(result.message || 'Failed to fetch service details');
        }
      } catch (err) {
        setError('An error occurred while fetching service details');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchService();
    }
  }, [id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }

     
      const updatePayload: UpdateServicePayload = {
        name: formData.name,
        description: formData.description,
        categoryId: formData.categoryId,
        industryId: formData.industryId,
        locationIndex: formData.locationIndex,
      };


      if (formData.sku) updatePayload.sku = formData.sku;
      if (formData.upc) updatePayload.upc = formData.upc;
      if (formData.producer) updatePayload.producer = formData.producer;
      if (formData.totalProviders) {
        updatePayload.totalAvailableServiceProviders = parseInt(formData.totalProviders);
      }
      
     
      updatePayload.priceInDollars = parseFloat(formData.priceInDollars) || 0;
      updatePayload.discountPercentage = parseFloat(formData.discountPercentage) || 0;
      updatePayload.platformChargePercentage = parseFloat(formData.platformChargePercentage) || 0;
      updatePayload.upfrontPaymentPercentage = formData.upfrontPayment ? 30 : 0;
      updatePayload.visibilityToPublic = formData.visibilityToPublic;
      
      if (formData.notes) {
        updatePayload.notes = formData.notes;
      }

     
      if (formData.subServices && formData.subServices.length > 0) {
        updatePayload.subServices = formData.subServices.map(sub => ({
          name: sub.name,
          description: sub.description,
          price: sub.price,
          ...(sub.subPlatformUniqueCode && { subPlatformUniqueCode: sub.subPlatformUniqueCode }),
          ...(sub.uploadPicture && { uploadPicture: sub.uploadPicture })
        }));
      }

    
      if (formData.availabilityType === 'period') {
        updatePayload.availability = {
          type: 'period',
          startDate: formData.startDate,
          startTime: formData.startTime,
          endDate: formData.endDate,
          endTime: formData.endTime
        };
      }

      console.log('Updating with payload:', updatePayload);

      // Call the update method
      const result = await GalleryService.updateGalleryItem(token, id, updatePayload as any);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/admin/gallery/services');
        }, 1000);
      } else {
        setError(result.message || 'Failed to update service');
      }
    } catch (err) {
      setError('An error occurred while updating');
      console.error('Update error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#5d2a8b] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading service for editing...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !formData.name) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => router.push('/admin/gallery/services')}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Back to Gallery
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-0 md:ml-[350px] pt-8 md:pt-8 p-4 md:p-8 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.push('/admin/gallery/services')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Gallery
          </button>
          <h1 className="text-2xl font-bold text-[#5d2a8b]">Edit Service</h1>
        </div>

   
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            Service updated successfully! Redirecting...
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#5d2a8b] focus:border-[#5d2a8b]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location Index
                  </label>
                  <input
                    type="number"
                    name="locationIndex"
                    value={formData.locationIndex}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#5d2a8b] focus:border-[#5d2a8b]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#5d2a8b] focus:border-[#5d2a8b]"
                  />
                </div>

                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#5d2a8b] focus:border-[#5d2a8b]"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div> */}

                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry
                  </label>
                  <select
                    name="industryId"
                    value={formData.industryId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#5d2a8b] focus:border-[#5d2a8b]"
                  >
                    <option value="">Select Industry</option>
                    {industries.map(ind => (
                      <option key={ind.id} value={ind.id}>{ind.name}</option>
                    ))}
                  </select>
                </div> */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#5d2a8b] focus:border-[#5d2a8b]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    UPC
                  </label>
                  <input
                    type="text"
                    name="upc"
                    value={formData.upc}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#5d2a8b] focus:border-[#5d2a8b]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Producer
                  </label>
                  <input
                    type="text"
                    name="producer"
                    value={formData.producer}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#5d2a8b] focus:border-[#5d2a8b]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Providers
                  </label>
                  <input
                    type="number"
                    name="totalProviders"
                    value={formData.totalProviders}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#5d2a8b] focus:border-[#5d2a8b]"
                  />
                </div>
              </div>
            </div>

            {/* Pricing Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">Pricing Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="priceInDollars"
                    value={formData.priceInDollars}
                    onChange={handleChange}
                    required
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#5d2a8b] focus:border-[#5d2a8b]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    name="discountPercentage"
                    value={formData.discountPercentage}
                    onChange={handleChange}
                    step="0.1"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#5d2a8b] focus:border-[#5d2a8b]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Platform Charge (%)
                  </label>
                  <input
                    type="number"
                    name="platformChargePercentage"
                    value={formData.platformChargePercentage}
                    onChange={handleChange}
                    step="0.1"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#5d2a8b] focus:border-[#5d2a8b]"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="upfrontPayment"
                  id="upfrontPayment"
                  checked={formData.upfrontPayment}
                  onChange={(e) => setFormData(prev => ({ ...prev, upfrontPayment: e.target.checked }))}
                  className="h-4 w-4 text-[#5d2a8b] focus:ring-[#5d2a8b] border-gray-300 rounded"
                />
                <label htmlFor="upfrontPayment" className="ml-2 block text-sm text-gray-700">
                  Require Upfront Payment (30%)
                </label>
              </div>
            </div>

            {/* Visibility & Availability */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">Visibility & Availability</h2>
              
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  name="visibilityToPublic"
                  id="visibilityToPublic"
                  checked={formData.visibilityToPublic}
                  onChange={(e) => setFormData(prev => ({ ...prev, visibilityToPublic: e.target.checked }))}
                  className="h-4 w-4 text-[#5d2a8b] focus:ring-[#5d2a8b] border-gray-300 rounded"
                />
                <label htmlFor="visibilityToPublic" className="ml-2 block text-sm text-gray-700">
                  Visible to Public
                </label>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Availability Type</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="availabilityType"
                      value="unlimited"
                      checked={formData.availabilityType === 'unlimited'}
                      onChange={handleChange}
                      className="h-4 w-4 text-[#5d2a8b] focus:ring-[#5d2a8b] border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Unlimited</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="availabilityType"
                      value="period"
                      checked={formData.availabilityType === 'period'}
                      onChange={handleChange}
                      className="h-4 w-4 text-[#5d2a8b] focus:ring-[#5d2a8b] border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Specific Period</span>
                  </label>
                </div>
              </div>

              {formData.availabilityType === 'period' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#5d2a8b] focus:border-[#5d2a8b]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#5d2a8b] focus:border-[#5d2a8b]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#5d2a8b] focus:border-[#5d2a8b]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input
                      type="time"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#5d2a8b] focus:border-[#5d2a8b]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">Additional Notes</h2>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#5d2a8b] focus:border-[#5d2a8b]"
                placeholder="Any additional notes about the service..."
              />
            </div>

            {/* Sub-services summary */}
            {formData.subServices.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold border-b pb-2">Sub-services ({formData.subServices.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.subServices.map((sub, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                      <h3 className="font-medium">{sub.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{sub.description}</p>
                      <p className="text-sm font-medium text-[#5d2a8b] mt-2">${sub.price}</p>
                      {sub.subPlatformUniqueCode && (
                        <p className="text-xs text-gray-400 mt-1">Code: {sub.subPlatformUniqueCode}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-[#5d2a8b] text-white rounded-md hover:bg-[#4a2170] transition-colors disabled:bg-purple-300 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {submitting ? 'Updating...' : 'Update Service'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}