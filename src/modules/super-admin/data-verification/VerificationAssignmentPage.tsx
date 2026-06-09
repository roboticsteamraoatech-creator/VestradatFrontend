'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Eye, MapPin, User, Building2, Calendar, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DataVerificationService from '@/services/DataVerificationService';
import { toast } from '@/app/components/hooks/use-toast';
import LocationModal from './LocationModal';

interface Location {
  _id: string;
  locationType: string;
  brandName: string;
  country: string;
  state: string;
  lga: string;
  city: string;
  cityRegion: string;
  houseNumber: string;
  street: string;
  landmark: string;
  buildingColor?: string;
  buildingType?: string;
}

interface Assignment {
  _id: string;
  userId: string;
  userName: string;
  organizationId: string;
  organizationName: string;
  targetUserId: string;
  targetUserName: string;
  targetUserEmail: string;
  organizationLocationDetails: Location[];
  status: string;
  assignedBy: string;
  assignedAt: string;
  createdAt: string;
  updatedAt: string;
}

const VerificationAssignmentPage = () => {
  const router = useRouter();
  const dataVerificationService = new DataVerificationService();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // State for location modal
  const [locationModal, setLocationModal] = useState({
    isOpen: false,
    assignment: null as Assignment | null
  });

  // State for delete confirmation modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    assignmentId: null as string | null,
    organizationName: ''
  });

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
    filterAssignments();
  }, [searchTerm, assignments]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      // Get token from auth context or localStorage
      const token = localStorage.getItem('userToken') || '';
      const response = await dataVerificationService.getAllAssignments(token);
      setAssignments(response.data.assignments);
      setFilteredAssignments(response.data.assignments);
    } catch (error: any) {
      console.error('Error fetching assignments:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch assignments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAssignments = () => {
    let result = [...assignments];
    
    if (searchTerm) {
      result = result.filter(assignment => 
        assignment.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.targetUserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.targetUserEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredAssignments(result);
  };

  const handleViewLocations = (assignment: Assignment) => {
    setLocationModal({
      isOpen: true,
      assignment
    });
  };

  const handleDeleteAssignment = (assignmentId: string, organizationName: string) => {
    setDeleteModal({
      isOpen: true,
      assignmentId,
      organizationName
    });
  };

  const confirmDeleteAssignment = async () => {
    if (deleteModal.assignmentId) {
      try {
        // TODO: Implement deleteAssignment method in DataVerificationService
        // await dataVerificationService.deleteAssignment(deleteModal.assignmentId);
        
        toast({
          title: 'Error',
          description: 'Delete functionality not yet implemented',
          variant: 'destructive',
        });
        
        // fetchAssignments();
        
        setDeleteModal({
          isOpen: false,
          assignmentId: null,
          organizationName: ''
        });
      } catch (error: any) {
        console.error('Error deleting assignment:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete assignment',
          variant: 'destructive',
        });
        
        setDeleteModal({
          isOpen: false,
          assignmentId: null,
          organizationName: ''
        });
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="manrope">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
        .manrope { font-family: 'Manrope', sans-serif; }
        
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

      <div className="ml-0 md:ml-[350px] pt-8 md:pt-8 p-4 md:p-8 min-h-screen">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Verification Assignments</h1>
          <p className="text-gray-600">Manage data verification assignments and organization allocations</p>
        </div>

        {/* Search and Action Section */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by organization, user, or email..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <button
              className="px-4 py-3 bg-[#5D2A8B] text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2"
              onClick={() => router.push('/super-admin/data-verification/assignment/create')}
            >
              <Plus className="w-5 h-5" />
              Create Assignment
            </button>
          </div>
        </div>

        {/* Assignments Table */}
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
                      Organization
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Target User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Locations
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned Date
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAssignments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <p className="text-lg font-medium">No assignments found</p>
                          <p className="text-sm mt-1">Create a new assignment to get started</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAssignments.map((assignment) => (
                      <tr key={assignment._id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-purple-600" />
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{assignment.organizationName}</div>
                              <div className="text-xs text-gray-500">{assignment.organizationId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-gray-900">{assignment.userName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{assignment.targetUserName}</div>
                            <div className="text-xs text-gray-500">{assignment.targetUserEmail}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleViewLocations(assignment)}
                            className="flex items-center gap-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 px-3 py-1 rounded-lg transition-all duration-200"
                            title="View Locations"
                          >
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm font-medium">{assignment.organizationLocationDetails.length}</span>
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                            assignment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            assignment.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            assignment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {assignment.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            {formatDate(assignment.assignedAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors duration-200"
                              title="View Locations"
                              onClick={() => handleViewLocations(assignment)}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                              onClick={() => handleDeleteAssignment(assignment._id, assignment.organizationName)}
                              title="Delete Assignment"
                            >
                              <Trash2 className="w-4 h-4" />
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

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Assignment</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the assignment for "<strong>{deleteModal.organizationName}</strong>"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAssignment}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Modal */}
      <LocationModal
        isOpen={locationModal.isOpen}
        assignment={locationModal.assignment}
        onClose={() => setLocationModal({ isOpen: false, assignment: null })}
      />
    </div>
  );
};

export default VerificationAssignmentPage;
