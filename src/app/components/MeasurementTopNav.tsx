'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { UserTopBar } from './user-topbar';

// Updated interface to handle dynamic measurements
interface MeasurementItem {
  label: string;
  value: string;
}

// Backward compatible interface
interface LegacyMeasurementData {
  chest: string;
  waist: string;
  hips: string;
  legs: string;
}

interface MeasurementTopNavProps {
  measurements?: MeasurementItem[] | LegacyMeasurementData;
  title?: string;
  onSearch?: (term: string) => void;
  searchTerm?: string;
}

export const MeasurementTopNav: React.FC<MeasurementTopNavProps> = ({ 
  measurements,
  title = 'Current body measurement',
  onSearch,
  searchTerm = ''
}) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  // Helper function to convert legacy data to new format
  const convertToMeasurementItems = (measurements: MeasurementItem[] | LegacyMeasurementData | undefined): MeasurementItem[] => {
    // Check if it's the new format
    if (!measurements) {
      return [];
    }
    
    // If it's already an array, it's the new format
    if (Array.isArray(measurements)) {
      return measurements as MeasurementItem[];
    }
    
    // Convert legacy format to new format
    const legacy = measurements as LegacyMeasurementData;
    return [
      { label: 'Chest', value: legacy.chest || '--' },
      { label: 'Waist', value: legacy.waist || '--' },
      { label: 'Hips', value: legacy.hips || '--' },
      { label: 'Legs', value: legacy.legs || '--' }
    ];
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setLocalSearchTerm(term);
    if (onSearch) {
      onSearch(term);
    }
  };

  const handleCopyMeasurements = () => {
    const measurementItems = convertToMeasurementItems(measurements);
    if (measurementItems && measurementItems.length > 0) {
      const textToCopy = measurementItems.map(item => `${item.label}: ${item.value}`).join('\n');
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          console.log('Measurements copied to clipboard');
          // Optionally show a toast notification here
        })
        .catch(err => {
          console.error('Failed to copy measurements: ', err);
        });
    }
  };

  // Default measurements if none provided
  const defaultMeasurements: MeasurementItem[] = [
    { label: 'Chest', value: '--' },
    { label: 'Waist', value: '--' },
    { label: 'Hips', value: '--' },
    { label: 'Legs', value: '--' }
  ];

  const displayMeasurements = convertToMeasurementItems(measurements);
  if (displayMeasurements.length === 0) {
    displayMeasurements.push(...defaultMeasurements);
  }

  return (
    <div>
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
        .manrope { font-family: 'Manrope', sans-serif; }
        
        /* Mobile-first responsive design */
        .measurement-card {
          position: relative;
          width: auto;
          padding: 16px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          margin: 16px;
        }

        @media (min-width: 768px) {
          .measurement-card {
            border-radius: 20px;
            padding: 20px 24px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            margin: 16px 24px;
          }
        }
        
        .measurement-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        
        @media (min-width: 640px) {
          .measurement-grid {
            display: flex;
            gap: 16px;
          }
        }
        
        .measurement-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px;
          border-radius: 8px;
          transition: background-color 0.2s;
        }
        
        .measurement-item:hover {
          background-color: #f9fafb;
        }
        
        @media (min-width: 640px) {
          .measurement-item {
            padding: 0;
          }
        }
        
        .search-container {
          position: absolute;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
        }
        
        .search-input {
          padding: 8px 12px 8px 32px;
          border-radius: 20px;
          border: 1px solid #e5e7eb;
          font-size: 14px;
          width: 180px;
        }
        
        .search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
        }
      `}</style>

      <div className="measurement-card">
        <div className="flex items-center justify-between h-full gap-4">
          {/* Left: title + measurements */}
          <div className="flex flex-col justify-center flex-1 min-w-0">
          <div className="manrope text-xs md:text-sm text-gray-400 mb-2 md:mb-3">{title}</div>

          {/* Measurement Grid */}
          <div className="measurement-grid">
            {displayMeasurements.map((item, index) => (
              <button 
                key={index} 
                className={`measurement-item manrope text-sm text-gray-600 hover:text-purple-700 ${
                  item.label === 'Copy' ? 'text-purple-700 font-medium col-span-2 sm:col-span-1' : ''
                }`}
                onClick={item.label === 'Copy' ? handleCopyMeasurements : undefined}
              >
                {item.label === 'Copy' ? (
                  <>
                    <Image 
                      src="/Copy Streamline Bootstrap.png" 
                      alt="Copy" 
                      width={16} 
                      height={16}
                      className="object-contain mb-1"
                    />
                    <span className="text-xs md:text-sm">{item.value}</span>
                  </>
                ) : (
                  <>
                    <span className="font-medium">{item.value}</span>
                    <span className="text-xs md:text-sm">{item.label}</span>
                  </>
                )}
              </button>
            ))}
            
            {/* Add Copy button if not already in measurements */}
            {!displayMeasurements.some(item => item.label === 'Copy') && (
              <button 
                className="measurement-item manrope text-sm text-purple-700 font-medium col-span-2 sm:col-span-1"
                onClick={handleCopyMeasurements}
              >
                <Image 
                  src="/Copy Streamline Bootstrap.png" 
                  alt="Copy" 
                  width={16} 
                  height={16}
                  className="object-contain mb-1"
                />
                <span className="text-xs md:text-sm">Copy</span>
              </button>
            )}
          </div>
          </div>

          {/* Right: Search / Bell / Avatar — desktop only, inside the card */}
          <div className="hidden md:flex items-center flex-shrink-0">
            <UserTopBar />
          </div>
        </div>
      </div>
    </div>
  );
};