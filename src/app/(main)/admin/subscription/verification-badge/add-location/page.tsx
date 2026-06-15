/**
 * Add Location Page - Admin Subscription Verification Badge
 * 
 * This page allows admins to add new business locations for verification badge.
 * It uses hierarchical location data (Country → State → LGA → City → City Region)
 * fetched from backend API endpoints.
 * 
 * Key Features:
 * - Cascading dropdowns with search functionality
 * - API-based location data loading
 * - Automatic fee calculation based on city region
 * - Image and video gallery upload to Cloudinary
 * - Form validation and error handling
 */

"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import {
  Globe,
  MapPin,
  Search,
  ChevronDown,
  Layers,
  Building,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import OrganizationProfileService, { LocationData } from "@/services/OrganizationProfileService";
import { useRouter } from "next/navigation";
import { getLGAsForState, nigeriaStatesAndLGAs } from "@/services/nigerianLGAs";

interface LocationFormData {
  locationType: 'headquarters' | 'branch';
  brandName: string;
  country: string;
  state: string;
  lga: string;
  city: string;
  cityRegion: string;
  cityRegionFee?: number;
  pricingSource?: string;
  houseNumber: string;
  street: string;
  landmark?: string;
  buildingColor?: string;
  buildingType?: string;
  gallery: {
    images: (string | File)[];
    videos: (string | File)[];
  };
}

interface DropdownState {
  countryDropdownOpen: boolean;
  stateDropdownOpen: boolean;
  lgaDropdownOpen: boolean;
  cityDropdownOpen: boolean;
  cityRegionDropdownOpen: boolean;
  countrySearch: string;
  stateSearch: string;
  lgaSearch: string;
  citySearch: string;
  cityRegionSearch: string;
  loadingStates: boolean;
  loadingLgas: boolean;
  loadingCities: boolean;
  loadingCityRegions: boolean;
  statesForCountry: (string | { name: string; isoCode?: string })[];
  lgasForState: (string | { name: string })[];
  citiesForLga: (string | { name: string })[];
  cityRegionsForCity: { name: string; fee: number; _id: string }[];
}

