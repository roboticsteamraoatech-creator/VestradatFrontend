
"use client";


import { UserSidebar } from '@/app/components/sidebar';
import { useState } from 'react';
import SubscriptionGuard from '@/components/SubscriptionGuard';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showSidebar, setShowSidebar] = useState(false);

  return (
    <SubscriptionGuard>
      <div className="min-h-screen bg-[#F7F0FE]">
        <UserSidebar onShow={showSidebar} setShow={setShowSidebar} />
        <div
          className={`transition-[margin-left] duration-300 ease-in-out ${
            showSidebar ? 'md:ml-[328px]' : 'md:ml-[72px]'
          }`}
        >
          {children}
        </div>
      </div>
    </SubscriptionGuard>
  );
}
