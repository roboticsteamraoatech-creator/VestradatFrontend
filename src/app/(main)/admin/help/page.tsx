'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, ChevronRight, HelpCircle, Lightbulb } from 'lucide-react';

const FAQS = [
  {
    q: 'How do I take a body measurement?',
    a: 'Go to the Body Measurement screen and tap "Create New". Choose between Manual entry or AI scan. For AI scan, upload front and side view photos with your height.',
  },
  {
    q: 'How accurate are AI measurements?',
    a: 'Our AI technology provides measurements with 95% accuracy when proper photos are taken. Ensure good lighting and wear fitted clothing for best results.',
  },
  {
    q: 'Can I share my measurements?',
    a: 'Yes! You can share measurements to your organization using one-time codes, or export them as PDF reports to share with others.',
  },
  {
    q: 'How do I reset my password?',
    a: 'On the login screen, tap "Forgot Password?" and enter your email. You\'ll receive a verification code to reset your password.',
  },
  {
    q: 'How do I update my profile?',
    a: 'Go to My Profile and tap "Edit Profile" to update your personal information including name, phone number, and other details.',
  },
];

const TIPS = [
  'Take AI photos in good lighting for better accuracy',
  'Wear fitted clothing for body measurements',
  'Keep your profile updated for better experience',
];

const APP_INFO = [
  { label: 'Version', value: '1.0.0' },
  { label: 'Last Updated', value: 'January 2024' },
  { label: 'Developer', value: 'Vestradat Team' },
];

export default function HelpPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-800" />
        </button>
        <h1 className="text-base font-bold text-gray-900">Help & Support</h1>
        <div className="w-9 h-9" />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Section 1 — Contact Support */}
        <div>
          <p className="text-sm font-bold text-gray-800 mb-2 px-1">Contact Support</p>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Email */}
            <a
              href="mailto:datacapturesuperadmin@raoatech.com?subject=Help Request"
              className="flex items-center gap-4 px-5 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">Email Support</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">datacapturesuperadmin@raoatech.com</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
            </a>

            {/* Phone */}
            <a
              href="tel:+2348097227051"
              className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">Phone Support</p>
                <p className="text-xs text-gray-500 mt-0.5">+234 809 722 7051</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
            </a>
          </div>
        </div>

        {/* Section 2 — FAQ */}
        <div>
          <p className="text-sm font-bold text-gray-800 mb-2 px-1">Frequently Asked Questions</p>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {FAQS.map(({ q, a }, i) => (
              <div key={i} className={`px-5 py-4 ${i < FAQS.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                  <p className="text-sm font-bold text-gray-900">{q}</p>
                </div>
                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed pl-7">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3 — App Information */}
        <div>
          <p className="text-sm font-bold text-gray-800 mb-2 px-1">App Information</p>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {APP_INFO.map(({ label, value }, i) => (
              <div key={label} className={`flex items-center justify-between px-5 py-4 ${i < APP_INFO.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-sm font-semibold text-gray-900">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4 — Quick Tips */}
        <div>
          <p className="text-sm font-bold text-gray-800 mb-2 px-1">Quick Tips</p>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {TIPS.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-4">
                <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-sm text-gray-500 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
