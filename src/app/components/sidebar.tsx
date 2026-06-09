"use client";

import React, {
  Dispatch,
  SetStateAction,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { Menu, ChevronDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LogoutModal } from "./logoutModal";
import { useAuthContext } from "@/AuthContext";

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
  hidden?: boolean;
}

interface MenuItem {
  id: string;
  name: string;
  route?: string;
  icon: React.ReactNode;
  subItems?: SubMenuItem[];
}

const MenuBtn: React.FC<MenuBtnProps> = ({
  icon,
  positioning = "",
  onClick,
  toggleLeftPadding = "",
}) => (
  <button
    type="button"
    className={`${positioning} inline-flex cursor-pointer items-center justify-center rounded-md p-2 text-gray-600 hover:text-gray-900 ${toggleLeftPadding}`}
    onClick={onClick}
  >
    <span className="sr-only">Toggle menu</span>
    {icon}
  </button>
);

export const UserSidebar: React.FC<SidebarProps> = ({ onShow, setShow }) => {
  const pathname = usePathname();
  const { signOut } = useAuthContext();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const { user } = useAuthContext();
  const isServiceProvider = user?.role === "SERVICE_PROVIDER";

  // Auto-expand the submenu whose child route is currently active
  useEffect(() => {
    userMenuItems.forEach((item) => {
      if (item.subItems?.some((sub) => pathname.startsWith(sub.route))) {
        setExpandedMenu(item.id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggleSidebar = (): string => (onShow ? "block" : "hidden");
  const toggleLeftPadding = (): string => (onShow ? "pl-4 md:pl-12" : "");

  // Helper function to check if a route is active
  const isActive = (route: string): boolean => {
    if (route === "/user" && pathname === "/user") return true;
    if (route !== "/user" && pathname.startsWith(route)) return true;
    return false;
  };

  // Helper function to get text color
  const getTextColor = (route: string) => {
    return isActive(route) ? "#FFFFFF" : "#6E6E6EB2";
  };

  // Helper function to get icon filter for active state
  const getIconFilter = (route: string) => {
    return isActive(route) ? "brightness(0) invert(1)" : "none";
  };

  // Toggle submenu
  const toggleSubmenu = (menuId: string) => {
    setExpandedMenu(expandedMenu === menuId ? null : menuId);
  };

  // Check if any submenu item is active
  const isSubmenuActive = (subItems?: SubMenuItem[]): boolean => {
    if (!subItems) return false;
    return subItems.some((item) => isActive(item.route));
  };

  // Logout handler functions
  const handleLogoutClick = () => {
    setShowLogoutModal(true);
    setShow(false);
  };

  const handleConfirmLogout = () => {
    console.log("Logging out...");
    setShowLogoutModal(false);
    alert("Logged out successfully!");
    signOut();
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  // User menu items with their positions
  const userMenuItems: MenuItem[] = [
    {
      id: "dashboard",
      name: "Dashboard",
      route: "/user",
      icon: (
        <Image
          src="/Dashboard Circle Streamline Core Remix - Free.png"
          alt="Dashboard"
          width={24}
          height={24}
          className="object-contain"
        />
      ),
    },
    {
      id: "body-measurement",
      name: "Body Measurement",
      route: "/user/body-measurement",
      icon: (
        <Image
          src="/Body Streamline Ionic Filled.png"
          alt="Body Measurement"
          width={24}
          height={24}
          className="object-contain"
        />
      ),
    },
    {
      id: "object-dimension",
      name: "Object Dimension",
      route: "/user/object-dimension",
      icon: (
        <Image
          src="/Object Scan Streamline Tabler Line.png"
          alt="Object Dimension"
          width={24}
          height={24}
          className="object-contain"
        />
      ),
    },
    {
      id: "questionaire",
      name: "Questionnaire",
      route: "/user/questionaire",
      icon: (
        <Image
          src="/List Dropdown Streamline Carbon.png"
          alt="Questionnaire"
          width={24}
          height={24}
          className="object-contain"
        />
      ),
    },
    {
      id: "body-care",
      name: "Product/Services",
      icon: (
        <Image
          src="/Body Streamline Ionic Filled.png"
          alt="Body Care"
          width={24}
          height={24}
          className="object-contain"
        />
      ),
      subItems: [
        {
          id: "product-services-dashboard",
          name: "Product/Services Dashboard",
          route: "/user/body-care",
        },
        {
          id: "book-appointment",
          name: "Book Appointment",
          route: "/user/book-appointment",
        },
        {
          id: "my-orders",
          name: "My Orders",
          route: "/user/orders",
        },
        {
          id: "task-management",
          name: "Task Management",
          route: "/user/body-care/task-management",
          hidden: !isServiceProvider,
        },
        {
          id: "provider-settlement",
          name: "Provider Settlement",
          route: "/user/body-care/provider-settlement",
          hidden: !isServiceProvider,
        },
        {
          id: "delivery",
          name: "Delivery",
          route: "/user/delivery",
        },
      ],
    },
  ];

  return (
    <aside>
      <style jsx>{`
        @import url("https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap");
        .manrope {
          font-family: "Manrope", sans-serif;
        }

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
          box-shadow:
            0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06);
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

      <div
        className={`${toggleSidebar()} sidebar-container bg-[#FFFFFF] fixed overflow-y-auto shadow-sm flex flex-col`}
        style={{
          width: "328px",
          height: "100vh",
          top: "0",
          left: "0",
          borderRadius: "0 20px 20px 0",
          boxShadow: "0px 2px 8px 0px rgba(0, 0, 0, 0.1)",
          zIndex: 999,
        }}
      >
        {/* Header with Logo and Close Button */}
        <div
          className="sidebar-logo-container flex items-center"
          style={{
            width: "252px",
            height: "48px",
            justifyContent: "space-between",
            top: "43px",
            left: "38px",
            position: "absolute",
          }}
        >
          <div className="flex items-center">
            <Image
              src="/Group 1.png"
              alt="Brand Logo"
              width={55}
              height={48}
              className="object-contain"
            />
          </div>

          <button
            type="button"
            onClick={() => setShow(!onShow)}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            <Image
              src="/Panel Left Close Streamline Lucide Line.png"
              alt="Close Panel"
              width={24}
              height={24}
              className="object-contain"
            />
          </button>
        </div>

        <nav
          className="sidebar-nav-container flex flex-col justify-between"
          style={{
            marginTop: "120px",
            height: "calc(100vh - 180px)",
            paddingBottom: "20px",
          }}
        >
          <div
            className="menu-item-container flex flex-col"
            style={{ gap: "12px" }}
          >
            {/* User Menu Items */}
            {userMenuItems.map((item: MenuItem) => (
              <div key={item.id}>
                {item.route && !item.subItems ? (
                  // Menu item with route (no submenu)
                  <Link href={item.route}>
                    <div
                      className={`manrope flex items-center rounded-lg cursor-pointer transition-all duration-200 ${
                        isActive(item.route)
                          ? "bg-[#5D2A8B] hover:bg-[#5D2A8B]/90"
                          : "hover:bg-gray-50"
                      }`}
                      style={{
                        width: "295px",
                        height: "71px",
                        padding: "0 23px",
                        marginLeft: "15px",
                      }}
                    >
                      <div
                        className="flex items-center w-full"
                        style={{
                          gap: "12px",
                        }}
                      >
                        <div
                          className="w-6 h-6 flex items-center justify-center flex-shrink-0"
                          style={{ filter: getIconFilter(item.route) }}
                        >
                          {item.icon}
                        </div>
                        <span
                          className="manrope whitespace-nowrap overflow-hidden text-ellipsis"
                          style={{
                            fontWeight: 500,
                            fontSize: "20px",
                            lineHeight: "100%",
                            color: getTextColor(item.route),
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          {item.name}
                        </span>
                      </div>
                    </div>
                  </Link>
                ) : (
                  // Menu item with submenu
                  <div className="relative">
                    <div
                      className={`manrope flex items-center rounded-lg cursor-pointer transition-all duration-200 ${
                        isSubmenuActive(item.subItems)
                          ? "bg-[#5D2A8B] hover:bg-[#5D2A8B]/90"
                          : "hover:bg-gray-50"
                      }`}
                      style={{
                        width: "295px",
                        height: "71px",
                        padding: "0 23px",
                        marginLeft: "15px",
                      }}
                      onClick={() => toggleSubmenu(item.id)}
                    >
                      <div
                        className="flex items-center w-full"
                        style={{
                          gap: "12px",
                        }}
                      >
                        <div
                          className="w-6 h-6 flex items-center justify-center flex-shrink-0"
                          style={{
                            filter: isSubmenuActive(item.subItems)
                              ? "brightness(0) invert(1)"
                              : "none",
                          }}
                        >
                          {item.icon}
                        </div>
                        <span
                          className="manrope whitespace-nowrap overflow-hidden text-ellipsis"
                          style={{
                            fontWeight: 500,
                            fontSize: "20px",
                            lineHeight: "100%",
                            color: isSubmenuActive(item.subItems)
                              ? "#FFFFFF"
                              : "#6E6E6EB2",
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          {item.name}
                        </span>
                        <ChevronDown
                          className={`w-5 h-5 transition-transform duration-200 ${
                            expandedMenu === item.id ? "rotate-180" : ""
                          }`}
                          style={{
                            filter: isSubmenuActive(item.subItems)
                              ? "brightness(0) invert(1)"
                              : "none",
                            color: isSubmenuActive(item.subItems)
                              ? "#FFFFFF"
                              : "#6E6E6EB2",
                          }}
                        />
                      </div>
                    </div>

                    {/* Submenu items - only show if this menu is expanded */}
                    {expandedMenu === item.id && item.subItems && (
                      <div
                        className="ml-8 mt-2 flex flex-col gap-2 submenu-up"
                        style={{ width: "230px", marginLeft: "40px" }}
                      >
                        {item.subItems.map((subItem: SubMenuItem) =>
                          subItem.hidden ? null : (
                            <Link href={subItem.route} key={subItem.id}>
                              <div
                                className={`manrope flex items-center rounded-lg cursor-pointer transition-all duration-200 ${
                                  isActive(subItem.route)
                                    ? "bg-[#5D2A8B] hover:bg-[#5D2A8B]/90"
                                    : "bg-gray-100 hover:bg-gray-200"
                                }`}
                                style={{
                                  width: "230px",
                                  height: "45px",
                                  padding: "0 15px",
                                  marginLeft: "10px",
                                  borderRadius: "8px",
                                  margin: "2px 0",
                                }}
                              >
                                <span
                                  className="manrope whitespace-nowrap overflow-hidden text-ellipsis"
                                  style={{
                                    fontWeight: 400,
                                    fontSize: "15px",
                                    lineHeight: "100%",
                                    color: isActive(subItem.route)
                                      ? "#FFFFFF"
                                      : "#6E6E6EB2",
                                    flex: 1,
                                    minWidth: 0,
                                  }}
                                >
                                  {subItem.name}
                                </span>
                              </div>
                            </Link>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Logout Module - Positioned at the bottom */}
          <div
            className="sidebar-logout mt-auto"
            style={{
              display: "flex",
              alignItems: "center",
              paddingTop: "30px",
              marginLeft: "38px",
            }}
          >
            <button
              className="manrope flex items-center hover:opacity-80 cursor-pointer"
              style={{
                gap: "12px",
                background: "none",
                border: "none",
                padding: 0,
              }}
              onClick={handleLogoutClick}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7.5 17.5H4.16667C3.72464 17.5 3.30072 17.3244 2.98816 17.0118C2.67559 16.6993 2.5 16.2754 2.5 15.8333V4.16667C2.5 3.72464 2.67559 3.30072 2.98816 2.98816C3.30072 2.67559 3.72464 2.5 4.16667 2.5H7.5"
                  stroke="#FF6161"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M13.3333 14.1667L17.5 10L13.3333 5.83334"
                  stroke="#FF6161"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M17.5 10H7.5"
                  stroke="#FF6161"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span
                className="manrope"
                style={{
                  fontWeight: 500,
                  fontSize: "20px",
                  lineHeight: "100%",
                  color: "#FF6161",
                }}
              >
                Logout
              </span>
            </button>
          </div>
        </nav>
      </div>

      {!onShow && (
        <MenuBtn
          positioning="fixed left-4 z-[1000]"
          icon={<Menu className="h-6 w-6 text-gray-600 hover:text-gray-900" />}
          onClick={() => setShow(!onShow)}
          toggleLeftPadding={toggleLeftPadding()}
        />
      )}
    </aside>
  );
};
