// app/(main)/admin/gallery/view/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { GalleryService } from "@/services/gallery-sub-service";
import { ApiServiceResponse } from "@/types/sub-service";

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
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

export default function ViewServicePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [service, setService] = useState<ApiServiceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getToken = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userToken') || sessionStorage.getItem('userToken');
    }
    return null;
  };

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
          setService(result.data);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#5d2a8b] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading service details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
            <p className="text-red-600">{error || 'Service not found'}</p>
            <button
              onClick={() => router.push('/admin/gallery')}
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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#5d2a8b]">Service Details</h1>
            <p className="text-gray-600">View complete information about this service</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/admin/gallery')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            <button
              onClick={() => router.push(`/admin/gallery/edit/${id}`)}
              className="px-4 py-2 bg-[#5d2a8b] text-white rounded-md hover:bg-[#4a2170] flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Image Section */}
          <div className="h-64 bg-gray-100 relative">
            {service.imageUrl ? (
              <Image
                src={service.imageUrl}
                alt={service.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">{service.name}</h2>
                <p className="text-gray-600 mb-4">{service.description}</p>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Category</span>
                    <p className="text-gray-900">{service.categoryName || 'Uncategorized'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Location Index</span>
                    <p className="text-gray-900">{service.locationIndex}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Platform Code</span>
                    <p className="text-gray-900 font-mono text-sm">{service.platformUniqueCode}</p>
                  </div>
                  {service.producer && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Producer</span>
                      <p className="text-gray-900">{service.producer}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Pricing Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Price:</span>
                    <span className="font-medium">{formatCurrency(service.priceInDollars)}</span>
                  </div>
                  {service.discountPercentage > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({service.discountPercentage}%):</span>
                      <span>-{formatCurrency(service.priceInDollars * service.discountPercentage / 100)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Platform Charge ({service.platformChargePercentage}%):</span>
                    <span>+{formatCurrency(service.priceInDollars * service.platformChargePercentage / 100)}</span>
                  </div>
                  {service.upfrontPaymentPercentage > 0 && (
                    <div className="flex justify-between text-blue-600">
                      <span>Upfront Payment ({service.upfrontPaymentPercentage}%):</span>
                      <span>{formatCurrency(service.upfrontPaymentAmount)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Final Amount:</span>
                    <span className="text-[#5d2a8b]">{formatCurrency(service.actualAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-services Section */}
            {service.hasSubServices && service.subServices && service.subServices.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Sub-services ({service.subServiceCount})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {service.subServices.map((sub, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900">{sub.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">{sub.description}</p>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-sm font-medium text-[#5d2a8b]">
                          {formatCurrency(sub.price)}
                        </span>
                        {sub.uploadPicture && (
                          <span className="text-xs text-gray-400">Has image</span>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-gray-400 font-mono">
                        {sub.subPlatformUniqueCode}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Availability Section */}
            {service.availability && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Availability</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Start Date</span>
                      <p className="text-gray-900">{formatDate(service.availability.startDate)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Start Time</span>
                      <p className="text-gray-900">{service.availability.startTime}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">End Date</span>
                      <p className="text-gray-900">{formatDate(service.availability.endDate)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">End Time</span>
                      <p className="text-gray-900">{service.availability.endTime}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

           
            {service.notes && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Notes</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{service.notes}</p>
                </div>
              </div>
            )}

            
            <div className="mt-8 text-sm text-gray-400 border-t pt-4">
              <div className="flex justify-between">
                <span>Created: {formatDate(service.createdAt)}</span>
                <span>Updated: {formatDate(service.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}