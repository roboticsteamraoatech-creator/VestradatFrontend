// "use client";

// import React, { useState } from 'react';
// import OrganizationsTable from '@/components/forms/OrganizationsTable';

// const OrganisationManagementPage = () => {
//   const [searchTerm, setSearchTerm] = useState('');

//   return (
//     <div className="manrope">
//       <style jsx>{`
//         @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
//         .manrope { font-family: 'Manrope', sans-serif; }
//       `}</style>

//       <div className="ml-0 md:ml-[350px] pt-8 md:pt-8 p-4 md:p-8 min-h-screen">
//         {/* Header Section */}
//         <div className="mb-6">
//           <h1 className="text-2xl font-bold text-gray-800 mb-2">Organisation Management</h1>
//           <p className="text-gray-600">Manage organisations and their administrators</p>
//         </div>

//         <OrganizationsTable
//           searchTerm={searchTerm}
//           onSearchChange={setSearchTerm}
//         />
//       </div>
//     </div>
//   );
// };

// export default OrganisationManagementPage;


"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  MoreVertical,
} from "lucide-react";
import { useRouter } from "next/navigation";
import OrganizationService from "@/services/OrganizationService";
import { Organization } from "@/types";
import { BASE_URL } from '@/config/api';

const OrganisationManagementPage = () => {
  const router = useRouter();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionModalPosition, setActionModalPosition] = useState({ top: 0, left: 0 });

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrganizations, setTotalOrganizations] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"active" | "suspended" | "inactive" | "">("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Date range
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Export
  const [exportLoading, setExportLoading] = useState(false);

  const fetchOrganizations = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        limit,
        search: searchTerm,
        status: statusFilter || undefined,
        sortBy,
        sortOrder,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const response = await OrganizationService.getOrganizations(params);

      setOrganizations(response.organizations);
      setTotalOrganizations(response.total);
      setTotalPages(response.totalPages);
    } catch (err) {
      setError("Failed to fetch organizations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [page, searchTerm, statusFilter, sortBy, sortOrder, startDate, endDate]);

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString();

  const handleActionClick = (org: Organization, e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedOrg(org);
    
    // Calculate position to ensure modal stays within viewport
    const buttonRect = (e.target as Element).getBoundingClientRect();
    const top = buttonRect.bottom + window.scrollY;
    const left = Math.max(buttonRect.left - 150, 10); // Position to the left of the button, with minimum 10px from left edge
    
    setActionModalPosition({
      top,
      left,
    });
    setShowActionModal(true);
  };

  const handleViewOrg = () => {
    if (selectedOrg) {
      router.push(`/super-admin/organisation/view/${selectedOrg.id}`);
      setShowActionModal(false);
    }
  };

  const handleEditOrg = () => {
    if (selectedOrg) {
      router.push(`/super-admin/organisation/edit/${selectedOrg.id}`);
      setShowActionModal(false);
    }
  };

  const handleDeleteOrg = () => {
    if (selectedOrg) {
      // Implement delete functionality
      console.log('Delete organization:', selectedOrg.id);
      setShowActionModal(false);
    }
  };

  const handleExport = async (format: "csv" | "excel") => {
    setExportLoading(true);
    try {
      const params = {
        search: searchTerm,
        status: statusFilter || undefined,
        sortBy,
        sortOrder,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      // Directly call the export endpoint with all parameters
      const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
      
      // Build query string from params
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);

      const queryString = queryParams.toString();
      const url = queryString 
        ? `${BASE_URL}/api/super-admin/organizations/export/${format}?${queryString}` 
        : `${BASE_URL}/api/super-admin/organizations/export/${format}`;

      const response = await fetch(url, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to export organizations as ${format}`);
      }

      // Get the filename from the Content-Disposition header or use a default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `organizations.${format}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Convert response to blob and create download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="manrope">
      <style jsx>{`
        @import url("https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap");
        .manrope {
          font-family: "Manrope", sans-serif;
        }
      `}</style>

      <div className="ml-0 md:ml-[350px] p-6 min-h-screen bg-gray-50">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Organisation Management
          </h1>
          
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          {/* FILTER SECTION */}
          <div className="p-5 border-b border-gray-200 space-y-4">

            {/* ROW 1 */}
            <div className="flex flex-col md:flex-row md:justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xl">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search organizations..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as any)
                  }
                  className="px-3 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <button
                onClick={() =>
                  router.push("/super-admin/organisation/create")
                }
                className="px-5 py-3 bg-[#5D2A8B] text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Organization
              </button>
            </div>

            {/* ROW 2 */}
            {/* Date Range Helper */}
<p className="text-xs text-gray-500">
  Select range from <span className="font-medium">Start Date</span> to{" "}
  <span className="font-medium">End Date</span> 
</p>

{/* Date Range Inputs */}
<div className="flex flex-col sm:flex-row gap-3 max-w-xl">
  {/* Start Date */}
  <div className="w-full">
    <label className="block text-xs text-gray-600 mb-1">
      Start Date
    </label>
    <input
      type="date"
      value={startDate}
      onChange={(e) => {
        setStartDate(e.target.value);
        setPage(1);
      }}
      className="w-full px-2 py-1.5 text-xs sm:text-sm border rounded-lg focus:ring-2 focus:ring-purple-500"
    />
  </div>

  {/* End Date */}
  <div className="w-full">
    <label className="block text-xs text-gray-600 mb-1">
      End Date
    </label>
    <input
      type="date"
      value={endDate}
      min={startDate || undefined}
      onChange={(e) => {
        setEndDate(e.target.value);
        setPage(1);
      }}
      className="w-full px-2 py-1.5 text-xs sm:text-sm border rounded-lg focus:ring-2 focus:ring-purple-500"
    />
  </div>
</div>


            {/* ROW 3 */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => handleExport("csv")}
                disabled={exportLoading}
                className="px-4 py-3 bg-green-600 text-white rounded-lg flex gap-2"
              >
                <Download className="w-5 h-5" />
                Export CSV
              </button>

              <button
                onClick={() => handleExport("excel")}
                disabled={exportLoading}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg flex gap-2"
              >
                <Download className="w-5 h-5" />
                Export Excel
              </button>
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-500 border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "S/N",
                    "Organization Name",
                    "Email",
                    "Phone",
                    "Account",
                    "Date Registered",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y ">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12">
                      Loading...
                    </td>
                  </tr>
                ) : organizations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12">
                      No organizations found
                    </td>
                  </tr>
                ) : (
                  organizations.map((org, i) => (
                    <tr key={org.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        {(page - 1) * limit + i + 1}
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {org.organizationName}
                      </td>
                      <td className="px-6 py-4">{org.email}</td>
                      <td className="px-6 py-4">
                        {org.phoneNumber || "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        {org.accountNumber}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {formatDate(org.registrationDate)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          {org.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => handleActionClick(org, e)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                            title="More actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="p-4 flex justify-between items-center">
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
              >
                <ChevronLeft />
              </button>
              <button
                onClick={() =>
                  setPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={page === totalPages}
              >
                <ChevronRight />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {showActionModal && selectedOrg && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-transparent" 
            onClick={() => setShowActionModal(false)}
          />
          
          <div 
            className="fixed bg-white shadow-lg rounded-lg z-50"
            style={{
              top: `${actionModalPosition.top}px`,
              left: `${actionModalPosition.left}px`,
              width: '155px',
              borderRadius: '20px',
              padding: '16px',
              boxShadow: '0px 2px 8px 0px #5D2A8B1A',
              border: '1px solid #E4D8F3'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-2">
              <button 
                className="text-left hover:bg-gray-50 p-2 rounded transition-colors"
                style={{
                  fontSize: '14px',
                  color: '#1A1A1A',
                  border: 'none',
                  background: 'none',
                  width: '100%'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewOrg();
                }}
              >
                View
              </button>
              
              <button 
                className="text-left hover:bg-gray-50 p-2 rounded transition-colors"
                style={{
                  fontSize: '14px',
                  color: '#1A1A1A',
                  border: 'none',
                  background: 'none',
                  width: '100%'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditOrg();
                }}
              >
                Edit
              </button>
              
              <button 
                className="text-left hover:bg-gray-50 p-2 rounded transition-colors"
                style={{
                  fontSize: '14px',
                  color: '#FF6161',
                  border: 'none',
                  background: 'none',
                  width: '100%'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteOrg();
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OrganisationManagementPage;
