'use client';

import React, { useState } from 'react';
import { useProfile } from '@/api/hooks/useProfile';
import Image from 'next/image';
import { MessageModal } from '@/app/components/MessageModal';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MeasurementTopNav } from '@/app/components/MeasurementTopNav';
import { ProfileService, UserProfile } from '@/services/ProfileService';

const ProfilePage = () => {
  const router = useRouter();
  const { profile, loading: profileLoading, error, refetch } = useProfile();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    country: '',
    industryName: '',
    organizationName: '',
  });
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error'
  });

  // Initialize form data when profile loads
  React.useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.firstName && profile.lastName 
          ? `${profile.firstName} ${profile.lastName}`
          : '',
        email: profile.email || '',
        phoneNumber: profile.phoneNumber || '',
        country: profile.country || '',
        industryName: profile.industryName || '',
        organizationName: profile.organizationName || '',
      });
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors: any = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (formData.phoneNumber && formData.phoneNumber.trim()) {
      // Validate Nigerian phone number format
      if (!/^(\+?234|0)?[789][01]\d{8}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
        newErrors.phoneNumber = 'Please enter a valid Nigerian phone number';
      }
    }
    
    // Check if phone number is different from the current one and if it's a duplicate
    if (formData.phoneNumber && formData.phoneNumber !== profile?.phoneNumber) {
      // We'll handle duplicate check in the error handling after API call
    }
    
    return newErrors;
  };
  
  const handleSaveProfile = async () => {
    // Validate the form before saving
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsSaving(true);
    try {
      const profileService = new ProfileService();
      
      // Prepare the update data - only send changed fields
      const updateData: Partial<UserProfile> = {};
      if (formData.fullName !== (profile?.firstName && profile?.lastName 
        ? `${profile.firstName} ${profile.lastName}`
        : '')) {
        const [firstName, ...lastNameParts] = formData.fullName.split(' ');
        const lastName = lastNameParts.join(' ');
        updateData.firstName = firstName;
        updateData.lastName = lastName || firstName; // Use firstName as lastName if no last name provided
      }
      
      if (formData.email !== profile?.email) {
        updateData.email = formData.email;
      }
      
      if (formData.phoneNumber !== profile?.phoneNumber) {
        updateData.phoneNumber = formData.phoneNumber;
      }
      
      // Only update if there are changes
      if (Object.keys(updateData).length > 0) {
        await profileService.updateProfile(updateData);
        await refetch();

        setModalState({
          isOpen: true,
          title: 'Success',
          message: 'Profile updated successfully!',
          type: 'success'
        });
      } else {
        setModalState({
          isOpen: true,
          title: 'No Changes',
          message: 'No changes were made to your profile.',
          type: 'info'
        });
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      
      // Check if it's a duplicate phone number error
      const errorMessage = error?.response?.data?.message || error?.message || 'An error occurred while updating profile';
      
      if (errorMessage.toLowerCase().includes('phone') && 
          (errorMessage.toLowerCase().includes('duplicate') || 
           errorMessage.toLowerCase().includes('already exists') ||
           errorMessage.toLowerCase().includes('taken'))) {
        setErrors({
          ...errors,
          phoneNumber: 'This phone number is already in use. Please use a different phone number.'
        });
      } else {
        setModalState({
          isOpen: true,
          title: 'Error',
          message: errorMessage,
          type: 'error'
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const closeModal = () => {
    setModalState({ ...modalState, isOpen: false });
  };

  return (
    <div className="min-h-screen bg-white p-0">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
        .manrope { font-family: 'Manrope', sans-serif; }

         @media (min-width: 768px) {
          .desktop-topnav {
            display: block;
          }
        }
      `}</style>

      {/* Message Modal */}
      <MessageModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
      />
      
      <div className="desktop-topnav">
        <MeasurementTopNav />
      </div>

      {/* Main Profile Container */}
      <div 
        className="absolute bg-white"
        style={{
          width: '958px',
          height: '1005px',
          top: '227px',
          left: '401px',
          background:"#FFFFFF",
          borderRadius: '20px',
          opacity: 1
        }}
      >
        {/* View Profile Header */}
        <button 
          onClick={() => router.back()}
          className="absolute flex items-center manrope text-gray-700 hover:text-gray-900"
          style={{
            width: '161px',
            height: '30px',
            top: '52px',
            left: '25px',
            gap: '14px',
            opacity: 1
          }}
        >
          <ChevronLeft size={20} />
          <span className="text-base font-medium">View Profile</span>
        </button>

        {profileLoading ? (
          <div className="text-center py-8">
            <p className="manrope text-gray-500">Loading profile...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="manrope text-red-500">Failed to load profile</p>
            <p className="manrope text-sm text-gray-500 mt-2">{error}</p>
          </div>
        ) : (
          /* Inner User Details Container */
          <div 
            className="absolute bg-white"
            style={{
              width: '811px',
              height: '819px',
              top: '135px',
              left: '49px',
              borderRadius: '20px',
              opacity: 1,
              boxShadow: '0px 2px 8px 0px #5D2A8B1A',
              padding: '48px'
            }}
          >
            <div className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-4">
                <div 
                  className="relative overflow-hidden flex items-center justify-center"
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: '#6D1E1E'
                  }}
                >
                  <Image 
                    src="/Frame 1707479300.png" 
                    alt="User Avatar" 
                    width={60} 
                    height={60}
                    className="object-cover"
                  />
                </div>
                <button 
                  className="manrope text-sm font-medium"
                  style={{ color: '#6E6E6EB2' }}

                >
                  Upload new picture
                </button>
              </div>

              {/* Form Fields */}
              <div className="space-y-5">
                {/* Full Name */}
                <div>
                  <label className="manrope block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Full Name"
                    className="manrope w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ 
                      borderColor: '#E5E7EB',
                      fontSize: '14px'
                    }}
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="manrope block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email Address"
                    className="manrope w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ 
                      borderColor: '#E5E7EB',
                      fontSize: '14px'
                    }}
                  />
                </div>

                {/* Phone No */}
                <div>
                  <label className="manrope block text-sm font-medium text-gray-700 mb-2">
                    Phone No.
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="Phone No."
                    className={`manrope w-full px-4 py-3 border ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:border-transparent`}
                    style={{ 
                      borderColor: errors.phoneNumber ? '#EF4444' : '#E5E7EB',
                      fontSize: '14px'
                    }}
                  />
                </div>
                {errors.phoneNumber && (
                  <p className="manrope text-sm text-red-500 mt-1" style={{ fontSize: '12px' }}>
                    {errors.phoneNumber}
                  </p>
                )}

                {/* Organization Name (Read-only) */}
                <div>
                  <label className="manrope block text-sm font-medium text-gray-700 mb-2">
                    Organization
                  </label>
                  <input
                    type="text"
                    name="organizationName"
                    value={formData.organizationName}
                    readOnly
                    placeholder="Organization Name"
                    className="manrope w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                    style={{ 
                      borderColor: '#E5E7EB',
                      fontSize: '14px',
                      backgroundColor: '#F9FAFB'
                    }}
                  />
                </div>

                {/* Country (Read-only) */}
                <div>
                  <label className="manrope block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    readOnly
                    placeholder="Country"
                    className="manrope w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                    style={{ 
                      borderColor: '#E5E7EB',
                      fontSize: '14px',
                      backgroundColor: '#F9FAFB'
                    }}
                  />
                </div>

                {/* Industry (Read-only) */}
                <div>
                  <label className="manrope block text-sm font-medium text-gray-700 mb-2">
                    Industry
                  </label>
                  <input
                    type="text"
                    name="industryName"
                    value={formData.industryName}
                    readOnly
                    placeholder="Industry"
                    className="manrope w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                    style={{ 
                      borderColor: '#E5E7EB',
                      fontSize: '14px',
                      backgroundColor: '#F9FAFB'
                    }}
                  />
                </div>
              </div>

              {/* Save Profile Button */}
              <div className="flex justify-end pt-4">
                <button 
                  className="manrope text-white font-medium transition-colors hover:opacity-90"
                  onClick={handleSaveProfile}
                  style={{
                    background: '#5D2A8B',
                    width: '109px',
                    height: '38px',
                    borderRadius: '20px',
                    opacity: 1,
                    paddingTop: '8px',
                    paddingRight: '10px',
                    paddingBottom: '8px',
                    paddingLeft: '10px',
                    fontSize: '14px'
                  }}
                >
                  {isSaving ? 'Saving...' : 'Edit Profile'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;