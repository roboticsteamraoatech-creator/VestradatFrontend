'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { 
  Users, 
  FileCheck2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Calendar,
  MapPin,
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Download
} from 'lucide-react';
import DataVerificationService from '@/services/DataVerificationService';
import { toast } from '@/app/components/hooks/use-toast';
import ReviewVerificationModal from './ReviewVerificationModal';

interface Verification {
  _id: string;
  verificationId: string;
  verifierUserId: string;
  verifierName: string;
  country: string;
  state: string;
  organizationName: string;
  targetUserFirstName: string;
  targetUserLastName: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedAt: string;
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  permissions: string[];
  createdAt: string;
}

interface Stats {
  total: number;
  draft: number;
  submitted: number;
  approved: number;
  rejected: number;
  thisMonth: number;
}

const DataVerificationPage = () => {
  const pathname = usePathname();
  const router = useRouter();
  const dataVerificationService = new DataVerificationService();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [filteredVerifications, setFilteredVerifications] = useState<Verification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // State for pagination and filters
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedVerificationId, setSelectedVerificationId] = useState<string | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const handleViewDetails = (verificationId: string) => {
    setSelectedVerificationId(verificationId);
    setIsReviewModalOpen(true);
  };

  const handleReviewComplete = () => {
    fetchData(); // Refresh the data after review
  };

  useEffect(() => {
    fetchData();
  }, [selectedStatus, page, searchTerm, sortBy, sortOrder, statusFilter, pathname]);

  useEffect(() => {
    filterVerifications();
  }, [searchTerm, verifications]);

  const filterVerifications = () => {
    let result = [...verifications];
    
    if (searchTerm) {
      result = result.filter(verification => 
        verification.verificationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        verification.verifierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        verification.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        verification.targetUserFirstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        verification.targetUserLastName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredVerifications(result);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const token = localStorage.getItem('userToken') || '';
      const [verificationsRes, usersRes, statsRes]: [any, any, any] = await Promise.all([
        dataVerificationService.getAllVerificationsSuperAdmin(selectedStatus === 'all' ? undefined : selectedStatus, token),
        dataVerificationService.getDataVerificationUsers(token),
        dataVerificationService.getVerificationStats(token)
      ]);

      setVerifications(verificationsRes.data.verifications);
      setFilteredVerifications(verificationsRes.data.verifications);
      setUsers(usersRes.data.users);
      setStats(statsRes.data.stats);
      setTotalUsers(usersRes.data.total || usersRes.data.users.length);
      setTotalPages(Math.ceil((usersRes.data.total || usersRes.data.users.length) / limit));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'submitted':
        return <Badge className="bg-yellow-100 text-yellow-800">Submitted</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="manrope ml-0 md:ml-[350px] pt-4 md:pt-4 p-4 md:p-8 min-h-screen bg-white">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
        .manrope { font-family: 'Manrope', sans-serif; }
        
        .table-container {
          max-height: calc(100vh - 300px);
          overflow-y: auto;
        }
        
        @media (min-width: 768px) {
          .table-container {
            max-height: calc(100vh - 280px);
          }
        }
      `}</style>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Data Verification Management</h1>
        <p className="text-gray-600 mt-2">Manage data verification processes and field agents</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <FileCheck2 className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Draft</p>
                  <p className="text-2xl font-bold">{stats.draft}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Submitted</p>
                  <p className="text-2xl font-bold">{stats.submitted}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">This Month</p>
                  <p className="text-2xl font-bold">{stats.thisMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

     
          <Card className="border-0 shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <CardTitle className="flex items-center gap-2">
                  <FileCheck2 className="h-5 w-5" />
                  All Verifications
                </CardTitle>
                
                {/* Verification Users Button */}
                <Button
                  variant="outline"
                  onClick={() => router.push('/super-admin/data-verification/verification-users')}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Verification Users
                </Button>
              </div>
              
              {/* Status Filter Buttons - Outside Table */}
              <div className="flex gap-2 mb-4">
                <Button
                  variant={selectedStatus === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedStatus('all')}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  variant={selectedStatus === 'submitted' ? 'default' : 'outline'}
                  onClick={() => setSelectedStatus('submitted')}
                  size="sm"
                >
                  Submitted
                </Button>
                <Button
                  variant={selectedStatus === 'approved' ? 'default' : 'outline'}
                  onClick={() => setSelectedStatus('approved')}
                  size="sm"
                >
                  Approved
                </Button>
                <Button
                  variant={selectedStatus === 'rejected' ? 'default' : 'outline'}
                  onClick={() => setSelectedStatus('rejected')}
                  size="sm"
                >
                  Rejected
                </Button>
              </div>
              
              {/* Search Bar */}
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search verifications..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {/* Table */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="table-container" style={{ maxHeight: 'calc(100vh - 380px)', overflowY: 'auto' }}>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Verification ID
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Verifier
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Organization
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Target User
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loading ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center justify-center text-gray-500">
                              <p className="text-lg font-medium">Loading verifications...</p>
                            </div>
                          </td>
                        </tr>
                      ) : filteredVerifications.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center justify-center text-gray-500">
                              <p className="text-lg font-medium">No verifications found</p>
                              <p className="text-sm mt-1">Try adjusting your search or filter</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredVerifications.map((verification) => (
                          <tr key={verification._id} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-6 py-4">
                              <div className="text-sm font-semibold text-gray-900">{verification.verificationId}</div>
                            </td>
                            <td className="px-6 py-4">
                              {getStatusBadge(verification.status)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">{verification.verifierName}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 max-w-xs truncate">{verification.organizationName}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">
                                {verification.targetUserFirstName} {verification.targetUserLastName}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-500">
                                {verification.state}, {verification.country}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-500">{formatDate(verification.submittedAt)}</div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                  onClick={() => handleViewDetails(verification._id)}
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
      
      
      
      {/* Review Verification Modal */}
      <ReviewVerificationModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setSelectedVerificationId(null);
        }}
        verificationId={selectedVerificationId || ''}
        onReviewComplete={handleReviewComplete}
      />
    </div>
  );
};

export default DataVerificationPage;