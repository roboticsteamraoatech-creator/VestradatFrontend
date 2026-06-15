"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, Filter, DollarSign, CheckCircle, XCircle, Clock, Loader2, 
  AlertCircle, MapPin, User, Mail, FileText, Plus, Search, ArrowLeft,
  ArrowRight, Users
} from 'lucide-react';
import BookingAdminService, { 
  AdminBooking, AvailableSlot, OrganizationUser, ServiceProvider, 
  LocationOption, CreateAdminBookingRequest
} from '@/services/BookingAdminService';
import { GalleryService } from '@/services/GalleryService';
import AdminTaskManagementService from '@/services/AdminTaskManagementService';
import { useAuthContext } from '@/AuthContext';
import AcceptedTasksTable from './AcceptedTasksTable';
import BookingDetailsModal from './BookingDetailsModal';
import StatusUpdateModal from './StatusUpdateModal';
import SummaryCards from './SummaryCards';
import BookingCreateFlow from './BookingCreateFlow';

interface GalleryServiceItem {
  _id: string;
  name: string;
  description: string;
  itemType: 'product' | 'service';
  priceInDollars: number;
  actualAmount: number;
  categoryName?: string;
  industryName?: string;
  imageUrl?: string;
}

type TabType = 'all' | 'pending' | 'confirmed' | 'accepted' | 'rejected' | 'completed';
type BookingStep = 'service-date' | 'customer' | 'details' | 'location' | 'review';

