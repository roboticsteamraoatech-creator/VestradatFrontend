"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  Building,
  ShieldCheck,
  CheckCircle,
  User,
  FileText,
  Send,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import OrganizationProfileService, { OrganizationProfile } from "@/services/OrganizationProfileService";
import { useRouter } from "next/navigation";

interface OrganizationDetails {
  type: "registered" | "unregistered";
  businessRegistrationNumber?: string;
  ownerIdentificationType?: "international-passport" | "nin" | "none";
  ownerDocumentNumber?: string;
  visibility: "public" | "private";
  verifiedBadge: boolean;
  professionalTrade?: {
    associationName?: string;
    membershipId?: string;
    certificateFile?: File;
  };
}

const OrganizationProfilePage: React.FC = () => {
  const router = useRouter();
  const [organizationDetails, setOrganizationDetails] = useState<OrganizationDetails>({
    type: "unregistered",
    visibility: "private",
    verifiedBadge: false,
    professionalTrade: {},
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const organizationProfileService = new OrganizationProfileService();

  // Load existing profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await organizationProfileService.getProfile();
        if (response.success && response.data) {
          const profile = response.data.profile;
          setOrganizationDetails({
            type: profile.businessType,
            visibility: profile.isPublicProfile ? "public" : "private",
            verifiedBadge: profile.verificationStatus === "verified",
            professionalTrade: {},
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    loadProfile();
  }, []);

  const handleOrganizationDetailsChange = (field: keyof OrganizationDetails, value: any) => {
    setOrganizationDetails((prev) => {
      const updated = { ...prev, [field]: value };

      if (field === "type" && value === "unregistered") {
        updated.verifiedBadge = false;
        updated.businessRegistrationNumber = "";
        updated.ownerIdentificationType = undefined;
        updated.ownerDocumentNumber = "";
      }

      if (field === "visibility" && value === "private") {
        updated.verifiedBadge = false;
      }

      if (field === "ownerIdentificationType") {
        updated.ownerDocumentNumber = "";
      }

      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!organizationDetails.type) {
      setErrorMessage('Business type is a required field');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const profileData: OrganizationProfile = {
        businessType: organizationDetails.type as 'registered' | 'unregistered',
        isPublicProfile: organizationDetails.visibility === "public",
        verificationStatus: organizationDetails.verifiedBadge ? "verified" : "unverified",
      };

      const response = await organizationProfileService.createOrUpdateProfile(profileData);

      if (response.success) {
        setSuccessMessage('Organization profile updated successfully!');
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(response.message || 'Failed to update organization profile');
      }
    } catch (error: any) {
      console.error('Error updating organization profile:', error);
      setErrorMessage(error.message || 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
        * { font-family: 'Manrope', sans-serif; }
      `}</style>

      <div className="px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Organization Profile</h2>
          <p className="text-gray-600">
            Complete your organization profile details
          </p>
        </div>

        {/* Organization Details Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center mb-6">
            <ShieldCheck className="w-6 h-6 text-purple-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Organization Details</h2>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-8">
              {/* Business Type */}
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 text-lg flex items-center">
                  <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm mr-2">
                    1
                  </span>
                  Type of Business:
                </h3>
                <div className="flex gap-6">
                  <label className="flex items-center cursor-pointer p-3 bg-white rounded-lg border border-gray-300 hover:border-purple-400 hover:bg-purple-50 transition-colors flex-1 max-w-xs">
                    <input
                      type="radio"
                      name="organizationType"
                      value="registered"
                      checked={organizationDetails.type === "registered"}
                      onChange={(e) => handleOrganizationDetailsChange("type", e.target.value)}
                      className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="ml-3">
                      <span className="text-gray-700 font-medium">Registered</span>
                      <p className="text-sm text-gray-500 mt-1">Business is officially registered with government</p>
                    </div>
                  </label>
                  <label className="flex items-center cursor-pointer p-3 bg-white rounded-lg border border-gray-300 hover:border-purple-400 hover:bg-purple-50 transition-colors flex-1 max-w-xs">
                    <input
                      type="radio"
                      name="organizationType"
                      value="unregistered"
                      checked={organizationDetails.type === "unregistered"}
                      onChange={(e) => handleOrganizationDetailsChange("type", e.target.value)}
                      className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="ml-3">
                      <span className="text-gray-700 font-medium">Unregistered</span>
                      <p className="text-sm text-gray-500 mt-1">Business is not officially registered</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Registration Number for Registered Businesses */}
              {organizationDetails.type === "registered" && (
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4 text-lg flex items-center">
                    <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm mr-2">
                      2
                    </span>
                    Registration Number (From government)
                  </h3>
                  <div>
                    <input
                      type="text"
                      value={organizationDetails.businessRegistrationNumber || ""}
                      onChange={(e) => handleOrganizationDetailsChange("businessRegistrationNumber", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                      placeholder="Enter your business registration number"
                    />
                    <p className="text-sm text-gray-500 mt-2">Optional for registered businesses. This number will be verified if provided.</p>
                  </div>
                </div>
              )}

              {/* Business Owner's Verification for Registered Businesses */}
              {organizationDetails.type === "registered" && (
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4 text-lg flex items-center">
                    <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm mr-2">
                      3
                    </span>
                    Business Owner's Verification (Optional)
                  </h3>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select means of identification
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center cursor-pointer p-4 bg-white rounded-lg border border-gray-300 hover:border-purple-400 hover:bg-purple-50 transition-colors">
                        <input
                          type="radio"
                          name="identificationType"
                          value="international-passport"
                          checked={organizationDetails.ownerIdentificationType === "international-passport"}
                          onChange={(e) => handleOrganizationDetailsChange("ownerIdentificationType", e.target.value)}
                          className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                        />
                        <div className="ml-3">
                          <span className="text-gray-700 font-medium">International Passport</span>
                          <p className="text-sm text-gray-500 mt-1">Valid passport for identification</p>
                        </div>
                      </label>
                      <label className="flex items-center cursor-pointer p-4 bg-white rounded-lg border border-gray-300 hover:border-purple-400 hover:bg-purple-50 transition-colors">
                        <input
                          type="radio"
                          name="identificationType"
                          value="nin"
                          checked={organizationDetails.ownerIdentificationType === "nin"}
                          onChange={(e) => handleOrganizationDetailsChange("ownerIdentificationType", e.target.value)}
                          className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                        />
                        <div className="ml-3">
                          <span className="text-gray-700 font-medium">NIN (National Identity Number)</span>
                          <p className="text-sm text-gray-500 mt-1">National identity card number</p>
                        </div>
                      </label>
                      <label className="flex items-center cursor-pointer p-4 bg-white rounded-lg border border-gray-300 hover:border-purple-400 hover:bg-purple-50 transition-colors">
                        <input
                          type="radio"
                          name="identificationType"
                          value="none"
                          checked={organizationDetails.ownerIdentificationType === "none"}
                          onChange={(e) => handleOrganizationDetailsChange("ownerIdentificationType", e.target.value)}
                          className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                        />
                        <div className="ml-3">
                          <span className="text-gray-700 font-medium">Skip Owner Verification</span>
                          <p className="text-sm text-gray-500 mt-1">Do not provide owner identification</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {organizationDetails.ownerIdentificationType && 
                   organizationDetails.ownerIdentificationType !== "none" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Enter Document Number</label>
                      <input
                        type="text"
                        value={organizationDetails.ownerDocumentNumber || ""}
                        onChange={(e) => handleOrganizationDetailsChange("ownerDocumentNumber", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder={
                          organizationDetails.ownerIdentificationType === "international-passport"
                            ? "Enter your International Passport number"
                            : "Enter your NIN"
                        }
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        This information is used for verification purposes only and kept confidential.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Profile Visibility */}
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 text-lg flex items-center">
                  <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm mr-2">
                    {organizationDetails.type === "registered" ? "4" : "2"}
                  </span>
                  Profile Visibility
                </h3>
                <div className="flex gap-6">
                  <label className="flex items-center cursor-pointer p-3 bg-white rounded-lg border border-gray-300 hover:border-purple-400 hover:bg-purple-50 transition-colors flex-1 max-w-xs">
                    <input
                      type="radio"
                      name="profileVisibility"
                      value="public"
                      checked={organizationDetails.visibility === "public"}
                      onChange={(e) => handleOrganizationDetailsChange("visibility", e.target.value)}
                      className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="ml-3">
                      <span className="text-gray-700 font-medium">Public</span>
                      <p className="text-sm text-gray-500 mt-1">Anyone can see your organization profile</p>
                    </div>
                  </label>
                  <label className="flex items-center cursor-pointer p-3 bg-white rounded-lg border border-gray-300 hover:border-purple-400 hover:bg-purple-50 transition-colors flex-1 max-w-xs">
                    <input
                      type="radio"
                      name="profileVisibility"
                      value="private"
                      checked={organizationDetails.visibility === "private"}
                      onChange={(e) => handleOrganizationDetailsChange("visibility", e.target.value)}
                      className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="ml-3">
                      <span className="text-gray-700 font-medium">Private</span>
                      <p className="text-sm text-gray-500 mt-1">Only you and authorized persons can see your profile</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Verification Badge Request */}
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 text-lg flex items-center">
                  <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm mr-2">
                    {organizationDetails.type === "registered" ? "5" : "3"}
                  </span>
                  Verification Badge Request
                </h3>
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="verificationBadge"
                    checked={organizationDetails.verifiedBadge}
                    onChange={(e) => handleOrganizationDetailsChange("verifiedBadge", e.target.checked)}
                    className="mt-1 w-5 h-5 text-purple-600 focus:ring-purple-500 rounded"
                  />
                  <div className="ml-3">
                    <label htmlFor="verificationBadge" className="text-gray-700 font-medium">
                      Request Verification Badge
                    </label>
                    <p className="text-sm text-gray-500 mt-1">
                      Enable this to request a verification badge for your organization. This increases credibility and trust.
                    </p>
                  </div>
                </div>
              </div>

              {/* Professional Trade Association (Optional) */}
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 text-lg flex items-center">
                  <User className="w-5 h-5 text-purple-600 mr-2" />
                  Professional Trade Association (Optional)
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name of Professional/Trade Association
                    </label>
                    <input
                      type="text"
                      value={organizationDetails.professionalTrade?.associationName || ""}
                      onChange={(e) =>
                        setOrganizationDetails((prev) => ({
                          ...prev,
                          professionalTrade: {
                            ...prev.professionalTrade,
                            associationName: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., Chamber of Commerce, Professional Association"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Membership ID (Optional)</label>
                    <input
                      type="text"
                      value={organizationDetails.professionalTrade?.membershipId || ""}
                      onChange={(e) =>
                        setOrganizationDetails((prev) => ({
                          ...prev,
                          professionalTrade: {
                            ...prev.professionalTrade,
                            membershipId: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter your membership ID"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Membership Certificate or ID (Optional)
                    </label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <FileText className="w-8 h-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">PDF, JPG, PNG (Max 5MB)</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setOrganizationDetails((prev) => ({
                                ...prev,
                                professionalTrade: {
                                  ...prev.professionalTrade,
                                  certificateFile: e.target.files![0],
                                },
                              }));
                            }
                          }}
                        />
                      </label>
                    </div>
                    {organizationDetails.professionalTrade?.certificateFile && (
                      <div className="mt-2 flex items-center text-sm text-green-600">
                        <FileText className="w-4 h-4 mr-1" />
                        {organizationDetails.professionalTrade.certificateFile.name}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button Section */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className={`flex items-center justify-center px-8 py-3 rounded-lg font-semibold text-white transition-colors ${
                      isProcessing
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-purple-600 hover:bg-purple-700"
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Save Profile
                      </>
                    )}
                  </button>
                </div>

                {!organizationDetails.verifiedBadge && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800 text-center">
                      Please select "Yes" for verification badge to enable submission
                    </p>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Inline Success Message */}
        {successMessage && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <p className="font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Inline Error Message */}
        {errorMessage && (
          <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="font-medium text-red-800">{errorMessage}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationProfilePage;