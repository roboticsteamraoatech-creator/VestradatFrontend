"use client";

import React, { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import ActionModal from '@/app/components/ActionModal';
import { MeasurementTopNav } from '@/app/components/MeasurementTopNav';

// Mock data for questionnaires
const mockQuestionnaires = [
  {
    id: '1',
    title: 'Clothing Preferences Survey',
    email: 'john.doe@example.com',
    userId: 'user1',
    formId: 'FORM-001',
    responses: 24,
    status: 'Active',
    visibility: 'Public',
    createdAt: '2023-05-15T10:30:00Z'
  },
  {
    id: '2',
    title: 'Shopping Habits Analysis',
    email: 'jane.smith@example.com',
    userId: 'user2',
    formId: 'FORM-002',
    responses: 18,
    status: 'Active',
    visibility: 'Private',
    createdAt: '2023-05-16T14:45:00Z'
  },
  {
    id: '3',
    title: 'Brand Awareness Study',
    email: 'robert.johnson@example.com',
    userId: 'user3',
    formId: 'FORM-003',
    responses: 32,
    status: 'Inactive',
    visibility: 'Public',
    createdAt: '2023-05-17T09:15:00Z'
  }
];

const AdminQuestionnairePage = () => {
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  
  const handleActionClick = (questionnaire: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedQuestionnaire(questionnaire);
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
    if (selectedQuestionnaire) {
      console.log('View questionnaire:', selectedQuestionnaire.id);
      // Implement view functionality
    }
  };

  const handleEdit = () => {
    if (selectedQuestionnaire) {
      console.log('Edit questionnaire:', selectedQuestionnaire.id);
      // Implement edit functionality
    }
  };

  const handleDelete = () => {
    if (selectedQuestionnaire) {
      console.log('Delete questionnaire:', selectedQuestionnaire.id);
      // Implement delete functionality
    }
    setIsModalOpen(false);
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const getStatusStyle = () => {
      switch (status.toLowerCase()) {
        case 'active':
          return 'bg-green-100 text-green-800';
        case 'inactive':
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };
    
    return (
      <span className={`manrope px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle()}`}>
        {status}
      </span>
    );
  };

  // Mock data for current measurement (for the top nav)
  const currentMeasurement = {
    chest: '90 cm',
    waist: '78 cm',
    hips: '92 cm',
    legs: '84 cm'
  };

  return (
    <div className="min-h-screen bg-white md:bg-gray-50">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
        .manrope { font-family: 'Manrope', sans-serif; }
      `}</style>

      {/* Measurement Top Nav */}
      <MeasurementTopNav 
        title="Current questionnaire metrics"
        measurements={currentMeasurement}
      />

    

      {/* Main Content */}
      <div className="w-full px-4 md:px-6 py-4">
        {/* Header with Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="manrope text-xl md:text-3xl font-semibold text-gray-800">
            All Questionnaires
          </h1>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="manrope text-left px-6 py-4 text-sm font-medium text-gray-500">Title</th>
                  <th className="manrope text-left px-6 py-4 text-sm font-medium text-gray-500">User Email</th>
                  <th className="manrope text-left px-6 py-4 text-sm font-medium text-gray-500">Form ID</th>
                  <th className="manrope text-left px-6 py-4 text-sm font-medium text-gray-500">Responses</th>
                  <th className="manrope text-left px-6 py-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="manrope text-left px-6 py-4 text-sm font-medium text-gray-500">Visibility</th>
                  <th className="manrope text-left px-6 py-4 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {mockQuestionnaires.map((questionnaire: any) => (
                  <tr key={questionnaire.id} className="hover:bg-gray-50">
                    <td className="manrope px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {questionnaire.title}
                      </div>
                    </td>
                    <td className="manrope px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {questionnaire.email}
                    </td>
                    <td className="manrope px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {questionnaire.formId}
                    </td>
                    <td className="manrope px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {questionnaire.responses}
                    </td>
                    <td className="manrope px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <StatusBadge status={questionnaire.status} />
                    </td>
                    <td className="manrope px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {questionnaire.visibility}
                    </td>
                    <td className="manrope px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={(e) => handleActionClick(questionnaire, e)}
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
              {mockQuestionnaires.map((questionnaire: any) => (
                <div key={questionnaire.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="manrope font-semibold text-gray-900">
                        {questionnaire.title}
                      </h3>
                      <p className="manrope text-sm text-gray-500 mt-1">
                        {questionnaire.email}
                      </p>
                      <p className="manrope text-sm text-gray-500 mt-1">
                        Form ID: {questionnaire.formId}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="flex justify-between items-center">
                      <span className="manrope text-sm text-gray-500">Responses:</span>
                      <span className="manrope text-sm font-medium text-gray-900">
                        {questionnaire.responses}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="manrope text-sm text-gray-500">Status:</span>
                      <span className="manrope text-sm font-medium text-gray-900">
                        <StatusBadge status={questionnaire.status} />
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="manrope text-sm text-gray-500">Visibility:</span>
                      <span className="manrope text-sm font-medium text-gray-900">
                        {questionnaire.visibility}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={(e) => handleActionClick(questionnaire, e)}
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

export default AdminQuestionnairePage;