"use client";


import { AdminSidebar } from "@/app/components/AdminSidebar";
import { useState } from "react";
import SubscriptionGuard from "@/components/SubscriptionGuard";
import { NotificationProvider } from "@/contexts/NotificationContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showSidebar, setShowSidebar] = useState(true);

  return (
    <SubscriptionGuard>
      <NotificationProvider>
        <div className="min-h-screen bg-gray-50">
          <AdminSidebar onShow={showSidebar} setShow={setShowSidebar} />
          <div
            className={`transition-[margin-left] duration-300 ease-in-out ${
              showSidebar ? "md:ml-[328px]" : "md:ml-[72px]"
            }`}
          >
            {children}
          </div>
        </div>
      </NotificationProvider>
    </SubscriptionGuard>
  );
}