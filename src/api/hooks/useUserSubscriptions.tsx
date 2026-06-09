import { useState, useEffect } from "react";
import { useAuthContext } from '@/AuthContext';
import { BASE_URL } from '@/config/api';

interface Service {
  serviceId: string;
  serviceName: string;
  duration: string;
  _id?: string;
}

interface UserSubscription {
  _id: string;
  userId: string;
  userType: string;
  packageId: string;
  packageTitle: string;
  subscriptionDuration: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive' | 'expired';
  autoRenew: boolean;
  amountPaid: number;
  originalAmount: number;
  discountApplied: number;
  promoCodeUsed: string | null;
  paymentStatus: 'completed' | 'pending' | 'failed';
  services: Service[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

const useUserSubscriptions = (userId: string | null) => {
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuthContext();

  useEffect(() => {
    const fetchUserSubscriptions = async () => {
      // Only proceed if we have both userId and token
      if (!userId || !token) {
        setLoading(false);
        setSubscriptions([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Call the backend API directly
        const backendUrl = `${BASE_URL}/api/user-subscriptions/user/${userId}/active`;
        
        console.log('Fetching user subscriptions for userId:', userId);
        console.log('Using token:', token ? 'Token present' : 'No token');
        console.log('Backend URL:', backendUrl);
        
        const response = await fetch(backendUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        console.log('User subscriptions API response status:', response.status);
        console.log('User subscriptions API response URL:', backendUrl);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Handle the response structure from the active endpoint
        let transformedSubscriptions: UserSubscription[] = [];
        
        // If it's a success response with subscription data
        if (data.success && data.data && data.data.subscription) {
          // Single subscription from active endpoint
          transformedSubscriptions = [data.data.subscription];
        }
        // If it's a direct array of active subscriptions
        else if (Array.isArray(data)) {
          transformedSubscriptions = data;
        }
        // If it's a data wrapper with active subscriptions array
        else if (data.data && Array.isArray(data.data)) {
          transformedSubscriptions = data.data;
        }
        // If it's an activeSubscriptions array
        else if (data.activeSubscriptions && Array.isArray(data.activeSubscriptions)) {
          transformedSubscriptions = data.activeSubscriptions;
        }
        // If it's a packages array (active packages)
        else if (data.packages && Array.isArray(data.packages)) {
          transformedSubscriptions = data.packages;
        }
        // Handle single subscription object
        else if (data.data) {
          transformedSubscriptions = [data.data];
        }
        // Handle direct object
        else {
          transformedSubscriptions = [data];
        }
        
        setSubscriptions(transformedSubscriptions);
      } catch (err) {
        console.error('Error fetching user subscriptions:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setSubscriptions([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchUserSubscriptions();
  }, [userId, token]);

  return { subscriptions, loading, error };
};

export default useUserSubscriptions;