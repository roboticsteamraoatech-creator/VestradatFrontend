'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, X } from 'lucide-react';
import { GroupService, CreateGroupData } from '@/services/GroupService';
import { AdminUserService } from '@/services/AdminUserService';
import { toast } from '@/app/components/hooks/use-toast';

import { AdminUser } from '@/services/AdminUserService';

const CreateGroupPage = () => {
  const router = useRouter();
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const adminUserService = new AdminUserService();
        const response = await adminUserService.getAllUsers();
        setUsers(response.data.users);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: 'Error',
          description: 'Failed to load users',
          variant: 'destructive',
        });
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const handleMemberToggle = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      toast({
        title: 'Error',
        description: 'Group name is required',
        variant: 'destructive',
      });
      return;
    }

    if (selectedMembers.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one member to the group',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const groupService = new GroupService();
      const groupData: CreateGroupData = {
        name: groupName,
        description: groupDescription,
        memberIds: selectedMembers,
      };

      const response = await groupService.createGroup(groupData);

      if (!response.success) {
        const errorMsg = (response as any).message || response.data?.message || 'Failed to create group';
        toast({
          title: 'Error',
          description: errorMsg.includes('already exists')
            ? `A group with the name "${groupName}" already exists. Please choose a different name.`
            : errorMsg,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: `Group "${groupName}" created successfully!`,
      });

      router.push('/admin/group-management');
    } catch (error: any) {
      console.error('Error creating group:', error);
      const errorMsg = error.message || 'Failed to create group';
      toast({
        title: 'Error',
        description: errorMsg.includes('already exists')
          ? `A group with the name "${groupName}" already exists. Please choose a different name.`
          : errorMsg,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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
          
          <h1 className="text-2xl font-bold text-gray-800">Create New Group</h1>
          <p className="text-gray-600 mt-1">Define a new group with specific members</p>
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
            </div>
          </div>

          {/* Members Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Group Members</h2>
            <p className="text-gray-600 text-sm mb-6">Select the members to add to this group</p>
            
            {loadingUsers ? (
              <div className="text-center py-8 text-gray-600">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-gray-600">No users available</div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div 
                    key={user.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                      selectedMembers.includes(user.id)
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleMemberToggle(user.id)}
                  >
                    <div className="flex items-start">
                      <div className={`flex items-center h-5 mt-0.5 mr-3 ${
                        selectedMembers.includes(user.id) 
                          ? 'text-purple-600' 
                          : 'text-gray-400'
                      }`}>
                        {selectedMembers.includes(user.id) ? (
                          <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.fullName}</div>
                        <div className="text-sm text-gray-500 mt-1">{user.email} | {user.role}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Members Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Selected Members</h2>
            
            {selectedMembers.length === 0 ? (
              <p className="text-gray-500 italic">No members selected</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedMembers.map(memberId => {
                  const user = users.find(u => u.id === memberId);
                  return user ? (
                    <div 
                      key={memberId}
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-purple-100 text-purple-800"
                    >
                      {user.fullName}
                      <button
                        type="button"
                        onClick={() => handleMemberToggle(memberId)}
                        className="ml-2 text-purple-600 hover:text-purple-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
            )}
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
              disabled={loading || selectedMembers.length === 0}
              className={`px-6 py-3 bg-[#5D2A8B] text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2 ${(loading || selectedMembers.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Create Group
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupPage;