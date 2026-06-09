'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, MapPin, Phone, Mail, Users, Calendar } from 'lucide-react';
import OrganizationService from '@/services/OrganizationService';
import { Organization } from '@/types';

interface ViewOrganizationPageProps {
  params: {
    id: string;
  };
}

const ViewOrganizationPage: React.FC<ViewOrganizationPageProps> = ({ params }) => {
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        // In a real implementation, we would fetch the specific organization
        // For now, we'll use mock data or simulate fetching
        console.log('Fetching organization with ID:', params.id);
        
        // This is a placeholder - in a real implementation, we would call:
        // const org = await OrganizationService.getOrganizationById(params.id);
        
        // For now, let's simulate with mock data
        const mockOrg: Organization = {
          id: params.id,
          organizationName: 'Tech Solutions Ltd',
          accountNumber: '2025000067',
          email: 'admin@techsolutions.com',
          phoneNumber: '+1234567890',
          address: '456 Tech Park, Innovation City',
          contactPerson: 'Jane Smith',
          status: 'active',
          registrationDate: '2025-07-23',
          createdAt: '2025-07-23T10:30:00.000Z',
          updatedAt: '2025-07-23T10:30:00.000Z'
        };
        
        setOrganization(mockOrg);
      } catch (err) {
        console.error('Error fetching organization:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch organization');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [params.id]);

  const handleEdit = () => {
    router.push(`/super-admin/organisation/edit/${params.id}`);
  };

  const handleBack = () => {
    router.push('/super-admin/organisation');
  };

  if (loading) {
    return (
      <div className="manrope">
        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
          .manrope { font-family: 'Manrope', sans-serif; }
        `}</style>

        <div className="ml-0 md:ml-[350px] pt-8 md:pt-8 p-4 md:p-8 min-h-screen">
          <div className="flex items-center mb-6">
            <button
              onClick={handleBack}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Organizations
            </button>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-100 rounded w-1/2 ml-4"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="manrope">
        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
          .manrope { font-family: 'Manrope', sans-serif; }
        `}</style>

        <div className="ml-0 md:ml-[350px] pt-8 md:pt-8 p-4 md:p-8 min-h-screen">
          <div className="flex items-center mb-6">
            <button
              onClick={handleBack}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Organizations
            </button>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="text-red-500 text-center py-8">
              <p className="text-lg font-medium">Error loading organization</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="manrope">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
        .manrope { font-family: 'Manrope', sans-serif; }
      `}</style>

      <div className="ml-0 md:ml-[350px] pt-8 md:pt-8 p-4 md:p-8 min-h-screen">
        <div className="flex items-center mb-6">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Organizations
          </button>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{organization?.organizationName}</h1>
              <p className="text-gray-600">Organization Details</p>
            </div>
            
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-[#5D2A8B] text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-gray-100 p-2 rounded-lg mr-3">
                  <MapPin className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">{organization?.address}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-gray-100 p-2 rounded-lg mr-3">
                  <Mail className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{organization?.email}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-gray-100 p-2 rounded-lg mr-3">
                  <Phone className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{organization?.phoneNumber}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-gray-100 p-2 rounded-lg mr-3">
                  <Users className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contact Person</p>
                  <p className="font-medium">{organization?.contactPerson}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-gray-100 p-2 rounded-lg mr-3">
                  <span className="text-gray-600 font-bold text-sm">#</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Account Number</p>
                  <p className="font-medium">{organization?.accountNumber}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-gray-100 p-2 rounded-lg mr-3">
                  <Calendar className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Registration Date</p>
                  <p className="font-medium">
                    {organization?.registrationDate ? new Date(organization.registrationDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">Status:</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  organization?.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : organization?.status === 'suspended'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                }`}>
                  {organization?.status ? organization.status.charAt(0).toUpperCase() + organization.status.slice(1) : 'N/A'}
                </span>
              </div>
              <button
                onClick={() => router.push(`/super-admin/org-admins?orgId=${params.id}&orgName=${encodeURIComponent((organization as any)?.organizationName || (organization as any)?.name || '')}`)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm hover:bg-purple-700 transition-colors"
              >
                <Users className="w-4 h-4" /> View Admins
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewOrganizationPage;