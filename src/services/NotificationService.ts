import { HttpService } from './HttpService';
import { BASE_URL } from '@/config/api';

export interface AdminNotification {
  _id: string;
  organizationId: string;
  type: 'task_accepted' | 'task_rejected' | 'task_completed' | 'all_providers_rejected';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data: {
    taskId?: string;
    serviceName?: string;
    provider?: {
      userId: string;
      name: string;
      email: string;
      phone: string;
    };
    service?: {
      name: string;
      date: string;
      time: string;
      duration: number;
      location: string;
      notes: string;
    };
    customer?: {
      firstName: string;
      fullName?: string;
      email?: string;
      phone?: string;
      customerId: string;
    };
    financials?: {
      totalFee: number;
      providerFee: number;
      settlementStatus?: string;
    };
    rejectionReason?: string;
  };
}

export interface NotificationResponse {
  notifications: AdminNotification[];
  total: number;
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export class NotificationService {
  private static httpService = new HttpService();

  /**
   * Fetch paginated notifications for the admin's organization
   */
  static async getNotifications(
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<{ success: boolean; data?: NotificationResponse; message?: string }> {
    try {
      const url = `/api/admin/notifications?page=${page}&limit=${limit}&unreadOnly=${unreadOnly}`;
      const response = await this.httpService.getData<{ success: boolean; data: NotificationResponse }>(url);

      if (response.success) {
        return {
          success: true,
          data: response.data
        };
      }

      return {
        success: false,
        message: 'Failed to fetch notifications'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'An unexpected error occurred'
      };
    }
  }

  /**
   * Get unread notification count for bell badge
   */
  static async getUnreadCount(): Promise<{ success: boolean; data?: UnreadCountResponse; message?: string }> {
    try {
      const response = await this.httpService.getData<{ success: boolean; data: UnreadCountResponse }>(
        '/api/admin/notifications/unread-count'
      );

      if (response.success) {
        return {
          success: true,
          data: response.data
        };
      }

      return {
        success: false,
        message: 'Failed to fetch unread count'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'An unexpected error occurred'
      };
    }
  }

  /**
   * Mark a single notification as read
   */
  static async markAsRead(
    notificationId: string
  ): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const url = `${BASE_URL}/api/admin/notifications/${notificationId}/read`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('userToken') : ''}`
        }
      });

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          data: result.data
        };
      }

      return {
        success: false,
        message: 'Failed to mark notification as read'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'An unexpected error occurred'
      };
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const url = `${BASE_URL}/api/admin/notifications/read-all`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('userToken') : ''}`
        }
      });

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          data: result.data
        };
      }

      return {
        success: false,
        message: 'Failed to mark all notifications as read'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'An unexpected error occurred'
      };
    }
  }

  /**
   * Get notification icon based on type
   */
  static getNotificationIcon(type: AdminNotification['type']): string {
    switch (type) {
      case 'task_accepted':
        return '✓';
      case 'task_rejected':
        return '✕';
      case 'task_completed':
        return '★';
      case 'all_providers_rejected':
        return '⚠';
      default:
        return '●';
    }
  }

  /**
   * Get notification color based on type
   */
  static getNotificationColor(type: AdminNotification['type']): string {
    switch (type) {
      case 'task_accepted':
        return '#10B981'; // Green
      case 'task_rejected':
        return '#EF4444'; // Red
      case 'task_completed':
        return '#5D2A8B'; // Purple
      case 'all_providers_rejected':
        return '#F59E0B'; // Orange/Amber
      default:
        return '#6E6E6E'; // Gray
    }
  }

  /**
   * Format notification time
   */
  static formatNotificationTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  /**
   * Format currency (NGN)
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
}
