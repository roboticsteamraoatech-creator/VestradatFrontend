"use client";

import React, { Dispatch, SetStateAction, ReactNode, useState, useEffect, useRef } from 'react';
import { 
  Menu,
  User,
  LogOut,
  Shield,
  ChevronDown,
  Landmark,
  ShoppingBag,
  FileCheck,
  FileText,
  Bell,
  Calendar,
  Smartphone,
  Package,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LogoutModal } from './logoutModal';
import { useAuthContext } from '@/AuthContext';

interface SidebarProps {
  onShow: boolean;
  setShow: Dispatch<SetStateAction<boolean>>;
}

interface MenuBtnProps {
  icon: ReactNode;
  positioning?: string;
  onClick: () => void;
  toggleLeftPadding?: string;
}

interface SubMenuItem {
  id: string;
  name: string;
  route: string;
}

interface MenuItem {
  id: string;
  name: string;
  route?: string;
  icon: React.ReactNode;
  subItems?: SubMenuItem[];
}

const MenuBtn: React.FC<MenuBtnProps> = ({ icon, positioning = '', onClick, toggleLeftPadding = '' }) => (
  <button
    type="button"
    className={`${positioning} inline-flex cursor-pointer items-center justify-center rounded-md p-2 text-gray-600 hover:text-gray-900 ${toggleLeftPadding}`}
    onClick={onClick}
  >
    <span className="sr-only">Toggle menu</span>
    {icon}
  </button>
);

export const AdminSidebar: React.FC<SidebarProps> = ({ onShow, setShow }) => {
  const pathname = usePathname();
  const { signOut, user } = useAuthContext();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  const toggleSidebar = (): string => onShow ? "block" : "hidden";
  const toggleLeftPadding = (): string => onShow ? "pl-4 md:pl-12" : "";

  // Helper function to check if a route is active
  const isActive = (route: string): boolean => {
    if (route === '/admin' && pathname === '/admin') return true;
    if (route !== '/admin' && pathname.startsWith(route)) return true;
    return false;
  };

  // Helper function to get text color
  const getTextColor = (route: string) => {
    return isActive(route) ? '#5D2A8B' : '#6E6E6EB2';
  };

  // CSS filter that converts a black icon to #5D2A8B purple
  const PURPLE_FILTER = 'brightness(0) saturate(100%) invert(21%) sepia(77%) saturate(700%) hue-rotate(252deg) brightness(90%)';

  const getIconFilter = (route: string) => {
    return isActive(route) ? PURPLE_FILTER : 'none';
  };

  // Toggle submenu
  const toggleSubmenu = (menuId: string) => {
    setExpandedMenu(expandedMenu === menuId ? null : menuId);
  };

  // Check if any submenu item is active
  const isSubmenuActive = (subItems?: SubMenuItem[]): boolean => {
    if (!subItems) return false;
    return subItems.some(item => isActive(item.route));
  };

  // Logout handler functions
  const handleLogoutClick = () => {
    setShowLogoutModal(true);
    setShow(false);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    signOut();
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  // Admin menu items with their positions
  const adminMenuItems: MenuItem[] = [
    { 
      id: 'dashboard', 
      name: 'Dashboard', 
      route: '/admin', 
      icon: <Image src="/Dashboard Circle Streamline Core Remix - Free.png" alt="Dashboard" width={24} height={24} className="object-contain" />,
    },
    //  { 
    //   id: 'mobile-app-stats', 
    //   name: 'Mobile App Statistics', 
    //   route: '/admin/mobile-app-stats', 
    //   icon: <Smartphone className="w-6 h-6" />,
    // },
    {
      id: 'body-measurement', 
      name: 'Body Measurement', 
      route: '/admin/body-measurement', 
      icon: <Image src="/Body Streamline Ionic Filled.png" alt="Body Measurement" width={24} height={24} className="object-contain" />,
    },
    { 
      id: 'object-dimension', 
      name: 'Object Dimension', 
      route: '/admin/object-dimension', 
      icon: <Image src="/Object Scan Streamline Tabler Line.png" alt="Object Dimension" width={24} height={24} className="object-contain" />,
    },
    { 
      id: 'questionaire', 
      name: 'Questionnaire', 
      route: '/admin/questionaire', 
      icon: <Image src="/List Dropdown Streamline Carbon.png" alt="Questionnaire" width={24} height={24} className="object-contain" />,
    },
    { 
      id: 'group-management', 
      name: 'Group Management', 
      route: '/admin/group-management', 
      icon: <Image src="/List Dropdown Streamline Carbon.png" alt="Questionnaire" width={24} height={24} className="object-contain" />,
    },
    {
      id: 'verification-badge',
      name: 'Verification Badge',
      icon: <Image src="/List Dropdown Streamline Carbon.png" alt="Verification Badge" width={24} height={24} className="object-contain" />,
      subItems: [
        // { id: 'org-profile', name: 'Organization Profile', route: '/admin/org-profile' },
        {
          id: 'verification-badge-main',
          name: 'My Locations',
          route: '/admin/subscription/verification-badge'
        },
        // { id: 'location-payment', name: 'Location Payments', route: '/admin/subscription/location-payment' }
      ]
    },
    {
      id: 'subscription',
      name: 'Subscription',
      icon: <Image src="/List Dropdown Streamline Carbon.png" alt="Subscription" width={24} height={24} className="object-contain" />,
      subItems: [
        // { id: 'subscription-overview', name: 'Overview', route: '/admin/subscription' },
        {
          id: 'subscription-packages',
          name: 'My Packages',
          route: '/admin/subscription/packages'
        }
      ]
    },
    { 
      id: 'settlements', 
      name: 'Settlements', 
      icon: <Image src="/Rss Feed Streamline Ultimate Regular - Free (4).png" alt="Settlements" width={24} height={24} className="object-contain" />,
      subItems: [
        {
          id: 'settlement-orders',
          name: 'Order Settlements',
          route: '/admin/remittance/order'
        },
        {
          id: 'task-management',
          name: 'Task Management',
          route: '/admin/settlement/task-management'
        },
        {
          id: 'provider-settlement',
          name: 'Provider Settlement',
          route: '/admin/settlement/provider-settlement'
        },
        {
          id: 'settlement-bank',
          name: 'Bank Details',
          route: '/admin/remittance'
        }
      ]
    },
   
  
   
    { 
      id: 'gallery', 
      name: 'Gallery Item Management', 
      icon: <Image src="/List Dropdown Streamline Carbon.png" alt="Gallery" width={24} height={24} className="object-contain" />,
      subItems: [
        {
          id: 'gallery-items',
          name: 'Gallery Management',
          route: '/admin/gallery'
        },
        {
          id: 'gallery-org-items',
          name: 'Services & Products',
          route: '/admin/gallery/items'
        },
        {
          id: 'service-provider-assignment',
          name: 'Service Provider Assignment',
          route: '/admin/gallery/service-provider-assignment'
        },
      ]
    },
    {
      id: 'booking',
      name: 'Booking Management',
      route: '/admin/booking',
      icon: <Calendar className="w-6 h-6" />,
    },
    {
      id: 'order-management',
      name: 'Order Management',
      route: '/admin/order-management',
      icon: <Package className="w-6 h-6" />,
    },
    {
      id: 'service-booking',
      name: 'Service Booking',
      route: '/admin/service-booking',
      icon: <BookOpen className="w-6 h-6" />,
    },
   
    { 
      id: 'data-verification', 
      name: 'Data Verification', 
       icon: <FileText className="w-6 h-6" />,
      // icon: <Image src="/File Document Streamline Carbon.png" alt="Data Verification" width={24} height={24} className="object-contain" />,
      subItems: [
        {
          id: 'field-agent',
          name: 'Field Agent',
          route: '/admin/data-verification/field-agent'
        }
      ]
    },
    {
      id: 'role-management',
      name: 'Role Management',
      route: '/admin/role-management',
      icon: <Shield className="w-6 h-6" />,
    },
    { 
      id: 'users', 
      name: 'User Management', 
      icon: <User className="w-6 h-6" />, 
      subItems: [
        {
          id: 'users-list',
          name: 'Users',
          route: '/admin/users'
        },
        {
          id: 'pending-users',
          name: 'Pending Users',
          route: '/admin/users/pending'
        },
        {
          id: 'one-time-codes',
          name: 'One-Time Codes',
          route: '/admin/users/one-time-codes'
        }
      ]
    },
  ];

  // Auto-expand menu based on current route
  useEffect(() => {
    adminMenuItems.forEach(item => {
      if (item.subItems) {
        const isActiveSubmenu = item.subItems.some(subItem => isActive(subItem.route));
        if (isActiveSubmenu) {
          setExpandedMenu(item.id);
        }
      }
    });
  }, [pathname]);

  return (
    <aside>
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
        .manrope { font-family: 'Manrope', sans-serif; }
        
        @media (max-width: 768px) {
          .sidebar-container {
            width: 280px !important;
            height: 100vh !important;
            top: 0 !important;
            left: 0 !important;
            border-radius: 0 !important;
          }
          
          .sidebar-logo-container {
            position: relative !important;
            top: auto !important;
            left: auto !important;
            padding: 20px;
          }
          
          .sidebar-nav-container {
            position: relative !important;
            padding: 0 20px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: calc(100vh - 140px);
          }
          
          .menu-item-container {
            display: flex !important;
            flex-direction: column !important;
            gap: 8px !important;
            margin-top: 20px !important;
          }
          
          .sidebar-logout {
            position: relative !important;
            bottom: auto !important;
            left: auto !important;
            margin-top: auto;
            padding: 20px 0;
          }
        }
        
        .sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 998;
        }
        
        @media (max-width: 768px) {
          .sidebar-overlay.active {
            display: block;
          }
        }
        
        /* Submenu positioning */
        .submenu-up {
          position: absolute;
          top: 100%;
          left: 30px;
          z-index: 10;
          min-width: 200px;
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          padding: 8px 0;
          margin-top: 5px;
        }
        
        .submenu-down {
          position: relative;
          top: 0;
          left: 0;
          transform: none;
        }
      `}</style>
      
      <LogoutModal 
        isOpen={showLogoutModal}
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
      />
      
      {onShow && (
        <div 
          className="sidebar-overlay active"
          onClick={() => setShow(false)}
        />
      )}
      
      {/* Sidebar — full when onShow=true, mini icons-only on desktop when onShow=false */}
      <div
        ref={sidebarRef}
        className={`${onShow ? 'block' : 'hidden md:flex md:flex-col'} sidebar-container bg-[#FFFFFF] fixed shadow-sm`}
        style={{
          width: onShow ? '328px' : '72px',
          height: '100vh',
          top: '0',
          left: '0',
          borderRadius: '0 20px 20px 0',
          boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.1)',
          zIndex: 999,
          transition: 'width 300ms ease',
          overflowY: onShow ? 'auto' : 'visible',
          overflowX: onShow ? 'hidden' : 'visible',
        }}
      >
        {onShow ? (
          /* ── FULL SIDEBAR ── */
          <>
            {/* Header with Logo and Close Button */}
            <div
              className="sidebar-logo-container flex items-center"
              style={{
                width: '252px',
                height: '48px',
                justifyContent: 'space-between',
                top: '43px',
                left: '38px',
                position: 'absolute'
              }}
            >
              <div className="flex items-center">
                <Image src="/assets/vetra.png" alt="Vestradat Logo" width={120} height={40} className="object-contain" />
              </div>
              <button type="button" onClick={() => setShow(false)} className="cursor-pointer hover:opacity-80 transition-opacity">
                <Image src="/Panel Left Close Streamline Lucide Line.png" alt="Close Panel" width={24} height={24} className="object-contain" />
              </button>
            </div>

            <nav
              className="sidebar-nav-container flex flex-col justify-between"
              style={{ marginTop: '120px', height: 'calc(100vh - 180px)', paddingBottom: '20px' }}
            >
              <div className="menu-item-container flex flex-col" style={{ gap: '12px' }}>
                {adminMenuItems.map((item: MenuItem) => (
                  <div key={item.id}>
                    {item.route && !item.subItems ? (
                      <Link href={item.route}>
                        <div
                          className={`manrope flex items-center rounded-lg cursor-pointer hover:bg-purple-50 transition-all duration-200 ${isActive(item.route) ? 'bg-[#F4EFFA]' : ''}`}
                          style={{ width: '275px', height: '71px', padding: '0 23px', marginLeft: '15px' }}
                        >
                          <div className="flex items-center w-full" style={{ gap: '12px' }}>
                            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0" style={{ filter: getIconFilter(item.route), color: isActive(item.route) ? '#5D2A8B' : undefined }}>
                              {item.icon}
                            </div>
                            <span className="manrope whitespace-nowrap overflow-hidden text-ellipsis" style={{ fontWeight: 500, fontSize: '20px', lineHeight: '100%', color: getTextColor(item.route), flex: 1, minWidth: 0 }}>
                              {item.name}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div className="relative">
                        <div
                          className={`manrope flex items-center rounded-lg cursor-pointer hover:bg-purple-50 transition-all duration-200 ${isSubmenuActive(item.subItems) ? 'bg-[#F4EFFA]' : ''}`}
                          style={{ width: '275px', height: '71px', padding: '0 23px', marginLeft: '15px' }}
                          onClick={() => toggleSubmenu(item.id)}
                        >
                          <div className="flex items-center w-full" style={{ gap: '12px' }}>
                            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0" style={{ filter: isSubmenuActive(item.subItems) ? PURPLE_FILTER : 'none', color: isSubmenuActive(item.subItems) ? '#5D2A8B' : undefined }}>
                              {item.icon}
                            </div>
                            <span className="manrope whitespace-nowrap overflow-hidden text-ellipsis" style={{ fontWeight: 500, fontSize: '20px', lineHeight: '100%', color: isSubmenuActive(item.subItems) ? '#5D2A8B' : '#6E6E6EB2', flex: 1, minWidth: 0 }}>
                              {item.name}
                            </span>
                            <ChevronDown
                              className={`w-5 h-5 transition-transform duration-200 ${expandedMenu === item.id ? 'rotate-180' : ''}`}
                              style={{ color: isSubmenuActive(item.subItems) ? '#5D2A8B' : '#6E6E6EB2' }}
                            />
                          </div>
                        </div>
                        {expandedMenu === item.id && item.subItems && (
                          <div className="mt-2 flex flex-col gap-2" style={{ width: '230px', marginLeft: '40px' }}>
                            {item.subItems.map((subItem: SubMenuItem) => (
                              <Link href={subItem.route} key={subItem.id}>
                                <div
                                  className={`manrope flex items-center rounded-lg cursor-pointer hover:bg-purple-50 transition-all duration-200 ${isActive(subItem.route) ? 'bg-[#F4EFFA]' : 'bg-gray-100'}`}
                                  style={{ width: '230px', height: '45px', padding: '0 15px', borderRadius: '8px', margin: '2px 0' }}
                                >
                                  <span className="manrope whitespace-nowrap overflow-hidden text-ellipsis" style={{ fontWeight: 400, fontSize: '15px', lineHeight: '100%', color: isActive(subItem.route) ? '#5D2A8B' : '#6E6E6EB2', flex: 1, minWidth: 0 }}>
                                    {subItem.name}
                                  </span>
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-auto" style={{ paddingTop: '40px', paddingBottom: '8px' }}>
                {/* Divider */}
                <div style={{ height: '1px', background: '#f0f0f0', marginBottom: '16px', marginLeft: '15px', width: '270px' }} />

                {/* Profile card + logout icon */}
                <div className="flex items-center justify-between" style={{ marginLeft: '15px', width: '270px' }}>
                  <Link href="/admin/profile" className="flex items-center gap-3 flex-1 min-w-0 px-3 py-2 rounded-xl hover:bg-purple-50 transition-colors cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-[#5D2A8B] flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-base">
                        {((user as any)?.fullName || (user as any)?.firstName || 'A')[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="manrope text-sm font-semibold text-gray-800 truncate leading-tight">
                        {(user as any)?.fullName || `${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`.trim() || 'Admin'}
                      </p>
                      <p className="manrope text-xs truncate capitalize" style={{ color: '#6E6E6EB2' }}>
                        {(user as any)?.role?.toLowerCase().replace(/_/g, ' ') || 'Administrator'}
                      </p>
                    </div>
                  </Link>
                  <button
                    onClick={handleLogoutClick}
                    className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-red-50 transition-colors flex-shrink-0 ml-2"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5 text-[#FF6161]" />
                  </button>
                </div>
              </div>
            </nav>
          </>
        ) : (
          /* ── MINI SIDEBAR (desktop only) ── */
          <div className="flex flex-col items-center w-full h-full py-5 gap-1">
            {/* Expand button */}
            <button
              type="button"
              onClick={() => setShow(true)}
              className="w-11 h-11 flex items-center justify-center hover:bg-gray-100 rounded-xl cursor-pointer mb-3 transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-500" />
            </button>

            {/* Icon-only nav items */}
            {adminMenuItems.map((item: MenuItem) => {
              const route = item.route ?? item.subItems?.[0]?.route ?? '#';
              const active = item.route ? isActive(item.route) : isSubmenuActive(item.subItems);
              return (
                <div key={item.id} className="group relative w-full flex justify-center">
                  {item.route && !item.subItems ? (
                    <Link href={item.route}>
                      <div className={`w-11 h-11 flex items-center justify-center rounded-xl transition-colors cursor-pointer ${active ? 'bg-[#F4EFFA]' : 'hover:bg-gray-100'}`}>
                        <div className="w-5 h-5 flex items-center justify-center" style={{ filter: active ? PURPLE_FILTER : 'none', color: active ? '#5D2A8B' : undefined }}>
                          {item.icon}
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <button type="button" onClick={() => setShow(true)} className={`w-11 h-11 flex items-center justify-center rounded-xl transition-colors cursor-pointer ${active ? 'bg-[#F4EFFA]' : 'hover:bg-gray-100'}`}>
                      <div className="w-5 h-5 flex items-center justify-center" style={{ filter: active ? PURPLE_FILTER : 'none', color: active ? '#5D2A8B' : undefined }}>
                        {item.icon}
                      </div>
                    </button>
                  )}
                  {/* Tooltip */}
                  <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-gray-800 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none z-[1000] whitespace-nowrap transition-opacity duration-150 shadow-lg">
                    {item.name}
                  </span>
                </div>
              );
            })}

            <div className="flex-1" />

            {/* Divider */}
            <div style={{ height: '1px', background: '#f0f0f0', width: '40px', marginBottom: '8px' }} />

            {/* Profile avatar */}
            <div className="group relative w-full flex justify-center pb-1">
              <Link href="/admin/profile">
                <div className="w-10 h-10 rounded-full bg-[#5D2A8B] flex items-center justify-center hover:ring-2 hover:ring-purple-300 transition-all cursor-pointer">
                  <span className="text-white font-bold text-sm">
                    {((user as any)?.fullName || (user as any)?.firstName || 'A')[0]?.toUpperCase()}
                  </span>
                </div>
              </Link>
              <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-gray-800 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none z-[1000] whitespace-nowrap transition-opacity duration-150 shadow-lg">
                My Profile
              </span>
            </div>

            {/* Logout icon */}
            <div className="group relative w-full flex justify-center pb-4">
              <button onClick={handleLogoutClick} className="w-11 h-11 flex items-center justify-center hover:bg-red-50 rounded-xl transition-colors cursor-pointer">
                <LogOut className="w-5 h-5 text-[#FF6161]" />
              </button>
              <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-gray-800 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none z-[1000] whitespace-nowrap transition-opacity duration-150 shadow-lg">
                Logout
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Mobile-only hamburger — hidden on desktop since mini sidebar is always visible */}
      {!onShow && (
        <MenuBtn
          positioning="fixed left-4 top-4 z-[1000] md:hidden"
          icon={<Menu className="h-6 w-6 text-gray-600 hover:text-gray-900" />}
          onClick={() => setShow(true)}
          toggleLeftPadding={toggleLeftPadding()}
        />
      )}
    </aside>
  );
};

