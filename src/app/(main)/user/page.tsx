



'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import ActionModal from '@/app/components/ActionModal';
import { MeasurementTopNav } from '@/app/components/MeasurementTopNav';
import { useProfile } from '@/api/hooks/useProfile';
import { useManualMeasurements } from '@/api/hooks/useManualMeasurement';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Page = () => {
  const router = useRouter();
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const [selectedMeasurementId, setSelectedMeasurementId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'ai' | 'manual' | 'object' | 'questionnaire'>('all');
  
  const { profile } = useProfile();
  const { data: measurementsData, isLoading, error } = useManualMeasurements();

  const handleCreateNew = (type: string) => {
    switch(type) {
      case 'body':
        router.push('/user/body-measurement/create');
        break;
      case 'object':
        router.push('/user/object-dimension/create');
        break;
      case 'questionnaire':
        router.push('/user/questionaire/create');
        break;
      default:
        break;
    }
  };

  const handleCopyMeasurements = () => {
    // TODO: Implement copy functionality
    console.log('Copy measurements clicked');
  };

  const handleExport = (format: 'excel' | 'pdf') => {
    // Use filtered measurements for export based on active tab
    const filteredMeasurements = getFilteredMeasurements();
    
    if (format === 'excel') {
      // Export to Excel
      const worksheet = XLSX.utils.json_to_sheet(filteredMeasurements.map((item: any) => ({
        Name: item.name,
        Type: item.type,
        Measurements: getMeasurementsString(item)
      })));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Measurements');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(data, 'measurements.xlsx');
    } else {
      // Export to PDF
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text('Measurements Report', 14, 22);
      
      // Add table
      (doc as any).autoTable({
        head: [['Name', 'Type', 'Measurements']],
        body: filteredMeasurements.map((item: any) => [
          item.name,
          item.type,
          getMeasurementsString(item)
        ]),
        startY: 30,
      });
      
      doc.save('measurements.pdf');
    }
  };

  const getMeasurementsString = (item: any) => {
    if (item.measurementType === 'AI') {
      const aiSection = item.sections?.find((s: any) => s.sectionName === 'AI Generated Measurements');
      if (aiSection && aiSection.measurements) {
        return aiSection.measurements
          .map((m: any) => `${m.bodyPartName}: ${parseFloat(m.size).toFixed(2)} cm`)
          .join(', ');
      }
    } else {
      return item.sections?.flatMap((section: any) => 
        section.measurements?.map((m: any) => m.size) || []
      ).join(', ');
    }
    return '';
  };

  const toggleRowSelection = (rowIndex: number) => {
    setSelectedRows(prev => 
      prev.includes(rowIndex) 
        ? prev.filter(i => i !== rowIndex)
        : [...prev, rowIndex]
    );
  };

  const toggleDropdown = (rowIndex: number, measurementId: string, event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setModalPosition({
      top: rect.bottom + 5,
      left: rect.left - 100 // Position modal to the left of the button
    });
    setSelectedMeasurementId(measurementId);
    setDropdownOpen(dropdownOpen === rowIndex ? null : rowIndex);
  };

  const closeDropdown = () => {
    setDropdownOpen(null);
  };

  const handleViewMeasurement = () => {
    if (selectedMeasurementId) {
      router.push(`/user/body-measurement/view?id=${selectedMeasurementId}`);
    }
  };

  const handleEditMeasurement = () => {
    if (selectedMeasurementId) {
      router.push(`/user/body-measurement/edit?id=${selectedMeasurementId}`);
    }
  };

  const handleDelete = () => {
    if (selectedMeasurementId) {
      console.log('Delete clicked for ID:', selectedMeasurementId);
      // TODO: Implement delete functionality
    }
  };

  // Close dropdown when clicking outside
  const handleOutsideClick = () => {
    if (dropdownOpen !== null) {
      closeDropdown();
    }
  };

  // Function to round AI measurements to 2 decimal places
  const processAIMeasurements = (item: any) => {
    if (item.measurementType === 'AI' && item.sections) {
      return {
        ...item,
        sections: item.sections.map((section: any) => {
          if (section.sectionName === 'AI Generated Measurements' && section.measurements) {
            return {
              ...section,
              measurements: section.measurements.map((m: any) => ({
                ...m,
                size: typeof m.size === 'number' ? parseFloat(m.size.toFixed(2)) : m.size
              }))
            };
          }
          return section;
        })
      };
    }
    return item;
  };

  // Transform the fetched data to match the existing structure
  const measurements = measurementsData?.map((item: any, index: number) => {
    // Process AI measurements to round to 2 decimal places
    const processedItem = processAIMeasurements(item);
    
    // Determine the type based on measurementType
    let type = processedItem.measurementType || 'Manual';
    let color = '#5D2A8B'; // Default purple for Manual
    
    // Set color based on type
    if (type === 'Object') {
      color = '#F59E0B'; // Yellow for Object
    } else if (type === 'Questionnaire') {
      color = '#EF4444'; // Red for Questionnaire
    } else if (type === 'AI') {
      color = '#3B82F6'; // Blue for AI
    }
    
    return {
      id: processedItem.id,
      name: `${processedItem.firstName} ${processedItem.lastName}`,
      type: type,
      color: color,
      measurementType: processedItem.measurementType, // Keep original for filtering
      sections: processedItem.sections,
      createdAt: processedItem.createdAt,
      rawData: processedItem // Keep original data for reference
    };
  }) || [];

  // Filter measurements based on active tab
  const getFilteredMeasurements = () => {
    switch(activeTab) {
      case 'ai':
        return measurements.filter((m: any) => m.measurementType === 'AI');
      case 'manual':
        return measurements.filter((m: any) => m.measurementType === 'Manual');
      case 'object':
        return measurements.filter((m: any) => m.measurementType === 'Object');
      case 'questionnaire':
        return measurements.filter((m: any) => m.measurementType === 'Questionnaire');
      default:
        return measurements;
    }
  };

  // Get unique section names for table headers based on active tab
  const getUniqueSectionNames = () => {
    const sectionNames = new Set<string>();
    const filteredMeasurements = getFilteredMeasurements();
    
    if (activeTab === 'ai') {
      // For AI tab, show common body part measurements
      const commonBodyParts = ['Chest', 'Waist', 'Hips', 'Shoulder', 'Bust', 'Inseam'];
      
      filteredMeasurements.forEach((item: any) => {
        if (item.measurementType === 'AI') {
          item.sections?.forEach((section: any) => {
            if (section.sectionName === 'AI Generated Measurements' && section.measurements) {
              // Add common body parts that have non-zero values
              section.measurements.forEach((m: any) => {
                if (commonBodyParts.includes(m.bodyPartName) && parseFloat(m.size) > 0) {
                  sectionNames.add(m.bodyPartName);
                }
              });
            }
          });
        }
      });
      
      // If no specific body parts found, use default
      if (sectionNames.size === 0) {
        return ['Chest', 'Waist', 'Hips', 'Shoulder'];
      }
    } else {
      // For non-AI tabs, use section names
      filteredMeasurements.forEach((item: any) => {
        if (item.measurementType !== 'AI') {
          item.sections?.forEach((section: any) => {
            sectionNames.add(section.sectionName);
          });
        }
      });
    }
    
    // If no sections found, return default headers
    if (sectionNames.size === 0) {
      return activeTab === 'ai' 
        ? ['Chest', 'Waist', 'Hips', 'Shoulder'] 
        : ['Section 1', 'Section 2', 'Section 3', 'Section 4'];
    }
    
    return Array.from(sectionNames).slice(0, 4); // Limit to 4 columns
  };

  // Get measurements for a specific section
  const getMeasurementsForSection = (item: any, sectionName: string) => {
    if (item.measurementType === 'AI') {
      // For AI measurements, find in AI Generated Measurements section
      const aiSection = item.sections?.find((s: any) => 
        s.sectionName === 'AI Generated Measurements'
      );
      if (aiSection) {
        const measurement = aiSection.measurements?.find(
          (m: any) => m.bodyPartName === sectionName
        );
        if (measurement) {
          const size = parseFloat(measurement.size);
          return size > 0 ? `${size.toFixed(2)} cm` : '--';
        }
      }
    } else {
      // For non-AI measurements, find by section name
      const section = item.sections?.find((s: any) => s.sectionName === sectionName);
      if (section && section.measurements && section.measurements.length > 0) {
        return section.measurements.map((m: any) => `${m.size}`).join(', ');
      }
    }
    return '--';
  };

  // Get the latest measurement for the top nav
  const latestMeasurement = measurementsData && measurementsData.length > 0 ? measurementsData[0] : null;

  // Extract measurements for the MeasurementTopNav component
  const getSummaryMeasurements = () => {
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
    latestMeasurement.sections?.forEach((section: any) => {
      section.measurements?.forEach((m: any) => {
        const partName = m.bodyPartName?.toLowerCase() || section.sectionName?.toLowerCase() || 'Unknown';
        const sizeValue = typeof m.size === 'number' ? m.size.toFixed(2) : m.size;
        const value = `${sizeValue} cm`;
        
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

  // Count measurements by type
  const getCountByType = (type: string) => {
    return measurements.filter((m: any) => m.measurementType === type).length;
  };

  // Get AI measurement details for better display
  const getAIMeasurementDetails = (item: any) => {
    if (item.measurementType !== 'AI') return null;
    
    const aiSection = item.sections?.find((s: any) => s.sectionName === 'AI Generated Measurements');
    if (!aiSection || !aiSection.measurements) return null;
    
    // Get top 4 non-zero measurements
    const topMeasurements = aiSection.measurements
      .filter((m: any) => parseFloat(m.size) > 0)
      .slice(0, 4)
      .map((m: any) => ({
        bodyPart: m.bodyPartName,
        size: parseFloat(m.size).toFixed(2) + ' cm'
      }));
    
    return topMeasurements;
  };

  return (
    <div className="min-h-screen bg-white" onClick={handleOutsideClick}>
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
        .manrope { font-family: 'Manrope', sans-serif; }
      `}</style>

      {/* Mobile Top Section - Only visible on mobile */}
      <div className="md:hidden px-4 pt-4 pb-2">
        {/* Hello User and Icons */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="manrope text-lg font-normal text-[#1A1A1A]">
            Hello, &ldquo;{profile?.fullName || 'User'}&ldquo;
          </h1>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-full border border-[#E4D8F3] bg-[#FBFAFC] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 6.66667C15 5.34058 14.4732 4.06881 13.5355 3.13113C12.5979 2.19345 11.3261 1.66667 10 1.66667C8.67392 1.66667 7.40215 2.19345 6.46447 3.13113C5.52678 4.06881 5 5.34058 5 6.66667C5 12.5 2.5 14.1667 2.5 14.1667H17.5C17.5 14.1667 15 12.5 15 6.66667Z" stroke="#6E6E6E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11.4417 17.5C11.2952 17.7526 11.0849 17.9622 10.8319 18.1079C10.5789 18.2537 10.292 18.3304 10 18.3304C9.70802 18.3304 9.42112 18.2537 9.16813 18.1079C8.91514 17.9622 8.70484 17.7526 8.55835 17.5" stroke="#6E6E6E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="w-10 h-10 rounded-full bg-[#6D1E1E] overflow-hidden">
              <Image 
                src="/Frame 1707479300.png" 
                alt="User Avatar" 
                width={40} 
                height={40}
                className="object-cover"
              />
            </div>
          </div>
        </div>

        {/* Measurement Summary - Mobile Only */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <span className="manrope text-xs text-[#6E6E6EB2]">Chest</span>
              <span className="manrope text-sm font-medium text-[#1A1A1A]">--</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="manrope text-xs text-[#6E6E6EB2]">Waist</span>
              <span className="manrope text-sm font-medium text-[#1A1A1A]">--</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="manrope text-xs text-[#6E6E6EB2]">Hips</span>
              <span className="manrope text-sm font-medium text-[#1A1A1A]">--</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="manrope text-xs text-[#6E6E6EB2]">Legs</span>
              <span className="manrope text-sm font-medium text-[#1A1A1A]">--</span>
            </div>
          </div>
          <button 
            className="flex items-center gap-1 text-[#5D2A8B]"
            onClick={handleCopyMeasurements}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.3333 8.66667V13.3333C13.3333 13.6869 13.1929 14.0261 12.9428 14.2761C12.6928 14.5262 12.3536 14.6667 12 14.6667H2.66667C2.31304 14.6667 1.97391 14.5262 1.72386 14.2761C1.47381 14.0261 1.33333 13.6869 1.33333 13.3333V4C1.33333 3.64638 1.47381 3.30724 1.72386 3.05719C1.97391 2.80714 2.31304 2.66667 2.66667 2.66667H7.33333" stroke="#5D2A8B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M11.3333 1.33333H14.6666V4.66667" stroke="#5D2A8B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6.66667 9.33333L14.6667 1.33333" stroke="#5D2A8B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="manrope text-xs font-medium">Copy</span>
          </button>
        </div>
      </div>

      {/* Top Navigation - Desktop Only */}
      <div className="hidden md:block mb-6">
        <MeasurementTopNav 
          title="Current body measurement"
          measurements={getSummaryMeasurements()}
        />
      </div>

      {/* Overview Section - Responsive */}
      <div className="px-4 md:px-6 py-4">
        <h2 className="manrope text-xl md:text-2xl font-semibold text-gray-800 mb-4 md:mb-0">Overview</h2>

        {/* Four Cards Container - Responsive Grid */}
        <div className="flex flex-col gap-4 md:flex-row md:absolute md:top-[56px] md:gap-[30px] mt-4 md:mt-0">
          {/* Card 1 - AI Measurements - Responsive */}
          <div 
            className={`relative w-full md:w-[218px] h-[146px] rounded-[20px] p-6 cursor-pointer transition-all duration-300 ${activeTab === 'ai' ? 'ring-2 ring-[#3B82F6]' : ''}`} 
            style={{ background: '#EFF6FF' }}
            onClick={() => setActiveTab('ai')}
          >
            <div className="flex flex-col gap-3">
              <span className="manrope text-sm md:text-base font-normal leading-tight" style={{ color: '#6E6E6EB2' }}>
                AI Measurements
              </span>
              <span className="manrope text-2xl font-medium leading-tight text-[#1A1A1A]">
                {getCountByType('AI')}
              </span>
            </div>

            {/* Card Image */}
            <div className="absolute top-4 right-4 w-[30px] h-[30px] rounded-full flex items-center justify-center" style={{ background: '#FFFFFF80' }}>
              <div className="w-6 h-6 bg-[#3B82F6] rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">AI</span>
              </div>
            </div>

            {/* Create New Button - Only show if active */}
            {activeTab === 'ai' && (
              <button 
                className="manrope absolute bottom-4 right-4 px-3 py-1.5 rounded-[20px] text-xs" 
                style={{ background: '#FFFFFF80', color: '#3B82F6' }}
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Add AI measurement creation
                  console.log('Create AI measurement');
                }}
              >
                Create New
              </button>
            )}
          </div>

          {/* Card 2 - Manual Measurements - Responsive */}
          <div 
            className={`relative w-full md:w-[218px] h-[146px] rounded-[20px] p-6 cursor-pointer transition-all duration-300 ${activeTab === 'manual' ? 'ring-2 ring-[#5D2A8B]' : ''}`} 
            style={{ background: '#F4EFFA' }}
            onClick={() => setActiveTab('manual')}
          >
            <div className="flex flex-col gap-3">
              <span className="manrope text-sm md:text-base font-normal leading-tight" style={{ color: '#6E6E6EB2' }}>
                Manual Measurements
              </span>
              {/* <span className="manrope text-2xl font-medium leading-tight text-[#1A1A1A]">
                {getCountByType('Manual')}
              </span> */}
            </div>

            {/* Card Image */}
            <div className="absolute top-4 right-4 w-[30px] h-[30px] rounded-full flex items-center justify-center" style={{ background: '#FFFFFF80' }}>
              <Image 
                src="/Body Streamline Ionic Filled.png" 
                alt="Body" 
                width={20} 
                height={20}
                className="object-contain"
              />
            </div>

            {/* Create New Button */}
            <button 
              className="manrope absolute bottom-4 right-4 px-3 py-1.5 rounded-[20px] text-xs" 
              style={{ background: '#FFFFFF80', color: '#5D2A8B' }}
              onClick={(e) => {
                e.stopPropagation();
                handleCreateNew('body');
              }}
            >
              Create New
            </button>
          </div>

          {/* Card 3 - Object Measurements - Responsive */}
          <div 
            className={`relative w-full md:w-[218px] h-[146px] rounded-[20px] p-6 cursor-pointer transition-all duration-300 ${activeTab === 'object' ? 'ring-2 ring-[#F59E0B]' : ''}`} 
            style={{ background: '#FBF8EF' }}
            onClick={() => setActiveTab('object')}
          >
            <div className="flex flex-col gap-3">
              <span className="manrope text-sm md:text-base font-normal leading-tight" style={{ color: '#6E6E6EB2' }}>
                Object Measurements
              </span>
              <span className="manrope text-2xl font-medium leading-tight text-[#1A1A1A]">
                {getCountByType('Object')}
              </span>
            </div>

            {/* Object Image */}
            <div className="absolute top-4 right-4 w-[30px] h-[30px] rounded-full flex items-center justify-center" style={{ background: '#FFFFFF80' }}>
              <Image 
                src="/Object Scan Streamline Tabler Line.png" 
                alt="Object" 
                width={20} 
                height={20}
                className="object-contain"
              />
            </div>

            {/* Create New Button */}
            <button 
              className="manrope absolute bottom-4 right-4 px-3 py-1.5 rounded-[20px] text-xs" 
              style={{ background: '#FFFFFF80', color: '#5D2A8B' }}
              onClick={(e) => {
                e.stopPropagation();
                handleCreateNew('object');
              }}
            >
              Create New
            </button>
          </div>

          {/* Card 4 - Questionnaire - Responsive */}
          <div 
            className={`relative w-full md:w-[218px] h-[146px] rounded-[20px] p-6 cursor-pointer transition-all duration-300 ${activeTab === 'questionnaire' ? 'ring-2 ring-[#EF4444]' : ''}`} 
            style={{ background: '#FCEEEE' }}
            onClick={() => setActiveTab('questionnaire')}
          >
            <div className="flex flex-col gap-3">
              <span className="manrope text-sm md:text-base font-normal leading-tight" style={{ color: '#6E6E6EB2' }}>
                Questionnaire
              </span>
              <span className="manrope text-2xl font-medium leading-tight text-[#1A1A1A]">
                {getCountByType('Questionnaire')}
              </span>
            </div>

            {/* Image */}
            <div className="absolute top-4 right-4 w-[30px] h-[30px] rounded-full flex items-center justify-center" style={{ background: '#FFFFFF80' }}>
              <Image 
                src="/List Dropdown Streamline Carbon.png" 
                alt="Questionnaire" 
                width={20} 
                height={20}
                className="object-contain"
              />
            </div>

            {/* Create New Button */}
            <button 
              className="manrope absolute bottom-4 right-4 px-3 py-1.5 rounded-[20px] text-xs" 
              style={{ background: '#FFFFFF80', color: '#5D2A8B' }}
              onClick={(e) => {
                e.stopPropagation();
                handleCreateNew('questionnaire');
              }}
            >
              Create New
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs - Below cards on mobile, top of table on desktop */}
      <div className="px-4 md:px-6 mt-4">
        <div className="flex gap-2 md:gap-4 overflow-x-auto pb-2">
          <button
            className={`manrope px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              activeTab === 'all' 
                ? 'bg-[#5D2A8B] text-white' 
                : 'bg-white text-[#6E6E6E] border border-[#E4D8F3]'
            }`}
            onClick={() => setActiveTab('all')}
          >
            All Measurements ({measurements.length})
          </button>
          <button
            className={`manrope px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              activeTab === 'ai' 
                ? 'bg-[#3B82F6] text-white' 
                : 'bg-white text-[#6E6E6E] border border-[#E4D8F3]'
            }`}
            onClick={() => setActiveTab('ai')}
          >
            AI ({getCountByType('AI')})
          </button>
          <button
            className={`manrope px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              activeTab === 'manual' 
                ? 'bg-[#5D2A8B] text-white' 
                : 'bg-white text-[#6E6E6E] border border-[#E4D8F3]'
            }`}
            onClick={() => setActiveTab('manual')}
          >
            Manual ({getCountByType('Manual')})
          </button>
          <button
            className={`manrope px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              activeTab === 'object' 
                ? 'bg-[#F59E0B] text-white' 
                : 'bg-white text-[#6E6E6E] border border-[#E4D8F3]'
            }`}
            onClick={() => setActiveTab('object')}
          >
            Object ({getCountByType('Object')})
          </button>
          <button
            className={`manrope px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              activeTab === 'questionnaire' 
                ? 'bg-[#EF4444] text-white' 
                : 'bg-white text-[#6E6E6E] border border-[#E4D8F3]'
            }`}
            onClick={() => setActiveTab('questionnaire')}
          >
            Questionnaire ({getCountByType('Questionnaire')})
          </button>
        </div>
      </div>

      {/* Total Summary Section - Responsive */}
      <div className="mx-4 md:mx-6 mb-8 bg-white shadow-sm rounded-[20px] p-4 md:p-6">
        {/* Total Summary and Export Container */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          {/* Total Summary Text */}
          <h2 className="manrope text-xl md:text-[26px] font-semibold leading-tight text-[#1A1A1A]">
            {activeTab === 'all' ? 'All Measurements' : 
             activeTab === 'ai' ? 'AI Measurements' :
             activeTab === 'manual' ? 'Manual Measurements' :
             activeTab === 'object' ? 'Object Measurements' : 'Questionnaire'}
          </h2>

          {/* Export Options */}
          <div className="relative">
            <div className="flex gap-2">
              <button 
                className="manrope flex items-center justify-center gap-2 h-10 px-4 rounded-full border border-[#E4D8F3] bg-white"
                onClick={() => handleExport('excel')}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.5 12.5V15.8333C17.5 16.2754 17.3244 16.6993 17.0118 17.0118C16.6993 17.3244 16.2754 17.5 15.8333 17.5H4.16667C3.72464 17.5 3.30072 17.3244 2.98816 17.0118C2.67559 16.6993 2.5 16.2754 2.5 15.8333V12.5" stroke="#6E6E6EB2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5.83333 8.33333L10 12.5L14.1667 8.33333" stroke="#6E6E6EB2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 12.5V2.5" stroke="#6E6E6EB2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="manrope text-sm md:text-base font-medium text-[#6E6E6EB2]">
                  Excel
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Table Layout - Hidden on Desktop - With Scroll */}
        <div className="md:hidden">
          {getFilteredMeasurements().length === 0 ? (
            <div className="text-center py-8">
              <p className="manrope text-gray-500">No measurements found for this category</p>
            </div>
          ) : (
            <div className="space-y-4">
              {getFilteredMeasurements().map((row: any, index: number) => (
                <div key={row.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="manrope font-semibold text-gray-900">
                        {row.name}
                      </h3>
                      <p className="manrope text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: row.color }}></span>
                        {row.type}
                      </p>
                    </div>
                  </div>
                  
                  {row.measurementType === 'AI' ? (
                    // AI Measurement Display - Mobile
                    <div className="mt-3 space-y-2">
                      {getAIMeasurementDetails(row)?.map((measurement: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span className="manrope text-sm text-gray-500">{measurement.bodyPart}:</span>
                          <span className="manrope text-sm font-medium text-gray-900">
                            {measurement.size}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Non-AI Measurement Display - Mobile
                    <div className="mt-3 space-y-2">
                      {getUniqueSectionNames().slice(0, 4).map((sectionName, secIndex) => (
                        <div key={secIndex} className="flex justify-between items-center">
                          <span className="manrope text-sm text-gray-500">{sectionName}:</span>
                          <span className="manrope text-sm font-medium text-gray-900">
                            {getMeasurementsForSection(row, sectionName)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDropdown(index, row.id, e);
                      }}
                      className="manrope text-sm text-gray-500 hover:text-gray-700"
                    >
                      ...
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Table Layout - Hidden on Mobile */}
        <div className="hidden md:block overflow-x-auto">
          {getFilteredMeasurements().length === 0 ? (
            <div className="text-center py-12">
              <p className="manrope text-gray-500 text-lg">No measurements found for this category</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="manrope text-left px-6 py-4 text-sm font-medium text-gray-500">Name</th>
                  <th className="manrope text-left px-6 py-4 text-sm font-medium text-gray-500">Measurement Type</th>
                  {/* Dynamic section headers */}
                  {getUniqueSectionNames().map((sectionName, index) => (
                    <th key={index} className="manrope text-left px-6 py-4 text-sm font-medium text-gray-500">
                      {sectionName}
                    </th>
                  ))}
                  <th className="manrope text-left px-6 py-4 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {getFilteredMeasurements().map((row: any, index: number) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="manrope px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {row.name}
                      </div>
                    </td>
                    <td className="manrope px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: row.color }}></span>
                        <span className="text-sm text-gray-500">{row.type}</span>
                      </div>
                    </td>
                 
                    {getUniqueSectionNames().map((sectionName, secIndex) => (
                      <td key={secIndex} className="manrope px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getMeasurementsForSection(row, sectionName)}
                      </td>
                    ))}
                    <td className="manrope px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDropdown(index, row.id, e);
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ...
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    
      <ActionModal
        isOpen={dropdownOpen !== null}
        onClose={closeDropdown}
        onViewMeasurement={handleViewMeasurement}
        onEditMeasurement={handleEditMeasurement}
        onDelete={handleDelete}
        position={modalPosition}
      />
    </div>
  );
};

export default Page;