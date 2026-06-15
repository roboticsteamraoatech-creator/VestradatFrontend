

'use client';

import React, { useState, useEffect } from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { useProfile } from '@/api/hooks/useProfile';
import { useRouter } from 'next/navigation';
import { LogoutModal } from './logoutModal';
import { useAuthContext } from '@/AuthContext';
import { BASE_URL } from '@/config/api';

export const UserTopBar = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { profile, error } = useProfile();
  const { token } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!token) return;
    fetch(`${BASE_URL}/api/admin/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setUnreadCount(d.unreadCount || d.data?.unreadCount || 0))
      .catch(() => {});
  }, [token]);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (error) {
      // Profile loading error
    }
    if (profile) {
      // Profile loaded successfully
    }
  }, [error, profile]);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
    setShowDropdown(false);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    localStorage.removeItem('userToken');
    router.push('/auth/login');
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <>
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
        .manrope { font-family: 'Manrope', sans-serif; }
      `}</style>

      <LogoutModal
        isOpen={showLogoutModal}
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
      />

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="bg-white flex items-center w-[285px] h-[40px] rounded-full border border-[#E4D8F3] px-4 gap-2">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search"
            className="manrope flex-1 outline-none bg-transparent text-sm text-[#6E6E6E]"
          />
        </div>

        {/* Bell + Avatar */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <button
            className="relative p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => router.push('/admin/notifications')}
            type="button"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-gray-500" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Avatar and Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              className="flex items-center cursor-pointer bg-transparent border-none p-0 gap-1.5"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
              type="button"
            >
              <div className="relative overflow-hidden flex items-center justify-center w-[40px] h-[40px] rounded-full bg-[#6D1E1E]">
                <Image
                  src="/Frame 1707479300.png"
                  alt="User Avatar"
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>
              <ChevronDown className="text-gray-600 w-[22px] h-[22px]" />
            </button>

            {showDropdown && (
              <div
                className="absolute manrope top-12 right-0 w-[200px] bg-[#F4EFFA] rounded-[15px] shadow-xl p-5 z-[9999]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col gap-5">
                  <button
                    className="w-full text-left bg-transparent border-none manrope font-medium text-lg text-[#1A1A1A] cursor-pointer p-0 hover:text-[#5D2A8B] transition-colors"
                    onClick={() => { setShowDropdown(false); router.push('/user/profile'); }}
                  >
                    Profile
                  </button>
                  <button
                    className="w-full text-left bg-transparent border-none manrope font-medium text-lg text-[#1A1A1A] cursor-pointer p-0 hover:text-[#5D2A8B] transition-colors"
                    onClick={handleLogoutClick}
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

