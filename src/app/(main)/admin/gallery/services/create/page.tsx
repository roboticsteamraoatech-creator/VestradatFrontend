"use client";

import { useState, useEffect } from "react";
import { 
  Service, 
  SubService,
  SUB_SERVICE_COUNT_OPTIONS, 
  INITIAL_SERVICE,
  INITIAL_SUB_SERVICE,
  ApiCategory,
  ApiIndustry,
  ApiLocation,
  validateFile
} from "@/types/sub-service";
import { SubServiceForm } from "@/app/components/sub-service";
import { GalleryService } from "@/services/gallery-sub-service";
import { MessageModal } from "@/app/components/MessageModal";
import Image from "next/image";
import { useRouter } from "next/navigation";

const Input = ({ label, value, onChange, error, type = "text", placeholder, ...props }: any) => (
  <div className="space-y-1">
    {label && <label className="text-sm font-medium text-gray-600">{label}</label>}
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#5d2a8b] focus:border-transparent ${
        error ? 'border-red-500' : 'border-gray-300'
      }`}
      placeholder={placeholder}
      {...props}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

const Select = ({ label, value, onChange, error, options, ...props }: any) => (
  <div className="space-y-1">
    {label && <label className="text-sm font-medium text-gray-600">{label}</label>}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#5d2a8b] focus:border-transparent ${
        error ? 'border-red-500' : 'border-gray-300'
      }`}
      {...props}
    >
      <option value="">Select an option</option>
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

const Checkbox = ({ label, checked, onChange, error, ...props }: any) => (
  <div className="flex items-center space-x-2">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 text-[#5d2a8b] focus:ring-[#5d2a8b] border-gray-300 rounded"
      {...props}
    />
    <label className="text-sm text-gray-700">{label}</label>
    {error && <p className="text-red-500 text-xs ml-2">{error}</p>}
  </div>
);

const RadioGroup = ({ options, value, onChange, name }: any) => (
  <div className="flex space-x-4">
    {options.map((option: any) => (
      <label key={option.value} className="flex items-center space-x-2">
        <input
          type="radio"
          name={name}
          value={option.value}
          checked={value === option.value}
          onChange={(e) => onChange(e.target.value)}
          className="w-4 h-4 text-[#5d2a8b] focus:ring-[#5d2a8b] border-gray-300"
        />
        <span className="text-sm text-gray-700">{option.label}</span>
      </label>
    ))}
  </div>
);

const FileInput = ({ label, value, onChange, error, accept, preview, onRemove, ...props }: any) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (typeof value === 'string') {
      setPreviewUrl(value);
    } else {
      setPreviewUrl(null);
    }
  }, [value]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onChange(file);
  };

  return (
    <div className="space-y-3">
      {label && <label className="text-sm font-medium text-gray-600">{label}</label>}
      
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5d2a8b]"
            {...props}
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
        
        {preview && previewUrl && (
          <div className="relative w-20 h-20 border rounded-md overflow-hidden flex-shrink-0">
            <Image 
              src={previewUrl} 
              alt="Preview" 
              fill 
              className="object-cover"
              sizes="80px"
            />
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
              >
                ×
              </button>
            )}
          </div>
        )}
      </div>
      
      {value instanceof File && (
        <p className="text-xs text-green-600">Selected: {value.name}</p>
      )}
    </div>
  );
};

