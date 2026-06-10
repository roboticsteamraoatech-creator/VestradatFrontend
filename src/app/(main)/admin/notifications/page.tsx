"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, XCircle, Star, AlertCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { MeasurementTopNav } from '@/app/components/MeasurementTopNav';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { NotificationService, AdminNotification } from '@/services/NotificationService';
import { NotificationDetail } from '@/app/components/NotificationDetail';
import { toast } from '@/app/components/hooks/use-toast';

const NotificationsPage = () => {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    loading,
    currentPage,
    totalPages,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationContext();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [selectedNotification, setSelectedNotification] = useState<AdminNotification | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  // Fetch notifications when filter changes
  useEffect(() => {
    fetchNotifications(1, filter === 'unread');
  }, [filter, fetchNotifications]);

  const handleNotificationClick = async (notification: AdminNotification) => {
    setSelectedNotification(notification);
    setShowDetailModal(true);

    // Mark as read if unread
    if (!notification.isRead) {
      const success = await markAsRead(notification._id);
      if (success) {
        // Update the selected notification
        setSelectedNotification(prev => prev ? { ...prev, isRead: true } : null);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAllRead(true);
      const success = await markAllAsRead();
      if (success) {
        toast({
          title: "Success",
          description: "All notifications marked as read",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handlePageChange = (page: number) => {
    fetchNotifications(page, filter === 'unread');
  };

  const getNotificationIcon = (type: AdminNotification['type']) => {
    const color = NotificationService.getNotificationColor(type);
    switch (type) {
      case 'task_accepted':
        return <CheckCircle className="w-6 h-6" style={{ color }} />;
      case 'task_rejected':
        return <XCircle className="w-6 h-6" style={{ color }} />;
      case 'task_completed':
        return <Star className="w-6 h-6" style={{ color }} />;
      case 'all_providers_rejected':
        return <AlertCircle className="w-6 h-6" style={{ color }} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');
        .manrope { font-family: 'Manrope', sans-serif; }
      `}</style>

      {/* Measurement Top Nav */}
      <MeasurementTopNav title="Notification Center" />

      {/* Main Content */}
      <div className="px-4 md:px-6 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              Back
            </button>
            <h1 className="manrope text-2xl font-semibold text-gray-800">Notifications</h1>
            {unreadCount > 0 && (
              <span
                style={{
                  background: '#EF4444',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 600,
                  padding: '4px 12px',
                  borderRadius: '16px',
                }}
              >
                {unreadCount} unread
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markingAllRead}
              className="manrope px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontSize: '14px', fontWeight: 500 }}
            >
              {markingAllRead ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Marking...
                </span>
              ) : (
                'Mark all as read'
              )}
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`manrope px-6 py-2 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={{ fontSize: '14px', fontWeight: 500 }}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`manrope px-6 py-2 rounded-lg transition-colors ${
              filter === 'unread'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={{ fontSize: '14px', fontWeight: 500 }}
          >
            Unread
          </button>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin" style={{ color: '#5D2A8B' }} />
            <p className="manrope text-gray-600 mt-4">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-lg">
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔔</div>
            <p className="manrope text-gray-600 text-lg font-medium">No notifications yet</p>
            <p className="manrope text-gray-500 text-sm mt-2">
              {filter === 'unread' ? 'All caught up! No unread notifications.' : 'You\'ll see notifications here when they arrive.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                className={`manrope bg-white border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                  notification.isRead ? 'border-gray-200' : 'border-purple-500 border-2'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{
                      background: `${NotificationService.getNotificationColor(notification.type)}15`,
                    }}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3
                          className={`text-base mb-1 ${
                            notification.isRead ? 'font-normal text-gray-700' : 'font-semibold text-gray-900'
                          }`}
                        >
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{notification.message}</p>
                      </div>

                      {/* Unread indicator */}
                      {!notification.isRead && (
                        <div
                          className="w-3 h-3 rounded-full bg-purple-600 flex-shrink-0 mt-2"
                        />
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-gray-500">
                        {NotificationService.formatNotificationTime(notification.createdAt)}
                      </span>
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                          background: `${NotificationService.getNotificationColor(notification.type)}15`,
                          color: NotificationService.getNotificationColor(notification.type),
                          fontWeight: 500,
                        }}
                      >
                        {notification.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <p className="manrope text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="manrope px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ fontSize: '14px' }}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="manrope px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ fontSize: '14px' }}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedNotification && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            style={{ zIndex: 9998 }}
            onClick={() => setShowDetailModal(false)}
          />

          {/* Modal */}
          <div
            className="fixed"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '80vh',
              background: '#FFFFFF',
              borderRadius: '20px',
              zIndex: 9999,
              boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.15)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 24px',
                borderBottom: '1px solid rgba(110, 110, 110, 0.2)',
              }}
            >
              <h2 className="manrope text-lg font-semibold text-gray-800" style={{ margin: 0 }}>
                Notification Details
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-600 hover:text-gray-800"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px',
              }}
            >
              <NotificationDetail notification={selectedNotification} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationsPage;
