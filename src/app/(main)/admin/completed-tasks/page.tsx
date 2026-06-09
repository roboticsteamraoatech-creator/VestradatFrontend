"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/AuthContext';
import { ArrowLeft, CheckCircle, Loader2, RefreshCw, Tag, User, Clock } from 'lucide-react';

import { BASE_URL } from '@/config/api';

interface CompletedTask {
  taskId: string;
  serviceName: string;
  providerName?: string;
  customerName?: string;
  completedAt: string;
  amount?: number;
  remittanceStatus?: string;
}

const REMITTANCE_COLORS: Record<string, { bg: string; text: string }> = {
  pending:   { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  completed: { bg: 'bg-green-100',  text: 'text-green-700' },
  failed:    { bg: 'bg-red-100',    text: 'text-red-700' },
};

export default function CompletedTasksPage() {
  const router = useRouter();
  const { token } = useAuthContext();
  const [tasks, setTasks] = useState<CompletedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTasks = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/api/service-provider-tasks/admin/report/completed?includeConfirmation=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load completed tasks');
      setTasks(data.tasks || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const formatDate = (dt: string) => {
    try { return new Date(dt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }); }
    catch { return dt; }
  };

  const getStatusStyle = (status?: string) => {
    const key = (status || 'pending').toLowerCase();
    return REMITTANCE_COLORS[key] || { bg: 'bg-gray-100', text: 'text-gray-700' };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Completed Tasks</h1>
              <p className="text-sm text-gray-500">Service provider task completion records · {tasks.length} tasks</p>
            </div>
          </div>
          <button onClick={fetchTasks} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              <p className="text-gray-500 text-sm">Loading completed tasks...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button onClick={fetchTasks} className="mt-3 text-sm text-purple-600 hover:underline">Retry</button>
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No completed tasks</p>
            <p className="text-gray-400 text-sm mt-1">Completed tasks will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task, i) => {
              const statusStyle = getStatusStyle(task.remittanceStatus);
              return (
                <div
                  key={task.taskId || i}
                  onClick={() => router.push(`/admin/task-completion-details/${task.taskId}`)}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:border-purple-200 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">{task.serviceName}</span>
                        {task.remittanceStatus && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                            {task.remittanceStatus}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5" />
                          <span className="font-mono text-xs">{task.taskId}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatDate(task.completedAt)}</span>
                        </div>
                        {task.providerName && (
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" />
                            <span>Provider: {task.providerName}</span>
                          </div>
                        )}
                        {task.customerName && (
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-blue-400" />
                            <span>Customer: {task.customerName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {task.amount !== undefined && (
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">₦{task.amount.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">Amount</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
