"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Image as ImageIcon, Video, Tag, Package, Briefcase, MapPin, Calendar, DollarSign, Copy, Check, Clock, Hash, CreditCard, FileText, Eye, EyeOff } from 'lucide-react';
import { GalleryService } from '@/services/GalleryService';
import { useAuthContext } from '@/AuthContext';
import Image from 'next/image';

interface GalleryItem {
  _id: string;
  name: string;
  description: string;
  categoryId: string;
  industryId: string;
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
  categoryName?: string;
  industryName?: string;
  commissionName?: string;
}

const ViewGalleryItemPage = () => {
  const router = useRouter();
  const params = useParams();
  const { token } = useAuthContext();
  const [item, setItem] = useState<GalleryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      if (!token) return;
      
      try {
        const itemId = Array.isArray(params.id) ? params.id[0] : params.id;
        if (itemId) {
          const result = await GalleryService.getGalleryItem(token, itemId);
          
          if (result.success) {
            if (result.data && 'galleryItem' in result.data) {
              setItem((result.data as any).galleryItem);
            } else {
              setItem(result.data || null);
            }
          } else {
            setErrors('Failed to load gallery item');
          }
        }
      } catch (error: any) {
        console.error('Error fetching item:', error);
        setErrors('Failed to load item data');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [token, params.id]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Item Not Found</h2>
          <p className="text-gray-600 mb-4">The gallery item you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/admin/gallery')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Gallery
          </button>
        </div>
      </div>
    );
  }

  const actualAmount = item.actualAmount ||
    (item.priceInDollars - (item.priceInDollars * (item.discountPercentage || 0) / 100) +
    (item.priceInDollars * (item.platformChargePercentage || 0) / 100));

  // Combine imageUrl (top-level) with images array for display
  const allImages = item.imageUrl
    ? [item.imageUrl, ...(item.images || []).filter(img => img !== item.imageUrl)]
    : (item.images || []);
  const allVideos = item.videoUrl
    ? [item.videoUrl, ...(item.videos || []).filter(v => v !== item.videoUrl)]
    : (item.videos || []);

  const displayId = item._id ? item._id.slice(-8) : 'N/A';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
          {/* Header with Back Button and Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 group w-fit"
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Gallery
            </button>
            
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                item.visibilityToPublic 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}>
                {item.visibilityToPublic ? (
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    Public
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <EyeOff className="w-3 h-3" />
                    Private
                  </span>
                )}
              </span>
              <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                item.itemType === 'product' 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'bg-purple-100 text-purple-700 border border-purple-200'
              }`}>
                {item.itemType === 'product' ? 'Product' : 'Service'}
              </span>
            </div>
          </div>

          {errors && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {errors}
            </div>
          )}

          {/* Main Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{item.name}</h1>
            <p className="text-gray-600 text-lg">{item.description}</p>
          </div>

          {/* Platform Code Card */}
          {item.platformUniqueCode && (
            <div className="mb-8 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Tag className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-purple-700 uppercase tracking-wider">Platform Unique Code</p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm font-mono bg-white px-3 py-1.5 rounded-lg border border-purple-200 text-purple-900">
                        {item.platformUniqueCode}
                      </code>
                      <button
                        onClick={() => copyToClipboard(item.platformUniqueCode!)}
                        className="p-2 hover:bg-white rounded-lg transition-colors"
                        title="Copy code"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-purple-600 hover:text-purple-800" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-purple-600 bg-purple-100 px-3 py-1.5 rounded-lg">
                  <Hash className="w-4 h-4" />
                  <span className="font-mono">ID: {displayId}</span>
                </div>
              </div>
            </div>
          )}

          {/* Images Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="p-1.5 bg-purple-100 rounded-lg mr-2">
                <ImageIcon className="w-5 h-5 text-purple-600" />
              </div>
              Images ({allImages.length})
            </h2>
            {allImages.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {allImages.map((image, index) => (
                    <div 
                      key={index} 
                      className="relative group aspect-square cursor-pointer"
                      onClick={() => setSelectedImage(image)}
                    >
                      <div className="relative w-full h-full rounded-lg border border-gray-200 overflow-hidden hover:border-purple-400 hover:shadow-md transition-all">
                        <Image
                          src={image}
                          alt={`${item.name} - Image ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 20vw"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg"></div>
                    </div>
                  ))}
                </div>

                {/* Image Preview Modal */}
                {selectedImage && (
                  <div 
                    className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                  >
                    <div className="relative max-w-4xl max-h-[90vh] w-full h-full">
                      <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 z-10"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <div className="relative w-full h-full">
                        <Image
                          src={selectedImage}
                          alt="Preview"
                          fill
                          className="object-contain"
                          sizes="100vw"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
                <div className="p-3 bg-gray-100 rounded-full mb-3">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">No images uploaded</p>
              </div>
            )}
          </div>

          {/* Videos Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="p-1.5 bg-purple-100 rounded-lg mr-2">
                <Video className="w-5 h-5 text-purple-600" />
              </div>
              Videos ({allVideos.length})
            </h2>
            {allVideos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allVideos.map((video, index) => (
                  <div key={index} className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all">
                    <div className="p-2 bg-red-50 rounded-lg mr-3">
                      <Video className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">Video {index + 1}</p>
                      <p className="text-xs text-gray-500">Click to preview</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
                <div className="p-3 bg-gray-100 rounded-full mb-3">
                  <Video className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">No videos uploaded</p>
              </div>
            )}
          </div>

          {/* Details Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Card Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Item Details</h2>
            </div>

            {/* Card Body */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Classification */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center mb-3">
                      <div className="p-1 bg-purple-100 rounded mr-2">
                        <Tag className="w-3.5 h-3.5 text-purple-600" />
                      </div>
                      Classification
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Industry</span>
                        <span className="text-sm font-medium text-gray-900 bg-white px-3 py-1 rounded-full border border-gray-200">
                          {item.industryName || 'Fintech'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Category</span>
                        <span className="text-sm font-medium text-gray-900 bg-white px-3 py-1 rounded-full border border-gray-200">
                          {item.categoryName || 'Bank'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Location</span>
                        <span className="text-sm font-medium text-gray-900 flex items-center bg-white px-3 py-1 rounded-full border border-gray-200">
                          <MapPin className="w-3 h-3 mr-1 text-gray-500" />
                          Location {item.locationIndex}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">SKU / UPC</span>
                        <span className="text-sm font-mono text-gray-900 bg-white px-3 py-1 rounded-full border border-gray-200">
                          {item.sku || item.upc || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center mb-3">
                      <div className="p-1 bg-purple-100 rounded mr-2">
                        <Package className="w-3.5 h-3.5 text-purple-600" />
                      </div>
                      Inventory
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Available Quantity</span>
                        <span className="text-2xl font-bold text-purple-600">{item.totalAvailableQuantity}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Middle Column - Schedule */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center mb-3">
                      <div className="p-1 bg-purple-100 rounded mr-2">
                        <Calendar className="w-3.5 h-3.5 text-purple-600" />
                      </div>
                      Schedule
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Start Date</p>
                          <p className="text-sm font-medium text-gray-900">{formatDate(item.startDate)}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatTime(item.startTime)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">End Date</p>
                          <p className="text-sm font-medium text-gray-900">{formatDate(item.endDate)}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatTime(item.endTime)}</p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Duration</span>
                          <span className="text-sm font-medium text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                            {Math.ceil((new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Media */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center mb-3">
                      <div className="p-1 bg-purple-100 rounded mr-2">
                        <FileText className="w-3.5 h-3.5 text-purple-600" />
                      </div>
                      Media Summary
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 flex items-center">
                            <ImageIcon className="w-4 h-4 mr-2 text-gray-400" />
                            Images
                          </span>
                          <span className="text-sm font-medium text-gray-900">{allImages.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 flex items-center">
                            <Video className="w-4 h-4 mr-2 text-gray-400" />
                            Videos
                          </span>
                          <span className="text-sm font-medium text-gray-900">{allVideos.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing Section - Full Width */}
                <div className="lg:col-span-3 mt-4">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center mb-4">
                    <div className="p-1 bg-purple-100 rounded mr-2">
                      <DollarSign className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    Pricing Details
                  </h3>
                  
                  {/* Price Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <p className="text-xs text-gray-500 mb-1">Base Price</p>
                      <p className="text-xl font-bold text-gray-900">{formatNaira(item.priceInDollars)}</p>
                      {item.discountPercentage > 0 && (
                        <div className="mt-2 inline-flex items-center px-2 py-1 bg-red-50 rounded-md">
                          <span className="text-xs text-red-600 font-medium">-{item.discountPercentage}% discount</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <p className="text-xs text-gray-500 mb-1">Platform Charge</p>
                      <p className="text-xl font-bold text-amber-600">{item.platformChargePercentage}%</p>
                      {item.commissionName && (
                        <p className="text-xs text-gray-500 mt-2">{item.commissionName}</p>
                      )}
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <p className="text-xs text-purple-600 mb-1">Final Amount</p>
                      <p className="text-xl font-bold text-purple-600">{formatNaira(actualAmount)}</p>
                      <p className="text-xs text-purple-500 mt-2">After all charges</p>
                    </div>

                    {item.upfrontPaymentPercentage && item.upfrontPaymentPercentage > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <p className="text-xs text-blue-600 mb-1">Upfront Payment</p>
                        <p className="text-xl font-bold text-blue-600">{item.upfrontPaymentPercentage}%</p>
                        <p className="text-xs text-blue-500 mt-2">{formatNaira(item.upfrontPaymentAmount || 0)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes Section */}
                {item.notes && (
                  <div className="lg:col-span-3 mt-6">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center mb-3">
                      <div className="p-1 bg-purple-100 rounded mr-2">
                        <FileText className="w-3.5 h-3.5 text-purple-600" />
                      </div>
                      Additional Notes
                    </h3>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-gray-700 whitespace-pre-wrap text-sm">{item.notes}</p>
                    </div>
                  </div>
                )}

                {/* Metadata Footer */}
                <div className="lg:col-span-3 mt-8 pt-6 border-t border-gray-200">
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-gray-100 rounded-md">
                        <Hash className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Item ID</p>
                        <p className="text-xs font-mono text-gray-800">{displayId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-gray-100 rounded-md">
                        <Calendar className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Created</p>
                        <p className="text-xs text-gray-800">{formatDate(item.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-gray-100 rounded-md">
                        <Clock className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Updated</p>
                        <p className="text-xs text-gray-800">{formatDate(item.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

         
         
      </div>
    </div>
  );
};

export default ViewGalleryItemPage;