const AdminBookingsPage: React.FC = () => {
  const router = useRouter();
  const { token } = useAuthContext();
  
  // View mode: 'list' or 'create'
  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
  
  // List view states
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [totalBookings, setTotalBookings] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);
  const [showStatusUpdateModal, setShowStatusUpdateModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  // Accepted tasks states
  const [acceptSuccessMessage, setAcceptSuccessMessage] = useState<string | null>(null);
  const [acceptedTasksCount, setAcceptedTasksCount] = useState<number>(0);

  // Create booking flow states
  const [currentStep, setCurrentStep] = useState<BookingStep>('service-date');
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  
  // Step 1: Service & Date Selection
  const [galleryServices, setGalleryServices] = useState<GalleryServiceItem[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedServiceName, setSelectedServiceName] = useState<string>('');
  const [selectedServicePrice, setSelectedServicePrice] = useState<number>(0);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [loadingDays, setLoadingDays] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);

  // Step 2: Customer Selection
  const [customerType, setCustomerType] = useState<'existing' | 'external'>('existing');
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [organizationUsers, setOrganizationUsers] = useState<OrganizationUser[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<OrganizationUser | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [externalCustomerName, setExternalCustomerName] = useState('');
  const [externalCustomerEmail, setExternalCustomerEmail] = useState('');
  const [externalCustomerPhone, setExternalCustomerPhone] = useState('');

  // Step 3: Details (Service Provider & Guests)
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [guests, setGuests] = useState<Array<{ name: string; email: string; slotDateTime: string; notes?: string }>>([]);
  const [customerNotes, setCustomerNotes] = useState('');

  // Step 4: Location Selection
  const [locationOptions, setLocationOptions] = useState<{
    merchantLocation: LocationOption;
    customerAddress: LocationOption;
    newAddress: LocationOption;
    whatsappLocation: LocationOption;
  } | null>(null);
  const [selectedLocationType, setSelectedLocationType] = useState<string>('');
  const [locationAddress, setLocationAddress] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Step 5: Review & Payment
  const [processPayment, setProcessPayment] = useState(true);
  const [paymentType, setPaymentType] = useState<'upfront' | 'full'>('upfront');
  const [upfrontPercentage, setUpfrontPercentage] = useState(50);
  const [createdBooking, setCreatedBooking] = useState<any>(null);

  // Load accepted tasks count
  useEffect(() => {
    const fetchAcceptedCount = async () => {
      try {
        const response = await AdminTaskManagementService.getAcceptedTasksReport();
        if (response.success) {
          setAcceptedTasksCount(response.data.total);
        }
      } catch (err) {
        console.error('Error fetching accepted count:', err);
      }
    };
    
    if (viewMode === 'list') {
      fetchAcceptedCount();
    }
  }, [viewMode]);

  // Load bookings list
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await BookingAdminService.getAdminBookings(
        currentPage,
        20,
        activeTab === 'all' ? undefined : activeTab,
        dateFrom || undefined,
        dateTo || undefined
      );

      if (response.success) {
        setBookings(response.data.bookings);
        setTotalBookings(response.data.total);
        setTotalPages(response.data.pagination.totalPages);
      } else {
        setError(response.message || 'Failed to load bookings');
      }
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [currentPage, activeTab, dateFrom, dateTo]);

  useEffect(() => {
    if (viewMode === 'list') {
      fetchBookings();
    }
  }, [viewMode, fetchBookings]);

  // Load available days when month/year changes
  useEffect(() => {
    if (viewMode === 'create' && currentStep === 'service-date') {
      fetchAvailableDays();
    }
  }, [selectedMonth, selectedYear, selectedServiceId, viewMode, currentStep]);

  // Load available slots when date changes
  useEffect(() => {
    if (selectedDate && viewMode === 'create') {
      fetchAvailableSlots();
    }
  }, [selectedDate, selectedServiceId, viewMode]);

  // Load organization users when searching
  useEffect(() => {
    if (customerType === 'existing' && viewMode === 'create' && currentStep === 'customer') {
      const timeoutId = setTimeout(() => {
        fetchOrganizationUsers();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [customerSearch, customerType, viewMode, currentStep]);

  // Load gallery services for booking
  useEffect(() => {
    if (viewMode === 'create' && currentStep === 'service-date') {
      fetchGalleryServices();
    }
  }, [viewMode, currentStep]);

  // Load service providers
  useEffect(() => {
    if (viewMode === 'create' && currentStep === 'details') {
      fetchServiceProviders();
    }
  }, [selectedServiceId, viewMode, currentStep]);

  // Load location options
  useEffect(() => {
    if (viewMode === 'create' && currentStep === 'location') {
      fetchLocationOptions();
    }
  }, [selectedServiceId, viewMode, currentStep]);

  const fetchAvailableDays = async () => {
    try {
      setLoadingDays(true);
      const response = await BookingAdminService.getAvailableDays(
        selectedMonth,
        selectedYear,
        selectedServiceId || undefined
      );

      if (response.success) {
        setAvailableDays(response.data.availableDays);
      }
    } catch (err: any) {
      console.error('Error fetching available days:', err);
    } finally {
      setLoadingDays(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      setLoadingSlots(true);
      const response = await BookingAdminService.getAvailableSlots(
        selectedDate,
        selectedServiceId || undefined
      );

      if (response.success) {
        setAvailableSlots(response.data.slots);
      }
    } catch (err: any) {
      console.error('Error fetching available slots:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const fetchOrganizationUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await BookingAdminService.getOrganizationUsers(
        customerSearch || undefined,
        1,
        20
      );

      if (response.success) {
        console.log('Fetched organization users:', response.data.users);
        setOrganizationUsers(response.data.users);
      }
    } catch (err: any) {
      console.error('Error fetching organization users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchServiceProviders = async () => {
    try {
      setLoadingProviders(true);
      const response = await BookingAdminService.getServiceProviders(
        selectedServiceId || undefined
      );

      if (response.success) {
        setServiceProviders(response.data.providers);
      }
    } catch (err: any) {
      console.error('Error fetching service providers:', err);
    } finally {
      setLoadingProviders(false);
    }
  };

  const fetchLocationOptions = async () => {
    try {
      setLoadingLocation(true);
      const response = await BookingAdminService.getLocationOptions(
        selectedServiceId || undefined
      );

      if (response.success) {
        setLocationOptions(response.data.locationOptions);
        setSelectedLocationType(response.data.defaultOption);
      }
    } catch (err: any) {
      console.error('Error fetching location options:', err);
    } finally {
      setLoadingLocation(false);
    }
  };

  const fetchGalleryServices = async () => {
    try {
      setLoadingServices(true);
      const response = await GalleryService.getGalleryItems(
        token || '',
        1,
        100, // Get all services
        undefined, // category
        undefined, // search
        undefined, // minPrice
        undefined, // maxPrice
        undefined, // startDate
        undefined, // endDate
        'createdAt',
        'desc',
        undefined, // visibilityToPublic
        undefined, // industryId
        undefined, // categoryId
        undefined, // locationIndex
        'service' // itemType - filter for services only
      );

      if (response.success && response.data) {
        // Map GalleryItem to GalleryServiceItem with actualAmount calculation
        const services: GalleryServiceItem[] = response.data.items.map((item: any) => ({
          _id: item._id,
          name: item.name,
          description: item.description,
          itemType: item.itemType,
          priceInDollars: item.priceInDollars,
          actualAmount: item.actualAmount || item.priceInDollars,
          categoryName: item.categoryName,
          industryName: item.industryName,
          imageUrl: item.imageUrl
        }));
        setGalleryServices(services);
      }
    } catch (err: any) {
      console.error('Error fetching gallery services:', err);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleViewDetails = async (booking: AdminBooking) => {
    try {
      setSelectedBooking(booking);
      setShowDetailsModal(true);
      
      // Fetch latest booking details
      const response = await BookingAdminService.getAdminBooking(booking.bookingId);
      if (response.success) {
        setSelectedBooking(response.data.booking);
      }

      // Fetch service providers for assignment
      const providersResponse = await BookingAdminService.getServiceProviders();
      if (providersResponse.success) {
        setServiceProviders(providersResponse.data.providers);
      }
    } catch (err: any) {
      console.error('Error fetching booking details:', err);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      if (!selectedBooking || !newStatus) {
        setStepError('Please select a status');
        return;
      }

      setUpdatingStatus(true);
      
      const response = await BookingAdminService.updateBookingStatus(
        selectedBooking.bookingId,
        {
          status: newStatus,
          newDate: newDate || undefined,
          newTime: newTime || undefined,
          adminNotes: adminNotes || undefined
        }
      );

      if (response.success) {
        // Fetch updated booking details
        const bookingResponse = await BookingAdminService.getAdminBooking(selectedBooking.bookingId);
        if (bookingResponse.success) {
          setSelectedBooking(bookingResponse.data.booking);
        }
        setShowStatusUpdateModal(false);
        // Refresh bookings list
        fetchBookings();
        
        // If status is accepted, show inline success message
        if (newStatus === 'accepted') {
          setAcceptSuccessMessage(`Task accepted successfully! Customer details are now available.`);
          // Clear message after 5 seconds
          setTimeout(() => setAcceptSuccessMessage(null), 5000);
        }
        
        // Reset form
        setNewStatus('');
        setNewDate('');
        setNewTime('');
        setAdminNotes('');
      } else {
        setStepError(response.message || 'Failed to update booking status');
      }
    } catch (err: any) {
      console.error('Error updating booking status:', err);
      setStepError(err.message || 'Failed to update booking status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCreateBooking = async () => {
    try {
      setCreatingBooking(true);
      setStepError(null);

      if (!selectedServiceId || !selectedSlot) {
        setStepError('Please select service and time slot');
        return;
      }

      if (customerType === 'existing' && !selectedCustomer) {
        setStepError('Please select a customer');
        return;
      }

      if (customerType === 'external' && (!externalCustomerName || !externalCustomerEmail)) {
        setStepError('Please provide customer name and email');
        return;
      }

      // Debug logging
      console.log('Creating booking with customer:', {
        customerType,
        selectedCustomer,
        customerId: selectedCustomer?.customUserId
      });

      if (customerType === 'existing' && !selectedCustomer?.customUserId) {
        setStepError('Selected customer is missing ID. Please select the customer again.');
        return;
      }

      const location = {
        type: selectedLocationType as any,
        address: locationAddress || undefined,
        whatsappLocationUrl: whatsappUrl || undefined
      };

      const bookingData: CreateAdminBookingRequest = {
        serviceId: selectedServiceId,
        serviceName: selectedServiceName,
        servicePrice: selectedServicePrice,
        customerType,
        customerId: customerType === 'existing' ? selectedCustomer?.customUserId : undefined,
        customerName: customerType === 'external' ? externalCustomerName : selectedCustomer?.name,
        customerEmail: customerType === 'external' ? externalCustomerEmail : selectedCustomer?.email,
        customerPhone: customerType === 'external' ? externalCustomerPhone : selectedCustomer?.phoneNumber,
        primarySlot: selectedSlot,
        guests: guests.length > 0 ? guests : undefined,
        location,
        customerNotes: customerNotes || undefined,
        serviceProviderId: selectedProvider?.id,
        processPayment,
        paymentType: processPayment ? paymentType : undefined,
        upfrontPercentage: processPayment && paymentType === 'upfront' ? upfrontPercentage : undefined
      };

      console.log('Booking data being sent:', bookingData);

      const response = await BookingAdminService.createAdminBooking(bookingData);

      if (response.success) {
        setCreatedBooking(response.data.booking);
      } else {
        setStepError(response.message || 'Failed to create booking');
      }
    } catch (err: any) {
      console.error('Error creating booking:', err);
      console.error('Error details:', {
        message: err.message,
        customerType,
        customerId: selectedCustomer?.customUserId,
        customerName: selectedCustomer?.name
      });
      setStepError(err.message || 'Failed to create booking');
    } finally {
      setCreatingBooking(false);
    }
  };

  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '₦0.00';
    }
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getLocationLabel = (type: string): string => {
    const labels: Record<string, string> = {
      merchant_location: 'Provider Location',
      customer_address: 'Customer Address',
      new_address: 'Custom Address',
      whatsapp_location: 'WhatsApp Location'
    };
    return labels[type] || type;
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const resetCreateFlow = () => {
    setViewMode('list');
    setCurrentStep('service-date');
    setSelectedServiceId('');
    setSelectedServiceName('');
    setSelectedServicePrice(0);
    setSelectedDate('');
    setSelectedSlot('');
    setSelectedCustomer(null);
    setSelectedProvider(null);
    setGuests([]);
    setCustomerNotes('');
    setSelectedLocationType('');
    setLocationAddress('');
    setWhatsappUrl('');
    setCreatedBooking(null);
    setStepError(null);
  };

  const canProceedToNextStep = (): boolean => {
    switch (currentStep) {
      case 'service-date':
        return !!(selectedServiceId && selectedDate && selectedSlot);
      case 'customer':
        if (customerType === 'existing') return !!selectedCustomer;
        return !!(externalCustomerName && externalCustomerEmail);
      case 'details':
        return true;
      case 'location':
        if (selectedLocationType === 'new_address') return !!locationAddress;
        if (selectedLocationType === 'whatsapp_location') return !!whatsappUrl;
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    const steps: BookingStep[] = ['service-date', 'customer', 'details', 'location', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: BookingStep[] = ['service-date', 'customer', 'details', 'location', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  // Loading state
  if (loading && viewMode === 'list') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && viewMode === 'list') {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchBookings}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Create booking flow
  if (viewMode === 'create') {
    return <BookingCreateFlow token={token} onCancel={resetCreateFlow} onSuccess={fetchBookings} />;
  }

  // List view
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Management</h1>
            <p className="text-gray-600">View and manage all service bookings</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setViewMode('create')}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create New Booking
            </button>
          </div>
        </div>

        {/* Inline Success Message */}
        {acceptSuccessMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-green-800 font-medium">{acceptSuccessMessage}</p>
            </div>
            <button
              onClick={() => setAcceptSuccessMessage(null)}
              className="text-green-600 hover:text-green-800"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Summary Cards */}
        <SummaryCards
          bookings={bookings}
          totalBookings={totalBookings}
          acceptedTasksCount={acceptedTasksCount}
        />

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'all' as TabType, label: 'All Bookings', count: totalBookings },
                { id: 'pending' as TabType, label: 'Pending' },
                { id: 'confirmed' as TabType, label: 'Confirmed' },
                { id: 'accepted' as TabType, label: 'Accepted' },
                { id: 'rejected' as TabType, label: 'Rejected' },
                { id: 'completed' as TabType, label: 'Completed' },
              ].map(({ id, label, count }) => (
                <button
                  key={id}
                  onClick={() => {
                    setActiveTab(id);
                    setCurrentPage(1);
                  }}
                  className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors ${
                    activeTab === id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {label}
                  {count !== undefined && count > 0 && (
                    <span className="ml-1 text-xs">({count})</span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <label className="text-sm text-gray-600">From:</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">To:</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              {(dateFrom || dateTo) && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Persons</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.length === 0 && activeTab !== 'accepted' && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                      No bookings found
                    </td>
                  </tr>
                )}

                {activeTab !== 'accepted' && bookings.map((booking, index) => (
                  <tr key={booking._id || booking.bookingId || index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono text-xs">{booking.bookingId}</td>
                    <td className="px-4 py-3 text-sm">{booking.serviceName}</td>
                    <td className="px-4 py-3 text-sm">
                      <div>
                        <p className="font-medium">{booking.customer.name}</p>
                        <p className="text-xs text-gray-500">{booking.customer.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{new Date(booking.bookingDate).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })} {booking.bookingTime}</td>
                    <td className="px-4 py-3 text-sm text-center">{booking.totalPersons}</td>
                    <td className="px-4 py-3 text-sm font-medium">{formatCurrency(booking.totalAmount)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center gap-1 text-xs">
                        <MapPin className="w-3 h-3" />
                        {getLocationLabel(booking.location?.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(booking.bookingStatus)}`}>
                        {booking.bookingStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleViewDetails(booking)}
                        className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && activeTab !== 'accepted' && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalBookings)} of {totalBookings} results
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Accepted Tasks Table - Below the bookings table when accepted tab is active */}
        {activeTab === 'accepted' && (
          <div className="mt-6">
            <AcceptedTasksTable />
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedBooking(null);
          }}
          onUpdateStatus={(booking) => {
            setSelectedBooking(booking);
            setNewStatus(booking.bookingStatus);
            setShowStatusUpdateModal(true);
          }}
          formatCurrency={formatCurrency}
          getLocationLabel={getLocationLabel}
          getStatusBadge={getStatusBadge}
        />
      )}

      {/* Status Update Modal */}
      {showStatusUpdateModal && selectedBooking && (
        <StatusUpdateModal
          booking={selectedBooking}
          newStatus={newStatus}
          newDate={newDate}
          newTime={newTime}
          adminNotes={adminNotes}
          updatingStatus={updatingStatus}
          onStatusChange={setNewStatus}
          onDateChange={setNewDate}
          onTimeChange={setNewTime}
          onNotesChange={setAdminNotes}
          onUpdate={handleUpdateStatus}
          onCancel={() => {
            setShowStatusUpdateModal(false);
            setNewStatus('');
            setNewDate('');
            setNewTime('');
            setAdminNotes('');
          }}
          getStatusBadge={getStatusBadge}
        />
      )}
    </div>
  );
};

export default AdminBookingsPage;