const AddLocationPage: React.FC = () => {
  const router = useRouter();
  const [currentLocation, setCurrentLocation] = useState<LocationFormData | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [countries, setCountries] = useState<any[]>([]);
  const [dropdownStates, setDropdownStates] = useState<DropdownState>({
    countryDropdownOpen: false,
    stateDropdownOpen: false,
    lgaDropdownOpen: false,
    cityDropdownOpen: false,
    cityRegionDropdownOpen: false,
    countrySearch: '',
    stateSearch: '',
    lgaSearch: '',
    citySearch: '',
    cityRegionSearch: '',
    loadingStates: false,
    loadingLgas: false,
    loadingCities: false,
    loadingCityRegions: false,
    statesForCountry: [],
    lgasForState: [],
    citiesForLga: [],
    cityRegionsForCity: [],
  });

  const countryRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<HTMLDivElement>(null);
  const lgaRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  const cityRegionRef = useRef<HTMLDivElement>(null);
  
  const organizationProfileService = new OrganizationProfileService();

  // Load countries on mount
  const loadCountries = async () => {
    try {
      const { Country } = await import('country-state-city');
      const allCountries = Country.getAllCountries();
      
      const countryObjects = allCountries.map((country: any) => ({
        name: country.name,
        isoCode: country.isoCode
      }));
      
      setCountries(countryObjects);
      console.log(`✅ Loaded ${countryObjects.length} countries`);
    } catch (error) {
      console.error('Error loading countries:', error);
      setCountries([]);
    }
  };

  const loadStates = async (countryName: string) => {
    setDropdownStates(prev => ({ ...prev, loadingStates: true }));
    try {
      // Use country-state-city package for all states (same as subscription page)
      const { Country, State } = await import('country-state-city');
      const allCountries = Country.getAllCountries();
      const country = allCountries.find(c => c.name === countryName);
      
      if (country) {
        const states = State.getStatesOfCountry(country.isoCode);
        const stateList = states.map(state => ({
          name: state.name,
          isoCode: state.isoCode
        }));
        
        setDropdownStates(prev => ({ ...prev, statesForCountry: stateList, loadingStates: false }));
        console.log(`✅ Loaded ${stateList.length} states for ${countryName}`);
      } else {
        setDropdownStates(prev => ({ ...prev, statesForCountry: [], loadingStates: false }));
      }
    } catch (error) {
      console.error('Error loading states:', error);
      setDropdownStates(prev => ({ ...prev, statesForCountry: [], loadingStates: false }));
    }
  };

  const loadLGAs = async (countryName: string, stateName: string) => {
    setDropdownStates(prev => ({ ...prev, loadingLgas: true }));
    try {
      // For Nigeria, use our comprehensive LGA list
      if (countryName.toLowerCase() === 'nigeria') {
        const lgas = getLGAsForState(stateName);
        
        if (lgas && lgas.length > 0) {
          setDropdownStates(prev => ({ ...prev, lgasForState: lgas, loadingLgas: false }));
          console.log(`✅ Loaded ${lgas.length} LGAs for ${stateName}, Nigeria from local data`);
        } else {
          // Fallback to API if no LGAs found in local data
          console.log(`⚠️ No LGAs found in local data for ${stateName}, trying API...`);
          const HttpService = (await import('@/services/HttpService')).HttpService;
          const httpService = new HttpService();
          
          const data = await httpService.getData<any>(`/api/locations/lgas?country=${encodeURIComponent(countryName)}&state=${encodeURIComponent(stateName)}`);
          const lgaList = data.data?.lgas?.map((lga: any) => typeof lga === 'string' ? lga : lga.name) || [];
          
          setDropdownStates(prev => ({ ...prev, lgasForState: lgaList, loadingLgas: false }));
          console.log(`✅ Loaded ${lgaList.length} LGAs for ${stateName} from API`);
        }
      } else {
        // For other countries, use API
        const HttpService = (await import('@/services/HttpService')).HttpService;
        const httpService = new HttpService();
        
        const data = await httpService.getData<any>(`/api/locations/lgas?country=${encodeURIComponent(countryName)}&state=${encodeURIComponent(stateName)}`);
        const lgaList = data.data?.lgas?.map((lga: any) => typeof lga === 'string' ? lga : lga.name) || [];
        
        setDropdownStates(prev => ({ ...prev, lgasForState: lgaList, loadingLgas: false }));
        
        if (lgaList.length > 0) {
          console.log(`✅ Loaded ${lgaList.length} LGAs for ${stateName} from API`);
        } else {
          console.log(`⚠️ No LGAs available for ${stateName} (LGA is optional)`);
        }
      }
    } catch (error) {
      console.error('Error loading LGAs:', error);
      setDropdownStates(prev => ({ ...prev, lgasForState: [], loadingLgas: false }));
      console.log(`❌ Failed to load LGAs for ${stateName}`);
    }
  };

  const loadCities = async (countryName: string, stateName: string, lgaName: string) => {
    setDropdownStates(prev => ({ ...prev, loadingCities: true }));
    try {
      // Use country-state-city package for all cities (same as subscription page)
      const { Country, State, City } = await import('country-state-city');
      const allCountries = Country.getAllCountries();
      const country = allCountries.find(c => c.name === countryName);
      
      if (country) {
        const states = State.getStatesOfCountry(country.isoCode);
        const state = states.find(s => s.name === stateName);
        
        if (state) {
          const cities = City.getCitiesOfState(country.isoCode, state.isoCode);
          const cityList = cities.map(city => ({
            name: city.name
          }));
          
          setDropdownStates(prev => ({ ...prev, citiesForLga: cityList, loadingCities: false }));
          console.log(`✅ Loaded ${cityList.length} cities for ${stateName}`);
        } else {
          setDropdownStates(prev => ({ ...prev, citiesForLga: [], loadingCities: false }));
        }
      }
    } catch (error) {
      console.error('Error loading cities:', error);
      setDropdownStates(prev => ({ ...prev, citiesForLga: [], loadingCities: false }));
    }
  };

  const loadCityRegions = async (countryName: string, stateName: string, lgaName: string, cityName: string) => {
    setDropdownStates(prev => ({ ...prev, loadingCityRegions: true }));
    try {
      const HttpService = (await import('@/services/HttpService')).HttpService;
      const httpService = new HttpService();
      
      // Use the location pricing endpoint which handles optional LGA
      const url = `/api/payment/location/pricing?country=${encodeURIComponent(countryName)}&state=${encodeURIComponent(stateName)}&city=${encodeURIComponent(cityName)}`;
      
      console.log('🔍 Fetching city region pricing from:', url);
      const data = await httpService.getData<any>(url);
      
      if (data.success && data.data) {
        // Transform pricing response into city region format
        const regionList = [{
          name: `City Region (${data.data.source || 'Default'})`,
          fee: data.data.fee || 0,
          _id: `pricing-${countryName}-${stateName}-${cityName}`
        }];
        
        setDropdownStates(prev => ({ ...prev, cityRegionsForCity: regionList, loadingCityRegions: false }));
        console.log(`✅ Loaded city region fee: ₦${data.data.fee} for ${cityName}`, data.data.source);
        
        // Auto-select the city region and fee
        handleLocationChange('cityRegion', regionList[0].name);
        handleLocationChange('cityRegionFee', regionList[0].fee);
        handleLocationChange('pricingSource', data.data.source || 'API pricing');
        
        console.log(`✅ Auto-selected city region with fee: ₦${data.data.fee}`);
      } else {
        // No pricing available for this location
        setDropdownStates(prev => ({ ...prev, cityRegionsForCity: [], loadingCityRegions: false }));
        console.log(`⚠️ No city regions/pricing found for ${cityName}`);
      }
    } catch (error: any) {
      console.error('❌ Error loading city regions:', error);
      console.error('Error details:', error.message);
      setDropdownStates(prev => ({ ...prev, cityRegionsForCity: [], loadingCityRegions: false }));
    }
  };

  // Initialize country data
  useEffect(() => {
    loadCountries();
    // Initialize new location
    const newLocation: LocationFormData = {
      locationType: 'headquarters',
      brandName: '',
      country: '',
      state: '',
      lga: '',
      city: '',
      cityRegion: '',
      houseNumber: '',
      street: '',
      landmark: '',
      buildingColor: '',
      buildingType: '',
      cityRegionFee: undefined,
      gallery: { images: [], videos: [] },
    };
    setCurrentLocation(newLocation);
  }, []);

  // Load states when country changes
  useEffect(() => {
    if (currentLocation?.country) {
      loadStates(currentLocation.country);
    }
  }, [currentLocation?.country]);

  // Load LGAs when state changes
  useEffect(() => {
    if (currentLocation?.country && currentLocation?.state) {
      loadLGAs(currentLocation.country, currentLocation.state);
    }
  }, [currentLocation?.country, currentLocation?.state]);

  // Load cities when LGA changes (or if no LGA, when state changes)
  useEffect(() => {
    if (currentLocation?.country && currentLocation?.state) {
      // Only load cities if we have country and state
      loadCities(currentLocation.country, currentLocation.state, currentLocation.lga || '');
    }
  }, [currentLocation?.country, currentLocation?.state, currentLocation?.lga]);

  // Load city regions when city changes (and required parent fields)
  useEffect(() => {
    if (currentLocation?.country && currentLocation?.state && currentLocation?.city) {
      loadCityRegions(
        currentLocation.country, 
        currentLocation.state, 
        currentLocation.lga || '', 
        currentLocation.city
      );
    }
  }, [currentLocation?.country, currentLocation?.state, currentLocation?.city, currentLocation?.lga]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const refs = [countryRef, stateRef, lgaRef, cityRef, cityRegionRef];
      refs.forEach(ref => {
        if (ref.current && !ref.current.contains(event.target as Node)) {
          if (ref === countryRef) setDropdownStates(prev => ({ ...prev, countryDropdownOpen: false }));
          if (ref === stateRef) setDropdownStates(prev => ({ ...prev, stateDropdownOpen: false }));
          if (ref === lgaRef) setDropdownStates(prev => ({ ...prev, lgaDropdownOpen: false }));
          if (ref === cityRef) setDropdownStates(prev => ({ ...prev, cityDropdownOpen: false }));
          if (ref === cityRegionRef) setDropdownStates(prev => ({ ...prev, cityRegionDropdownOpen: false }));
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter functions
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(dropdownStates.countrySearch.toLowerCase()) ||
    (country.isoCode && country.isoCode.toLowerCase().includes(dropdownStates.countrySearch.toLowerCase()))
  );

  const filteredStates = dropdownStates.statesForCountry.filter(state =>
    (typeof state === 'string' && state.toLowerCase().includes(dropdownStates.stateSearch.toLowerCase())) ||
    (typeof state === 'object' && state.name && state.name.toLowerCase().includes(dropdownStates.stateSearch.toLowerCase())) ||
    (typeof state === 'object' && state.isoCode && state.isoCode.toLowerCase().includes(dropdownStates.stateSearch.toLowerCase()))
  );

  const filteredLgas = dropdownStates.lgasForState.filter(lga =>
    (typeof lga === 'string' && lga.toLowerCase().includes(dropdownStates.lgaSearch.toLowerCase())) ||
    (typeof lga === 'object' && lga.name && lga.name.toLowerCase().includes(dropdownStates.lgaSearch.toLowerCase()))
  );

  const filteredCities = dropdownStates.citiesForLga.filter(city =>
    (typeof city === 'string' && city.toLowerCase().includes(dropdownStates.citySearch.toLowerCase())) ||
    (typeof city === 'object' && city.name && city.name.toLowerCase().includes(dropdownStates.citySearch.toLowerCase()))
  );

  const filteredCityRegions = dropdownStates.cityRegionsForCity.filter(region =>
    (region.name && region.name.toLowerCase().includes(dropdownStates.cityRegionSearch.toLowerCase()))
  );

  const handleLocationChange = (field: keyof LocationFormData, value: any) => {
    if (currentLocation) {
      setCurrentLocation((prevLocation: any) => ({
        ...prevLocation,
        [field]: value
      }));
      
      // Reset dependent fields
      if (field === 'country') {
        setCurrentLocation((prev: any) => ({
          ...prev,
          state: '',
          lga: '',
          city: '',
          cityRegion: '',
          cityRegionFee: undefined
        }));
        setDropdownStates(prev => ({
          ...prev,
          statesForCountry: [],
          lgasForState: [],
          citiesForLga: [],
          cityRegionsForCity: [],
        }));
      }
      
      if (field === 'state') {
        setCurrentLocation((prev: any) => ({
          ...prev,
          lga: '',
          city: '',
          cityRegion: '',
          cityRegionFee: undefined
        }));
        setDropdownStates(prev => ({
          ...prev,
          lgasForState: [],
          citiesForLga: [],
          cityRegionsForCity: [],
        }));
      }
      
      if (field === 'lga') {
        setCurrentLocation((prev: any) => ({
          ...prev,
          city: '',
          cityRegion: '',
          cityRegionFee: undefined
        }));
        setDropdownStates(prev => ({
          ...prev,
          citiesForLga: [],
          cityRegionsForCity: [],
        }));
      }
      
      if (field === 'city') {
        setCurrentLocation((prev: any) => ({
          ...prev,
          cityRegion: '',
          cityRegionFee: undefined
        }));
        setDropdownStates(prev => ({
          ...prev,
          cityRegionsForCity: [],
        }));
      }
    }
  };

  const uploadFilesAndGetUrls = async (files: (string | File)[]): Promise<string[]> => {
    const urls: string[] = [];
    
    for (const file of files) {
      if (typeof file === 'string') {
        urls.push(file);
      } else {
        try {
          const reader = new FileReader();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          
          const isImage = file.type.startsWith('image/');
          const uploadEndpoint = isImage 
            ? 'https://api.cloudinary.com/v1_1/disz21zwr/image/upload'
            : 'https://api.cloudinary.com/v1_1/disz21zwr/video/upload';
          
          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', 'vestradat_preset');
          
          const cloudinaryResponse = await fetch(uploadEndpoint, {
            method: 'POST',
            body: formData,
          });
          
          const result = await cloudinaryResponse.json();
          
          if (result.secure_url) {
            urls.push(result.secure_url);
          } else {
            urls.push(dataUrl);
          }
        } catch (error) {
          console.error('Error uploading file:', error);
          continue;
        }
      }
    }
    
    return urls;
  };

  const handleSubmit = async () => {
    if (!currentLocation) {
      setErrorMessage('Please fill in location details');
      return;
    }
  
    setIsProcessing(true);
    setFieldErrors({});
  
    try {
      let processedLocation = { ...currentLocation };
                
      // Process images
      if (currentLocation.gallery && currentLocation.gallery.images && currentLocation.gallery.images.length > 0) {
        const imageUrls = await uploadFilesAndGetUrls(currentLocation.gallery.images);
        processedLocation = {
          ...processedLocation,
          gallery: {
            ...(processedLocation.gallery || {}),
            images: imageUrls
          }
        };
      }
                
      // Process videos
      if (currentLocation.gallery && currentLocation.gallery.videos && currentLocation.gallery.videos.length > 0) {
        const videoUrls = await uploadFilesAndGetUrls(currentLocation.gallery.videos);
        processedLocation = {
          ...processedLocation,
          gallery: {
            ...(processedLocation.gallery || {}),
            videos: videoUrls
          }
        };
      }
        
      const response = await organizationProfileService.addLocation(processedLocation);
        
      if (response.success) {
        setSuccessMessage('Location added successfully!');
        setTimeout(() => {
          router.push('/admin/subscription/verification-badge');
        }, 1500);
        setErrorMessage('');
      } else {
        if (response.error) {
          if (typeof response.error === 'string' && response.error.includes('validation failed')) {
            const fieldErrors: Record<string, string> = {};
                    
            // Parse validation errors and display them clearly
            if (response.error.includes('street: Path `street` is required')) {
              fieldErrors.street = 'Street is required';
            }
            if (response.error.includes('houseNumber: Path `houseNumber` is required')) {
              fieldErrors.houseNumber = 'House number is required';
            }
            if (response.error.includes('brandName: Path `brandName` is required')) {
              fieldErrors.brandName = 'Brand name is required';
            }
            if (response.error.includes('country: Path `country` is required')) {
              fieldErrors.country = 'Country is required';
            }
            if (response.error.includes('state: Path `state` is required')) {
              fieldErrors.state = 'State is required';
            }
            if (response.error.includes('city: Path `city` is required')) {
              fieldErrors.city = 'City is required';
            }
            if (response.error.includes('lga: Path `lga` is required')) {
              fieldErrors.lga = 'LGA (Local Government Area) is required';
            }
            if (response.error.includes('locationType: Path `locationType` is required')) {
              fieldErrors.locationType = 'Location type is required';
            }
                    
            setFieldErrors(fieldErrors);
                  
            // Create a user-friendly error message
            const errorFields = Object.keys(fieldErrors);
            const friendlyMessage = errorFields.length > 0 
              ? `Please fill in the following required fields: ${errorFields.join(', ')}`
              : response.error;
                    
            setErrorMessage(friendlyMessage);
          } else {
            setFieldErrors({});
            setErrorMessage(response.error);
          }
        } else {
          setFieldErrors({});
          setErrorMessage(response.message || 'Failed to save location');
        }
        setSuccessMessage('');
      }
    } catch (error: any) {
      console.error('Error saving location:', error);
      setFieldErrors({});
      setErrorMessage(error.message || 'Network error or An unexpected error occurred');
      setSuccessMessage('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/subscription/verification-badge');
  };

  // Dropdown handlers
  const handleCountrySelect = (country: any) => {
    handleLocationChange('country', country.name);
    setDropdownStates(prev => ({
      ...prev,
      countryDropdownOpen: false,
      countrySearch: '',
    }));
  };

  const handleStateSelect = (state: any) => {
    const stateName = typeof state === 'string' ? state : state.name;
    handleLocationChange('state', stateName);
    setDropdownStates(prev => ({
      ...prev,
      stateDropdownOpen: false,
      stateSearch: '',
    }));
  };

  const handleLgaSelect = (lga: any) => {
    const lgaName = typeof lga === 'string' ? lga : lga.name;
    handleLocationChange('lga', lgaName);
    setDropdownStates(prev => ({
      ...prev,
      lgaDropdownOpen: false,
      lgaSearch: '',
    }));
  };

  const handleCitySelect = (city: any) => {
    const cityName = typeof city === 'string' ? city : city.name;
    handleLocationChange('city', cityName);
    setDropdownStates(prev => ({
      ...prev,
      cityDropdownOpen: false,
      citySearch: '',
    }));
  };

  const handleCityRegionSelect = (region: any) => {
    handleLocationChange('cityRegion', region.name);
    handleLocationChange('cityRegionFee', region.fee);
    handleLocationChange('pricingSource', 'City region pricing');
    setDropdownStates(prev => ({
      ...prev,
      cityRegionDropdownOpen: false,
      cityRegionSearch: '',
    }));
  };

  const toggleDropdown = (dropdownName: keyof Pick<DropdownState, 'countryDropdownOpen' | 'stateDropdownOpen' | 'lgaDropdownOpen' | 'cityDropdownOpen' | 'cityRegionDropdownOpen'>) => {
    setDropdownStates(prev => {
      const newState = {
        countryDropdownOpen: false,
        stateDropdownOpen: false,
        lgaDropdownOpen: false,
        cityDropdownOpen: false,
        cityRegionDropdownOpen: false,
      };
      newState[dropdownName] = !prev[dropdownName];
      return { ...prev, ...newState };
    });
  };

  if (!currentLocation) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
        * { font-family: 'Manrope', sans-serif; }
      `}</style>

      <div className="px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Add New Location</h2>
          <p className="text-gray-600">Fill in the location details below</p>
        </div>
        
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center text-green-800">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span>{successMessage}</span>
            </div>
          </div>
        )}
        
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center text-red-800">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          {/* Location Type and Brand Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location Type</label>
              <select
                value={currentLocation.locationType}
                onChange={(e) => handleLocationChange('locationType', e.target.value as 'headquarters' | 'branch')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="headquarters">Headquarters</option>
                <option value="branch">Branch</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
              <input
                type="text"
                value={currentLocation.brandName}
                onChange={(e) => handleLocationChange('brandName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${fieldErrors?.brandName ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter brand name"
              />
              {fieldErrors?.brandName && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.brandName}</p>
              )}
            </div>
          </div>
          
          {/* Country Field */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country <span className="text-red-500">*</span>
            </label>
            
            <div className="relative" ref={countryRef}>
              <button
                type="button"
                onClick={() => toggleDropdown('countryDropdownOpen')}
                className={`w-full flex items-center justify-between p-3 border rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 ${fieldErrors?.country ? 'border-red-500' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-gray-400" />
                  {currentLocation.country ? (
                    <span>{currentLocation.country}</span>
                  ) : (
                    <span className="text-gray-500">Select a country...</span>
                  )}
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${dropdownStates.countryDropdownOpen ? 'transform rotate-180' : ''}`} />
              </button>
              {fieldErrors?.country && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.country}</p>
              )}
              
              {dropdownStates.countryDropdownOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-80 overflow-hidden">
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search countries..."
                        className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                        value={dropdownStates.countrySearch}
                        onChange={(e) => setDropdownStates(prev => ({ ...prev, countrySearch: e.target.value }))}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>

                  <div className="overflow-y-auto max-h-60">
                    {filteredCountries.length > 0 ? (
                      filteredCountries.map((country) => (
                        <button
                          key={country.isoCode}
                          type="button"
                          onClick={() => handleCountrySelect(country)}
                          className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 ${
                            currentLocation.country === country.name ? 'bg-purple-500/10' : ''
                          }`}
                        >
                          <div className="text-left">
                            <div className="font-medium">{country.name}</div>
                            {country.isoCode && (
                              <div className="text-xs text-gray-500">{country.isoCode}</div>
                            )}
                          </div>
                          {currentLocation.country === country.name && (
                            <div className="ml-auto w-2 h-2 bg-purple-500 rounded-full"></div>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-gray-500 text-center">No countries found</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* State Field */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State/Province <span className="text-red-500">*</span>
            </label>
            
            {!currentLocation.country ? (
              <div className="p-4 bg-gray-50 rounded-lg text-gray-500 text-center">
                Please select a country first
              </div>
            ) : (
              <>
                <div className="relative" ref={stateRef}>
                  <button
                    type="button"
                    onClick={() => toggleDropdown('stateDropdownOpen')}
                    className={`w-full flex items-center justify-between p-3 border rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 ${fieldErrors?.state ? 'border-red-500' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      {currentLocation.state ? (
                        <span>{currentLocation.state}</span>
                      ) : (
                        <span className="text-gray-500">Select state...</span>
                      )}
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${dropdownStates.stateDropdownOpen ? 'transform rotate-180' : ''}`} />
                  </button>
                  {fieldErrors?.state && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.state}</p>
                  )}
                  
                  {dropdownStates.stateDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-80 overflow-hidden">
                      <div className="p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="text"
                            placeholder="Search states..."
                            className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                            value={dropdownStates.stateSearch}
                            onChange={(e) => setDropdownStates(prev => ({ ...prev, stateSearch: e.target.value }))}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>

                      <div className="overflow-y-auto max-h-60">
                        {dropdownStates.loadingStates ? (
                          <div className="px-3 py-2 text-gray-500 text-center">Loading states...</div>
                        ) : filteredStates.length > 0 ? (
                          filteredStates.map((state, index) => {
                            const stateName = typeof state === 'string' ? state : state.name;
                            const stateCode = typeof state === 'object' ? state.isoCode : undefined;
                            return (
                              <button
                                key={`${currentLocation.country}-${stateName}-${index}`}
                                type="button"
                                onClick={() => handleStateSelect(state)}
                                className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${
                                  currentLocation.state === stateName ? 'bg-purple-500/10' : ''
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium">{stateName}</div>
                                    {stateCode && (
                                      <div className="text-xs text-gray-500">{stateCode}</div>
                                    )}
                                  </div>
                                  {currentLocation.state === stateName && (
                                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                  )}
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <div className="px-3 py-2 text-gray-500 text-center">
                            {dropdownStates.statesForCountry.length === 0 
                              ? 'No states found for this country' 
                              : 'No results match your search'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          
          {/* LGA Field */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              LGA (Local Government Area) <span className="text-red-500">*</span>
            </label>
            
            {!currentLocation.state ? (
              <div className="p-4 bg-gray-50 rounded-lg text-gray-500 text-center">
                Please select a state first
              </div>
            ) : (
              <>
                {currentLocation.country === 'Nigeria' && (
                  <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800">
                      🇳🇬 All Nigerian LGAs loaded • Select your Local Government Area from the dropdown
                    </p>
                  </div>
                )}
                
                <div className="relative" ref={lgaRef}>
                  <button
                    type="button"
                    onClick={() => toggleDropdown('lgaDropdownOpen')}
                    className={`w-full flex items-center justify-between p-3 border rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 ${fieldErrors?.lga ? 'border-red-500' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      {currentLocation.lga ? (
                        <span>{currentLocation.lga}</span>
                      ) : (
                        <span className="text-gray-500">Select LGA...</span>
                      )}
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${dropdownStates.lgaDropdownOpen ? 'transform rotate-180' : ''}`} />
                  </button>
                  {fieldErrors?.lga && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.lga}</p>
                  )}
                  
                  {dropdownStates.lgaDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-80 overflow-hidden">
                      <div className="p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="text"
                            placeholder="Search LGAs..."
                            className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                            value={dropdownStates.lgaSearch}
                            onChange={(e) => setDropdownStates(prev => ({ ...prev, lgaSearch: e.target.value }))}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>

                      <div className="overflow-y-auto max-h-60">
                        {dropdownStates.loadingLgas ? (
                          <div className="px-3 py-2 text-gray-500 text-center">Loading LGAs...</div>
                        ) : filteredLgas.length > 0 ? (
                          filteredLgas.map((lga, index) => {
                            const lgaName = typeof lga === 'string' ? lga : lga.name;
                            return (
                              <button
                                key={`${currentLocation.state}-${lgaName}-${index}`}
                                type="button"
                                onClick={() => handleLgaSelect(lga)}
                                className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${
                                  currentLocation.lga === lgaName ? 'bg-purple-500/10' : ''
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="font-medium">{lgaName}</div>
                                  {currentLocation.lga === lgaName && (
                                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                  )}
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <div className="px-3 py-2 text-gray-500 text-center">
                            {dropdownStates.lgasForState.length === 0 
                              ? 'No LGAs found for this state' 
                              : 'No results match your search'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          
          {/* City Field */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City <span className="text-red-500">*</span>
            </label>
            
            {!currentLocation.state ? (
              <div className="p-4 bg-gray-50 rounded-lg text-gray-500 text-center">
                Please select a state first
              </div>
            ) : (
              <>
                <div className="relative" ref={cityRef}>
                  <button
                    type="button"
                    onClick={() => toggleDropdown('cityDropdownOpen')}
                    className={`w-full flex items-center justify-between p-3 border rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 ${fieldErrors?.city ? 'border-red-500' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <Building className="w-5 h-5 text-gray-400" />
                      {currentLocation.city ? (
                        <span>{currentLocation.city}</span>
                      ) : (
                        <span className="text-gray-500">Select city...</span>
                      )}
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${dropdownStates.cityDropdownOpen ? 'transform rotate-180' : ''}`} />
                  </button>
                  {fieldErrors?.city && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.city}</p>
                  )}
                  
                  {dropdownStates.cityDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-80 overflow-hidden">
                      <div className="p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="text"
                            placeholder="Search cities..."
                            className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                            value={dropdownStates.citySearch}
                            onChange={(e) => setDropdownStates(prev => ({ ...prev, citySearch: e.target.value }))}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>

                      <div className="overflow-y-auto max-h-60">
                        {dropdownStates.loadingCities ? (
                          <div className="px-3 py-2 text-gray-500 text-center">Loading cities...</div>
                        ) : filteredCities.length > 0 ? (
                          filteredCities.map((city, index) => {
                            const cityName = typeof city === 'string' ? city : city.name;
                            return (
                              <button
                                key={`${currentLocation.state}-${cityName}-${index}`}
                                type="button"
                                onClick={() => handleCitySelect(city)}
                                className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${
                                  currentLocation.city === cityName ? 'bg-purple-500/10' : ''
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="font-medium">{cityName}</div>
                                  {currentLocation.city === cityName && (
                                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                  )}
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <div className="px-3 py-2 text-gray-500 text-center">
                            {dropdownStates.citiesForLga.length === 0 
                              ? 'No cities found for this state' 
                              : 'No results match your search'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          
          {/* City Region Field */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City Region with Fee - Optional
            </label>
                      
            {!currentLocation.city ? (
              <div className="p-4 bg-gray-50 rounded-lg text-gray-500 text-center">
                Please select a city first
              </div>
            ) : (
              <>
                <div className="relative" ref={cityRegionRef}>
                  <button
                    type="button"
                    onClick={() => toggleDropdown('cityRegionDropdownOpen')}
                    className={`w-full flex items-center justify-between p-3 border rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 ${fieldErrors?.cityRegion ? 'border-red-500' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <Layers className="w-5 h-5 text-gray-400" />
                      {currentLocation.cityRegion ? (
                        <span className="text-purple-600 font-medium">
                          {currentLocation.cityRegion} 
                          {currentLocation.cityRegionFee ? ` (₦${currentLocation.cityRegionFee.toLocaleString()})` : ''}
                        </span>
                      ) : (
                        <span className="text-gray-500">Select city region...</span>
                      )}
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${dropdownStates.cityRegionDropdownOpen ? 'transform rotate-180' : ''}`} />
                  </button>
                  {fieldErrors?.cityRegion && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.cityRegion}</p>
                  )}
                            
                  {dropdownStates.cityRegionDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-80 overflow-hidden">
                      <div className="p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="text"
                            placeholder="Search city regions..."
                            className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                            value={dropdownStates.cityRegionSearch}
                            onChange={(e) => setDropdownStates(prev => ({ ...prev, cityRegionSearch: e.target.value }))}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                              
                      <div className="overflow-y-auto max-h-60">
                        {dropdownStates.loadingCityRegions ? (
                          <div className="px-3 py-2 text-gray-500 text-center">Loading city regions...</div>
                        ) : filteredCityRegions.length > 0 ? (
                          filteredCityRegions.map((region) => (
                            <button
                              key={region._id}
                              type="button"
                              onClick={() => handleCityRegionSelect(region)}
                              className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${
                                currentLocation.cityRegion === region.name ? 'bg-purple-500/10' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="font-medium">{region.name} (₦{region.fee.toLocaleString()})</div>
                                {currentLocation.cityRegion === region.name && (
                                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                )}
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-gray-500 text-center">
                            {dropdownStates.cityRegionsForCity.length === 0 
                              ? 'No city regions found for this city' 
                              : 'No results match your search'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                          
                {/* Show fee info when auto-selected */}
                {currentLocation.cityRegionFee && currentLocation.pricingSource && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div className="text-sm text-green-800">
                        <p className="font-medium">City region fee applied</p>
                        <p className="text-xs text-green-700 mt-1">
                          Fee: <strong>₦{currentLocation.cityRegionFee.toLocaleString()}</strong> • Source: {currentLocation.pricingSource}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
                      
          {/* Remaining fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">House Number</label>
              <input
                type="text"
                value={currentLocation.houseNumber}
                onChange={(e) => handleLocationChange('houseNumber', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${fieldErrors?.houseNumber ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="House Number"
              />
              {fieldErrors?.houseNumber && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.houseNumber}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
              <input
                type="text"
                value={currentLocation.street}
                onChange={(e) => handleLocationChange('street', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${fieldErrors?.street ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Street Address"
              />
              {fieldErrors?.street && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.street}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Landmark</label>
              <input
                type="text"
                value={currentLocation.landmark || ''}
                onChange={(e) => handleLocationChange('landmark', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Nearby landmark or bus stop"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Building Color</label>
              <input
                type="text"
                value={currentLocation.buildingColor || ''}
                onChange={(e) => handleLocationChange('buildingColor', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Building color"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Building Type</label>
              <input
                type="text"
                value={currentLocation.buildingType || ''}
                onChange={(e) => handleLocationChange('buildingType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Type of building"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City Region Fee</label>
              <input
                type="number"
                value={currentLocation.cityRegionFee || ''}
                onChange={(e) => handleLocationChange('cityRegionFee', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Delivery/service fee for region"
                readOnly={currentLocation.pricingSource === 'City region pricing'}
              />
              {currentLocation.pricingSource && (
                <p className="mt-1 text-xs text-gray-500">{currentLocation.pricingSource}</p>
              )}
            </div>
          </div>
          
          {/* Gallery Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Gallery</label>
            <div className="border border-gray-300 rounded-lg p-4">
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Images</h4>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(currentLocation.gallery?.images || []).map((image: string | File, index: number) => (
                    <div key={index} className="relative">
                      {typeof image === 'string' ? (
                        <img 
                          src={image} 
                          alt={`Gallery ${index + 1}`} 
                          className="w-16 h-16 object-cover rounded border"
                        />
                      ) : (
                        <img 
                          src={URL.createObjectURL(image)} 
                          alt={`Gallery ${index + 1}`} 
                          className="w-16 h-16 object-cover rounded border"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const updatedImages = [...(currentLocation.gallery?.images || [])];
                          updatedImages.splice(index, 1);
                          handleLocationChange('gallery', { 
                            ...currentLocation.gallery, 
                            images: updatedImages 
                          });
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <p className="text-sm text-gray-500 mt-2">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        const newImages = Array.from(e.target.files);
                        const updatedGallery = {
                          ...currentLocation.gallery,
                          images: [...(currentLocation.gallery?.images || []), ...newImages]
                        };
                        handleLocationChange('gallery', updatedGallery);
                        e.target.value = '';
                      }
                    }}
                  />
                </label>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Videos</h4>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(currentLocation.gallery?.videos || []).map((video: string | File, index: number) => (
                    <div key={index} className="relative">
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center border">
                        <span className="text-xs text-center">Video</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updatedVideos = [...(currentLocation.gallery?.videos || [])];
                          updatedVideos.splice(index, 1);
                          handleLocationChange('gallery', { 
                            ...currentLocation.gallery, 
                            videos: updatedVideos 
                          });
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                    </svg>
                    <p className="text-sm text-gray-500 mt-2">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">MP4, MOV, AVI up to 50MB</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="video/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        const newVideos = Array.from(e.target.files);
                        const updatedGallery = {
                          ...currentLocation.gallery,
                          videos: [...(currentLocation.gallery?.videos || []), ...newVideos]
                        };
                        handleLocationChange('gallery', updatedGallery);
                        e.target.value = '';
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isProcessing}
              className={`px-4 py-2 rounded-lg font-medium text-white ${isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                  Saving...
                </>
              ) : 'Add Location'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddLocationPage;