export default function ServiceSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"basic" | "subservices">("basic");
  const [service, setService] = useState<Service>(INITIAL_SERVICE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLocationMessage, setShowLocationMessage] = useState(false);
  
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error'
  });
  
  const [industries, setIndustries] = useState<ApiIndustry[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [locations, setLocations] = useState<ApiLocation[]>([]);
  
  const getToken = (): string | null => {
    return localStorage.getItem('userToken') || sessionStorage.getItem('userToken');
  };

  useEffect(() => {
    fetchIndustries();
    fetchCategories();
    fetchLocations();
  }, []);

  const fetchIndustries = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const result = await GalleryService.getIndustries(token);
      if (result.success && result.data) {
        setIndustries(result.data);
      }
    } catch (error) {
      console.error('Error fetching industries:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const result = await GalleryService.getCategories(token);
      if (result.success && result.data) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const result = await GalleryService.getLocations(token);
      if (result.success && result.data) {
        setLocations(result.data);
      } else if (result.message) {
        // Show message if no locations found
        setModal({
          isOpen: true,
          title: 'No Locations Found',
          message: result.message,
          type: 'warning'
        });
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const handleServiceChange = (field: keyof Service, value: any) => {
    setService(prev => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  };

  const handleSubServiceChange = (index: number, field: keyof SubService, value: any) => {
    const updatedSubServices = [...service.subServices];
    updatedSubServices[index] = { ...updatedSubServices[index], [field]: value };
    setService(prev => ({ ...prev, subServices: updatedSubServices }));
    
    const errorKey = `subServices.${index}.${field}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const handleSubServiceCountChange = (count: number) => {
    const countNum = Number(count);
    setService(prev => ({ ...prev, subServiceCount: countNum }));
    
    const currentCount = service.subServices.length;
    let updatedSubServices = [...service.subServices];
    
    if (countNum > currentCount) {
      for (let i = currentCount; i < countNum; i++) {
        updatedSubServices.push({
          ...INITIAL_SUB_SERVICE,
          id: `sub-${i}`,
        });
      }
    } else if (countNum < currentCount) {
      updatedSubServices = updatedSubServices.slice(0, countNum);
    }
    
    setService(prev => ({ ...prev, subServices: updatedSubServices }));
  };

  const removeSubService = (index: number) => {
    const updatedSubServices = service.subServices.filter((_, i) => i !== index);
    setService(prev => ({ 
      ...prev, 
      subServices: updatedSubServices,
      subServiceCount: updatedSubServices.length 
    }));
  };

  const removeMainImage = () => {
    handleServiceChange('image', null);
  };

  const validateBasicInfo = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!service.name) newErrors.name = "Service name is required";
    if (!service.description) newErrors.description = "Description is required";
    if (!service.categoryId) newErrors.categoryId = "Category is required";
    if (service.locationIndex === undefined || service.locationIndex === null) {
      newErrors.locationIndex = "Location is required";
    }
    if (!service.actualAmount) newErrors.actualAmount = "Price is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSubServices = (): boolean => {
    const newErrors: Record<string, string> = {};

    service.subServices.forEach((sub, index) => {
      if (!sub.name) newErrors[`subServices.${index}.name`] = "Sub-service name is required";
      if (!sub.description) newErrors[`subServices.${index}.description`] = "Description is required";
      if (!sub.price) newErrors[`subServices.${index}.price`] = "Price is required";
      
      const price = parseFloat(sub.price);
      if (isNaN(price) || price <= 0) {
        newErrors[`subServices.${index}.price`] = "Price must be a positive number";
      }
    });

    if (service.image) {
      const validation = validateFile(service.image, 'image');
      if (!validation.valid) {
        newErrors.image = validation.message || 'Invalid image file';
      }
    }

    service.subServices.forEach((sub, index) => {
      if (sub.picture) {
        const validation = validateFile(sub.picture, 'image');
        if (!validation.valid) {
          newErrors[`subServices.${index}.picture`] = validation.message || 'Invalid image file';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isValid = step === "basic" ? validateBasicInfo() : validateSubServices();
    
    if (isValid) {
      if (step === "basic") {
        setStep("subservices");
      } else {
        setIsSubmitting(true);
        try {
          const token = getToken();
          
          if (!token) {
            setModal({
              isOpen: true,
              title: 'Authentication Error',
              message: 'Authentication token not found. Please log in again.',
              type: 'error'
            });
            setIsSubmitting(false);
            return;
          }

          const result = await GalleryService.createService(token, service);
          
          if (result.success && result.data) {
            const createdItemId = result.data._id;
            let uploadSuccess = true;
            let uploadMessages: string[] = [];
            
            if (service.image) {
              const imageResult = await GalleryService.uploadImage(token, createdItemId, service.image);
              if (!imageResult.success) {
                uploadSuccess = false;
                uploadMessages.push(`Main image: ${imageResult.message}`);
              } else {
                uploadMessages.push('Main image uploaded successfully');
              }
            }
            
            const subServicesWithImages = service.subServices.filter(sub => sub.picture);
            for (let i = 0; i < subServicesWithImages.length; i++) {
              const sub = subServicesWithImages[i];
              if (sub.picture) {
                uploadMessages.push(`Sub-service ${i + 1} image ready for upload`);
              }
            }
            
            if (uploadSuccess) {
              setModal({
                isOpen: true,
                title: 'Success',
                message: 'Service created successfully!',
                type: 'success'
              });
            } else {
              setModal({
                isOpen: true,
                title: 'Partial Success',
                message: `Service created but some uploads failed:\n${uploadMessages.join('\n')}`,
                type: 'warning'
              });
            }
            
            setTimeout(() => {
              router.push('/admin/gallery/services');
            }, 2000);
            
          } else {
            setModal({
              isOpen: true,
              title: 'Error',
              message: `Failed to create service: ${result.message || 'Unknown error'}`,
              type: 'error'
            });
          }
        } catch (error) {
          console.error('Error submitting service:', error);
          setModal({
            isOpen: true,
            title: 'Error',
            message: 'An error occurred while submitting the service',
            type: 'error'
          });
        } finally {
          setIsSubmitting(false);
        }
      }
    } else {
      setModal({
        isOpen: true,
        title: 'Validation Error',
        message: 'Please fix the errors before proceeding',
        type: 'warning'
      });
    }
  };

  const handleBack = () => {
    router.push('/admin/gallery/services');
  };

  const locationOptions = locations.map(loc => ({
    value: loc.locationIndex,
    label: `${loc.brandName} - ${loc.cityRegion}, ${loc.city}, ${loc.state} (${loc.status})`
  }));

  return (
    <div className="pt-8 p-4 md:p-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Services</span>
          </button>
        </div>

        <h1 className="text-2xl font-bold text-[#5d2a8b] mb-2">Service Setup</h1>
        <p className="text-gray-600 mb-8">Configure your service and its sub-services</p>

        <div className="flex items-center mb-8">
          <div className={`flex items-center ${step === "basic" ? "text-[#5d2a8b]" : "text-gray-400"}`}>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === "basic" ? "bg-[#5d2a8b] text-white" : "bg-gray-200 text-gray-600"
            }`}>1</span>
            <span className="ml-2 font-medium">Basic Info</span>
          </div>
          <div className={`w-16 h-0.5 mx-4 ${step === "subservices" ? "bg-[#5d2a8b]" : "bg-gray-300"}`}></div>
          <div className={`flex items-center ${step === "subservices" ? "text-[#5d2a8b]" : "text-gray-400"}`}>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === "subservices" ? "bg-[#5d2a8b] text-white" : "bg-gray-200 text-gray-600"
            }`}>2</span>
            <span className="ml-2 font-medium">Sub-services</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {step === "basic" && (
            <>
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 pb-2 border-b-2 border-gray-200">
                  Basic Service Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Service Name *"
                    value={service.name}
                    onChange={(v: string) => handleServiceChange("name", v)}
                    error={errors.name}
                    placeholder="Enter service name"
                  />
                  
                  <Input
                    label="Description *"
                    value={service.description}
                    onChange={(v: string) => handleServiceChange("description", v)}
                    error={errors.description}
                    placeholder="Enter description"
                  />
                  
                  <Select
                    label="Category *"
                    value={service.categoryId || ''}
                    onChange={(v: string) => {
                      handleServiceChange("categoryId", v);
                      const selectedCat = categories.find(c => c.id === v);
                      if (selectedCat) {
                        handleServiceChange("category", selectedCat.name);
                      }
                    }}
                    error={errors.categoryId}
                    options={categories.map(c => ({ value: c.id, label: c.name }))}
                  />
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-600">Location *</label>
                    <select
                      value={service.locationIndex ?? ''}
                      onChange={(e) => handleServiceChange("locationIndex", parseInt(e.target.value))}
                      onClick={() => {
                        if (locations.length === 0) {
                          setShowLocationMessage(true);
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#5d2a8b] focus:border-transparent ${
                        errors.locationIndex ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select a location</option>
                      {locations.map(loc => (
                        <option key={loc.locationIndex} value={loc.locationIndex}>
                          {loc.brandName} - {loc.cityRegion}, {loc.city}, {loc.state} ({loc.status})
                        </option>
                      ))}
                    </select>
                    {errors.locationIndex && <p className="text-red-500 text-xs mt-1">{errors.locationIndex}</p>}
                    {showLocationMessage && locations.length === 0 && (
                      <p className="text-yellow-600 text-xs mt-1">
                        No locations found. Add locations first to create gallery items.
                      </p>
                    )}
                  </div>
                  
                  <Input
                    label="SKU"
                    value={service.sku || ''}
                    onChange={(v: string) => handleServiceChange("sku", v)}
                    error={errors.sku}
                    placeholder="Enter SKU"
                  />
                  
                  <Input
                    label="UPC"
                    value={service.upc || ''}
                    onChange={(v: string) => handleServiceChange("upc", v)}
                    error={errors.upc}
                    placeholder="Enter UPC code"
                  />
                  
                  <Input
                    label="Producer"
                    value={service.producer || ''}
                    onChange={(v: string) => handleServiceChange("producer", v)}
                    error={errors.producer}
                    placeholder="Enter producer name"
                  />
                  
                  <Input
                    label="Total Available Service Providers *"
                    value={service.totalProviders || ''}
                    onChange={(v: string) => handleServiceChange("totalProviders", v)}
                    error={errors.totalProviders}
                    type="number"
                    placeholder="Enter number"
                  />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 pb-2 border-b-2 border-gray-200">
                  Pricing Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Price (Actual Amount) *"
                    value={service.actualAmount}
                    onChange={(v: string) => handleServiceChange("actualAmount", v)}
                    error={errors.actualAmount}
                    type="number"
                    placeholder="0.00"
                  />
                  
                  <Input
                    label="Discount Percentage"
                    value={service.discount}
                    onChange={(v: string) => handleServiceChange("discount", v)}
                    error={errors.discount}
                    type="number"
                    placeholder="0"
                  />
                  
                  <Input
                    label="Platform Charge Percentage"
                    value={service.platformCharge}
                    onChange={(v: string) => handleServiceChange("platformCharge", v)}
                    error={errors.platformCharge}
                    type="number"
                    placeholder="0"
                  />
                  
                  <Input
                    label="Payment Methods"
                    value={service.paymentMethods || ''}
                    onChange={(v: string) => handleServiceChange("paymentMethods", v)}
                    error={errors.paymentMethods}
                    placeholder="e.g., Card, Cash, Transfer"
                  />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 pb-2 border-b-2 border-gray-200">
                  Visibility & Availability
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <Input
                    label="Start Date"
                    value={service.visibilityPeriod.startDate}
                    onChange={(v: string) => handleServiceChange("visibilityPeriod", { 
                      ...service.visibilityPeriod, 
                      startDate: v 
                    })}
                    error={errors["visibilityPeriod.startDate"]}
                    type="date"
                  />
                  <Input
                    label="Start Time"
                    value={service.timeSlot.startTime}
                    onChange={(v: string) => handleServiceChange("timeSlot", { 
                      ...service.timeSlot, 
                      startTime: v 
                    })}
                    error={errors["timeSlot.startTime"]}
                    type="time"
                  />
                  <Input
                    label="End Date"
                    value={service.visibilityPeriod.endDate}
                    onChange={(v: string) => handleServiceChange("visibilityPeriod", { 
                      ...service.visibilityPeriod, 
                      endDate: v 
                    })}
                    error={errors["visibilityPeriod.endDate"]}
                    type="date"
                  />
                  <Input
                    label="End Time"
                    value={service.timeSlot.endTime}
                    onChange={(v: string) => handleServiceChange("timeSlot", { 
                      ...service.timeSlot, 
                      endTime: v 
                    })}
                    error={errors["timeSlot.endTime"]}
                    type="time"
                  />
                </div>

                <div className="mb-4">
                  <Checkbox
                    label="Upfront Payment Required"
                    checked={service.upfrontPayment}
                    onChange={(v: boolean) => handleServiceChange("upfrontPayment", v)}
                    error={errors.upfrontPayment}
                  />
                </div>

                <div className="mb-4">
                  <Checkbox
                    label="Visible to Public"
                    checked={service.visibilityToPublic ?? true}
                    onChange={(v: boolean) => handleServiceChange("visibilityToPublic", v)}
                    error={errors.visibilityToPublic}
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-medium text-gray-600">Availability Type</label>
                  <RadioGroup
                    options={[
                      { value: "unlimited", label: "Unlimited" },
                      { value: "period", label: "Specific Period" }
                    ]}
                    value={service.availabilityType}
                    onChange={(v: "unlimited" | "period") => handleServiceChange("availabilityType", v)}
                    name="availabilityType"
                  />
                </div>

                {service.availabilityType === "period" && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600 mb-3">Availability Period</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Start Year"
                        value={service.availabilityPeriod.startYear}
                        onChange={(v: string) => handleServiceChange("availabilityPeriod", { 
                          ...service.availabilityPeriod, 
                          startYear: v 
                        })}
                        error={errors["availabilityPeriod.startYear"]}
                        type="number"
                        placeholder={new Date().getFullYear().toString()}
                      />
                      <Input
                        label="End Year"
                        value={service.availabilityPeriod.endYear}
                        onChange={(v: string) => handleServiceChange("availabilityPeriod", { 
                          ...service.availabilityPeriod, 
                          endYear: v 
                        })}
                        error={errors["availabilityPeriod.endYear"]}
                        type="number"
                        placeholder={(new Date().getFullYear() + 1).toString()}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 pb-2 border-b-2 border-gray-200">
                  Service Image
                </h2>
                <FileInput
                  label="Main Service Image"
                  accept="image/jpeg,image/png,image/webp"
                  value={service.image}
                  onChange={(file: File | null) => handleServiceChange("image", file)}
                  error={errors.image}
                  preview={true}
                  onRemove={removeMainImage}
                />
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 pb-2 border-b-2 border-gray-200">
                  Sub-service Configuration
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Number of Sub-services"
                    value={service.subServiceCount}
                    onChange={handleSubServiceCountChange}
                    error={errors.subServiceCount}
                    options={SUB_SERVICE_COUNT_OPTIONS.map(n => ({ value: n, label: n.toString() }))}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Number selected will determine how many sub-services will be displayed
                </p>
              </div>

              <button
                type="submit"
                className="px-6 py-2 bg-[#5d2a8b] text-white rounded-md hover:bg-[#4a2170] transition-colors"
              >
                Continue to Sub-services
              </button>
            </>
          )}

          {step === "subservices" && (
            <>
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 pb-2 border-b-2 border-gray-200">
                  Sub-services ({service.subServiceCount})
                </h2>
                {service.subServices.length === 0 ? (
                  <div className="bg-purple-50 text-[#5d2a8b] px-4 py-3 rounded-md">
                    No sub-services configured. Please go back and set the number of sub-services.
                  </div>
                ) : (
                  service.subServices.map((sub, index) => (
                    <SubServiceForm
                      key={sub.id}
                      index={index}
                      subService={sub}
                      onChange={handleSubServiceChange}
                      onRemove={service.subServices.length > 2 ? () => removeSubService(index) : undefined}
                      showRemove={service.subServices.length > 2}
                      errors={errors}
                    />
                  ))
                )}
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 pb-2 border-b-2 border-gray-200">
                  Additional Information
                </h2>
                <Input
                  label="Notes"
                  value={service.notes || ''}
                  onChange={(v: string) => handleServiceChange("notes", v)}
                  error={errors.notes}
                  placeholder="Any additional notes about the service"
                  className="w-full"
                />
              </div>

              <div className="flex gap-4">
                {/* <button
                  type="button"
                  onClick={() => setStep("basic")}
                  className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                  disabled={isSubmitting}
                >
                  ← Back
                </button> */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-[#5d2a8b] text-white rounded-md hover:bg-[#4a2170] transition-colors font-semibold disabled:bg-purple-300"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Service'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
      
      <MessageModal
        isOpen={modal.isOpen}
        onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
    </div>
  );
}