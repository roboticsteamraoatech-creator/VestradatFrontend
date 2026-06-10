
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MeasurementTopNav } from '@/app/components/MeasurementTopNav'; 
import ActionModal from '@/app/components/ActionModal';
import { AdminMeasurementService, Measurement } from '@/services/AdminMeasurementService';
import { toast } from '@/app/components/hooks/use-toast';
import { Plus, MoreVertical, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface MeasurementData {
  chest: string;
  waist: string;
  hips: string;
  legs: string;
}

interface MeasurementItem {
  label: string;
  value: string;
}

interface MeasurementSection {
  sectionName: string;
  measurements: Array<{
    bodyPartName: string;
    size: number;
  }>;
}

const AdminBodyMeasurementPage = () => {
  const router = useRouter();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMeasurement, setSelectedMeasurement] = useState<Measurement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMeasurements, setTotalMeasurements] = useState(0);

 
  useEffect(() => {
    const fetchMeasurements = async () => {
      try {
        setLoading(true);
        const measurementService = new AdminMeasurementService();
        const response = await measurementService.getMeasurements(currentPage, 10);
        
        const responseData = response.data;
        setMeasurements(responseData.measurements || []);
        setTotalPages(responseData.pagination?.totalPages || 1);
        setTotalMeasurements(responseData.total || 0);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching measurements:', err);
        setError(err.message || 'Failed to fetch measurements');
        toast({ 
          title: 'Error', 
          description: err.message || 'Failed to fetch measurements',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMeasurements();
  }, [currentPage]);

  const getSummaryMeasurements = (): any => {
    if (!measurements || measurements.length === 0) {
      return [
        { label: 'Chest', value: '--' },
        { label: 'Waist', value: '--' },
        { label: 'Hips', value: '--' },
        { label: 'Shoulder', value: '--' }
      ];
    }

    const latestMeasurement = measurements[0];
    const summary: any[] = [];

    // Try new format first (sections with bodyPartName)
    if (latestMeasurement.sections && Array.isArray(latestMeasurement.sections)) {
      latestMeasurement.sections.forEach((section: any) => {
        if (section.measurements && Array.isArray(section.measurements)) {
          section.measurements.forEach((measurement: any) => {
            if (measurement.bodyPartName && measurement.size !== undefined && measurement.size !== null) {
              const partName = measurement.bodyPartName.toLowerCase();
              const displayValue = `${measurement.size} cm`;
              
              if (partName.includes('chest') || partName.includes('bust')) {
                summary.push({ label: 'Chest', value: displayValue });
              } else if (partName.includes('waist')) {
                summary.push({ label: 'Waist', value: displayValue });
              } else if (partName.includes('hip')) {
                summary.push({ label: 'Hips', value: displayValue });
              } else if (partName.includes('shoulder')) {
                summary.push({ label: 'Shoulder', value: displayValue });
              } else {
                // For other body parts, use the actual name
                const displayName = measurement.bodyPartName.charAt(0).toUpperCase() + measurement.bodyPartName.slice(1);
                summary.push({ label: displayName, value: displayValue });
              }
            }
          });
        }
      });
    }
    // Fallback to old format (measurements object)
    else if (latestMeasurement.measurements && typeof latestMeasurement.measurements === 'object') {
      Object.entries(latestMeasurement.measurements).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        
        const partName = key.toLowerCase();
        const displayValue = `${value} cm`;
        
        if (partName.includes('chest') || partName.includes('bust')) {
          summary.push({ label: 'Chest', value: displayValue });
        } else if (partName.includes('waist')) {
          summary.push({ label: 'Waist', value: displayValue });
        } else if (partName.includes('hip')) {
          summary.push({ label: 'Hips', value: displayValue });
        } else if (partName.includes('shoulder')) {
          summary.push({ label: 'Shoulder', value: displayValue });
        } else {
          // For other body parts, use the actual name
          const displayName = key.charAt(0).toUpperCase() + key.slice(1);
          summary.push({ label: displayName, value: displayValue });
        }
      });
    }

    // Ensure we always have at least 4 measurements by filling with defaults if needed
    const requiredMeasurements = ['Chest', 'Waist', 'Hips', 'Shoulder'];
    requiredMeasurements.forEach(required => {
      if (!summary.some(item => item.label === required)) {
        summary.push({ label: required, value: '--' });
      }
    });

    // Limit to 4 items for display
    return summary.slice(0, 4);
  };

  const handleActionClick = (measurement: Measurement, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedMeasurement(measurement);
    setIsModalOpen(true);
    
    const button = e.currentTarget as HTMLButtonElement;
    const rect = button.getBoundingClientRect();
    
    const top = rect.bottom + window.scrollY + 5;
    const left = rect.left + window.scrollX - 50;
    
    setModalPosition({
      top,
      left
    });
  };

  const handleEdit = () => {
    if (selectedMeasurement) {
      const measurementId = selectedMeasurement._id || selectedMeasurement.id;
      router.push(`/admin/body-measurement/edit/${measurementId}`);
    }
  };

  const handleView = () => {
    if (selectedMeasurement) {
      const measurementId = selectedMeasurement._id || selectedMeasurement.id;
      router.push(`/admin/body-measurement/view/${measurementId}`);
    }
  };

  const handleDelete = async () => {
    if (selectedMeasurement) {
      try {
        const measurementService = new AdminMeasurementService();
        const measurementId = selectedMeasurement._id || selectedMeasurement.id;
        await measurementService.deleteMeasurement(measurementId);
        
        // Filter using both possible ID fields
        setMeasurements(prev => prev.filter(m => (m._id || m.id) !== measurementId));
        
        toast({ 
          title: 'Success', 
          description: 'Measurement deleted successfully',
          variant: 'default'
        });
      } catch (err: any) {
        console.error('Failed to delete measurement:', err);
        toast({ 
          title: 'Error', 
          description: err.message || 'Failed to delete measurement',
          variant: 'destructive'
        });
      }
    }
    setIsModalOpen(false);
  };

  const handleCopy = async () => {
    if (selectedMeasurement) {
      try {
        // Format the measurement data in a readable format for clipboard
        let formattedData = `Measurement Details:\n\n`;
        
        // Add user information if available
        if (selectedMeasurement.userInfo) {
          formattedData += `User: ${selectedMeasurement.userInfo.fullName || 'N/A'}\n`;
          formattedData += `Email: ${selectedMeasurement.userInfo.email || 'N/A'}\n`;
          formattedData += `User ID: ${selectedMeasurement.userInfo.customUserId || 'N/A'}\n\n`;
        }
        
        // Add submission type
        formattedData += `Submission Type: ${selectedMeasurement.submissionType || 'Manual'}\n\n`;
        
        // Add measurements data based on format
        if (selectedMeasurement.sections && Array.isArray(selectedMeasurement.sections)) {
          formattedData += 'Measurements (by sections):\n';
          selectedMeasurement.sections.forEach((section: any) => {
            formattedData += `\n${section.sectionName || 'Section'}:\n`;
            if (section.measurements && Array.isArray(section.measurements)) {
              section.measurements.forEach((measurement: any) => {
                if (measurement.bodyPartName && measurement.size !== undefined && measurement.size !== null) {
                  formattedData += `  - ${measurement.bodyPartName}: ${measurement.size} cm\n`;
                }
              });
            }
          });
        } else if (selectedMeasurement.measurements && typeof selectedMeasurement.measurements === 'object') {
          formattedData += 'Measurements:\n';
          Object.entries(selectedMeasurement.measurements).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              formattedData += `  - ${key}: ${value} cm\n`;
            }
          });
        }
        
        // Add notes if available
        if (selectedMeasurement.notes) {
          formattedData += `\nNotes: ${selectedMeasurement.notes}\n`;
        }
        
        // Copy to clipboard
        await navigator.clipboard.writeText(formattedData);
        
        toast({
          title: 'Copied',
          description: 'Measurement data has been copied sucessfully',
          variant: 'default'
        });
      } catch (err: any) {
        console.error('Failed to copy measurement:', err);
        toast({
          title: 'Error',
          description: 'Failed to copy measurement data',
          variant: 'destructive'
        });
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  // Filter measurements based on search term
  const filteredMeasurements = measurements.filter((measurement: Measurement) => {
    const userName = measurement.userName || '';
    const fullName = measurement.userInfo?.fullName || '';
    const email = measurement.userInfo?.email || '';
    const submissionType = measurement.submissionType || '';
    
    return userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           submissionType.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Get all unique measurement names from both formats
  const getAllMeasurementNames = () => {
    const measurementNames = new Set<string>();
    
    filteredMeasurements.forEach((item: Measurement) => {
      // Check new format (sections array)
      if (item.sections && Array.isArray(item.sections)) {
        item.sections.forEach((section: any) => {
          if (section.measurements && Array.isArray(section.measurements)) {
            section.measurements.forEach((measurement: any) => {
              if (measurement.bodyPartName) {
                // Format name: Capitalize first letter
                const formattedName = measurement.bodyPartName
                  .charAt(0).toUpperCase() + measurement.bodyPartName.slice(1);
                measurementNames.add(formattedName);
              }
            });
          }
        });
      }
      // Check old format (measurements object)
      else if (item.measurements && typeof item.measurements === 'object') {
        Object.keys(item.measurements).forEach(key => {
          if (item.measurements && item.measurements[key] !== undefined && item.measurements[key] !== null) {
            const formattedName = key.charAt(0).toUpperCase() + key.slice(1);
            measurementNames.add(formattedName);
          }
        });
      }
    });
    
    return Array.from(measurementNames);
  };

  // Get measurement value for a specific name
  const getMeasurementValue = (measurement: Measurement, measurementName: string) => {
    const lowerName = measurementName.toLowerCase();
    
    // Check new format first
    if (measurement.sections && Array.isArray(measurement.sections)) {
      for (const section of measurement.sections) {
        if (section.measurements && Array.isArray(section.measurements)) {
          for (const meas of section.measurements) {
            if (meas.bodyPartName && meas.bodyPartName.toLowerCase() === lowerName && 
                meas.size !== undefined && meas.size !== null) {
              return `${meas.size} cm`;
            }
          }
        }
      }
    }
    
    // Check old format
    if (measurement.measurements && typeof measurement.measurements === 'object') {
      const value = measurement.measurements[lowerName];
      if (value !== undefined && value !== null) {
        return `${value} cm`;
      }
    }
    
    return '--';
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= maxVisiblePages; i++) {
          pages.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - maxVisiblePages + 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }
    
    return pages;
  };

  return (
    <div className="min-h-screen bg-white md:bg-gray-50">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
        .manrope { font-family: 'Manrope', sans-serif; }
      `}</style>

      {/* Measurement Top Nav */}
      <MeasurementTopNav
        title="Current body measurement"
        measurements={getSummaryMeasurements()}
        onSearch={handleSearch}
        searchTerm={searchTerm}
      />

      {/* Main Content - Responsive Positioning */}
      <div className="w-full px-4 md:px-6 py-4">
        
        {/* Header with Title and Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="manrope text-xl md:text-3xl font-semibold text-gray-800">
            All Body Measurements
          </h1>
          <button
            onClick={() => router.push('/admin/body-measurement/create')}
            className="manrope flex items-center gap-2 bg-[#5D2A8B] text-white px-6 py-2.5 rounded-full hover:bg-purple-700 transition-colors w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            Create New
          </button>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          
          {/* Loading, Error, Empty State Handling */}
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="manrope text-gray-500 mt-4">Loading measurements...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className="manrope text-red-500">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="manrope mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Retry
              </button>
            </div>
          ) : !filteredMeasurements || filteredMeasurements.length === 0 ? (
            <div className="p-8 md:p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl border-2 border-purple-200 flex items-center justify-center">
                <Plus className="w-10 h-10 text-purple-300" />
              </div>
              <h3 className="manrope text-lg font-semibold text-gray-800 mb-2">
                {searchTerm ? 'No matching measurements found' : 'No measurements recorded yet!'}
              </h3>
              <p className="manrope text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                {searchTerm ? 
                  'Try adjusting your search terms' : 
                  'There is nothing to view right now, Create a body measurement to see here.'}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="manrope px-4 py-2 text-purple-600 hover:text-purple-700"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="manrope text-left px-6 py-4 text-sm font-medium text-gray-500">User Details</th>
                      <th className="manrope text-left px-6 py-4 text-sm font-medium text-gray-500">Measurement Type</th>
                      {/* Dynamic measurement columns */}
                      {getAllMeasurementNames().slice(0, 5).map((measurementName, index) => (
                        <th key={index} className="manrope text-left px-6 py-4 text-sm font-medium text-gray-500">
                          {measurementName}
                        </th>
                      ))}
                      <th className="manrope text-left px-6 py-4 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredMeasurements.map((measurement: Measurement) => {
                      // Use _id if available, otherwise use id
                      const measurementId = measurement._id || measurement.id;
                      
                      return (
                        <tr key={measurementId} className="hover:bg-gray-50">
                          <td className="manrope px-6 py-4">
                            <div className="flex flex-col">
                              <div className="text-sm font-semibold text-gray-900">
                                {measurement.userInfo?.fullName || measurement.firstName || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {measurement.userInfo?.email || 'N/A'}
                              </div>
                              {measurement.userInfo?.customUserId && (
                                <div className="text-xs text-gray-400 mt-1">
                                  ID: {measurement.userInfo.customUserId}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="manrope px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {measurement.submissionType || measurement.measurements || 'Manual'}
                          </td>
                          {/* Dynamic measurement values */}
                          {getAllMeasurementNames().slice(0, 5).map((measurementName, index) => (
                            <td key={index} className="manrope px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {getMeasurementValue(measurement, measurementName)}
                            </td>
                          ))}
                          <td className="manrope px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={(e) => handleActionClick(measurement, e)}
                                className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100"
                                aria-label="More actions"
                              >
                                <MoreVertical className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                {/* Improved Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="manrope text-sm text-gray-700">
                        Showing <span className="font-medium">{((currentPage - 1) * 10) + 1}</span> -{' '}
                        <span className="font-medium">{Math.min(currentPage * 10, totalMeasurements)}</span> of{' '}
                        <span className="font-medium">{totalMeasurements}</span> measurements
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          className="manrope px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          onClick={() => handlePageChange(1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronsLeft className="w-4 h-4" />
                          First
                        </button>
                        <button 
                          className="manrope px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </button>
                        
                        {/* Page Numbers */}
                        <div className="flex items-center gap-1">
                          {generatePageNumbers().map((pageNum) => (
                            <button
                              key={pageNum}
                              className={`manrope w-10 h-10 flex items-center justify-center rounded-lg text-sm ${
                                currentPage === pageNum
                                  ? 'bg-[#5D2A8B] text-white'
                                  : 'border border-gray-300 hover:bg-gray-50'
                              }`}
                              onClick={() => handlePageChange(pageNum)}
                            >
                              {pageNum}
                            </button>
                          ))}
                        </div>
                        
                        <button 
                          className="manrope px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <button 
                          className="manrope px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          onClick={() => handlePageChange(totalPages)}
                          disabled={currentPage === totalPages}
                        >
                          Last
                          <ChevronsRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden">
                <div className="space-y-4">
                  {filteredMeasurements.map((measurement: Measurement) => {
                    // Use _id if available, otherwise use id
                    const measurementId = measurement._id || measurement.id;
                    
                    return (
                      <div key={measurementId} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="manrope font-semibold text-gray-900">
                              {measurement.userInfo?.fullName || measurement.firstName || 'N/A'}
                            </h3>
                            <p className="manrope text-sm text-gray-500 mt-1">
                              {measurement.userInfo?.email || 'N/A'}
                            </p>
                            <p className="manrope text-xs text-gray-400 mt-1">
                              {measurement.submissionType || measurement.measurements || 'Manual'} • ID: {measurement.userInfo?.customUserId || 'N/A'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {getAllMeasurementNames().slice(0, 4).map((measurementName, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <span className="manrope text-sm text-gray-500">{measurementName}:</span>
                              <span className="manrope text-sm font-medium text-gray-900">
                                {getMeasurementValue(measurement, measurementName)}
                              </span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-4 flex space-x-3">
                          <button
                            onClick={() => {
                              // Use _id if available, otherwise use id
                              const idToUse = measurement._id || measurement.id;
                              router.push(`/admin/body-measurement/view/${idToUse}`);
                            }}
                            className="manrope flex-1 bg-indigo-50 text-indigo-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-indigo-100"
                          >
                            View
                          </button>
                          <button
                            onClick={(e) => handleActionClick(measurement, e)}
                            className="manrope flex-1 bg-gray-50 text-gray-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-100"
                          >
                            More
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Mobile Pagination */}
                {totalPages > 1 && (
                  <div className="px-4 py-4 border-t border-gray-200">
                    <div className="flex flex-col items-center justify-between gap-4">
                      <div className="manrope text-sm text-gray-700 text-center">
                        Showing <span className="font-medium">{((currentPage - 1) * 10) + 1}</span> -{' '}
                        <span className="font-medium">{Math.min(currentPage * 10, totalMeasurements)}</span> of{' '}
                        <span className="font-medium">{totalMeasurements}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          className="manrope px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        <span className="manrope text-sm text-gray-700">
                          Page {currentPage} of {totalPages}
                        </span>
                        
                        <button 
                          className="manrope px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action Modal */}
      <ActionModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onViewMeasurement={handleView}
        onEditMeasurement={handleEdit}
        onDelete={handleDelete}
        onCopyMeasurement={handleCopy}
        position={modalPosition}
      />
    </div>
  );
};

export default AdminBodyMeasurementPage;