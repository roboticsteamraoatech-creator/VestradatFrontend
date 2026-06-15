'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, X, UserPlus, UserMinus } from 'lucide-react';
import { GroupService, ManageGroupMembersData } from '@/services/GroupService';
import { AdminUserService } from '@/services/AdminUserService';
import { toast } from '@/app/components/hooks/use-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: string;
  status: 'pending' | 'active' | 'disabled' | 'archived';
  organizationId?: string;
  organizationName: string | null;
  createdBy: string;
  isVerified: boolean;
  customUserId: string;
  permissions: any[];
  createdAt: string;
}

const ManageGroupMembersPage = () => {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  
  const [group, setGroup] = useState<any>(null); // Using any since we don't have a specific interface for the response
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [groupMembers, setGroupMembers] = useState<User[]>([]);
  const [nonGroupMembers, setNonGroupMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<'add' | 'remove'>('add');

  useEffect(() => {
    fetchGroupAndUsers();
  }, [groupId]);

  const fetchGroupAndUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch group details
      const groupService = new GroupService();
      const groupResponse = await groupService.getGroupById(groupId);
      const fetchedGroup = groupResponse.data.group;
      setGroup(fetchedGroup);

      // Fetch all users
      const adminUserService = new AdminUserService();
      const usersResponse = await adminUserService.getAllUsers();
      const adminUsers = usersResponse.data.users;
      
      // Convert AdminUser objects to User objects
      const allUsers: User[] = adminUsers.map(user => ({
        id: user.id,
        name: user.fullName || `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
      }));

      // Separate group members from non-group members
      const groupMemberIds = new Set(fetchedGroup.memberIds);
      const members = allUsers.filter((user: User) => groupMemberIds.has(user.id));
      const nonMembers = allUsers.filter((user: User) => !groupMemberIds.has(user.id));

      setAllUsers(allUsers);
      setGroupMembers(members);
      setNonGroupMembers(nonMembers);
    } catch (error: any) {
      console.error('Error fetching group and users:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch group and users data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMemberToggle = (userId: string) => {
    if (action === 'add') {
      const userToAdd = nonGroupMembers.find(user => user.id === userId);
      if (userToAdd) {
        setGroupMembers(prev => [...prev, userToAdd]);
        setNonGroupMembers(prev => prev.filter(user => user.id !== userId));
      }
    } else {
      const userToRemove = groupMembers.find(user => user.id === userId);
      if (userToRemove) {
        setNonGroupMembers(prev => [...prev, userToRemove]);
        setGroupMembers(prev => prev.filter(user => user.id !== userId));
      }
    }
  };

  // Reverses a selection made via handleMemberToggle — the user is already in the
  // opposite list by the time the chip X is clicked, so we must look there.
  const handleChipRemove = (userId: string) => {
    if (action === 'add') {
      const user = groupMembers.find(u => u.id === userId);
      if (user) {
        setNonGroupMembers(prev => [...prev, user]);
        setGroupMembers(prev => prev.filter(u => u.id !== userId));
      }
    } else {
      const user = nonGroupMembers.find(u => u.id === userId);
      if (user) {
        setGroupMembers(prev => [...prev, user]);
        setNonGroupMembers(prev => prev.filter(u => u.id !== userId));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!group) return;
    
    setLoading(true);
    
    try {
      const groupService = new GroupService();
      const originalMemberIds = new Set(group.memberIds);
      const userIds = action === 'add'
        ? groupMembers.map(user => user.id).filter(id => !originalMemberIds.has(id))
        : nonGroupMembers.filter(user => originalMemberIds.has(user.id)).map(user => user.id);
      
      if (userIds.length === 0) {
        toast({
          title: 'Info',
          description: 'No changes made to group members',
        });
        router.push('/admin/group-management');
        return;
      }

      const manageData: ManageGroupMembersData = {
        action: action,
        userIds: userIds
      };
      
      await groupService.manageGroupMembers(groupId, manageData);
      
      toast({
        title: 'Success',
        description: `Group members ${action === 'add' ? 'added' : 'removed'} successfully!`,
      });
      
      router.push('/admin/group-management');
    } catch (error: any) {
      console.error('Error managing group members:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to manage group members',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !group) {
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
          
          <h1 className="text-2xl font-bold text-gray-800">Manage Group Members</h1>
          <p className="text-gray-600 mt-1">Add or remove members from the group: {group.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl">
          {/* Action Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Action</h2>
            
            <div className="flex space-x-4">
              <button
                type="button"
                className={`px-4 py-2 rounded-lg border ${
                  action === 'add' 
                    ? 'bg-purple-100 border-purple-500 text-purple-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setAction('add')}
              >
                <div className="flex items-center">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Members
                </div>
              </button>
              
              <button
                type="button"
                className={`px-4 py-2 rounded-lg border ${
                  action === 'remove' 
                    ? 'bg-red-100 border-red-500 text-red-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setAction('remove')}
              >
                <div className="flex items-center">
                  <UserMinus className="w-4 h-4 mr-2" />
                  Remove Members
                </div>
              </button>
            </div>
          </div>

          {/* Members Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {action === 'add' ? 'Add Members to Group' : 'Remove Members from Group'}
            </h2>
            
            {action === 'add' ? (
              <div className="space-y-4">
                {nonGroupMembers.length === 0 ? (
                  <p className="text-gray-500 italic">No users available to add to this group</p>
                ) : (
                  <>
                    <p className="text-gray-600 text-sm mb-4">
                      Select users to {action} to the group
                    </p>
                    {nonGroupMembers.map((user) => (
                      <div 
                        key={user.id}
                        className="border rounded-lg p-4 cursor-pointer transition-all duration-200 border-gray-200 hover:border-gray-300"
                        onClick={() => handleMemberToggle(user.id)}
                      >
                        <div className="flex items-start">
                          <div className="flex items-center h-5 mt-0.5 mr-3 text-gray-400">
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500 mt-1">{user.email} | {user.role}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {groupMembers.length === 0 ? (
                  <p className="text-gray-500 italic">No members in this group to remove</p>
                ) : (
                  <>
                    <p className="text-gray-600 text-sm mb-4">
                      Select members to {action} from the group
                    </p>
                    {groupMembers.map((user) => (
                      <div 
                        key={user.id}
                        className="border rounded-lg p-4 cursor-pointer transition-all duration-200 border-gray-200 hover:border-gray-300"
                        onClick={() => handleMemberToggle(user.id)}
                      >
                        <div className="flex items-start">
                          <div className="flex items-center h-5 mt-0.5 mr-3 text-gray-400">
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500 mt-1">{user.email} | {user.role}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Selected Members Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Selected Members</h2>
            
            {action === 'add' ? (
              <div>
                {groupMembers.filter(user => !group.memberIds.includes(user.id)).length === 0 ? (
                  <p className="text-gray-500 italic">No members selected to add</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {groupMembers.filter(user => !group.memberIds.includes(user.id)).map(user => (
                      <div
                        key={user.id}
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-purple-100 text-purple-800"
                      >
                        {user.name}
                        <button
                          type="button"
                          onClick={() => handleChipRemove(user.id)}
                          className="ml-2 text-purple-600 hover:text-purple-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                {nonGroupMembers.filter(user => group.memberIds.includes(user.id)).length === 0 ? (
                  <p className="text-gray-500 italic">No members selected to remove</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {nonGroupMembers.filter(user => group.memberIds.includes(user.id)).map(user => (
                      <div
                        key={user.id}
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-red-100 text-red-800"
                      >
                        {user.name}
                        <button
                          type="button"
                          onClick={() => handleChipRemove(user.id)}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
              disabled={loading}
              className={`px-6 py-3 bg-[#5D2A8B] text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {action === 'add' ? 'Adding...' : 'Removing...'}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {action === 'add' ? 'Add Members' : 'Remove Members'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManageGroupMembersPage;