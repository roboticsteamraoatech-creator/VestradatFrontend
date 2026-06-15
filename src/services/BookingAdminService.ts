import { HttpService } from './HttpService';

// ============ INTERFACES ============

export interface BookingGuest {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  age?: number;
  slotDateTime: string;
  notes?: string;
}

export interface BookingLocation {
  type: 'merchant_location' | 'customer_address' | 'new_address' | 'whatsapp_location';
  address?: string;
  whatsappLocationUrl?: string;
}

export interface AdminBooking {
  _id: string;
  bookingId: string;
  orderId: string;
  taskId: string;
  serviceName: string;
  serviceId: string;
  serviceImage?: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    customUserId: string | null;
  };
  bookingDate: string;
  bookingTime: string;
  duration: number;
  location: BookingLocation;
  bookedForPersons: BookingGuest[];
  totalPersons: number;
  notes: string;
  bookingStatus: string;
  orderStatus: string;
  paymentStatus: string;
  totalAmount: number;
  amountPaid: number;
  assignedProviders: string[];
  hasAssignedProvider: boolean;
  createdAt: string;
  updatedAt: string;
  bookedByAdmin: boolean;
  itemType: string;
}

export interface AdminBookingsResponse {
  success: boolean;
  data: {
    bookings: AdminBooking[];
    total: number;
    pagination: {
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  message?: string;
}

export interface AcceptedTask {
  sn: number;
  taskId: string;
  serviceName: string;
  serviceProvider: string;
  providerId: string;
  customerFullName: string;
  customerId: string;
  date: string;
  time: string;
  duration: number;
  fee: number;
  acceptedAt: string;
}

export interface AcceptedTasksResponse {
  success: boolean;
  data: {
    tasks: AcceptedTask[];
    total: number;
  };
  message?: string;
}

export interface AvailableSlot {
  datetime: string;
  time: string;
  displayTime: string;
}

export interface AvailableSlotsResponse {
  success: boolean;
  data: {
    date: string;
    slots: AvailableSlot[];
    total: number;
  };
  message?: string;
}

export interface OrganizationUser {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  customUserId: string;
  phoneNumber?: string;
  status: string;
}

export interface OrganizationUsersResponse {
  success: boolean;
  data: {
    users: OrganizationUser[];
    total: number;
    pagination: {
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  message?: string;
}

export interface ServiceProvider {
  id: string;
  providerId: string;
  name: string;
  email: string;
  phoneNumber?: string;
  specialties: string[];
  rating: number;
  completedTasks: number;
  totalBookings: number;
  isAvailable: boolean;
  availabilityHours: string;
  maxConcurrentBookings: number;
  serviceProviderFee: number;
  serviceProviderFeeCurrency: string;
  serviceProviderFeeFrequency: string;
}

export interface ServiceProvidersResponse {
  success: boolean;
  data: {
    providers: ServiceProvider[];
    total: number;
  };
  message?: string;
}

export interface LocationOption {
  type: string;
  label: string;
  address?: string;
  organizationName?: string;
  description?: string;
  requiresInput: boolean;
  inputType?: string;
  placeholder?: string;
}

export interface LocationOptionsResponse {
  success: boolean;
  data: {
    organizationName: string;
    locationOptions: {
      merchantLocation: LocationOption;
      customerAddress: LocationOption;
      newAddress: LocationOption;
      whatsappLocation: LocationOption;
    };
    defaultOption: string;
  };
  message?: string;
}

export interface CreateAdminBookingRequest {
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  customerType: 'existing' | 'external';
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  primarySlot: string;
  guests?: Array<{ name: string; email: string; slotDateTime: string; notes?: string }>;
  location: BookingLocation;
  customerNotes?: string;
  serviceProviderId?: string;
  paymentType?: 'upfront' | 'full';
  upfrontPercentage?: number;
  processPayment?: boolean;
  redirect_url?: string;
}

export interface CreateAdminBookingResponse {
  success: boolean;
  data: {
    booking: {
      orderId?: string;
      paymentLink?: string;
      transactionId?: string;
      amount?: number;
      paymentType?: string;
      bookingId?: string;
      taskId?: string;
      status: string;
      slotDateTime: string;
      totalPersons: number;
      fee: number;
      location: BookingLocation;
      assignedProvider?: string;
    };
  };
  message?: string;
}

export interface UpdateBookingStatusRequest {
  status: string;
  newDate?: string;
  newTime?: string;
  adminNotes?: string;
}

export interface UpdateBookingStatusResponse {
  success: boolean;
  data: {
    booking: AdminBooking;
  };
  message?: string;
}

// ============ SERVICE CLASS ============

class BookingAdminService {
  /**
   * Get all admin bookings with pagination and filters
   */
  static async getAdminBookings(
    page: number = 1,
    limit: number = 20,
    status?: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<AdminBookingsResponse> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (status) queryParams.append('status', status);
    if (dateFrom) queryParams.append('dateFrom', dateFrom);
    if (dateTo) queryParams.append('dateTo', dateTo);

    return HttpService.get<AdminBookingsResponse>(
      `/api/admin/bookings?${queryParams.toString()}`
    );
  }

  /**
   * Get accepted tasks from service provider tasks
   */
  static async getAcceptedTasks(): Promise<AcceptedTasksResponse> {
    return HttpService.get<AcceptedTasksResponse>(
      '/api/service-provider-tasks/admin/report/accepted'
    );
  }

  /**
   * Get single booking details
   */
  static async getAdminBooking(bookingId: string): Promise<{ success: boolean; data: { booking: AdminBooking }; message?: string }> {
    return HttpService.get<{ success: boolean; data: { booking: AdminBooking }; message?: string }>(
      `/api/admin/bookings/${bookingId}`
    );
  }

  /**
   * Update booking status
   */
  static async updateBookingStatus(
    bookingId: string,
    data: UpdateBookingStatusRequest
  ): Promise<UpdateBookingStatusResponse> {
    return HttpService.put<UpdateBookingStatusResponse>(
      `/api/admin/bookings/${bookingId}/status`,
      data
    );
  }

  /**
   * Get available days for booking
   */
  static async getAvailableDays(
    month: number,
    year: number,
    serviceId?: string
  ): Promise<{ success: boolean; data: { availableDays: string[] }; message?: string }> {
    const queryParams = new URLSearchParams({
      month: month.toString(),
      year: year.toString()
    });
    
    if (serviceId) queryParams.append('serviceId', serviceId);

    return HttpService.get<{ success: boolean; data: { availableDays: string[] }; message?: string }>(
      `/api/admin/booking/available-days?${queryParams.toString()}`
    );
  }

  /**
   * Get available time slots for a specific date
   */
  static async getAvailableSlots(
    date: string,
    serviceId?: string
  ): Promise<AvailableSlotsResponse> {
    const queryParams = new URLSearchParams({ date });
    
    if (serviceId) queryParams.append('serviceId', serviceId);

    return HttpService.get<AvailableSlotsResponse>(
      `/api/admin/booking/available-slots?${queryParams.toString()}`
    );
  }

  /**
   * Get organization users for customer selection
   */
  static async getOrganizationUsers(
    search?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<OrganizationUsersResponse> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    
    if (search) queryParams.append('search', search);

    return HttpService.get<OrganizationUsersResponse>(
      `/api/admin/booking/organization-users?${queryParams.toString()}`
    );
  }

  /**
   * Get service providers for manual assignment
   */
  static async getServiceProviders(
    serviceId?: string
  ): Promise<ServiceProvidersResponse> {
    const queryParams = new URLSearchParams();
    
    if (serviceId) queryParams.append('serviceId', serviceId);

    const queryString = queryParams.toString();
    const url = `/api/admin/booking/service-providers${queryString ? `?${queryString}` : ''}`;

    return HttpService.get<ServiceProvidersResponse>(url);
  }

  /**
   * Get location options for booking
   */
  static async getLocationOptions(
    serviceId?: string
  ): Promise<LocationOptionsResponse> {
    const queryParams = new URLSearchParams();
    
    if (serviceId) queryParams.append('serviceId', serviceId);

    const queryString = queryParams.toString();
    const url = `/api/admin/booking/location-options${queryString ? `?${queryString}` : ''}`;

    return HttpService.get<LocationOptionsResponse>(url);
  }

  /**
   * Create admin booking with optional payment processing
   */
  static async createAdminBooking(
    data: CreateAdminBookingRequest
  ): Promise<CreateAdminBookingResponse> {
    return HttpService.post<CreateAdminBookingResponse>(
      '/api/admin/booking/create',
      data
    );
  }

  /** GET /api/service-provider-assignment/detailed */
  static async getDetailedServiceProviders(): Promise<any> {
    return HttpService.get<any>('/api/service-provider-assignment/detailed');
  }

  /** POST /api/admin/booking/validate-location */
  static async validateLocation(payload: {
    locationType: string;
    address?: string;
    whatsappLocationUrl?: string;
    customerEmail?: string;
  }): Promise<{ success: boolean; message?: string }> {
    return HttpService.post<{ success: boolean; message?: string }>(
      '/api/admin/booking/validate-location',
      payload
    );
  }

  /** GET /api/admin/booking/services/:serviceId/sub-services */
  static async getSubServices(serviceId: string): Promise<any> {
    return HttpService.get<any>(`/api/admin/booking/services/${serviceId}/sub-services`);
  }

  /** POST /api/admin/booking/calculate-pricing */
  static async calculatePricing(payload: {
    serviceId: string;
    bookedForPersons: Array<{ name: string; selectedSubServices: Array<{ subServiceId: string; name: string; price: number }> }>;
    paymentType: 'upfront' | 'full';
    upfrontPercentage: number;
  }): Promise<any> {
    return HttpService.post<any>('/api/admin/booking/calculate-pricing', payload);
  }
}

export default BookingAdminService;
