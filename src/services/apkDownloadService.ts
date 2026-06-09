import { BASE_URL } from '@/config/api';


interface SignupAndDownloadPayload {
  email: string;
  password: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role?: "CUSTOMER" | "ORGANIZATION" | "SERVICE_PROVIDER" | "TAILOR" | "ADMIN";
  organizationName?: string;
  country?: string;
  industryId?: string;
  industryName?: string;
  platform: "android" | "ios";
}

interface Industry {
  id: string;
  name: string;
  description?: string;
}

interface SignupAndDownloadResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      fullName: string;
      role: string;
      isVerified: boolean;
      status: string;
    };
    message: string;
    jwtToken?: string;
    downloadUrl: string;
    platform: "android" | "ios";
    otpExpiresAt: string;
    otpExpiresIn: string;
    maxAttempts: number;
    remainingAttempts: number;
    requiresVerification: boolean;
    nextStep: string;
  };
  message?: string;
}

interface IndustriesResponse {
  success: boolean;
  data: {
    industries: Industry[];
  };
  message?: string;
}

interface DownloadStatsResponse {
  success: boolean;
  data: {
    totalDownloads: number;
    uniqueUsers: number;
    androidDownloads: number;
    iosDownloads: number;
    downloadsToday: number;
    downloadsThisWeek: number;
    downloadsThisMonth: number;
    roleBreakdown: Record<string, number>;
    message?: string;
  };
  message?: string;
}

export interface DownloadRecord {
  _id: string;
  userId: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  platform: 'android' | 'ios';
  deviceInfo: string;
  ipAddress: string;
  downloadedAt: string;
  signupSource: string;
  userRole: string;
  userStatus: string;
  isVerified: boolean;
}

export interface DownloadListFilters {
  page?: number;
  limit?: number;
  platform?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
}

interface DownloadListResponse {
  success: boolean;
  data: {
    downloads: DownloadRecord[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
    message?: string;
  };
  message?: string;
}

interface LoginAndDownloadPayload {
  email: string;
  password: string;
  platform: "android" | "ios";
}

interface LoginAndDownloadResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      fullName: string;
      role: string;
      isVerified: boolean;
      status: string;
    };
    message: string;
    jwtToken: string;
    downloadUrl: string;
    platform: "android" | "ios";
  };
  message?: string;
}

export class ApkDownloadService {
  private baseUrl: string;

  constructor() {
    // Use environment variable with fallback
    this.baseUrl =  BASE_URL;
    
    // Log the base URL for debugging (only in development)
  
      console.log('[ApkDownloadService] Base URL:', this.baseUrl);
    
  }

  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const fullUrl = `${this.baseUrl}${url}`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ApkDownloadService] Making request to: ${fullUrl}`);
    }
    
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json();
        throw new Error(error.message || `Request failed: ${response.status}`);
      } else {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Invalid response from server. Please try again.");
    }

    return response.json();
  }

  async signupAndDownload(
    payload: SignupAndDownloadPayload
  ): Promise<SignupAndDownloadResponse> {
    return this.request<SignupAndDownloadResponse>("/api/apk-download/signup-and-download", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getIndustries(): Promise<IndustriesResponse> {
    try {
      const response = await this.request<IndustriesResponse>("/api/auth/industries", {
        method: "GET",
      });
      return response;
    } catch (error) {
      console.error("[ApkDownloadService] Failed to fetch industries:", error);
      // Return a fallback response instead of throwing
      return {
        success: false,
        data: {
          industries: []
        },
        message: error instanceof Error ? error.message : "Failed to fetch industries"
      };
    }
  }

  triggerDownload(downloadUrl: string, platform: "android" | "ios"): void {
    if (platform === "ios") {
      // For iOS, open in new tab (App Store link)
      window.open(downloadUrl, "_blank");
    } else {
      // For Android, trigger download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "vestradat-app.apk";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  async loginAndDownload(
    payload: LoginAndDownloadPayload
  ): Promise<LoginAndDownloadResponse> {
    return this.request<LoginAndDownloadResponse>("/api/apk-download/login-and-download", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getDownloadStats(token: string): Promise<DownloadStatsResponse> {
    return this.request<DownloadStatsResponse>("/api/apk-download/stats", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getDownloadList(token: string, filters: DownloadListFilters = {}): Promise<DownloadListResponse> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.platform) params.append('platform', filters.platform);
    if (filters.role) params.append('role', filters.role);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<DownloadListResponse>(`/api/apk-download/list${query}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}

export const apkDownloadService = new ApkDownloadService();