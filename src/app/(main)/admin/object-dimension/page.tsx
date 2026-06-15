"use client";

import React, { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import ActionModal from '@/app/components/ActionModal';
import { MeasurementTopNav } from '@/app/components/MeasurementTopNav';


const mockObjects = [
  {
    id: '1',
    name: 'Wooden Chair',
    email: 'john.doe@example.com',
    userId: 'user1',
    dimensions: [
      { name: 'Height', value: '90 cm' },
      { name: 'Width', value: '50 cm' },
      { name: 'Depth', value: '50 cm' }
    ],
    category: 'Furniture',
    createdAt: '2023-05-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'Office Desk',
    email: 'jane.smith@example.com',
    userId: 'user2',
    dimensions: [
      { name: 'Height', value: '75 cm' },
      { name: 'Width', value: '120 cm' },
      { name: 'Depth', value: '60 cm' }
    ],
    category: 'Furniture',
    createdAt: '2023-05-16T14:45:00Z'
  },
  {
    id: '3',
    name: 'Smartphone',
    email: 'robert.johnson@example.com',
    userId: 'user3',
    dimensions: [
      { name: 'Height', value: '15 cm' },
      { name: 'Width', value: '7 cm' },
      { name: 'Depth', value: '0.8 cm' }
    ],
    category: 'Electronics',
    createdAt: '2023-05-17T09:15:00Z'
  }
];

const AdminObjectDimensionPage = () => {
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  
  const handleActionClick = (obj: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedObject(obj);
    setIsModalOpen(true);
    
    // Set modal position based on button position
    const button = e.currentTarget as HTMLButtonElement;
    const rect = button.getBoundingClientRect();
    
    const top = rect.bottom + window.scrollY + 5;
    const left = rect.left + window.scrollX - 50;
    
    setModalPosition({
      top,
      left
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleView = () => {
    if (selectedObject) {
      console.log('View object:', selectedObject.id);
      // Implement view functionality
    }
  };

  const handleEdit = () => {
    if (selectedObject) {
      console.log('Edit object:', selectedObject.id);
      
    }
  };

  const handleDelete = () => {
    if (selectedObject) {
      console.log('Delete object:', selectedObject.id);
      // Implement delete functionality
    }
    setIsModalOpen(false);
  };

  
  const currentMeasurement = {
    chest: '88 cm',
    waist: '75 cm',
    hips: '90 cm',
    legs: '82 cm'
  };

  return (
    <div className="min-h-screen bg-white md:bg-gray-50">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
        .manrope { font-family: 'Manrope', sans-serif; }
      `}</style>

     
      <MeasurementTopNav 
        title="Current object dimensions"
        measurements={currentMeasurement}
      />

      {/* Main Content */}
      <div className="w-full px-4 md:px-6 py-4">
        {/* Header with Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="manrope text-xl md:text-3xl font-semibold text-gray-800">
            All Object Dimensions
          </h1>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="manrope text-left px-6 py-4 text-sm font-medium text-gray-500">Object Name</th>
                  <th className="manrope text-left px-6 py-4 text-sm font-medium text-gray-500">User Email</th>
                  <th className="manrope text-left px-6 py-4 text-sm font-medium text-gray-500">Category</th>
                  <th className="manrope text-left px-6 py-4 text-sm font-medium text-gray-500">Dimensions</th>
                  <th className="manrope text-left px-6 py-4 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {mockObjects.map((obj: any) => (
                  <tr key={obj.id} className="hover:bg-gray-50">
                    <td className="manrope px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {obj.name}
                      </div>
                    </td>
                    <td className="manrope px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {obj.email}
                    </td>
                    <td className="manrope px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {obj.category}
                    </td>
                    <td className="manrope px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {obj.dimensions.map((dim: any, idx: number) => (
                        <div key={idx}>{dim.name}: {dim.value}</div>
                      ))}
                    </td>
                    <td className="manrope px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={(e) => handleActionClick(obj, e)}
                          className="text-gray-500 hover:text-gray-700"
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
            <div className="space-y-4 p-4">
              {mockObjects.map((obj: any) => (
                <div key={obj.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="manrope font-semibold text-gray-900">
                        {obj.name}
                      </h3>
                      <p className="manrope text-sm text-gray-500 mt-1">
                        {obj.email}
                      </p>
                      <p className="manrope text-sm text-gray-500 mt-1">
                        Category: {obj.category}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <h4 className="manrope text-sm font-medium text-gray-700 mb-2">Dimensions:</h4>
                    {obj.dimensions.map((dim: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center mb-1">
                        <span className="manrope text-sm text-gray-500">{dim.name}:</span>
                        <span className="manrope text-sm font-medium text-gray-900">
                          {dim.value}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={(e) => handleActionClick(obj, e)}
                      className="manrope text-sm text-gray-500 hover:text-gray-700"
                    >
                      ...
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      <ActionModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onViewMeasurement={handleView}
        onEditMeasurement={handleEdit}
        onDelete={handleDelete}
        position={modalPosition}
      />
    </div>
  );
};

export default AdminObjectDimensionPage;