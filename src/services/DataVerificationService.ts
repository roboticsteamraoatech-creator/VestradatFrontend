import { BASE_URL } from '@/config/api';
interface AssignmentLocation {
  _id: string;
  locationType: string;
  brandName: string;
  country: string;
  state: string;
  lga: string;
  city: string;
  cityRegion: string;
  houseNumber: string;
  street: string;
  landmark: string;
  buildingColor?: string;
  buildingType?: string;
}

interface Assignment {
  _id: string;
  userId: string;
  userName: string;
  organizationId: string;
  organizationName: string;
  targetUserId: string;
  targetUserName: string;
  targetUserEmail: string;
  organizationLocationDetails: AssignmentLocation[];
  status: 'pending' | 'in_progress' | 'completed';
  assignedBy: string;
  assignedAt: string;
  createdAt: string;
  updatedAt: string;
  verificationId?: string;
}

interface AssignmentsResponse {
  success: boolean;
  data: {
    assignments: Assignment[];
    total: number;
  };
  message?: string;
}

interface CreateVerificationData {
  assignmentId?: string;
  country: string;
  state: string;
  lga: string;
  city: string;
  cityRegion: string;
  organizationId: string;
  organizationName: string;
  targetUserId: string;
  targetUserFirstName: string;
  targetUserLastName: string;
  organizationClaimedLocation: {
    locationType: 'headquarters' | 'branch';
    country: string;
    state: string;
    lga: string;
    city: string;
    cityRegion: string;
    houseNumber?: string;
    street?: string;
    landmark?: string;
    buildingColor?: string;
    buildingType?: string;
  };
  organizationDetails: {
    name: string;
    attachments?: File[];
    headquartersAddress?: string;
    addressAttachments?: File[];
  };
  buildingPictures?: {
    frontView?: File;
    sideView?: File;
    interior?: File;
  };
  transportationCost?: {
    amount: number;
    paymentMethod: string;
    receipt?: File;
  };
}

