import { BASE_URL } from '@/config/api';
interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
  updatedAt: string;
}

interface BankDetailsResponse {
  success: boolean;
  data: {
    bankDetails: BankDetails;
    message?: string;
  };
}

class BankDetailsService {
  private static BASE_URL = '/api/admin/bank-details';

  private static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userToken') || sessionStorage.getItem('userToken');
    }
    return null;
  }

  private static async handleResponse(response: Response) {
    if (!response.ok) {
      let errorMessage = 'Request failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        errorMessage = `HTTP error! status: ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    
    if (result.success === false) {
      throw new Error(result.message || 'Operation failed');
    }

    return result.data || result;
  }

  /**
   * Register/Update bank account details for admin
   */
  static async registerBankDetails(data: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  }): Promise<BankDetails> {
    try {
      const token = this.getToken();
      
      const url = `${BASE_URL}${this.BASE_URL}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(data),
      });

      const result = await this.handleResponse(response);

      // Handle different response formats
      let bankDetailsData: any;
      
      if (result && typeof result === 'object') {
        if (result.bankDetails) {
          bankDetailsData = result.bankDetails;
        } else if (result.data && result.data.bankDetails) {
          bankDetailsData = result.data.bankDetails;
        } else if (result.data) {
          bankDetailsData = result.data;
        } else {
          bankDetailsData = result;
        }
      }

      return bankDetailsData;
    } catch (error) {
      console.error('Error registering bank details:', error);
      throw error;
    }
  }

  /**
   * Get registered bank details for admin
   */
  static async getBankDetails(): Promise<BankDetails | null> {
    try {
      const token = this.getToken();
      
      const url = `${BASE_URL}${this.BASE_URL}`;
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        cache: 'no-store',
      });

      // Handle 404 as no bank details found
      if (response.status === 404) {
        return null;
      }

      const result = await this.handleResponse(response);

      // Handle different response formats
      let bankDetailsData: any;
      
      if (result && typeof result === 'object') {
        if (result.bankDetails) {
          bankDetailsData = result.bankDetails;
        } else if (result.data && result.data.bankDetails) {
          bankDetailsData = result.data.bankDetails;
        } else if (result.data) {
          bankDetailsData = result.data;
        } else {
          bankDetailsData = result;
        }
      }

      return bankDetailsData;
    } catch (error) {
      console.error('Error fetching bank details:', error);
      throw error;
    }
  }
}

export default BankDetailsService;