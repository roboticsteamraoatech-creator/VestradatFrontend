'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, X } from 'lucide-react';
import { GroupService, Group } from '@/services/GroupService';
import { AdminUserService } from '@/services/AdminUserService';
import { toast } from '@/app/components/hooks/use-toast';

import { AdminUser } from '@/services/AdminUserService';

const EditGroupPage = () => {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  
  const [group, setGroup] = useState<Group | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingGroup, setLoadingGroup] = useState(true);

  useEffect(() => {
    fetchGroupAndUsers();
  }, [groupId]);

  const fetchGroupAndUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch users
      const adminUserService = new AdminUserService();
      const usersResponse = await adminUserService.getAllUsers();
      setUsers(usersResponse.data.users);

      // Fetch group data
      const groupService = new GroupService();
      const response = await groupService.getGroupById(groupId);
      const fetchedGroup = response.data.group;
      
      setGroup(fetchedGroup);
      setGroupName(fetchedGroup.name);
      setGroupDescription(fetchedGroup.description);
      setSelectedMembers(fetchedGroup.memberIds);
    } catch (error: any) {
      console.error('Error fetching group and users:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch group and users data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setLoadingGroup(false);
      setLoadingUsers(false);
    }
  };

  const handleMemberToggle = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!group) return;
    
    setLoading(true);
    
    try {
      const groupService = new GroupService();
      const groupData = {
        name: groupName,
        description: groupDescription,
      };
      
      await groupService.updateGroup(groupId, groupData);
      
      toast({
        title: 'Success',
        description: `Group "${groupName}" updated successfully!`,
      });
      
      router.push('/admin/group-management');
    } catch (error: any) {
      console.error('Error updating group:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update group',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingGroup && !group) {
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
            <p className="text-gray-600">Please wait while we fetch the group details.</p>
          </div>
        </div>
      </div>
    );
  }

  // If group is still null after loading, then it truly doesn't exist
  if (!group) {
    return (
      <div className="manrope pt-8 p-4 md:p-8 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Group Management
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
        {/* Header */}
        <div className="mb-6">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Group Management
          </button>
          
          <h1 className="text-2xl font-bold text-gray-800">Edit Group</h1>
          <p className="text-gray-600 mt-1">Modify group details and members</p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl">
          {/* Group Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Group Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name *
                </label>
                <input
                  type="text"
                  id="groupName"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter group name"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="groupDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  id="groupDescription"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter group description"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group ID
                </label>
                <input
                  type="text"
                  value={group.id}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push('/admin/group-management')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-3 bg-[#5D2A8B] text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Update Group
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGroupPage;