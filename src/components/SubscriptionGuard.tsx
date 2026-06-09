"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/AuthContext';
import axios from 'axios';
import { mockSubscriptionService } from '@/services/mockSubscriptionService';
import { BASE_URL } from '@/config/api';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ children }) => {
  const router = useRouter();
  const { token, user } = useAuthContext();
  const [isLoading, setIsLoading] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      // Skip check if no token or user
      if (!token || !user) {
        setIsLoading(false);
        return;
      }

      // Skip for super admin users
      const userRole = user.role?.toLowerCase();
      if (userRole === 'super_admin') {
        setHasActiveSubscription(true);
        setIsLoading(false);
        return;
      }

      // For organization/admin users, check subscription status using the correct API
      if (userRole === 'organisation' || userRole === 'organization' || userRole === 'admin') {
        try {
          // First try the real API with correct endpoint
          const response = await axios.get(
            `${BASE_URL}/api/user-subscriptions/user/${user.id}/status`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (response.data.success) {
            // Log the actual API response for debugging
            console.log('🔍 SubscriptionGuard API Response:', response.data.data);
            console.log('  - redirectTo:', response.data.data.redirectTo);
            console.log('  - shouldShowSubscription:', response.data.data.shouldShowSubscription);
            console.log('  - hasActiveSubscription:', response.data.data.hasActiveSubscription);
            
            // Use the redirectTo field to determine access
            const shouldShowSubscription = response.data.data.shouldShowSubscription;
            const hasActiveSubFromAPI = response.data.data.hasActiveSubscription;
            
            // Prefer hasActiveSubscription if available, otherwise calculate from shouldShowSubscription
            if (typeof hasActiveSubFromAPI === 'boolean') {
              console.log('✅ Using hasActiveSubscription from API:', hasActiveSubFromAPI);
              setHasActiveSubscription(hasActiveSubFromAPI);
            } else {
              console.log('⚠️ Calculating from shouldShowSubscription:', !shouldShowSubscription);
              setHasActiveSubscription(!shouldShowSubscription);
            }
          } else {
            // Fallback to mock service
            setHasActiveSubscription(mockSubscriptionService.hasActiveSubscription(user.id));
          }
        } catch (error) {
          console.error('Error checking subscription status via API:', error);
          // Fallback to mock service when API fails
          setHasActiveSubscription(mockSubscriptionService.hasActiveSubscription(user.id));
        } finally {
          setIsLoading(false);
        }
      } else {
        // For other user types, no subscription check needed
        setHasActiveSubscription(true);
        setIsLoading(false);
      }
    };

    checkSubscriptionStatus();
  }, [token, user]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5D2A8B]"></div>
      </div>
    );
  }

  // If user has active subscription, show protected content
  if (hasActiveSubscription) {
    return <>{children}</>;
  }

  // IMPORTANT: Do NOT redirect to /subscription page during render
  // Calling router.replace() here causes React error:
  // "Cannot update a component while rendering a different component"
  // 
  // Subscription check happens ONLY at login time.
  // This guard simply controls access without redirecting.
  
  // For all cases, show children
  return <>{children}</>;
};

export default SubscriptionGuard;