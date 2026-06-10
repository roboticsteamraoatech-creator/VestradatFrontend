
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Components should be imported relative to your project structure
import { MeasurementTopNav } from '@/app/components/MeasurementTopNav';
import { UserTopBar } from '@/app/components/user-topbar';
import ActionModal from '@/app/components/ActionModal';

import { 
    useManualMeasurements, 
    Measurement, 
    MeasurementSection, 
    MeasurementData as ApiMeasurementData,
    useDeleteManualMeasurement
} from '@/api/hooks/useManualMeasurement'; 
import { Plus, Eye, Camera, MoreVertical, Download, Share2, ChevronDown, Users, X } from 'lucide-react';
import { useAuthContext } from '@/AuthContext';

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

const BodyMeasurementPage = () => {
  const router = useRouter();
  const { data: measurements, isLoading, error, refetch } = useManualMeasurements();
  const { mutate: deleteMeasurement } = useDeleteManualMeasurement();
  const { user } = useAuthContext(); // Get user info from auth context
  const [selectedMeasurement, setSelectedMeasurement] = useState<Measurement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [isShareDropdownOpen, setIsShareDropdownOpen] = useState(false);
  const [isOrganizationModalOpen, setIsOrganizationModalOpen] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [organizationCode, setOrganizationCode] = useState('');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDeleteSuccessModalOpen, setIsDeleteSuccessModalOpen] = useState(false);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState('');
  const shareDropdownRef = useRef<HTMLDivElement>(null);

  const latestMeasurement = measurements && measurements.length > 0 ? measurements[0] : null;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareDropdownRef.current && !shareDropdownRef.current.contains(event.target as Node)) {
        setIsShareDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSummaryMeasurements = (): any => {
    if (!latestMeasurement) {
      return [
        { label: 'Chest', value: '--' },
        { label: 'Waist', value: '--' },
        { label: 'Hips', value: '--' },
        { label: 'Legs', value: '--' }
      ];
    }

    const summary: any[] = [];

    // Process all sections and their measurements
    latestMeasurement.sections?.forEach((section: MeasurementSection) => {
      section.measurements?.forEach((m: ApiMeasurementData) => {
        const partName = m.bodyPartName?.toLowerCase() || section.sectionName?.toLowerCase() || 'Unknown';
        const size = typeof m.size === 'string' ? parseFloat(m.size) : m.size;
        const value = isNaN(size) ? '--' : `${size.toFixed(2)} cm`;
        
        // Check for common body parts and add them to summary
        if (partName?.includes('chest')) {
          summary.push({ label: 'Chest', value });
        } else if (partName?.includes('waist')) {
          summary.push({ label: 'Waist', value });
        } else if (partName?.includes('hip')) {
          summary.push({ label: 'Hips', value });
        } else if (partName?.includes('leg') || partName?.includes('thigh')) {
          summary.push({ label: 'Legs', value });
        } else {
          // For other body parts, use the actual name
          const displayName = m.bodyPartName || section.sectionName || 'Measurement';
          summary.push({ label: displayName, value });
        }
      });
    });

    // Ensure we always have at least 4 measurements by filling with defaults if needed
    const requiredMeasurements = ['Chest', 'Waist', 'Hips', 'Legs'];
    requiredMeasurements.forEach(required => {
      if (!summary.some(item => item.label === required)) {
        summary.push({ label: required, value: '--' });
      }
    });

    // Limit to 4 items for display
    return summary.slice(0, 4);
  };

  // Helper function to get a specific measurement value
  const getMeasurementValue = (label: string): string => {
    const measurements = getSummaryMeasurements();
    const item = measurements.find((m: any) => m.label === label);
    return item ? item.value : '--';
  };

  const handleActionClick = (measurement: Measurement, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedMeasurement(measurement);
    setIsModalOpen(true);
    
    // Set modal position based on button position with better viewport awareness
    const button = e.currentTarget as HTMLButtonElement;
    const rect = button.getBoundingClientRect();
    
    // Calculate position relative to viewport
    const top = rect.bottom + window.scrollY + 5;
    const left = rect.left + window.scrollX - 50; // Adjust to center the modal on the button
    
    setModalPosition({
      top,
      left
    });
  };

  const handleDownloadFromAction = () => {
    handleDownload();
    closeModal();
  };

  const handleShareFromAction = async () => {
    if (selectedMeasurement) {
      await handleNativeShare(selectedMeasurement);
    }
    closeModal();
  };
  
  const handleShareToOthersFromAction = async () => {
    if (selectedMeasurement) {
      await handleNativeShare(selectedMeasurement);
    }
    closeModal();
  };
  
  const handleShareToOrganizationFromAction = async () => {
    setIsOrganizationModalOpen(true);
    closeModal();
  };

  const handleEdit = () => {
    if (selectedMeasurement) {
      router.push(`/user/body-measurement/edit?id=${selectedMeasurement.id}`);
    }
  };

  const handleView = () => {
    if (selectedMeasurement) {
      router.push(`/user/body-measurement/view?id=${selectedMeasurement.id}`);
    }
  };

  const handleDelete = () => {
    // Open confirmation modal instead of directly deleting
    setIsDeleteConfirmOpen(true);
    setIsModalOpen(false);
  };

  const confirmDelete = () => {
    if (selectedMeasurement) {
      deleteMeasurement(selectedMeasurement.id, {
        onSuccess: (response) => {
          // Refetch measurements to update the list
          refetch();
          // Close the confirmation modal
          setIsDeleteConfirmOpen(false);
          
          // Show success message if available in response
          if (response && typeof response === 'object' && 'data' in response) {
            const responseData = response.data;
            if (responseData && typeof responseData === 'object' && 'message' in responseData) {
              const message = responseData.message;
              if (typeof message === 'string') {
                setDeleteSuccessMessage(message);
              }
            }
          } else {
            // Default message if no specific message in response
            setDeleteSuccessMessage('Measurement deleted successfully');
          }
          
          // Open the success modal
          setIsDeleteSuccessModalOpen(true);
        },
        onError: (err) => {
          console.error('Failed to delete measurement:', err);
          // Close the confirmation modal even if delete fails
          setIsDeleteConfirmOpen(false);
        }
      });
    }
  };

  const cancelDelete = () => {
    setIsDeleteConfirmOpen(false);
    setIsDeleteSuccessModalOpen(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  // Helper function to generate measurement text for a specific measurement
  const getMeasurementText = (measurement: Measurement): string => {
    if (!measurement) return '';
    
    let measurementText = `Body Measurement Report\n\n`;
    measurementText += `Name: ${measurement.firstName} ${measurement.lastName}\n`;
    measurementText += `Measurement Type: ${measurement.measurementType}\n`;
    measurementText += `Date: ${new Date(measurement.createdAt).toLocaleDateString()}\n\n`;
    measurementText += `Measurements:\n`;
    
    let measurementsDetails = '';
    measurement.sections?.forEach((section: MeasurementSection) => {
      measurementsDetails += `\n${section.sectionName}:\n`;
      section.measurements?.forEach((measurementData: ApiMeasurementData) => {
        measurementsDetails += `  ${measurementData.bodyPartName}: ${measurementData.size} cm\n`;
      });
    });
    
    return measurementText + measurementsDetails;
  };

  const handleDownload = () => {
    // Download all measurements as a single file
    if (measurements && measurements.length > 0) {
      let fullText = `All Body Measurements Report\n\n`;
      fullText += `Total Measurements: ${measurements.length}\n\n`;
      
      // Add each measurement to the text
      measurements.forEach((measurement: Measurement, index: number) => {
        fullText += `--- Measurement #${index + 1} ---\n`;
        fullText += getMeasurementText(measurement);
        fullText += `\n\n`;
      });
      
      // Create and download the file
      const blob = new Blob([fullText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `all-body-measurements-${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Prepare measurement text for sharing
  const getShareText = (measurementToShare?: Measurement): string => {
    const measurement = measurementToShare || latestMeasurement;
    if (!measurement) return '';
    
    let shareText = `📏 Body Measurement Report\n\n`;
    shareText += `Name: ${measurement.firstName} ${measurement.lastName}\n`;
    shareText += `Measurement Type: ${measurement.measurementType}\n`;
    shareText += `Date: ${new Date(measurement.createdAt).toLocaleDateString()}\n\n`;
    shareText += `Measurements:\n`;
    
    measurement.sections?.forEach((section: MeasurementSection) => {
      shareText += `\n${section.sectionName}:\n`;
      section.measurements?.forEach((measurementData: ApiMeasurementData) => {
        shareText += `  • ${measurementData.bodyPartName}: ${measurementData.size} cm\n`;
      });
    });
    
    return shareText;
  };

  // Check if Web Share API is available
  const canShare = () => {
    return typeof navigator !== 'undefined' && navigator.share;
  };

  const handleNativeShare = async (measurementToShare?: Measurement) => {
    const shareText = getShareText(measurementToShare);
    
    try {
      if (canShare()) {
        // Use the native Web Share API which includes WhatsApp, Facebook, etc.
        await navigator.share({
          title: 'Body Measurement Report',
          text: shareText,
          url: window.location.href,
        });
      } else {
        // Fallback to clipboard copy
        await navigator.clipboard.writeText(shareText);
        alert('Measurement report copied to clipboard!');
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error sharing:', error);
        try {
          await navigator.clipboard.writeText(shareText);
          alert('Measurement report copied to clipboard!');
        } catch (clipboardError) {
          alert('Failed to share. Please try again.');
        }
      }
    } finally {
      setIsShareDropdownOpen(false);
    }
  };

  const handleShareToOrganization = async () => {
    setIsOrganizationModalOpen(true);
    setIsShareDropdownOpen(false);
  };

  const submitOrganizationShare = async () => {
    if (!latestMeasurement || !organizationCode.trim()) {
      alert('Please enter an organization code');
      return;
    }
    
    setShareLoading(true);
    try {
      // Convert measurement data to the format required by the external endpoint
      const measurements: Record<string, number> = {};
      latestMeasurement.sections?.forEach((section: MeasurementSection) => {
        section.measurements?.forEach((measurement: ApiMeasurementData) => {
          if (measurement.bodyPartName && measurement.size !== undefined && measurement.size !== null) {
            measurements[measurement.bodyPartName.toLowerCase()] = parseFloat(measurement.size.toString());
          }
        });
      });
      
      const submitData = {
        code: organizationCode.trim(),
        userEmail: user?.email || '',
        measurements,
        userHeight: latestMeasurement.height ? parseFloat(latestMeasurement.height) : undefined,
        notes: latestMeasurement.notes || ''
      };
      
      // Import the service here to avoid circular dependencies
      const { ExternalMeasurementService } = await import('@/services/ExternalMeasurementService');
      const service = new ExternalMeasurementService();
      await service.submitExternalMeasurement(submitData);
      
      setIsOrganizationModalOpen(false);
      setOrganizationCode('');
      setShareLoading(false);
      setIsSuccessModalOpen(true);
    } catch (error: any) {
      console.error('Error sharing measurement:', error);
      
      // Check if the error has a response with a specific message
      if (error.response && error.response.data && error.response.data.message) {
        const responseMessage = error.response.data.message;
        // If the message contains 'Invalid or expired', display only 'Invalid or expired'
        if (responseMessage && responseMessage.includes('Invalid or expired')) {
          setErrorMessage('Invalid or expired');
        } else {
          setErrorMessage(responseMessage);
        }
      } else {
        setErrorMessage('Failed to share measurement. Please check the organization code and try again.');
      }
      
      setIsErrorModalOpen(true);
    } finally {
      setShareLoading(false);
    }
  };

  // Filter measurements based on search term
  const filteredMeasurements = measurements?.filter((measurement: Measurement) => 
    `${measurement.firstName} ${measurement.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    measurement.measurementType?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Get unique section names for table headers
  const getUniqueSectionNames = () => {
    const sectionNames = new Set<string>();
    
    filteredMeasurements?.forEach((item: Measurement) => {
      item.sections?.forEach((section: MeasurementSection) => {
        sectionNames.add(section.sectionName);
      });
    });
    
    return Array.from(sectionNames);
  };

  // Get measurements for a specific section (only sizes)
  const getMeasurementsForSection = (item: Measurement, sectionName: string) => {
    const section = item.sections?.find((s: MeasurementSection) => s.sectionName === sectionName);
    if (section && section.measurements && section.measurements.length > 0) {
      // Return only the sizes, not the body part names
      return section.measurements.map((m: ApiMeasurementData) => `${m.size}`).join(', ');
    }
    return '--';
  };

  // Get individual body part measurements from all sections
  const getBodyPartMeasurement = (item: Measurement, bodyPartName: string): string => {
    let measurement: ApiMeasurementData | undefined;
    
    // Search through all sections for the specific body part
    item.sections?.forEach((section: MeasurementSection) => {
      const found = section.measurements?.find((m: ApiMeasurementData) => 
        m.bodyPartName?.toLowerCase() === bodyPartName.toLowerCase()
      );
      if (found) {
        measurement = found;
      }
    });
    
    if (measurement && measurement.size !== undefined && measurement.size !== null) {
      const size = typeof measurement.size === 'string' ? parseFloat(measurement.size) : measurement.size;
      return isNaN(size) ? '--' : size.toFixed(2);
    }
    return '--';
  };

  // Define the body parts we want to display as columns
  const bodyPartColumns = [
    'Shoulder', 'Bust', 'Arm Length', 'Neck', 'Butt', 'Waist', 'Hips', 'Wrist', 'Inseam', 'Chest'
  ];

  return (
    <div className="min-h-screen bg-white md:bg-gray-50">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
        .manrope { font-family: 'Manrope', sans-serif; }
      `}</style>

      {/* Mobile: Show only UserTopBar */}
      <div className="md:hidden">
        <UserTopBar />
      </div>

      {/* Desktop: Show MeasurementTopNav (which includes UserTopBar) */}
      <div className="hidden md:block">
        <MeasurementTopNav
          title="Current body measurement"
          measurements={getSummaryMeasurements()}
          onSearch={handleSearch}
          searchTerm={searchTerm}
        />
      </div>

      {/* Mobile: Measurement Card (Separate implementation for fixed mobile layout) */}
      <div className="md:hidden px-4 py-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="manrope text-xs text-gray-500 mb-3">Body Measurement</div>
          
          {/* Mobile Measurement Row: Using flex and horizontal scroll */}
          <div className="flex overflow-x-auto flex-nowrap gap-3 pb-2 -mx-2 px-2">
            
            <div className="flex flex-col items-center p-2 flex-shrink-0 w-1/4 min-w-[80px]">
              <span className="manrope font-semibold text-gray-800">{getMeasurementValue('Chest')}</span>
              <span className="manrope text-xs text-gray-600 mt-0.5">Chest</span>
            </div>
            <div className="flex flex-col items-center p-2 flex-shrink-0 w-1/4 min-w-[80px]">
              <span className="manrope font-semibold text-gray-800">{getMeasurementValue('Waist')}</span>
              <span className="manrope text-xs text-gray-600 mt-0.5">Waist</span>
            </div>
            <div className="flex flex-col items-center p-2 flex-shrink-0 w-1/4 min-w-[80px]">
              <span className="manrope font-semibold text-gray-800">{getMeasurementValue('Hips')}</span>
              <span className="manrope text-xs text-gray-600 mt-0.5">Hips</span>
            </div>
            <div className="flex flex-col items-center p-2 flex-shrink-0 w-1/4 min-w-[80px]">
              <span className="manrope font-semibold text-gray-800">{getMeasurementValue('Shoulder')}</span>
              <span className="manrope text-xs text-gray-600 mt-0.5">Shoulder</span>
            </div>
            <div className="flex flex-col items-center p-2 flex-shrink-0 w-1/4 min-w-[80px]">
              <span className="manrope font-semibold text-gray-800">{getMeasurementValue('Bust')}</span>
              <span className="manrope text-xs text-gray-600 mt-0.5">Bust</span>
            </div>
            <div className="flex flex-col items-center p-2 flex-shrink-0 w-1/4 min-w-[80px]">
              <span className="manrope font-semibold text-gray-800">{getMeasurementValue('Neck')}</span>
              <span className="manrope text-xs text-gray-600 mt-0.5">Neck</span>
            </div>
            
          </div>
        </div>
      </div>

      {/* Main Content - Responsive Positioning */}
      <div className="w-full px-4 md:px-6 py-4">
        
        {/* Header with Title and Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="manrope text-xl md:text-3xl font-semibold text-gray-800">
            Overview
          </h1>
          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <button
              onClick={() => handleDownload()}
              className="manrope flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2.5 rounded-full hover:bg-gray-300 transition-colors w-full sm:w-auto justify-center"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            
           
             {/* <div className="relative w-full sm:w-auto" ref={shareDropdownRef}>
              <button
                onClick={() => setIsShareDropdownOpen(!isShareDropdownOpen)}
                className="manrope flex items-center justify-between gap-2 bg-gray-200 text-gray-700 px-4 py-2.5 rounded-full hover:bg-gray-300 transition-colors w-full sm:w-48"
              >
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${isShareDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              
              {isShareDropdownOpen && (
                <div className="absolute right-0 mt-2 w-full sm:w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="py-2">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                      <h3 className="manrope font-semibold text-gray-900">Select Share Option</h3>
                      <p className="manrope text-xs text-gray-500 mt-1">Choose how to share your measurements</p>
                    </div>
                    
                
                    <button
                      onClick={() => handleNativeShare()}
                      className="manrope w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100"
                    >
                      <Share2 className="w-5 h-5 text-blue-500" />
                      <div>
                        <div className="font-medium text-gray-900">Share with others</div>
                        <div className="text-xs text-gray-500">
                          {canShare() 
                            ? "Opens share menu with WhatsApp, Facebook, etc."
                            : "Copies measurement data to clipboard"
                          }
                        </div>
                      </div>
                    </button>
                    
                   
                    <button
                      onClick={handleShareToOrganization}
                      className="manrope w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <Users className="w-5 h-5 text-purple-600" />
                      <div>
                        <div className="font-medium text-gray-900">Share to organization</div>
                        <div className="text-xs text-gray-500">Share securely with organization code</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div> 
             */}
            <button
              onClick={() => router.push('/user/body-measurement/create')}
              className="manrope flex items-center gap-2 bg-[#5D2A8B] text-white px-6 py-2.5 rounded-full hover:bg-purple-700 transition-colors w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              Create New
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          
          {/* Loading, Error, Empty State Handling */}
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="manrope text-gray-500 mt-4">Loading measurements...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className="manrope text-red-500">Failed to load measurements</p>
            </div>
          ) : !filteredMeasurements || filteredMeasurements.length === 0 ? (
            <div className="p-8 md:p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl border-2 border-purple-200 flex items-center justify-center">
                <Camera className="w-10 h-10 text-purple-300" />
              </div>
              <h3 className="manrope text-lg font-semibold text-gray-800 mb-2">
                No measurements recorded yet!
              </h3>
              <p className="manrope text-sm text-gray-500 mb-6 max-w-sm mx-auto">
               There is nothing to view right now, <br />
                Create a body measurement to see here.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="manrope text-left px-6 py-4 text-sm font-medium text-gray-500">Name</th>
                      <th className="manrope text-left px-6 py-4 text-sm font-medium text-gray-500">Type</th>
                      {/* Individual body part columns */}
                      {bodyPartColumns.slice(0, 6).map((bodyPart, index) => (
                        <th key={index} className="manrope text-left px-6 py-4 text-sm font-medium text-gray-500">
                          {bodyPart} (cm)
                        </th>
                      ))}
                      <th className="manrope text-left px-6 py-4 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredMeasurements.map((measurement: Measurement) => (
                      <tr key={measurement.id} className="hover:bg-gray-50">
                        <td className="manrope px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {measurement.firstName} {measurement.lastName}
                          </div>
                        </td>
                        <td className="manrope px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {measurement.measurementType}
                        </td>
                        {/* Individual body part measurements */}
                        {bodyPartColumns.slice(0, 6).map((bodyPart, bodyIndex) => (
                          <td key={bodyIndex} className="manrope px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {getBodyPartMeasurement(measurement, bodyPart)}
                          </td>
                        ))}
                        <td className="manrope px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                           
                            <button
                              onClick={(e) => handleActionClick(measurement, e)}
                              className="text-gray-500 hover:text-gray-700"
                              title="More options"
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden">
                <div className="space-y-4">
                  {filteredMeasurements.map((measurement: Measurement) => (
                    <div key={measurement.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="manrope font-semibold text-gray-900">
                            {measurement.firstName} {measurement.lastName}
                          </h3>
                          <p className="manrope text-sm text-gray-500 mt-1">
                            {measurement.measurementType}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {bodyPartColumns.slice(0, 6).map((bodyPart, bodyIndex) => (
                          <div key={bodyIndex} className="flex justify-between items-center">
                            <span className="manrope text-sm text-gray-500">{bodyPart}:</span>
                            <span className="manrope text-sm font-medium text-gray-900">
                              {getBodyPartMeasurement(measurement, bodyPart)} cm
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 flex space-x-3">
                        <button
                          onClick={() => router.push(`/user/body-measurement/view?id=${measurement.id}`)}
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
                  ))}
                </div>
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
        onDownload={handleDownloadFromAction}
        onShareToOthers={handleShareFromAction}
        onShareToOrganization={handleShareToOrganizationFromAction}
        position={modalPosition}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 border border-gray-200 shadow-xl">
            <h3 className="manrope text-lg font-medium text-gray-900 mb-2">Delete Measurement</h3>
            <p className="manrope text-sm text-gray-500 mb-6">
              Are you sure you want to delete this measurement? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="manrope px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="manrope px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Organization Share Modal - Clean Overlay */}
      {isOrganizationModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="manrope text-xl font-semibold text-gray-900">Share to Organization</h3>
              <button
                onClick={() => {
                  setIsOrganizationModalOpen(false);
                  setOrganizationCode('');
                }}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6">
              <p className="manrope text-sm text-gray-500 mb-6">
                Enter the organization code to share your measurement data securely.
              </p>
              
              <div className="mb-6">
                <label className="manrope block text-sm font-medium text-gray-700 mb-2">
                  Organization Code
                </label>
                <input
                  type="text"
                  value={organizationCode}
                  onChange={(e) => setOrganizationCode(e.target.value)}
                  className="manrope w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Enter organization code"
                  disabled={shareLoading}
                />
                <p className="manrope text-xs text-gray-400 mt-2">
                  You should receive this code from the organization you want to share with.
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setIsOrganizationModalOpen(false);
                    setOrganizationCode('');
                  }}
                  className="manrope flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  disabled={shareLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={submitOrganizationShare}
                  className="manrope flex-1 px-4 py-3 text-sm font-medium text-white bg-[#5D2A8B] rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={shareLoading || !organizationCode.trim()}
                >
                  {shareLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sharing...
                    </>
                  ) : (
                    'Share'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Success Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="manrope text-xl font-semibold text-gray-900">Success</h3>
              <button
                onClick={() => setIsSuccessModalOpen(false)}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <p className="manrope text-center text-gray-700 mb-6">
                Measurement shared with organization successfully!
              </p>
              
              <button
                onClick={() => setIsSuccessModalOpen(false)}
                className="manrope w-full px-4 py-3 text-sm font-medium text-white bg-[#5D2A8B] rounded-lg hover:bg-purple-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Error Modal */}
     {/* Error Modal */}
{isErrorModalOpen && (
  <div className="fixed inset-0 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md mx-4 overflow-hidden">
      {/* Modal Header */}
      <div className="flex justify-between items-center p-6 border-b border-gray-100">
        <h3 className="manrope text-xl font-semibold text-gray-900">Share Failed</h3>
        <button
          onClick={() => setIsErrorModalOpen(false)}
          className="text-gray-400 hover:text-gray-500 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* Modal Body */}
      <div className="p-6">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        
        <p className="manrope text-center text-gray-700 mb-2 font-medium">
          Unable to share measurement
        </p>
        
        <p className="manrope text-center text-red-600 mb-6">
          {errorMessage}
        </p>
        
        <p className="manrope text-center text-sm text-gray-500 mb-6">
          Please verify the organization code is correct and try again.
        </p>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setIsErrorModalOpen(false)}
            className="manrope flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              setIsErrorModalOpen(false);
              setIsOrganizationModalOpen(true);
            }}
            className="manrope flex-1 px-4 py-3 text-sm font-medium text-white bg-[#5D2A8B] rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    
    {/* Delete Success Modal */}
    {isDeleteSuccessModalOpen && (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md mx-4 overflow-hidden">
          {/* Modal Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
            <h3 className="manrope text-xl font-semibold text-gray-900">Success</h3>
            <button
              onClick={() => setIsDeleteSuccessModalOpen(false)}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Modal Body */}
          <div className="p-6">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <p className="manrope text-center text-gray-700 mb-6">
              {deleteSuccessMessage}
            </p>
            
            <button
              onClick={() => setIsDeleteSuccessModalOpen(false)}
              className="manrope w-full px-4 py-3 text-sm font-medium text-white bg-[#5D2A8B] rounded-lg hover:bg-purple-700 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default BodyMeasurementPage;