"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Download } from 'lucide-react';

export default function SystemSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    allowRegistrations: true,
    maxUsersPerOrg: 100,
    sessionTimeout: 24,
    emailNotifications: true,
    systemName: 'DataCapturing & Measurement Platform',
    supportEmail: 'support@platform.com',
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const ToggleRow = ({ label, description, settingKey }: { label: string; description?: string; settingKey: keyof typeof settings }) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => setSettings(prev => ({ ...prev, [settingKey]: !prev[settingKey as keyof typeof prev] }))}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ml-4 ${settings[settingKey] ? 'bg-purple-600' : 'bg-gray-200'}`}
      >
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${settings[settingKey] ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
            <p className="text-sm text-gray-500">Platform configuration</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* System Toggles */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">System Controls</h2>
            <ToggleRow label="Maintenance Mode" description="Disable access for regular users during maintenance" settingKey="maintenanceMode" />
            <ToggleRow label="Allow Registrations" description="Allow new users to register on the platform" settingKey="allowRegistrations" />
            <ToggleRow label="Email Notifications" description="Send email notifications for system events" settingKey="emailNotifications" />
          </div>

          {/* Numeric Settings */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Limits & Timeouts</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Users per Organization</label>
                <input
                  type="number"
                  value={settings.maxUsersPerOrg}
                  onChange={e => setSettings(prev => ({ ...prev, maxUsersPerOrg: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Session Timeout (hours)</label>
                <input
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={e => setSettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Text Settings */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Platform Identity</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">System Name</label>
                <input
                  type="text"
                  value={settings.systemName}
                  onChange={e => setSettings(prev => ({ ...prev, systemName: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={e => setSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Export */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Export System Data</h2>
            <div className="flex gap-3">
              {['CSV', 'Excel', 'PDF'].map(fmt => (
                <button key={fmt} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  <Download className="w-4 h-4" /> {fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Save */}
          {saved && (
            <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-green-700 text-sm text-center">
              Settings saved successfully!
            </div>
          )}

          <button
            onClick={handleSave}
            className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
