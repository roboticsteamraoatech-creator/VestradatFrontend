import { HttpService } from './HttpService';
import { routes } from './apiRoutes';

export interface UserProfile {
  id?: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  organizationId?: string;
  organizationName?: string;
  country?: string;
  industryId?: string;
  industryName?: string;
  isVerified?: boolean;
  status?: string;
}

export class ProfileService {
  private httpService: HttpService;

  constructor() {
    this.httpService = new HttpService();
  }

  // Get user profile
  async getProfile(): Promise<UserProfile> {
    try {
      const response = await this.httpService.getData<any>(routes.getUserProfile());
      const data: any = response.data || response;
      
      // Handle different response structures
      let profileData: any = data.user || data.data?.user || data.data || data;
      
      // Ensure firstName and lastName are available
      if (profileData.fullName && profileData.fullName.trim() && !profileData.firstName && !profileData.lastName) {
        const [firstName, ...lastNameParts] = profileData.fullName.split(' ');
        const lastName = lastNameParts.join(' ');
        profileData = {
          ...profileData,
          firstName: firstName || '',
          lastName: lastName || ''
        };
      } else if (!profileData.firstName && !profileData.lastName) {
        // If fullName is empty, try to extract from email
        const emailName = profileData.email?.split('@')[0] || '';
        profileData = {
          ...profileData,
          firstName: emailName,
          lastName: ''
        };
      }
      
      // Ensure userId is available
      if (profileData.id && !profileData.userId) {
        profileData = {
          ...profileData,
          userId: profileData.id
        };
      }
      
      return profileData as UserProfile;
    } catch (error: any) {
      // Log the error for debugging
      console.error('Profile API error:', error);
      
      // If it's a 404 error, return a default profile object instead of throwing
      if (error.message && (error.message.includes('404') || error.message.includes('Route not found'))) {
        console.warn('Profile endpoint not found, returning default profile');
        return {
          firstName: 'User',
          lastName: '',
          email: '',
          phoneNumber: '',
          role: 'user',
          fullName: 'User'
        } as UserProfile;
      }
      
      // For other errors, re-throw
      throw error;
    }
  }

  // Update user profile
  async updateProfile(data: Partial<UserProfile>) {
    return this.httpService.putData(data, routes.updateUserProfile());
  }
}