class DataVerificationService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = BASE_URL;
  }

  /**
   * Get all assignments for the current user (Admin/Field Agent)
   */
  async getMyAssignments(token: string): Promise<AssignmentsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/data-verification/assignments/my`, {
        //  const response = await fetch(`${this.baseUrl}/api/data-verification/my-assigned-locations`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching assignments:', error);
      return {
        success: false,
        data: { assignments: [], total: 0 },
        message: 'An error occurred while fetching assignments.'
      };
    }
  }

  /**
   * Get all assignments - Super Admin endpoint
   */
  async getAllAssignments(token: string): Promise<AssignmentsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/super-admin/data-verification/assignments`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching all assignments:', error);
      return {
        success: false,
        data: { assignments: [], total: 0 },
        message: 'An error occurred while fetching all assignments.'
      };
    }
  }

  /**
   * Get pending and in-progress assignments
   */
  async getPendingAssignments(token: string): Promise<AssignmentsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/data-verification/assignments/pending`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching pending assignments:', error);
      return {
        success: false,
        data: { assignments: [], total: 0 },
        message: 'An error occurred while fetching pending assignments.'
      };
    }
  }

  /**
   * Get assignment details by ID
   */
  async getAssignmentById(assignmentId: string, token: string): Promise<{ success: boolean; data?: { assignment: Assignment }; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/data-verification/assignments/${assignmentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching assignment details:', error);
      return {
        success: false,
        message: 'An error occurred while fetching assignment details.'
      };
    }
  }

  /**
   * Create verification from assignment - Field Agent
   */
  async createVerificationFromAssignment(data: CreateVerificationData, token: string): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const formData = new FormData();
      
      // Add basic fields
      if (data.assignmentId) {
        formData.append('assignmentId', data.assignmentId);
      }
      formData.append('country', data.country);
      formData.append('state', data.state);
      formData.append('lga', data.lga);
      formData.append('city', data.city);
      formData.append('cityRegion', data.cityRegion);
      formData.append('organizationId', data.organizationId);
      formData.append('organizationName', data.organizationName);
      formData.append('targetUserId', data.targetUserId);
      formData.append('targetUserFirstName', data.targetUserFirstName);
      formData.append('targetUserLastName', data.targetUserLastName);

      // Add organization claimed location
      formData.append('organizationClaimedLocation', JSON.stringify({
        locationType: data.organizationClaimedLocation.locationType,
        country: data.organizationClaimedLocation.country,
        state: data.organizationClaimedLocation.state,
        lga: data.organizationClaimedLocation.lga,
        city: data.organizationClaimedLocation.city,
        cityRegion: data.organizationClaimedLocation.cityRegion,
        houseNumber: data.organizationClaimedLocation.houseNumber,
        street: data.organizationClaimedLocation.street,
        landmark: data.organizationClaimedLocation.landmark,
        buildingColor: data.organizationClaimedLocation.buildingColor,
        buildingType: data.organizationClaimedLocation.buildingType,
      }));

      // Add organization details
      const orgDetails: any = {
        name: data.organizationDetails.name,
        headquartersAddress: data.organizationDetails.headquartersAddress,
      };
      formData.append('organizationDetails', JSON.stringify(orgDetails));

      // Add organization attachments
      if (data.organizationDetails.attachments) {
        data.organizationDetails.attachments.forEach((file, index) => {
          formData.append(`organizationAttachments`, file);
        });
      }

      // Add address attachments
      if (data.organizationDetails.addressAttachments) {
        data.organizationDetails.addressAttachments.forEach((file, index) => {
          formData.append(`addressAttachments`, file);
        });
      }

      // Add building pictures
      if (data.buildingPictures) {
        if (data.buildingPictures.frontView) {
          formData.append('buildingFrontView', data.buildingPictures.frontView);
        }
        if (data.buildingPictures.sideView) {
          formData.append('buildingSideView', data.buildingPictures.sideView);
        }
        if (data.buildingPictures.interior) {
          formData.append('buildingInterior', data.buildingPictures.interior);
        }
      }

      // Add transportation cost
      if (data.transportationCost) {
        formData.append('transportationCost', JSON.stringify({
          amount: data.transportationCost.amount,
          paymentMethod: data.transportationCost.paymentMethod,
        }));
        if (data.transportationCost.receipt) {
          formData.append('transportationReceipt', data.transportationCost.receipt);
        }
      }

      const response = await fetch(`${this.baseUrl}/api/data-verification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - let browser handle multipart/form-data
        },
        body: formData,
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating verification:', error);
      return {
        success: false,
        message: 'An error occurred while creating verification.'
      };
    }
  }

  /**
   * Get all verifications - Super Admin endpoint (with status filter)
   */
  async getAllVerificationsSuperAdmin(status?: string, token: string = ''): Promise<{ success: boolean; data: { verifications: any[]; total: number }; message?: string }> {
    try {
      const url = status 
        ? `${this.baseUrl}/api/super-admin/data-verification/verifications?status=${status}`
        : `${this.baseUrl}/api/super-admin/data-verification/verifications`;
        
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching verifications:', error);
      return {
        success: false,
        data: { verifications: [], total: 0 },
        message: 'An error occurred while fetching verifications.'
      };
    }
  }

  /**
   * Get verification users - Super Admin endpoint
   */
  async getVerificationUsers(token: string = ''): Promise<{ success: boolean; data: { users: any[]; total: number }; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/super-admin/data-verification/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching verification users:', error);
      return {
        success: false,
        data: { users: [], total: 0 },
        message: 'An error occurred while fetching users.'
      };
    }
  }

  /**
   * Get data verification users - Super Admin endpoint (verification-users)
   */
  async getDataVerificationUsers(token: string = ''): Promise<{ success: boolean; data: { users: any[]; total: number }; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/super-admin/data-verification/verification-users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching data verification users:', error);
      return {
        success: false,
        data: { users: [], total: 0 },
        message: 'An error occurred while fetching verification users.'
      };
    }
  }

  /**
   * Get verification stats - Super Admin endpoint (verification-stats)
   */
  async getVerificationStats(token: string = ''): Promise<{ success: boolean; data: { stats: any }; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/super-admin/data-verification/verification-stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching verification stats:', error);
      return {
        success: false,
        data: { stats: {} },
        message: 'An error occurred while fetching stats.'
      };
    }
  }

  /**
   * Get organizations for assignment - Super Admin endpoint
   */
  async getOrganizationsForAssignment(token: string = ''): Promise<{ success: boolean; data: { organizations: any[] }; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/super-admin/data-verification/organizations`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching organizations:', error);
      return {
        success: false,
        data: { organizations: [] },
        message: 'An error occurred while fetching organizations.'
      };
    }
  }

  /**
   * Create role with assignments - Super Admin endpoint
   */
  async createRoleWithAssignments(data: any, token: string = ''): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/super-admin/data-verification/assignments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating role with assignments:', error);
      return {
        success: false,
        message: 'An error occurred while creating role with assignments.'
      };
    }
  }

  /**
   * Get verification by ID - Staff endpoint
   */
  async getVerificationById(verificationId: string, token: string = ''): Promise<{ success: boolean; data?: { verification: any }; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/data-verification/${verificationId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching verification:', error);
      return {
        success: false,
        message: 'An error occurred while fetching verification details.'
      };
    }
  }

  /**
   * Create verification - Staff endpoint
   */
  async createVerification(data: any, token: string = ''): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const formData = new FormData();
      
      // Append all data fields
      for (const key in data) {
        if (data[key] !== undefined && data[key] !== null) {
          if (key === 'attachments' || key === 'addressAttachments' || key === 'buildingPictures') {
            // Handle file arrays
            if (Array.isArray(data[key])) {
              data[key].forEach((file: File, index: number) => {
                formData.append(key, file);
              });
            }
          } else if (typeof data[key] === 'object' && !(data[key] instanceof File)) {
            // Handle objects
            formData.append(key, JSON.stringify(data[key]));
          } else {
            // Handle primitives
            formData.append(key, data[key]);
          }
        }
      }

      const response = await fetch(`${this.baseUrl}/api/data-verification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating verification:', error);
      return {
        success: false,
        message: 'An error occurred while creating verification.'
      };
    }
  }

  /**
   * Update verification - Staff endpoint
   */
  async updateVerification(verificationId: string, data: any, token: string = ''): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const formData = new FormData();
      
      // Append all data fields
      for (const key in data) {
        if (data[key] !== undefined && data[key] !== null) {
          if (key === 'attachments' || key === 'addressAttachments' || key === 'buildingPictures') {
            // Handle file arrays
            if (Array.isArray(data[key])) {
              data[key].forEach((file: File, index: number) => {
                formData.append(key, file);
              });
            }
          } else if (typeof data[key] === 'object' && !(data[key] instanceof File)) {
            // Handle objects
            formData.append(key, JSON.stringify(data[key]));
          } else {
            // Handle primitives
            formData.append(key, data[key]);
          }
        }
      }

      const response = await fetch(`${this.baseUrl}/api/data-verification/${verificationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error updating verification:', error);
      return {
        success: false,
        message: 'An error occurred while updating verification.'
      };
    }
  }

  /**
   * Submit verification - Staff endpoint
   */
  async submitVerification(verificationId: string, token: string = ''): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/data-verification/${verificationId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error submitting verification:', error);
      return {
        success: false,
        message: 'An error occurred while submitting verification.'
      };
    }
  }

  /**
   * Get all verifications for staff
   */
  async getAllVerifications(token: string = ''): Promise<{ success: boolean; data: { verifications: any[]; total: number }; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/data-verification`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching verifications:', error);
      return {
        success: false,
        data: { verifications: [], total: 0 },
        message: 'An error occurred while fetching verifications.'
      };
    }
  }

  /**
   * Get my verifications - Staff endpoint
   */
  async getMyVerifications(token: string = ''): Promise<{ success: boolean; data: { verifications: any[]; total: number }; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/data-verification/my`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching my verifications:', error);
      return {
        success: false,
        data: { verifications: [], total: 0 },
        message: 'An error occurred while fetching verifications.'
      };
    }
  }

  /**
   * Get organizations - Staff endpoint
   */
  async getOrganizations(token: string = ''): Promise<{ success: boolean; data: { organizations: any[] }; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/organizations`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching organizations:', error);
      return {
        success: false,
        data: { organizations: [] },
        message: 'An error occurred while fetching organizations.'
      };
    }
  }

  /**
   * Get users - Staff endpoint
   */
  async getUsers(token: string = ''): Promise<{ success: boolean; data: { users: any[] }; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching users:', error);
      return {
        success: false,
        data: { users: [] },
        message: 'An error occurred while fetching users.'
      };
    }
  }

  /**
   * Review verification - Super Admin endpoint
   */
  async reviewVerification(verificationId: string, data: { status: string; comments: string }, token: string = ''): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/super-admin/data-verification/verifications/${verificationId}/review`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error reviewing verification:', error);
      return {
        success: false,
        message: 'An error occurred while reviewing verification.'
      };
    }
  }
}

export default DataVerificationService;
