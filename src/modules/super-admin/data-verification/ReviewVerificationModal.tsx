'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  FileText, 
  MapPin, 
  Calendar,
  Users,
  Building,
  Camera,
  DollarSign
} from 'lucide-react';
import DataVerificationService from '@/services/DataVerificationService';
import { toast } from '@/app/components/hooks/use-toast';

interface VerificationDetail {
  _id: string;
  verificationId: string;
  verifierUserId: string;
  verifierName: string;
  country: string;
  state: string;
  lga: string;
  city: string;
  cityRegion: string;
  organizationId: string;
  organizationName: string;
  targetUserId: string;
  targetUserFirstName: string;
  targetUserLastName: string;
  organizationDetails: {
    name: string;
    attachments: Array<{ fileUrl: string; comments: string }>;
    headquartersAddress: string;
    addressAttachments: Array<{ fileUrl: string; comments: string }>;
  };
  buildingPictures: {
    frontView: string;
    streetPicture: string;
    agentInFrontBuilding: string;
    whatsappLocation: string;
    insideOrganization: string;
    withStaffOrOwner: string;
    videoWithNeighbor: string;
  };
  transportationCost: {
    going: Array<{
      startPoint: string;
      time: string;
      nextDestination: string;
      fareSpent: number;
      timeSpent: string;
    }>;
    finalDestination: string;
    finalFareSpent: number;
    finalTime: string;
    totalJourneyTime: string;
    comingBack: {
      totalTransportationCost: number;
      otherExpensesCost: number;
      receiptUrl: string;
    };
  };
  status: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface ReviewVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  verificationId: string;
  onReviewComplete: () => void;
}

