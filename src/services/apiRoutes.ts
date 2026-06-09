

export const routes = {
  // User profile routes
  getUserProfile: () => '/api/auth/profile',
  updateUserProfile: () => '/api/auth/profile',
  
  // Manual measurement routes
  getManualMeasurementForms: () => '/api/manual-measurements/forms',
  createManualMeasurement: () => '/api/manual-measurements',
  
  // Auth routes
  login: () => '/api/auth/login',
  register: () => '/api/auth/register',
  verifyOtp: () => '/api/auth/verify-otp',
  resendOtp: () => '/api/auth/resend-otp',
  
  // Organization routes
  registerOrganization: () => '/api/organisations/register',
  
  // Measurements routes
  getMeasurements: () => '/api/measurements',
  getMeasurementById: (id: string) => `/api/measurements/${id}`,
  
  // Admin user management routes
  createAdminUser: () => '/api/admin/users',
  getAdminUsers: (page: number = 1, limit: number = 10) => `/api/admin/users?page=${page}&limit=${limit}`,
  getAdminUserById: (userId: string) => `/api/admin/users/${userId}`,
  getAdminUsersByStatus: (status: string, page: number = 1, limit: number = 10) => `/api/admin/users/status/${status}?page=${page}&limit=${limit}`,
  generateCustomUserId: (userId: string) => `/api/admin/users/${userId}/generate-id`,
  updateAdminUser: (userId: string) => `/api/admin/users/${userId}`,
  updateAdminUserPassword: (userId: string) => `/api/admin/users/${userId}/password`,
  updateAdminUserStatus: (userId: string) => `/api/admin/users/${userId}/status`,
  getAvailablePermissions: () => '/api/admin/permissions',
  assignUserPermissions: (userId: string) => `/api/admin/users/${userId}/permissions`,
  getUserPermissions: (userId: string) => `/api/admin/users/${userId}/permissions`,
  deleteAdminUser: (userId: string) => `/api/admin/users/${userId}`,
  
  // Admin role management routes
  createRole: () => '/api/admin/roles',
  getRoles: () => '/api/admin/roles',
  getRoleById: (roleId: string) => `/api/admin/roles/${roleId}`,
  updateRole: (roleId: string) => `/api/admin/roles/${roleId}`,
  deleteRole: (roleId: string) => `/api/admin/roles/${roleId}`,
  assignRoleToUsers: (roleId: string) => `/api/admin/roles/${roleId}/assign`,
  unassignRoleFromUsers: (roleId: string) => `/api/admin/roles/${roleId}/unassign`,
  getUsersByRole: (roleId: string) => `/api/admin/roles/${roleId}/users`,
  getRolesWithPagination: (page: number = 1, limit: number = 10) => `/api/admin/roles?page=${page}&limit=${limit}`,
  
  // Admin group management routes
  createGroup: () => '/api/admin/groups',
  getGroups: () => '/api/admin/groups',
  getGroupById: (groupId: string) => `/api/admin/groups/${groupId}`,
  updateGroup: (groupId: string) => `/api/admin/groups/${groupId}`,
  deleteGroup: (groupId: string) => `/api/admin/groups/${groupId}`,
  manageGroupMembers: (groupId: string) => `/api/admin/groups/${groupId}/members`,
  getGroupsWithPagination: (page: number = 1, limit: number = 10) => `/api/admin/groups?page=${page}&limit=${limit}`,
  
  // Admin measurements routes
  getAdminMeasurements: (page: number = 1, limit: number = 10, userId?: string) => {
    let url = `/api/admin/measurements?page=${page}&limit=${limit}`;
    if (userId) {
      url += `&userId=${userId}`;
    }
    return url;
  },
  createAdminMeasurement: () => '/api/admin/measurements',
  getAdminMeasurementById: (measurementId: string) => `/api/admin/measurements/${measurementId}`,
  updateAdminMeasurement: (measurementId: string) => `/api/admin/measurements/${measurementId}`,
  deleteAdminMeasurement: (measurementId: string) => `/api/admin/measurements/${measurementId}`,
  
  // Admin dashboard routes
  getAdminDashboardStats: () => '/api/admin/dashboard/stats',
  
  // One-time codes routes
  generateOneTimeCode: () => '/api/admin/one-time-codes',
  getOneTimeCodes: (page: number = 1, limit: number = 10) => `/api/admin/one-time-codes?page=${page}&limit=${limit}`,
  sendOneTimeCodeEmail: () => '/api/admin/one-time-codes/send-email',
  validateCode: () => '/api/admin/external/validate-code',
  submitExternalMeasurement: () => '/api/admin/external/measurements',
  

 // For subscription packages
createSubscriptionPackage: () => '/api/subscription-packages',
getSubscriptionPackageById: (id: string) => `/api/subscription-packages/${id}`,
getAllSubscriptionPackage: () => `/api/subscription-packages`, // Remove the id parameter
updateSubscriptionPackage: (id: string) => `/api/subscription-packages/${id}`,
deleteSubscriptionPackage: (id: string) => `/api/subscription-packages/${id}`,
updateSubscriptionStatus: (id: string) => `/api/subscription-packages/${id}/status`,
exportSubscriptionPackages: (format: 'csv' | 'excel' | 'pdf') => `/api/subscription-packages/export/${format}`,

// User subscription status routes
getUserSubscriptionStatus: (userId: string) => `/api/user-subscriptions/user/${userId}/status`,

// Service management routes
createService: () => '/api/services',
getServices: () => '/api/services',
getServiceById: (id: string) => `/api/services/${id}`,
updateService: (id: string) => `/api/services/${id}`,
deleteService: (id: string) => `/api/services/${id}`,

  // Super Admin dashboard routes
  getSuperAdminDashboardStats: () => '/api/super-admin/dashboard/stats',
  getSuperAdminDashboardAnalytics: () => '/api/super-admin/dashboard/analytics',
  
  // Super Admin customer management routes
  superAdmin: {
    customers: '/api/super-admin/customers',
    customerById: (id: string) => `/api/super-admin/customers/${id}`,
    customerStatus: (id: string) => `/api/super-admin/customers/${id}/status`,
    resetCustomerPassword: (id: string) => `/api/super-admin/customers/${id}/reset-password`,
    exportCustomers: (format: 'csv' | 'excel' | 'pdf') => `/api/super-admin/customers/export/${format}`,
  },


  



  // Module management routes
  getModules: (search?: string, status?: 'active' | 'inactive') => {
    let url = '/api/super-admin/modules';
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    const paramString = params.toString();
    return paramString ? `${url}?${paramString}` : url;
  },
  getModuleById: (id: string) => `/api/super-admin/modules?id=${id}`,
  createModule: () => '/api/super-admin/modules',
  updateModule: (id: string) => `/api/super-admin/modules`,
  deleteModule: (id: string) => `/api/super-admin/modules?id=${id}`,
  
  // Verified subscription management routes
  getVerifiedSubscriptions: (search?: string) => {
    let url = '/api/super-admin/verified-subscriptions';
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    const paramString = params.toString();
    return paramString ? `${url}?${paramString}` : url;
  },
  getVerifiedSubscriptionById: (id: string) => `/api/super-admin/verified-subscriptions/${id}`,
  createVerifiedSubscription: () => '/api/super-admin/verified-subscriptions',
  updateVerifiedSubscription: (id: string) => `/api/super-admin/verified-subscriptions/${id}`,
  deleteVerifiedSubscription: (id: string) => `/api/super-admin/verified-subscriptions/${id}`,
  
  // City region management routes
  getCityRegions: (page: number = 1, limit: number = 10, search?: string, sortBy?: string, sortOrder?: 'asc' | 'desc', status?: 'active' | 'inactive') => {
    let url = `/api/super-admin/locations?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (sortBy) url += `&sortBy=${sortBy}`;
    if (sortOrder) url += `&sortOrder=${sortOrder}`;
    if (status) url += `&status=${status}`;
    return url;
  },
  getCityRegionById: (id: string) => `/api/super-admin/locations/${id}`,
  createCityRegion: () => '/api/super-admin/locations',
  updateCityRegion: (id: string) => `/api/super-admin/locations/${id}`,
  deleteCityRegion: (id: string) => `/api/super-admin/locations/${id}`,
  updateCityRegionStatus: (id: string) => `/api/super-admin/locations/${id}`,
  exportCityRegions: (format: 'csv' | 'excel' | 'pdf') => `/api/super-admin/locations/export/${format}`,
  
  scanMeasurements: () => '/api/measurements/scan',
  
  // Gallery management routes
  gallery: {
    base: '/api/admin/gallery',
    item: (id: string) => `/api/admin/gallery/${id}`,
    uploadImage: (id: string) => `/api/admin/gallery/${id}/upload-image`,
    uploadVideo: (id: string) => `/api/admin/gallery/${id}/upload-video`,
    categories: '/api/admin/gallery/categories',
    mediaUsage: '/api/admin/gallery/media-usage'
  },
  
  // Admin booking management routes
  adminBooking: {
    availableDays: '/api/admin/booking/available-days',
    availableSlots: '/api/admin/booking/available-slots',
    organizationUsers: '/api/admin/booking/organization-users',
    serviceProviders: '/api/admin/booking/service-providers',
    locationOptions: '/api/admin/booking/location-options',
    validateLocation: '/api/admin/booking/validate-location',
    createBooking: '/api/admin/booking/create',
  },
  
    getDefaultPricing: (page?: number, limit?: number, country?: string, state?: string) => {
    let url = '/api/super-admin/default-pricing';
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    if (country) params.append('country', country);
    if (state) params.append('state', state);
    const paramString = params.toString();
    return paramString ? `${url}?${paramString}` : url;
  },
  getDefaultPricingById: (id: string) => `/api/super-admin/default-pricing/${id}`,
  createDefaultPricing: () => '/api/super-admin/default-pricing',
  updateDefaultPricing: (id: string) => `/api/super-admin/default-pricing/${id}`,
  deleteDefaultPricing: (id: string) => `/api/super-admin/default-pricing/${id}`,



   getIndustries: (search?: string, status?: 'active' | 'inactive') => {
    let url = '/api/super-admin/industries';
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    const paramString = params.toString();
    return paramString ? `${url}?${paramString}` : url;
  },
  getIndustryById: (id: string) => `/api/super-admin/industries/${id}`,
  createIndustry: () => '/api/super-admin/industries',
  updateIndustry: (id: string) => `/api/super-admin/industries/${id}`,
  deleteIndustry: (id: string) => `/api/super-admin/industries/${id}`,
  updateIndustryStatus: (id: string) => `/api/super-admin/industries/${id}/status`,
  exportIndustries: (format: 'csv' | 'excel' | 'pdf') => `/api/super-admin/industries/export/${format}`,

};

// Log gallery routes for debugging
