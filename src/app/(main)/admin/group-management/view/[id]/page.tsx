'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Mail, User } from 'lucide-react';
import { GroupService, Group } from '@/services/GroupService';
import { toast } from '@/app/components/hooks/use-toast';

const ViewGroupPage = () => {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroup();
  }, [groupId]);

  const fetchGroup = async () => {
    try {
      setLoading(true);
      const groupService = new GroupService();
      const response = await groupService.getGroupById(groupId);
      setGroup(response.data.group);
    } catch (error: any) {
      console.error('Error fetching group:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch group',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="manrope pt-8 p-4 md:p-8 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5D2A8B] mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Group...</h2>
            
          </div>
        </div>
      </div>
    );
  }
  
  if (!group) {
    return (
      <div className="manrope pt-8 p-4 md:p-8 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Group Not Found</h2>
            <p className="text-gray-600">The requested group could not be found.</p>
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

      <div className="pt-8 p-4 md:p-8 min-h-screen">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button 
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{group.name}</h1>
                <p className="text-gray-600 mt-1">{group.description}</p>
              </div>
              
              {/* <button
                onClick={() => router.push(`/admin/group-management/edit/${group.id}`)}
                className="mt-4 md:mt-0 px-4 py-2 bg-[#5D2A8B] text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Group
              </button> */}
            </div>
          </div>

          {/* Group Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Group Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Group ID</label>
                <p className="text-gray-900">{group.id}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Group Name</label>
                <p className="text-gray-900">{group.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
                <p className="text-gray-900">{group.description || 'No description provided'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Created At</label>
                <p className="text-gray-900">
                  {new Date(group.createdAt).toLocaleDateString()} at {new Date(group.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Total Members</label>
                <p className="text-gray-900">{group.members?.length || 0}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  group.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {group.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Members */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Group Members</h2>
              <span className="text-sm text-gray-500">
                {group.members?.length || 0} {group.members?.length === 1 ? 'member' : 'members'}
              </span>
            </div>
            
            {!group.members || group.members.length === 0 ? (
              <div className="text-center py-8">
                <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 italic">No members assigned to this group</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.members.map((member, index) => (
                  <div 
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          
                          <h3 className="font-semibold text-gray-900 truncate">
                            {member.fullName}
                          </h3>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          
                          <p className="text-sm text-gray-600 truncate">
                            {member.email}
                          </p>
                        </div>
                        
                        <div className="mt-2">
                          <span className="inline-block px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                            {member.role}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewGroupPage;