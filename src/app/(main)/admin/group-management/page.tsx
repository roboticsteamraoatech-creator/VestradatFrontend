'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Edit, Eye, Trash2, MoreHorizontal, UserCheck, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GroupService, Group, GroupMember } from '@/services/GroupService';
import { toast } from '@/app/components/hooks/use-toast';

const GroupManagementPage = () => {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // State for member modal
  const [memberModal, setMemberModal] = useState({
    isOpen: false,
    members: [] as GroupMember[],
    groupName: ''
  });
  
  // State for action modal
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    groupId: null as string | null,
    position: { top: 0, left: 0 }
  });
  
  // Refs for action buttons
  const actionButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  
  // Fetch groups from API
  useEffect(() => {
    fetchGroups();
  }, []);
  
  const fetchGroups = async () => {
    try {
      setLoading(true);
      const groupService = new GroupService();
      const response = await groupService.getGroups();
      setGroups(response.data.groups);
      setFilteredGroups(response.data.groups);
    } catch (error: any) {
      console.error('Error fetching groups:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch groups',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize and filter groups
  useEffect(() => {
    filterGroups();
  }, [searchTerm, groups]);

  const filterGroups = () => {
    let result = [...groups];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(group => 
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredGroups(result);
  };

  // State for delete confirmation modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    groupId: null as string | null,
    groupName: ''
  });
  
  // Handle group deletion
  const handleDeleteGroup = async (groupId: string) => {
    const groupToDelete = groups.find(group => group.id === groupId);
    if (groupToDelete) {
      setDeleteModal({
        isOpen: true,
        groupId,
        groupName: groupToDelete.name
      });
    }
  };
  
  // Confirm delete group
  const confirmDeleteGroup = async () => {
    if (deleteModal.groupId) {
      try {
        const groupService = new GroupService();
        await groupService.deleteGroup(deleteModal.groupId);
        
        toast({
          title: 'Success',
          description: `Group ${deleteModal.groupName} deleted successfully`,
        });
        
        // Refresh the groups list
        fetchGroups();
        
        // Close the modal
        setDeleteModal({
          isOpen: false,
          groupId: null,
          groupName: ''
        });
      } catch (error: any) {
        console.error('Error deleting group:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete group',
          variant: 'destructive',
        });
        
        // Close the modal
        setDeleteModal({
          isOpen: false,
          groupId: null,
          groupName: ''
        });
      }
    }
  };
  
  // Handle view group
  const handleViewGroup = (groupId: string) => {
    router.push(`/admin/group-management/view/${groupId}`);
  };
  
  // Handle edit group
  const handleEditGroup = (groupId: string) => {
    router.push(`/admin/group-management/edit/${groupId}`);
  };
  
  // Handle manage group members
  const handleManageMembers = (groupId: string) => {
    router.push(`/admin/group-management/manage-members/${groupId}`);
  };
  
  // Handle action button click
  const handleActionClick = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const button = actionButtonRefs.current[groupId];
    if (button) {
      const rect = button.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const modalHeight = 160; // Approximate modal height
      
      // Calculate position - show modal above if near bottom of viewport
      let top = rect.bottom;
      if (rect.bottom + modalHeight > viewportHeight) {
        top = rect.top - modalHeight;
      }
      
      setActionModal({
        isOpen: true,
        groupId,
        position: {
          top: top,
          left: rect.left - 150 // Adjust to align properly
        }
      });
    }
  };
  
  // Close action modal
  const closeActionModal = () => {
    setActionModal({ isOpen: false, groupId: null, position: { top: 0, left: 0 } });
  };
  
  // Open member modal
  const openMemberModal = (members: GroupMember[], groupName: string) => {
    setMemberModal({
      isOpen: true,
      members,
      groupName
    });
  };
  
  // Close member modal
  const closeMemberModal = () => {
    setMemberModal({
      isOpen: false,
      members: [],
      groupName: ''
    });
  };

  return (
    <>
      <div className="manrope">
        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
          .manrope { font-family: 'Manrope', sans-serif; }
          
          /* Custom scrollbar */
          .custom-scrollbar::-webkit-scrollbar {
            height: 8px;
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #a1a1a1;
          }
          
          /* Table container with fixed height for scroll */
          .table-container {
            max-height: calc(100vh - 300px);
            overflow-y: auto;
          }
          
          @media (min-width: 768px) {
            .table-container {
              max-height: calc(100vh - 280px);
            }
          }
        `}</style>

        <div className="pt-8 p-4 md:p-8 min-h-screen">
          {/* Header Section */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Group Management</h1>
            <p className="text-gray-600">Manage groups and their members for your organisation</p>
          </div>

          {/* Search and Action Section */}
          <div className="mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search groups..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <button
                className="px-4 py-3 bg-[#5D2A8B] text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2"
                onClick={() => router.push('/admin/group-management/create')}>
                <Plus className="w-5 h-5" />
                Create Group
              </button>
            </div>
          </div>

          {/* Groups Table with Scroll */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5D2A8B]"></div>
              </div>
            ) : (
              <div className="table-container">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Group Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Members
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredGroups.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <p className="text-lg font-medium">No groups found</p>
                            <p className="text-sm mt-1">Try adjusting your search</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredGroups.map((group) => (
                        <tr key={group.id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-gray-900">{group.name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">{group.description}</div>
                          </td>
                          <td className="px-6 py-4">
                            <button 
                              className="text-purple-600 hover:text-purple-800 font-medium text-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openMemberModal(group.members || [], group.name);
                              }}
                            >
                              View Members ({group.memberIds?.length ?? group.members?.length ?? 0})
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500">
                              {new Date(group.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                ref={(el) => {
                                  actionButtonRefs.current[group.id] = el;
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleActionClick(group.id, e);
                                }}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                                title="More actions"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </div>
      </div>
      
      {/* Member Modal */}
      {memberModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
          <div className="fixed inset-0" onClick={closeMemberModal}></div>
          <div className="relative bg-white rounded-xl shadow-2xl z-50 w-full max-w-2xl max-h-[80vh] overflow-y-auto border border-gray-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Members for {memberModal.groupName}</h3>
                <button 
                  onClick={closeMemberModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {memberModal.members.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No members in this group</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {memberModal.members.map((member, index) => (
                    <div 
                      key={index} 
                      className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">{member.fullName}</p>
                          <p className="text-xs text-gray-600 mt-1">{member.email}</p>
                        </div>
                        <div className="sm:text-right">
                          <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                            {member.role}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeMemberModal}
                  className="px-4 py-2 bg-[#5D2A8B] text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Action Modal */}
      {actionModal.isOpen && actionModal.groupId && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-white bg-opacity-0 md:bg-transparent" onClick={closeActionModal}></div>
                
          {/* Mobile Bottom Sheet */}
          <div className="md:hidden fixed bottom-20 left-0 right-0 bg-white rounded-t-[20px] z-50 p-6 shadow-2xl">
            <div className="flex flex-col gap-4">
              <button 
                className="text-left p-3 rounded-lg hover:bg-gray-50 transition-colors text-base text-[#1A1A1A]"
                onClick={() => {
                  handleViewGroup(actionModal.groupId!);
                  closeActionModal();
                }}
              >
                View Group
              </button>
                    
              <button 
                className="text-left p-3 rounded-lg hover:bg-gray-50 transition-colors text-base text-[#1A1A1A]"
                onClick={() => {
                  handleEditGroup(actionModal.groupId!);
                  closeActionModal();
                }}
              >
                Edit Group
              </button>
                    
              <button 
                className="text-left p-3 rounded-lg hover:bg-gray-50 transition-colors text-base text-[#1A1A1A]"
                onClick={() => {
                  handleManageMembers(actionModal.groupId!);
                  closeActionModal();
                }}
              >
                Manage Members
              </button>
                    
              <button 
                className="text-left p-3 rounded-lg hover:bg-gray-50 transition-colors text-base text-[#FF6161]"
                onClick={() => {
                  handleDeleteGroup(actionModal.groupId!);
                  closeActionModal();
                }}
              >
                Delete
              </button>
            </div>
          </div>
          
          {/* Desktop Modal */}
          <div 
            className="hidden md:block fixed bg-white shadow-lg rounded-lg z-50"
            style={{
              top: `${actionModal.position.top}px`,
              left: `${actionModal.position.left}px`,
              width: '180px',
              borderRadius: '12px',
              padding: '8px',
              boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.15)',
              border: '1px solid #e5e7eb'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-1">
              <button 
                className="text-left hover:bg-gray-50 p-2 rounded transition-colors text-sm text-[#1A1A1A] w-full"
                onClick={() => {
                  handleViewGroup(actionModal.groupId!);
                  closeActionModal();
                }}
              >
                View Group
              </button>
                        
              <button 
                className="text-left hover:bg-gray-50 p-2 rounded transition-colors text-sm text-[#1A1A1A] w-full"
                onClick={() => {
                  handleEditGroup(actionModal.groupId!);
                  closeActionModal();
                }}
              >
                Edit Group
              </button>
                        
              <button 
                className="text-left hover:bg-gray-50 p-2 rounded transition-colors text-sm text-[#1A1A1A] w-full"
                onClick={() => {
                  handleManageMembers(actionModal.groupId!);
                  closeActionModal();
                }}
              >
                Manage Members
              </button>
                        
              <button 
                className="text-left hover:bg-gray-50 p-2 rounded transition-colors text-sm text-[#FF6161] w-full"
                onClick={() => {
                  handleDeleteGroup(actionModal.groupId!);
                  closeActionModal();
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="fixed inset-0" onClick={() => setDeleteModal({
            isOpen: false,
            groupId: null,
            groupName: ''
          })}></div>
          <div className="relative bg-white rounded-xl shadow-2xl z-50 w-full max-w-md border border-gray-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
                <button 
                  onClick={() => setDeleteModal({
                    isOpen: false,
                    groupId: null,
                    groupName: ''
                  })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete group <span className="font-semibold">{deleteModal.groupName}</span>? This action cannot be undone.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteModal({
                    isOpen: false,
                    groupId: null,
                    groupName: ''
                  })}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteGroup}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GroupManagementPage;