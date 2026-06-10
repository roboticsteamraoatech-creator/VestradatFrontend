"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Image as ImageIcon, Video, Calendar, DollarSign, Tag, Check, Briefcase, Package, AlertCircle, Plus, Trash2 } from 'lucide-react';

import { GalleryService } from '@/services/GalleryService';
import { useAuthContext } from '@/AuthContext';
import ServiceFields from '@/app/components/gallery/ServiceFields';
import MediaUpload from '@/app/components/gallery/MediaUpload';
import PricingSection from '@/app/components/gallery/PricingSection';
import { BASE_URL } from '@/config/api';
import {
  SubService,
  TimeWindow, 
  DayAvailability, 
  AvailabilityPeriod, 
  BookingAvailability, 
  FormData, 
  Industry, 
  Category, 
  PlatformCommission, 
  PlatformCodePreview,
  DayName
} from '@/types/gallery';



const DAY_NAMES: DayName[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const CreateGalleryItemPage = () => {
  const router = useRouter();
  const { token } = useAuthContext();
  
  // State for cascading dropdowns
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [platformCodePreview, setPlatformCodePreview] = useState<PlatformCodePreview | null>(null);
  const [platformCommission, setPlatformCommission] = useState<PlatformCommission | null>(null);
  
  // Loading states
  const [loadingIndustries, setLoadingIndustries] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [loadingCommission, setLoadingCommission] = useState(false);
  const [loadingCodePreview, setLoadingCodePreview] = useState(true);


  const [commissionError, setCommissionError] = useState<string | null>(null);
const [commissionLoading, setCommissionLoading] = useState(false);

  const [locations, setLocations] = useState<Array<{
    value: number;
    label: string;
    disabled: boolean;
    brandName: string;
    cityRegion: string;
    status: string;
    isPaidFor: boolean;
    verificationStatus: string;
  }>>([]);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    industryId: '',
    categoryId: '',
    category: '',
    itemType: 'product',
    sku: '',
    upc: '',
    platformUniqueCode: '',
    totalAvailableQuantity: 0,
    priceInNaira: 0,
    discountPercentage: 0,
    upfrontPaymentPercentage: 0,
    platformChargePercentage: 0,
    startDate: '', 
    startTime: '',
    endDate: '', 
    endTime: '',
    visibilityToPublic: true,
    notes: '',
    locationIndex: -1,
    // Service-specific fields
    producer: '',
    totalAvailableServiceProviders: 1,
    hasSubServices: false,
    subServices: [],
    bookingAvailability: {
      daysAvailable: DAY_NAMES.map((_, index) => ({
        dayOfWeek: index,
        isAvailable: index >= 1 && index <= 5, // Monday-Friday by default
        timeWindows: [{ startTime: '09:00', endTime: '17:00' }]
      })),
      slotDurationMinutes: 60,
      concurrentProviders: 1,
      availabilityPeriod: {
        type: 'unlimited'
      },
      timezone: 'Africa/Lagos'
    }
  });
  
  const [images, setImages] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [mediaLimits, setMediaLimits] = useState<{
    images: { current: number; max: number; remaining: number };
    videos: { current: number; max: number; remaining: number };
    verified: boolean;
  } | null>(null);

  // Fetch industries on mount
  useEffect(() => {
    const fetchIndustries = async () => {
      if (!token) return;
      
      try {
        setLoadingIndustries(true);
        const result = await GalleryService.getIndustries(token);
        
        if (result.success && result.data?.industries) {
          const industriesList = result.data.industries.map(ind => ({
            value: ind.id,
            label: ind.name
          }));
          setIndustries(industriesList);
        } else {
          setIndustries([]);
        }
      } catch (error) {
        console.error('Error fetching industries:', error);
        setIndustries([]);
      } finally {
        setLoadingIndustries(false);
      }
    };

    fetchIndustries();
  }, [token]);

  // Load locations on mount
  useEffect(() => {
    const fetchLocations = async () => {
      if (!token) return;
      
      try {
        setLoadingLocations(true);
        console.log('Create Gallery: Fetching locations...');
        const locationsList = await GalleryService.getLocationsForSelect(token);
        console.log('Create Gallery: Locations fetched:', locationsList);
        setLocations(locationsList);
        
        if (locationsList.length === 0) {
          console.warn('Create Gallery: No locations available');
        } else {
          locationsList.forEach((loc, idx) => {
            console.log(`Create Gallery: Location ${idx} - Value: ${loc.value}, Disabled: ${loc.disabled}, Label: ${loc.label}`);
          });
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
        setLocations([]);
      } finally {
        setLoadingLocations(false);
      }
    };

    fetchLocations();
  }, [token]);


useEffect(() => {
  const fetchPlatformCodePreview = async () => {
    if (!token) return;
    
    try {
      setLoadingCodePreview(true);
      const result = await GalleryService.getPlatformCodePreview(token);
      
     
      if (result.success && result.data) {
        const previewData = result.data as PlatformCodePreview;
        setPlatformCodePreview(previewData);
        setFormData(prev => ({
          ...prev,
          platformUniqueCode: previewData.platformUniqueCode
        }));
      }
    } catch (error) {
      console.error('Error fetching platform code preview:', error);
    } finally {
      setLoadingCodePreview(false);
    }
  };

  fetchPlatformCodePreview();
}, [token]);
 
  useEffect(() => {
    const fetchCategories = async () => {
      if (!token || !formData.industryId) {
        setCategories([]);
        return;
      }
      
      try {
        setLoadingCategories(true);
        const result = await GalleryService.getCategoriesByIndustry(token, formData.industryId);
        
        if (result.success && result.data?.categories) {
          const transformedCategories = result.data.categories.map((cat: { id: any; name: any; }) => ({
            id: cat.id,
            name: cat.name
          }));
          setCategories(transformedCategories);
        } else {
          setCategories([]);
        }
        
        setFormData(prev => ({ 
          ...prev, 
          categoryId: '', 
          category: '',
          platformChargePercentage: 0,
          platformCommissionId: undefined 
        }));
        setPlatformCommission(null);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [token, formData.industryId]);

  // Fetch platform commission when category is selected - USING ADMIN ENDPOINT
useEffect(() => {
  const fetchPlatformCommission = async () => {
    if (!token || !formData.categoryId) {
      setPlatformCommission(null);
      setFormData(prev => ({ ...prev, platformChargePercentage: 0, platformCommissionId: undefined }));
      return;
    }
    
    try {
      setCommissionLoading(true);
      setCommissionError(null);
      
      // Use the admin endpoint instead of super-admin
      const result = await GalleryService.getCommissionByCategory(token, formData.categoryId);
      
      if (result.success && result.data?.commission) {
        const commission = result.data.commission;
        setPlatformCommission(commission);
        setFormData(prev => ({
          ...prev,
          platformChargePercentage: commission.commissionRate,
          platformCommissionId: commission.id
        }));
        setCommissionError(null); // Clear any previous error
      } else {
        // No commission found for this category
        setPlatformCommission(null);
        setFormData(prev => ({
          ...prev,
          platformChargePercentage: 0,
          platformCommissionId: undefined
        }));
        
        const errorMsg = result.message || 'No platform commission found for this category. Please contact Super Admin.';
        setCommissionError(errorMsg);
      }
    } catch (error) {
    
      setCommissionError('Failed to load commission rate');
    } finally {
      setCommissionLoading(false);
    }
  };

  fetchPlatformCommission();
}, [token, formData.categoryId]);

  const checkMediaLimits = async () => {
    if (!token) return false;
    
    try {
      const result = await GalleryService.getMediaUsage(token);
      
      if (result.success && result.data) {
        const data = result.data;
        const usage = {
          images: {
            current: data.currentImages,
            max: data.maxImages,
            remaining: data.maxImages - data.currentImages
          },
          videos: {
            current: data.currentVideos,
            max: data.maxVideos,
            remaining: data.maxVideos - data.currentVideos
          },
          verified: data.isVerified
        };
        
        setMediaLimits(usage);
        return usage;
      }
    } catch (error) {
      console.error('Error checking media limits:', error);
    }
    
    return false;
  };



  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.industryId) {
      newErrors.industryId = 'Industry is required';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    if (!formData.itemType) {
      newErrors.itemType = 'Item type is required';
    }

    // Remove producer validation for services
    if (formData.itemType === 'service') {
      // Producer field removed - no validation needed
      if (formData.totalAvailableServiceProviders < 1) {
        newErrors.totalAvailableServiceProviders = 'At least 1 service provider is required';
      }
      if (formData.hasSubServices && formData.subServices.length === 0) {
        newErrors.subServices = 'At least one sub-service is required';
      }
     
      if (formData.hasSubServices && formData.subServices.length < 2) {
        newErrors.subServices = 'At least 2 sub-services are required when sub-services are enabled';
      }
      if (formData.hasSubServices && formData.subServices.length > 100) {
        newErrors.subServices = 'Maximum 100 sub-services allowed';
      }
   
      formData.subServices.forEach((sub, idx) => {
        if (!sub.name.trim()) {
          newErrors[`subService_${idx}_name`] = `Sub-service ${idx + 1} name is required`;
        }
        if (sub.price <= 0) {
          newErrors[`subService_${idx}_price`] = `Sub-service ${idx + 1} price must be greater than 0`;
        }
      });
      
      
      if (formData.bookingAvailability.availabilityPeriod.type === 'dateRange') {
        if (!formData.startDate) {
          newErrors.startDate = 'Start date is required for date range availability';
        }
        if (!formData.endDate) {
          newErrors.endDate = 'End date is required for date range availability';
        }
      }
    }

    if (formData.priceInNaira <= 0) {
      newErrors.priceInNaira = 'Price must be greater than 0';
    }

    if (formData.discountPercentage < 0 || formData.discountPercentage > 100) {
      newErrors.discountPercentage = 'Discount must be between 0 and 100';
    }

    if (formData.upfrontPaymentPercentage < 0 || formData.upfrontPaymentPercentage > 100) {
      newErrors.upfrontPaymentPercentage = 'Upfront payment must be between 0 and 100';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  
  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
    
  //   if (!validateForm()) return;
    
  //   if (!token) {
  //     setErrors({ general: 'Authentication required' });
  //     return;
  //   }

   
  //   const limits = await checkMediaLimits();
  //   if (limits && images.length > limits.images.remaining) {
  //     setErrors({ images: `You only have ${limits.images.remaining} image slots available` });
  //     return;
  //   }
  //   if (limits && videos.length > limits.videos.remaining) {
  //     setErrors({ videos: `You only have ${limits.videos.remaining} video slots available` });
  //     return;
  //   }

  //   setLoading(true);
  //   setErrors({});

  //   try {
  //     console.log('Create page: Creating gallery item with data:', formData);
      
  
  //     const selectedCategory = categories.find(c => c.id === formData.categoryId);
      
  //     const galleryData: any = {
  //       name: formData.name,
  //       description: formData.description.trim(),
  //       category: selectedCategory?.name || formData.category,
  //       categoryId: formData.categoryId,
  //       industryId: formData.industryId,
  //       itemType: formData.itemType,
  //       sku: formData.itemType === 'product' ? (formData.sku || undefined) : undefined,
  //       upc: formData.itemType === 'product' ? (formData.upc || undefined) : undefined,
  //       platformUniqueCode: formData.platformUniqueCode || undefined,
  //       totalAvailableQuantity: Number(formData.totalAvailableQuantity) || 0,
  //       priceInDollars: Number(formData.priceInNaira) || 0,
  //       discountPercentage: Number(formData.discountPercentage) || 0,
  //       upfrontPaymentPercentage: Number(formData.upfrontPaymentPercentage) || 0,
  //       platformChargePercentage: formData.platformChargePercentage,
  //       startDate: formData.startDate,
  //       startTime: formData.startTime,
  //       endDate: formData.endDate,
  //       endTime: formData.endTime,
  //       visibilityToPublic: formData.visibilityToPublic,
  //       notes: formData.notes || undefined,
  //       locationIndex: formData.locationIndex >= 0 ? Number(formData.locationIndex) : 0
  //     };

  
  //     if (formData.itemType === 'service') {
  //       // Producer field removed - not included in submission
  //       galleryData.totalAvailableServiceProviders = Number(formData.totalAvailableServiceProviders);
  //       galleryData.hasSubServices = formData.hasSubServices;
        
  //       if (formData.hasSubServices && formData.subServices.length > 0) {
  //         galleryData.subServiceCount = formData.subServices.length;
  //         galleryData.subServices = formData.subServices.map(sub => ({
  //           name: sub.name,
  //           description: sub.description,
  //           price: Number(sub.price)
  //         }));
  //       }

  //       // Add availability for services (simple date range)
  //       galleryData.availability = {
  //         type: formData.bookingAvailability.availabilityPeriod.type === 'dateRange' ? 'dateRange' : 'unlimited',
  //         startDate: formData.startDate,
  //         startTime: formData.startTime || '00:00',
  //         endDate: formData.endDate,
  //         endTime: formData.endTime || '23:59'
  //       };

  //       // Add booking availability for services (detailed booking config)
  //       galleryData.bookingAvailability = {
  //         daysAvailable: formData.bookingAvailability.daysAvailable,
  //         slotDurationMinutes: Number(formData.bookingAvailability.slotDurationMinutes),
  //         concurrentProviders: Number(formData.bookingAvailability.concurrentProviders),
  //         availabilityPeriod: {
  //           type: formData.bookingAvailability.availabilityPeriod.type,
            
  //           ...(formData.bookingAvailability.availabilityPeriod.type === 'dateRange' && {
  //             startDate: formData.startDate,
  //             endDate: formData.endDate
  //           }),
            
  //           ...(formData.bookingAvailability.availabilityPeriod.type === 'rollingWeeks' && {
  //             weeksAhead: formData.bookingAvailability.availabilityPeriod.weeksAhead || 6
  //           })
  //         },
  //         timezone: formData.bookingAvailability.timezone
  //       };
        
  //       console.log('Service-specific data being sent:', {
  //         totalAvailableServiceProviders: galleryData.totalAvailableServiceProviders,
  //         hasSubServices: galleryData.hasSubServices,
  //         subServices: galleryData.subServices,
  //         availability: galleryData.availability,
  //         bookingAvailability: galleryData.bookingAvailability
  //       });
  //     }
      
  //     const result = await GalleryService.createGalleryItem(token, galleryData);

  //     if (result.success && result.data?.galleryItem?._id) {
  //       const galleryItemId = result.data.galleryItem._id;
        
      
  //       if (images.length > 0) {
  //         console.log('Create page: Uploading', images.length, 'images');
  //         for (let i = 0; i < images.length; i++) {
         
  //           const isMainImage = i === 0;
  //           console.log(`Create page: Uploading image ${i + 1}/${images.length}, isMain: ${isMainImage}`);
  //           const uploadResult = await GalleryService.uploadImage(token, galleryItemId, images[i], isMainImage);
  //           if (!uploadResult.success) {
  //             console.error(`Failed to upload image ${i + 1}:`, uploadResult.message);
  //           }
  //         }
  //       }

       
  //       if (videos.length > 0) {
  //         console.log('Create page: Uploading', videos.length, 'videos');
  //         for (let i = 0; i < videos.length; i++) {
  //           console.log(`Create page: Uploading video ${i + 1}/${videos.length}`);
  //           const uploadResult = await GalleryService.uploadVideo(token, galleryItemId, videos[i]);
  //           if (!uploadResult.success) {
  //             console.error(`Failed to upload video ${i + 1}:`, uploadResult.message);
  //           }
  //         }
  //       }

  //       setSuccess(true);
  //       setTimeout(() => {
  //         router.push('/admin/gallery');
  //       }, 2000);
  //     } else {
  //       setErrors({ general: result.message || 'Failed to create gallery item' });
  //     }
  //   } catch (error: any) {
  //     console.error('Error creating gallery item:', error);
  //     setErrors({ general: error.message || 'An unexpected error occurred' });
  //   } finally {
  //     setLoading(false);
  //   }
  // };



  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // 1. Basic validation
  if (!validateForm()) return;

  if (!token) {
    setErrors({ general: 'Authentication required' });
    return;
  }

  // 2. 🔥 Show loading IMMEDIATELY – button becomes disabled & spinner appears
  setLoading(true);
  setErrors({});

  try {
    // 3. Check media limits (still async, but user sees feedback now)
    const limits = await checkMediaLimits();
    if (limits && images.length > limits.images.remaining) {
      setErrors({ images: `You only have ${limits.images.remaining} image slots available` });
      setLoading(false);
      return;
    }
    if (limits && videos.length > limits.videos.remaining) {
      setErrors({ videos: `You only have ${limits.videos.remaining} video slots available` });
      setLoading(false);
      return;
    }

    // 4. Prepare gallery data
    const selectedCategory = categories.find(c => c.id === formData.categoryId);

    const galleryData: any = {
      name: formData.name,
      description: formData.description.trim(),
      category: selectedCategory?.name || formData.category,
      categoryId: formData.categoryId,
      industryId: formData.industryId,
      itemType: formData.itemType,
      sku: formData.itemType === 'product' ? (formData.sku || undefined) : undefined,
      upc: formData.itemType === 'product' ? (formData.upc || undefined) : undefined,
      platformUniqueCode: formData.platformUniqueCode || undefined,
      totalAvailableQuantity: Number(formData.totalAvailableQuantity) || 0,
      priceInDollars: Number(formData.priceInNaira) || 0,
      discountPercentage: Number(formData.discountPercentage) || 0,
      upfrontPaymentPercentage: Number(formData.upfrontPaymentPercentage) || 0,
      platformChargePercentage: formData.platformChargePercentage,
      startDate: formData.startDate,
      startTime: formData.startTime,
      endDate: formData.endDate,
      endTime: formData.endTime,
      visibilityToPublic: formData.visibilityToPublic,
      notes: formData.notes || undefined,
      locationIndex: formData.locationIndex >= 0 ? Number(formData.locationIndex) : 0
    };

    // 5. Add service‑specific fields if needed
    if (formData.itemType === 'service') {
      galleryData.totalAvailableServiceProviders = Number(formData.totalAvailableServiceProviders);
      galleryData.hasSubServices = formData.hasSubServices;

      if (formData.hasSubServices && formData.subServices.length > 0) {
        galleryData.subServiceCount = formData.subServices.length;
        galleryData.subServices = formData.subServices.map(sub => ({
          name: sub.name,
          description: sub.description,
          price: Number(sub.price),
          ...(sub.uploadPicture && !sub.previewUrl && { uploadPicture: sub.uploadPicture })
        }));
      }

      galleryData.availability = {
        type: formData.bookingAvailability.availabilityPeriod.type === 'dateRange' ? 'dateRange' : 'unlimited',
        startDate: formData.startDate,
        startTime: formData.startTime || '00:00',
        endDate: formData.endDate,
        endTime: formData.endTime || '23:59'
      };

      galleryData.bookingAvailability = {
        daysAvailable: formData.bookingAvailability.daysAvailable,
        slotDurationMinutes: Number(formData.bookingAvailability.slotDurationMinutes),
        concurrentProviders: Number(formData.bookingAvailability.concurrentProviders),
        availabilityPeriod: {
          type: formData.bookingAvailability.availabilityPeriod.type,
          ...(formData.bookingAvailability.availabilityPeriod.type === 'dateRange' && {
            startDate: formData.startDate,
            endDate: formData.endDate
          }),
          ...(formData.bookingAvailability.availabilityPeriod.type === 'rollingWeeks' && {
            weeksAhead: formData.bookingAvailability.availabilityPeriod.weeksAhead || 6
          })
        },
        timezone: formData.bookingAvailability.timezone
      };
    }

    // 6. Create gallery item
    const result = await GalleryService.createGalleryItem(token, galleryData);

    if (result.success && result.data?.galleryItem?._id) {
      const galleryItemId = result.data.galleryItem._id;

      // Upload images
      if (images.length > 0) {
        console.log('Uploading', images.length, 'images');
        for (let i = 0; i < images.length; i++) {
          const isMainImage = i === 0;
          await GalleryService.uploadImage(token, galleryItemId, images[i], isMainImage);
        }
      }

      // Upload videos
      if (videos.length > 0) {
        console.log('Uploading', videos.length, 'videos');
        for (let i = 0; i < videos.length; i++) {
          await GalleryService.uploadVideo(token, galleryItemId, videos[i]);
        }
      }

      // Upload sub-service images and patch sub-services with returned URLs
      if (formData.hasSubServices && formData.subServices.some(s => s.file)) {
        const updatedSubServices = [...formData.subServices];
        for (let i = 0; i < updatedSubServices.length; i++) {
          const sub = updatedSubServices[i];
          if (sub.file) {
            const uploadResult = await GalleryService.uploadImage(token, galleryItemId, sub.file, false);
            if (uploadResult.success && uploadResult.data?.imageUrl) {
              updatedSubServices[i] = { ...sub, uploadPicture: uploadResult.data.imageUrl, file: undefined, previewUrl: undefined };
            }
          }
        }
        // Patch the gallery item with sub-service image URLs
        const BASE = BASE_URL;
        await fetch(`${BASE}/api/admin/gallery/${galleryItemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            subServices: updatedSubServices.map(s => ({
              name: s.name,
              description: s.description,
              price: Number(s.price),
              ...(s.uploadPicture && { uploadPicture: s.uploadPicture })
            }))
          })
        });
      }

      // Success
      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/gallery');
      }, 2000);
    } else {
      setErrors({ general: result.message || 'Failed to create gallery item' });
      setLoading(false);
    }
  } catch (error: any) {
    console.error('Error creating gallery item:', error);
    setErrors({ general: error.message || 'An unexpected error occurred' });
    setLoading(false);
  }
};
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const limits = await checkMediaLimits();
      if (limits && images.length + e.target.files.length > limits.images.remaining) {
        setErrors({ images: `You can only upload ${limits.images.remaining} more image(s)` });
        return;
      }

      const files = Array.from(e.target.files);
      const validFiles: File[] = [];
      const errorMessages: string[] = [];

      files.forEach(file => {
        const validation = GalleryService.validateImageFile(file);
        if (validation.valid) {
          validFiles.push(file);
        } else {
          errorMessages.push(`${file.name}: ${validation.message || 'Invalid image file'}`);
        }
      });

      if (errorMessages.length > 0) {
        setErrors({ images: errorMessages.join(', ') });
      }

      setImages(prev => [...prev, ...validFiles]);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const limits = await checkMediaLimits();
      if (limits && videos.length + e.target.files.length > limits.videos.remaining) {
        setErrors({ videos: `You can only upload ${limits.videos.remaining} more video(s)` });
        return;
      }

      const files = Array.from(e.target.files);
      const validFiles: File[] = [];
      const errorMessages: string[] = [];

      files.forEach(file => {
        const validation = GalleryService.validateVideoFile(file);
        if (validation.valid) {
          validFiles.push(file);
        } else {
          errorMessages.push(`${file.name}: ${validation.message || 'Invalid video file'}`);
        }
      });

      if (errorMessages.length > 0) {
        setErrors({ videos: errorMessages.join(', ') });
      }

      setVideos(prev => [...prev, ...validFiles]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
  };

  const calculateActualAmount = () => {
    return GalleryService.calculateActualAmount(
      formData.priceInNaira,
      formData.discountPercentage,
      formData.platformChargePercentage
    );
  };

  const calculateTotalWithUpfront = () => {
    const actual = calculateActualAmount();
    const upfront = (actual * (formData.upfrontPaymentPercentage || 0)) / 100;
    return {
      actual,
      upfront,
      remaining: actual - upfront
    };
  };

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Success!</h2>
          <p className="text-gray-600">Gallery item created successfully.</p>
          <p className="text-gray-500 text-sm mt-2">Redirecting to gallery...</p>
        </div>
      </div>
    );
  }

  const totalCalculation = calculateTotalWithUpfront();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Create Gallery Item</h1>
        </div>

        {errors.general && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {errors.general}
          </div>
        )}

        {/* Platform Code Preview - Read Only */}
        {platformCodePreview && (
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-start gap-3">
             
              <div className="flex-1">
                <label className="block text-sm font-medium text-purple-800 mb-1">
                  Platform Unique Code  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={platformCodePreview.platformUniqueCode}
                  readOnly
                  className="w-full px-3 py-2 bg-purple-100 border border-purple-300 rounded-lg text-purple-800 font-mono text-sm cursor-not-allowed"
                />
               
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          {/* Name Field */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Product/service name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Industry and Category Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.industryId}
                onChange={(e) => setFormData(prev => ({ ...prev, industryId: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.industryId ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loadingIndustries}
              >
                <option value="">
                  {loadingIndustries ? 'Loading industries...' : 'Select an industry'}
                </option>
                {industries.map((industry) => (
                  <option key={industry.value} value={industry.value}>
                    {industry.label}
                  </option>
                ))}
              </select>
              {errors.industryId && (
                <p className="mt-1 text-sm text-red-600">{errors.industryId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => {
                  const categoryId = e.target.value;
                  const selectedCategory = categories.find(c => c.id === categoryId);
                  setFormData(prev => ({
                    ...prev,
                    categoryId,
                    category: selectedCategory?.name || ''
                  }));
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.categoryId ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={!formData.industryId || loadingCategories}
              >
                <option value="">
                  {!formData.industryId
                    ? 'Select an industry first'
                    : loadingCategories
                    ? 'Loading categories...'
                    : 'Select a category'}
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>
              )}
            </div>
          </div>

          {/* Location Selection - Optional */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location <span className="text-gray-500">(Optional)</span>
            </label>
            <select
              value={formData.locationIndex}
              onChange={(e) => {
                const selectedValue = e.target.value;
                
                const locationIdx = selectedValue === '' ? -1 : parseInt(selectedValue);
          
                setFormData(prev => ({ ...prev, locationIndex: locationIdx }));
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.locationIndex ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loadingLocations}
            >
              <option value={-1}>No location selected</option>
              {locations.map((location) => (
                <option 
                  key={location.value} 
                  value={location.value}
                  disabled={location.disabled}
                >
                  {location.label}
                  {location.disabled && ' - Disabled (Payment Required)'}
                </option>
              ))}
            </select>
            {locations.length > 0 && locations.every(loc => loc.disabled) && (
              <p className="mt-1 text-sm text-amber-600">
                All locations require payment. Please complete payment to enable location selection.
              </p>
            )}
            {errors.locationIndex && (
              <p className="mt-1 text-sm text-red-600">{errors.locationIndex}</p>
            )}
          </div>
         
          {/* Item Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, itemType: 'product' }));
                  // Clear service-specific fields when switching to product
                  setFormData(prev => ({
                    ...prev,
                    producer: '',
                    totalAvailableServiceProviders: 1,
                    hasSubServices: false,
                    subServices: []
                  }));
                }}
                className={`flex items-center justify-center gap-2 p-3 border rounded-lg transition-colors ${
                  formData.itemType === 'product'
                    ? 'bg-purple-50 border-purple-500 text-purple-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Package className="w-5 h-5" />
                Product
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, itemType: 'service' }));
                  // Clear product-specific fields when switching to service
                  setFormData(prev => ({
                    ...prev,
                    sku: '',
                    upc: ''
                  }));
                }}
                className={`flex items-center justify-center gap-2 p-3 border rounded-lg transition-colors ${
                  formData.itemType === 'service'
                    ? 'bg-purple-50 border-purple-500 text-purple-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Briefcase className="w-5 h-5" />
                Service
              </button>
            </div>
            {errors.itemType && (
              <p className="mt-1 text-sm text-red-600">{errors.itemType}</p>
            )}
          </div>

          {/* SKU and UPC - Only show for products */}
          {formData.itemType === 'product' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Stock Keeping Unit"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  UPC
                </label>
                <input
                  type="text"
                  value={formData.upc}
                  onChange={(e) => setFormData(prev => ({ ...prev, upc: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Universal Product Code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  value={formData.totalAvailableQuantity || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalAvailableQuantity: e.target.value ? Number(e.target.value) : 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>
          )}

          {/* Service Provider Fields - Total Service Providers only (Producer removed) */}
          {formData.itemType === 'service' && (
            <ServiceFields 
              formData={formData} 
              setFormData={setFormData} 
              errors={errors} 
            />
          )}

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              rows={3}
              placeholder="Product/service description"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Identification Fields - Only for products (SKU, UPC, Quantity already moved) */}
          {/* Pricing Information - NGN Currency */}
          <PricingSection 
            formData={formData} 
            setFormData={setFormData} 
            errors={errors} 
            commissionLoading={commissionLoading} 
            commissionError={commissionError} 
            platformCommission={platformCommission} 
            calculateActualAmount={calculateActualAmount} 
            calculateTotalWithUpfront={calculateTotalWithUpfront} 
            formatNaira={formatNaira} 
          />

          {/* Date and Time - Empty by default */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.startDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.endDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Additional Options */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="visibility"
                checked={formData.visibilityToPublic}
                onChange={(e) => setFormData(prev => ({ ...prev, visibilityToPublic: e.target.checked }))}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="visibility" className="ml-2 block text-sm text-gray-700">
                Visible to Public
              </label>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={2}
              placeholder="Additional notes..."
            />
          </div>

          {/* Media Upload */}
          <MediaUpload 
            images={images} 
            videos={videos} 
            handleImageUpload={handleImageUpload} 
            handleVideoUpload={handleVideoUpload} 
            removeImage={removeImage} 
            removeVideo={removeVideo} 
            errors={errors} 
            mediaLimits={mediaLimits} 
          />

      
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={loading || !formData.industryId || !formData.categoryId} 
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {loading ? 'Creating...' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGalleryItemPage;
