"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { ShieldCheck, Building, MapPin, CreditCard, AlertCircle, CheckCircle, TrendingUp, Layers, Package } from "lucide-react";
import OrganizationProfileService, { OrganizationProfile } from "@/services/OrganizationProfileService";
import LocationPaymentService, {
  PaymentCheckResponse,
  InitializePaymentResponse,
  VerifyPaymentResponse
} from "@/services/LocationPaymentService";
import { useAuthContext } from "@/AuthContext";
import { BASE_URL } from "@/config/api";

interface ActiveSubscription {
  _id: string;
  packageId: string;
  packageTitle: string;
  subscriptionDuration: string;
  status: string;
  startDate: string;
  endDate: string;
  amountPaid: number;
  enabledModules: string[];
  services: Array<{ serviceName: string; duration: string }>;
}

interface LocationWithStatus extends Record<string, any> {
  locationType: string;
  brandName: string;
  country: string;
  state: string;
  city: string;
  cityRegion: string;
  houseNumber: string;
  street: string;
  isPaidFor?: boolean;
  verificationStatus?: string;
  status?: string;
}

const SubscriptionPage: React.FC = () => {
  const { user, token } = useAuthContext();
  const [organizationDetails, setOrganizationDetails] = useState<OrganizationProfile | null>(null);
  const [activeSubscription, setActiveSubscription] = useState<ActiveSubscription | null>(null);
  const [locations, setLocations] = useState<LocationWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [unpaidLocations, setUnpaidLocations] = useState(0);
  const [totalLocations, setTotalLocations] = useState(0);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  const organizationProfileService = new OrganizationProfileService();

  // Function to check if payment is required
  const checkPaymentRequired = async () => {
    try {
      const response: PaymentCheckResponse = await LocationPaymentService.checkPaymentRequired();
      
      if (response.success) {
        setPaymentRequired(response.data.paymentRequired);
        setUnpaidLocations(response.data.unpaidLocations);
        setTotalLocations(response.data.totalLocations);
      }
    } catch (err) {
      console.error('Error checking payment required:', err);
    }
  };

  // Function to initialize payment
  const initializePayment = async () => {
    try {
      // Get user details (you might want to fetch from your auth context)
      const userData = {
        email: 'admin@company.com', // Replace with actual user data
        name: 'John Smith',         // Replace with actual user data
        phone: '+2348012345678'     // Replace with actual user data
      };

      const response: InitializePaymentResponse = await LocationPaymentService.initializePayment(userData);

      if (response.success && response.data.paymentLink) {
        // Redirect to payment gateway
        window.location.href = response.data.paymentLink;
      }
    } catch (err) {
      console.error('Error initializing payment:', err);
      setError('Failed to initialize payment');
    }
  };

  // Function to verify payment based on URL parameters (if coming back from payment gateway)
  const verifyPayment = async (transactionId: string) => {
    setVerifyingPayment(true);
    try {
      const response: VerifyPaymentResponse = await LocationPaymentService.verifyPayment({
        transactionId
      });

      if (response.success) {
        // Refresh the data after successful payment verification
        await loadSubscriptionData();
      }
    } catch (err) {
      console.error('Error verifying payment:', err);
      setError('Failed to verify payment');
    } finally {
      setVerifyingPayment(false);
    }
  };

  // Check for transaction ID in URL parameters (for payment return verification)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const transactionId = urlParams.get('transaction_id');
    
    if (transactionId) {
      verifyPayment(transactionId);
    }
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);

      // Load active subscription (enabledModules + services)
      const userId = user?.id;
      if (userId && token) {
        try {
          const subRes = await fetch(`${BASE_URL}/api/user-subscriptions/user/${userId}/active`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const subData = await subRes.json();
          if (subData.success && subData.data?.subscription) {
            setActiveSubscription(subData.data.subscription);
          }
        } catch (_) {}
      }

      // Load organization profile
      const profileResponse = await organizationProfileService.getProfile();
      if (profileResponse.success && profileResponse.data) {
        setOrganizationDetails(profileResponse.data.profile);
      }

      // Load locations
      const locationsResponse = await organizationProfileService.getAllLocations();
      if (locationsResponse.success && locationsResponse.data) {
        // Calculate status for each location based on isPaidFor and verificationStatus
        const locationsWithStatus = locationsResponse.data.locations.map((location: LocationWithStatus) => {
          let status = "Pending Payment";
          
          if (location.isPaidFor === true) {
            if (location.verificationStatus === 'verified') {
              status = "Verified";
            } else if (location.verificationStatus === 'rejected') {
              status = "Rejected";
            } else {
              status = "Pending Verification";
            }
          } else if (location.isPaidFor === false || location.isPaidFor === undefined) {
            status = "Pending Payment";
          }
          
          return {
            ...location,
            status
          };
        });
        
        setLocations(locationsWithStatus);
      }
      
      // Check payment requirements
      await checkPaymentRequired();
    } catch (err) {
      console.error('Error loading subscription data:', err);
      setError('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading subscription data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-600 text-center">{error}</p>
        </div>
      </div>
    );
  }

  // Count locations by status
  const pendingPaymentCount = locations.filter(loc => loc.status === "Pending Payment").length;
  const pendingVerificationCount = locations.filter(loc => loc.status === "Pending Verification").length;
  const verifiedCount = locations.filter(loc => loc.status === "Verified").length;
  const rejectedCount = locations.filter(loc => loc.status === "Rejected").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
        * { font-family: 'Manrope', sans-serif; }
      `}</style>

      <div className="px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-gray-900">Subscription Overview</h2>
              <a href="/admin/subscription/profile" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center">
                <ShieldCheck className="w-4 h-4 mr-2" />
                Verify Profile
              </a>
              <a href="/admin/subscription/upgrade" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Upgrade Package
              </a>
              
              {/* Payment button - only show if payment is required */}
              {paymentRequired && unpaidLocations > 0 && (
                <button 
                  onClick={initializePayment}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay for {unpaidLocations} Location{unpaidLocations > 1 ? 's' : ''}
                </button>
              )}
            </div>
            <p className="text-gray-600 hidden md:block">View your organization's subscription and profile information</p>
          </div>
          
          {/* Payment notification if payment is required */}
          {paymentRequired && unpaidLocations > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-yellow-800">Payment Required</h3>
                <p className="text-yellow-700 text-sm">
                  You have {unpaidLocations} location{unpaidLocations > 1 ? 's' : ''} that require payment to get verified.
                  Complete payment to proceed with verification.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Organization Summary Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
          <div className="flex items-center mb-6">
            <ShieldCheck className="w-8 h-8 text-purple-600 mr-3" />
            <h2 className="text-xl font-bold text-gray-900">Organization Summary</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <Building className="w-6 h-6 text-purple-600 mr-2" />
                <h3 className="font-semibold text-gray-900">Business Type</h3>
              </div>
              <p className="mt-2 text-lg font-medium">
                {organizationDetails?.businessType || 'N/A'}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <MapPin className="w-6 h-6 text-purple-600 mr-2" />
                <h3 className="font-semibold text-gray-900">Locations</h3>
              </div>
              <p className="mt-2 text-lg font-medium">
                {locations.length} {locations.length === 1 ? 'Location' : 'Locations'}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <ShieldCheck className="w-6 h-6 text-purple-600 mr-2" />
                <h3 className="font-semibold text-gray-900">Verification Status</h3>
              </div>
              <p className="mt-2 text-lg font-medium">
                {organizationDetails?.verificationStatus || 'N/A'}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <CreditCard className="w-6 h-6 text-purple-600 mr-2" />
                <h3 className="font-semibold text-gray-900">Payment Status</h3>
              </div>
              <p className="mt-2 text-lg font-medium">
                {paymentRequired ? `${unpaidLocations} unpaid` : 'All paid'}
              </p>
            </div>
          </div>
        </div>

        {/* Active Subscription — Enabled Modules */}
        {activeSubscription && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Layers className="w-6 h-6 text-purple-600 mr-3" />
                <h2 className="text-xl font-bold text-gray-900">Enabled Modules</h2>
              </div>
              <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-3 py-1 rounded-full">
                {activeSubscription.packageTitle}
              </span>
            </div>
            {activeSubscription.enabledModules && activeSubscription.enabledModules.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {activeSubscription.enabledModules.map((mod) => (
                  <span
                    key={mod}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 text-green-800 text-xs font-semibold rounded-full"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    {mod.replace(/_/g, ' ').toUpperCase()}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No modules enabled on this subscription.</p>
            )}
          </div>
        )}

        {/* Active Subscription — Included Services */}
        {activeSubscription && activeSubscription.services && activeSubscription.services.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
            <div className="flex items-center mb-4">
              <Package className="w-6 h-6 text-purple-600 mr-3" />
              <h2 className="text-xl font-bold text-gray-900">Included Services</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeSubscription.services.map((svc, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{svc.serviceName}</p>
                    <p className="text-xs text-gray-500 capitalize">Duration: {svc.duration}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location Status Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
          <div className="flex items-center mb-6">
            <MapPin className="w-8 h-8 text-purple-600 mr-3" />
            <h2 className="text-xl font-bold text-gray-900">Location Status Summary</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="font-semibold text-blue-900">Pending Payment</h3>
              </div>
              <p className="mt-2 text-2xl font-bold text-blue-700">{pendingPaymentCount}</p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                <h3 className="font-semibold text-yellow-900">Pending Verification</h3>
              </div>
              <p className="mt-2 text-2xl font-bold text-yellow-700">{pendingVerificationCount}</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="font-semibold text-green-900">Verified</h3>
              </div>
              <p className="mt-2 text-2xl font-bold text-green-700">{verifiedCount}</p>
            </div>

            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <h3 className="font-semibold text-red-900">Rejected</h3>
              </div>
              <p className="mt-2 text-2xl font-bold text-red-700">{rejectedCount}</p>
            </div>
          </div>
        </div>

        {/* Organization Details */}
        {organizationDetails && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
            <div className="flex items-center mb-6">
              <Building className="w-8 h-8 text-purple-600 mr-3" />
              <h2 className="text-xl font-bold text-gray-900">Organization Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Business Type</h3>
                <p className="text-gray-900 capitalize">
                  {organizationDetails.businessType}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Public Profile</h3>
                <p className="text-gray-900">
                  {organizationDetails.isPublicProfile ? 'Visible' : 'Hidden'}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Verification Status</h3>
                <p className={`font-medium ${organizationDetails.verificationStatus === 'verified' ? 'text-green-600' : 'text-orange-600'}`}>
                  {organizationDetails.verificationStatus
                    ? organizationDetails.verificationStatus.charAt(0).toUpperCase() + organizationDetails.verificationStatus.slice(1)
                    : 'N/A'}
                </p>
              </div>

            </div>
          </div>
        )}

        {/* Locations Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center mb-6">
            <MapPin className="w-8 h-8 text-purple-600 mr-3" />
            <h2 className="text-xl font-bold text-gray-900">Locations</h2>
          </div>

          {locations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {locations.map((location, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${location.locationType === 'headquarters' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                          {location.locationType
                            ? location.locationType.charAt(0).toUpperCase() + location.locationType.slice(1)
                            : 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{location.brandName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {location.city}, {location.state}, {location.country}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {location.houseNumber} {location.street}, {location.cityRegion}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {location.status === "Pending Payment" && (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Pending Payment
                          </span>
                        )}
                        {location.status === "Pending Verification" && (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pending Verification
                          </span>
                        )}
                        {location.status === "Verified" && (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Verified
                          </span>
                        )}
                        {location.status === "Rejected" && (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Rejected
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <MapPin className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No locations</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding a new location.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;