"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthContext } from '@/AuthContext';
import { ArrowLeft, Loader2, CheckCircle, User, Clock, DollarSign, FileText, Image as ImageIcon } from 'lucide-react';

import { BASE_URL } from '@/config/api';

interface TaskDetails {
  taskId: string;
  serviceName?: string;
  providerName?: string;
  providerEmail?: string;
  completedAt?: string;
  completionForm?: {
    serviceCompletionDeclaration?: string;
    images?: string[];
    notes?: string;
  };
  financials?: {
    amount?: number;
    settlementStatus?: string;
  };
  customer?: {
    fullName?: string;
    firstName?: string;
    email?: string;
    phone?: string;
    customerId?: string;
  };
}

export default function TaskCompletionDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { token } = useAuthContext();
  const taskId = params?.id as string;
  const [task, setTask] = useState<TaskDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !taskId) return;
    const fetchTask = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/api/service-provider-tasks/admin/tasks/${taskId}/completion-details`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load task details');
        setTask(data.task || data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [token, taskId]);

  const formatDate = (dt?: string) => {
    if (!dt) return 'N/A';
    try { return new Date(dt).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }); }
    catch { return dt; }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          <p className="text-gray-500 text-sm">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center max-w-md">
          <p className="text-red-600 font-medium">{error || 'Task not found'}</p>
          <button onClick={() => router.back()} className="mt-4 text-sm text-purple-600 hover:underline">← Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Task Details</h1>
            <p className="text-sm text-gray-500 font-mono">{taskId}</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Task Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <h2 className="text-lg font-semibold text-gray-900">Task Summary</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400 text-xs mb-0.5">Service</p>
                <p className="font-medium text-gray-900">{task.serviceName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-0.5">Completed At</p>
                <p className="font-medium text-gray-900">{formatDate(task.completedAt)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-0.5">Provider</p>
                <p className="font-medium text-gray-900">{task.providerName || 'N/A'}</p>
              </div>
              {task.providerEmail && (
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Provider Email</p>
                  <p className="font-medium text-gray-900">{task.providerEmail}</p>
                </div>
              )}
            </div>
          </div>

          {/* Customer Info */}
          {task.customer && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900">Customer</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Name</p>
                  <p className="font-medium text-gray-900">{task.customer.fullName || task.customer.firstName || 'N/A'}</p>
                </div>
                {task.customer.email && (
                  <div>
                    <p className="text-gray-400 text-xs mb-0.5">Email</p>
                    <p className="font-medium text-gray-900">{task.customer.email}</p>
                  </div>
                )}
                {task.customer.phone && (
                  <div>
                    <p className="text-gray-400 text-xs mb-0.5">Phone</p>
                    <p className="font-medium text-gray-900">{task.customer.phone}</p>
                  </div>
                )}
                {task.customer.customerId && (
                  <div>
                    <p className="text-gray-400 text-xs mb-0.5">Customer ID</p>
                    <p className="font-mono text-xs text-gray-700">{task.customer.customerId}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Completion Form */}
          {task.completionForm && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-purple-500" />
                <h2 className="text-lg font-semibold text-gray-900">Completion Form</h2>
              </div>
              {task.completionForm.serviceCompletionDeclaration && (
                <div className="mb-4">
                  <p className="text-gray-400 text-xs mb-1">Declaration</p>
                  <p className="text-gray-700 text-sm bg-gray-50 rounded-xl p-3">{task.completionForm.serviceCompletionDeclaration}</p>
                </div>
              )}
              {task.completionForm.notes && (
                <div className="mb-4">
                  <p className="text-gray-400 text-xs mb-1">Notes</p>
                  <p className="text-gray-700 text-sm bg-gray-50 rounded-xl p-3">{task.completionForm.notes}</p>
                </div>
              )}
              {task.completionForm.images && task.completionForm.images.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ImageIcon className="w-4 h-4 text-gray-400" />
                    <p className="text-sm font-medium text-gray-700">Images ({task.completionForm.images.length})</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {task.completionForm.images.map((img, i) => (
                      <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                        <img src={img} alt={`Completion image ${i + 1}`} className="w-full h-24 object-cover rounded-xl border border-gray-100 hover:opacity-80 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Financials */}
          {task.financials && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-green-500" />
                <h2 className="text-lg font-semibold text-gray-900">Financial Details</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {task.financials.amount !== undefined && (
                  <div>
                    <p className="text-gray-400 text-xs mb-0.5">Amount</p>
                    <p className="text-xl font-bold text-gray-900">₦{task.financials.amount.toLocaleString()}</p>
                  </div>
                )}
                {task.financials.settlementStatus && (
                  <div>
                    <p className="text-gray-400 text-xs mb-0.5">Settlement Status</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      task.financials.settlementStatus === 'completed' ? 'bg-green-100 text-green-700' :
                      task.financials.settlementStatus === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{task.financials.settlementStatus}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