const ReviewVerificationModal = ({ 
  isOpen, 
  onClose, 
  verificationId,
  onReviewComplete 
}: ReviewVerificationModalProps) => {
  const dataVerificationService = new DataVerificationService();
  const [verification, setVerification] = useState<VerificationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected' | null>(null);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && verificationId) {
      fetchVerificationDetails();
    }
  }, [isOpen, verificationId]);

  const fetchVerificationDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken') || '';
      
      // Validate token before making request
      if (!token || token === 'undefined' || token === 'null') {
        toast({
          title: "Session Expired",
          description: "Please login again",
          variant: "destructive"
        });
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 1000);
        return;
      }
      
      const response: any = await dataVerificationService.getVerificationById(verificationId, token);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to load verification');
      }
      
      setVerification(response.data.verification);
    } catch (error: any) {
      console.error('Error fetching verification details:', error);
      
      if (error.message?.includes('Access token required') || error.message?.includes('Unauthorized')) {
        toast({
          title: "Session Expired",
          description: "Please login again",
          variant: "destructive"
        });
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 1000);
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to load verification details",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewStatus) {
      toast({
        title: "Validation Error",
        description: "Please select a review decision",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // Get token from localStorage
      const token = localStorage.getItem('userToken') || '';
      
      // Validate token exists
      if (!token || token === 'undefined' || token === 'null') {
        toast({
          title: "Authentication Error",
          description: "Your session has expired. Please login again.",
          variant: "destructive"
        });
        // Optionally redirect to login
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 2000);
        return;
      }
      
      const result = await dataVerificationService.reviewVerification(verificationId, {
        status: reviewStatus,
        comments
      }, token);

      if (result.success) {
        toast({
          title: "Success",
          description: result.message || `Verification ${reviewStatus} successfully`
        });
        onReviewComplete();
        onClose();
      } else {
        throw new Error(result.message || 'Failed to submit review');
      }
    } catch (error: any) {
      console.error('Error submitting review:', error);
      
      // Check if it's an authentication error
      if (error.message?.includes('Access token required') || error.message?.includes('Unauthorized')) {
        toast({
          title: "Session Expired",
          description: "Please login again to continue",
          variant: "destructive"
        });
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 2000);
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to submit review",
          variant: "destructive"
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white" style={{ marginLeft: '100px' }}>
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white" style={{ marginLeft: '100px' }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Review Verification {verification?.verificationId}
          </DialogTitle>
        </DialogHeader>

        {verification && (
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Verification Details</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Verifier:</span>
                        <span className="font-medium">{verification.verifierName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Organization:</span>
                        <span className="font-medium">{verification.organizationName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Location:</span>
                        <span>{verification.city}, {verification.state}, {verification.country}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Submitted:</span>
                        <span>{formatDate(verification.submittedAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Target User</h3>
                    <div className="space-y-2">
                      <div className="text-lg font-medium">
                        {verification.targetUserFirstName} {verification.targetUserLastName}
                      </div>
                      <div className="text-sm text-gray-600">
                        ID: {verification.targetUserId}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Building Pictures */}
          <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Building Documentation</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(verification.buildingPictures).map(([key, url]) => {
                    // Check if url is a valid string before processing
                    const urlString = typeof url === 'string' ? url : '';
                    const isVideo = urlString.endsWith('.mp4');
                    
                    return (
                      <div key={key} className="space-y-2">
                        <Label className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                        <div className="border rounded-lg overflow-hidden">
                          {isVideo && urlString ? (
                            <video 
                              src={urlString} 
                              controls 
                              className="w-full h-32 object-cover"
                            />
                          ) : urlString ? (
                            <img 
                              src={urlString} 
                              alt={key} 
                              className="w-full h-32 object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/assets/uploading.png'; // Fallback image
                                target.alt = 'Image not available';
                              }}
                            />
                          ) : (
                            <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                              <span className="text-gray-400 text-sm">No media</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card> 

          
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Transportation Costs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Going Journey</h4>
                    {verification.transportationCost.going.map((trip, index) => (
                      <div key={index} className="mb-3 p-3 border rounded-lg">
                        <div className="text-sm">
                          <div><strong>Start:</strong> {trip.startPoint} at {trip.time}</div>
                          <div><strong>To:</strong> {trip.nextDestination}</div>
                          <div><strong>Fare:</strong> ₦{trip.fareSpent}</div>
                          <div><strong>Time:</strong> {trip.timeSpent}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Return Journey</h4>
                    <div className="space-y-2">
                      <div><strong>Total Transportation:</strong> ₦{verification.transportationCost.comingBack.totalTransportationCost}</div>
                      <div><strong>Other Expenses:</strong> ₦{verification.transportationCost.comingBack.otherExpensesCost}</div>
                      {verification.transportationCost.comingBack.receiptUrl && (
                        <div>
                          <strong>Receipt:</strong>
                          <div className="mt-1">
                            <img 
                              src={verification.transportationCost.comingBack.receiptUrl} 
                              alt="Receipt" 
                              className="w-full h-32 object-cover border rounded"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Review Form */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Review Decision</h3>
                
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-medium mb-3 block">Decision *</Label>
                    <RadioGroup 
                      value={reviewStatus || ''} 
                      onValueChange={(value) => setReviewStatus(value as 'approved' | 'rejected')}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="approved" id="approve" />
                        <Label htmlFor="approve" className="flex items-center gap-2 cursor-pointer">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          Approve
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="rejected" id="reject" />
                        <Label htmlFor="reject" className="flex items-center gap-2 cursor-pointer">
                          <XCircle className="h-5 w-5 text-red-600" />
                          Reject
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label htmlFor="comments" className="text-base font-medium mb-2 block">
                      Comments
                    </Label>
                    <Textarea
                      id="comments"
                      placeholder="Add any additional comments for this review..."
                      value={comments}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComments(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSubmitReview}
                      disabled={submitting || !reviewStatus}
                      className={reviewStatus === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                    >
                      {submitting ? 'Submitting...' : `Submit ${reviewStatus ? reviewStatus.charAt(0).toUpperCase() + reviewStatus.slice(1) : ''}`}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReviewVerificationModal;