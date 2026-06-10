'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Image as ImageIcon,
  BookOpen,
  CheckCircle,
  XCircle,
  Package,
  Briefcase,
  Tag,
  MapPin,
  DollarSign,
  Calendar,
  Clock,
  Users,
  Layers,
  AlertCircle,
  Loader2,
  Globe,
  CreditCard,
  FileText,
  Settings,
  Hash,
} from 'lucide-react';
import { GalleryService } from '@/services/gallery-sub-service';

interface TimeWindow {
  startTime: string;
  endTime: string;
}

interface WeeklyScheduleDay {
  dayOfWeek?: number;
  day?: string;
  isAvailable: boolean;
  timeWindows?: TimeWindow[];
  slots?: TimeWindow[];
}

interface Availability {
  type?: 'unlimited' | 'dateRange' | 'rollingWeeks' | string;
  startDate?: string;
  endDate?: string;
  weeksAhead?: number;
  weeksForward?: number;
}

interface BookingConfig {
  slotDurationMinutes?: number;
  concurrentProviders?: number;
  timezone?: string;
  isActive?: boolean;
}

interface SubService {
  _id?: string;
  id?: string;
  name?: string;
  description?: string;
  price?: number;
  actualAmount?: number;
  subPlatformUniqueCode?: string;
}

interface Location {
  brandName?: string;
  streetAddress?: string;
  address?: string;
  landmark?: string;
  verified?: boolean;
  city?: string;
  state?: string;
}

interface GalleryItemDetail {
  _id?: string;
  id?: string;
  name?: string;
  description?: string;
  itemType: 'product' | 'service';
  categoryName?: string;
  category?: string;
  categoryId?: string;
  industryName?: string;
  platformUniqueCode?: string;
  priceInDollars?: number;
  platformChargePercentage?: number;
  actualAmount?: number;
  discountPercentage?: number;
  upfrontPaymentPercentage?: number;
  upfrontPaymentAmount?: number;
  hasBookingAvailability?: boolean;
  canBook?: boolean;
  visibilityToPublic?: boolean;
  producer?: string;
  totalAvailableServiceProviders?: number;
  subServiceCount?: number;
  bookingConfig?: BookingConfig;
  availability?: Availability;
  weeklySchedule?: WeeklyScheduleDay[];
  totalAvailableQuantity?: number;
  sku?: string;
  upc?: string;
  ingredients?: string;
  location?: Location;
  subServices?: SubService[];
  paymentMethods?: string[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  imageUrl?: string;
  image?: string;
  images?: string[] | { main?: string };
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);

const formatDate = (d?: string) => {
  if (!d) return 'N/A';
  try {
    return new Date(d).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return d;
  }
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const getDayName = (day: WeeklyScheduleDay) => {
  if (day.day) return day.day;
  if (day.dayOfWeek !== undefined) return DAY_NAMES[day.dayOfWeek] || `Day ${day.dayOfWeek}`;
  return 'Unknown';
};

const SectionCard = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gray-50">
      <span className="text-purple-600">{icon}</span>
      <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">{title}</h2>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const InfoRow = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 border-b border-gray-50 last:border-0 gap-1">
    <span className="text-sm text-gray-500 font-medium">{label}</span>
    <span className="text-sm text-gray-900 sm:text-right">{value ?? 'N/A'}</span>
  </div>
);

export default function AdminGalleryItemDetailsScreen() {
  const router = useRouter();
  const params = useParams();
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('userToken') ||
        sessionStorage.getItem('userToken') ||
        ''
      : '';

  const [item, setItem] = useState<GalleryItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const itemId = Array.isArray(params.id) ? params.id[0] : (params.id as string);

  useEffect(() => {
    if (!itemId) return;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await GalleryService.getAdminGalleryItemDetails(itemId);
        if (res.success && res.data) {
          // The data could be nested under galleryItem or similar
          const raw = res.data;
          const itemData: GalleryItemDetail =
            raw.galleryItem || raw.item || raw;
          setItem(itemData);
        } else {
          setError(res.message || 'Failed to load item details');
        }
      } catch (e: any) {
        setError(e.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [itemId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
          <p className="text-gray-500 text-sm">Loading item details...</p>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl border border-red-100 shadow-sm p-8 max-w-md w-full text-center">
          <div className="p-3 bg-red-50 rounded-full inline-flex mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Unable to Load Item</h2>
          <p className="text-gray-500 text-sm mb-6">{error || 'Item not found.'}</p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isService = item.itemType === 'service';
  const isProduct = item.itemType === 'product';
  const price = item.actualAmount ?? item.priceInDollars ?? 0;
  const canBook = item.canBook;
  const bookable = item.hasBookingAvailability;

  // Availability display
  const availType = item.availability?.type;
  let availBadge = 'Unlimited';
  let availDetail: React.ReactNode = null;
  if (availType === 'dateRange') {
    const start = formatDate(item.availability?.startDate);
    const end = formatDate(item.availability?.endDate);
    availBadge = 'Date Range';
    availDetail = (
      <span className="text-xs text-gray-500">
        {start} &rarr; {end}
      </span>
    );
  } else if (availType === 'rollingWeeks') {
    const weeks = item.availability?.weeksAhead ?? item.availability?.weeksForward;
    availBadge = 'Rolling Weeks';
    availDetail = (
      <span className="text-xs text-gray-500">{weeks} weeks ahead</span>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors flex-shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">
              {item.name || item.description || 'Item Details'}
            </h1>
          </div>
          <button
            onClick={() => router.push(`/admin/gallery/edit/${itemId}`)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors flex-shrink-0"
          >
            <Edit className="w-4 h-4" />
            <span className="hidden sm:inline">Edit</span>
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto space-y-5">
        {/* Availability / status badges */}
        <div className="flex flex-wrap gap-2">
          {/* Type badge */}
          <span
            className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full ${
              isProduct
                ? 'bg-blue-100 text-blue-800'
                : 'bg-indigo-100 text-indigo-800'
            }`}
          >
            {isProduct ? <Package className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
            {isProduct ? 'Product' : 'Service'}
          </span>

          {/* Availability badge */}
          {isService ? (
            <span
              className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full ${
                bookable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {bookable ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              {bookable ? 'Bookable' : 'Not Bookable'}
            </span>
          ) : (
            <span
              className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full ${
                (item.totalAvailableQuantity ?? 0) > 0
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {(item.totalAvailableQuantity ?? 0) > 0 ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              {(item.totalAvailableQuantity ?? 0) > 0 ? 'Purchasable' : 'Not Available'}
            </span>
          )}
        </div>

        {/* 1. Basic Information */}
        <SectionCard title="Basic Information" icon={<FileText className="w-4 h-4" />}>
          <InfoRow label="Name" value={item.name || 'N/A'} />
          <InfoRow
            label="Description"
            value={
              item.description ? (
                <span className="text-right block max-w-md">{item.description}</span>
              ) : undefined
            }
          />
          <InfoRow
            label="Item Type"
            value={
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  isProduct
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-indigo-100 text-indigo-800'
                }`}
              >
                {isProduct ? 'Product' : 'Service'}
              </span>
            }
          />
          <InfoRow label="Category" value={item.categoryName || item.category} />
          <InfoRow label="Industry" value={item.industryName} />
          {item.platformUniqueCode && (
            <InfoRow
              label="Platform Code"
              value={
                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                  {item.platformUniqueCode}
                </span>
              }
            />
          )}
        </SectionCard>

        {/* 2. Pricing */}
        <SectionCard title="Pricing" icon={<DollarSign className="w-4 h-4" />}>
          <InfoRow
            label="Base Price"
            value={
              <span className="font-semibold text-gray-900">
                {formatCurrency(item.priceInDollars ?? 0)}
              </span>
            }
          />
          <InfoRow
            label="Platform Charge"
            value={`${item.platformChargePercentage ?? 0}%`}
          />
          <InfoRow
            label="Final Amount"
            value={
              <span className="font-bold text-purple-700">
                {formatCurrency(price)}
              </span>
            }
          />
          <InfoRow
            label="Discount"
            value={`${item.discountPercentage ?? 0}%`}
          />
          {item.upfrontPaymentPercentage !== undefined && (
            <InfoRow
              label="Upfront Payment"
              value={`${item.upfrontPaymentPercentage}% (${formatCurrency(item.upfrontPaymentAmount ?? 0)})`}
            />
          )}
        </SectionCard>

        {/* 3. Service Details (services only) */}
        {isService && (
          <SectionCard title="Service Details" icon={<Briefcase className="w-4 h-4" />}>
            {item.producer && <InfoRow label="Producer" value={item.producer} />}
            <InfoRow
              label="Available Providers"
              value={item.totalAvailableServiceProviders ?? 0}
            />
            <InfoRow
              label="Sub-Services"
              value={item.subServiceCount ?? (item.subServices?.length ?? 0)}
            />
          </SectionCard>
        )}

        {/* 4. Booking Configuration (services only) */}
        {isService && item.bookingConfig && (
          <SectionCard title="Booking Configuration" icon={<Settings className="w-4 h-4" />}>
            <InfoRow
              label="Slot Duration"
              value={
                item.bookingConfig.slotDurationMinutes !== undefined
                  ? `${item.bookingConfig.slotDurationMinutes} min`
                  : undefined
              }
            />
            <InfoRow
              label="Concurrent Providers"
              value={item.bookingConfig.concurrentProviders}
            />
            <InfoRow label="Timezone" value={item.bookingConfig.timezone} />
            <InfoRow
              label="Active"
              value={
                item.bookingConfig.isActive !== undefined ? (
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                      item.bookingConfig.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {item.bookingConfig.isActive ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                    {item.bookingConfig.isActive ? 'Active' : 'Inactive'}
                  </span>
                ) : undefined
              }
            />
          </SectionCard>
        )}

        {/* 5. Availability Period */}
        {item.availability && (
          <SectionCard title="Availability Period" icon={<Calendar className="w-4 h-4" />}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800">
                {availBadge}
              </span>
              {availDetail}
            </div>
          </SectionCard>
        )}

        {/* 6. Weekly Schedule (services) */}
        {isService && item.weeklySchedule && item.weeklySchedule.length > 0 && (
          <SectionCard title="Weekly Schedule" icon={<Clock className="w-4 h-4" />}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase">
                      Day
                    </th>
                    <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase">
                      Available
                    </th>
                    <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">
                      Time Windows
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {item.weeklySchedule.map((day, idx) => {
                    const windows = day.timeWindows || day.slots || [];
                    return (
                      <tr key={idx} className="border-b border-gray-50 last:border-0">
                        <td className="py-2 pr-4 font-medium text-gray-800">
                          {getDayName(day)}
                        </td>
                        <td className="py-2 pr-4">
                          {day.isAvailable ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-700">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                              <XCircle className="w-3.5 h-3.5" />
                              No
                            </span>
                          )}
                        </td>
                        <td className="py-2">
                          {windows.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {windows.map((w, wi) => (
                                <span
                                  key={wi}
                                  className="text-xs bg-purple-50 text-purple-800 px-2 py-0.5 rounded-full"
                                >
                                  {w.startTime} - {w.endTime}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        {/* 7. Product Details (products only) */}
        {isProduct && (
          <SectionCard title="Product Details" icon={<Package className="w-4 h-4" />}>
            <InfoRow
              label="Stock Quantity"
              value={item.totalAvailableQuantity ?? 0}
            />
            {item.sku && <InfoRow label="SKU" value={item.sku} />}
            {item.upc && <InfoRow label="UPC" value={item.upc} />}
            {item.ingredients && (
              <InfoRow
                label="Ingredients"
                value={
                  <span className="text-right block max-w-md">{item.ingredients}</span>
                }
              />
            )}
          </SectionCard>
        )}

        {/* 8. Location */}
        {item.location && (
          <SectionCard title="Location" icon={<MapPin className="w-4 h-4" />}>
            {item.location.brandName && (
              <InfoRow label="Brand" value={item.location.brandName} />
            )}
            <InfoRow
              label="Address"
              value={item.location.streetAddress || item.location.address}
            />
            {item.location.landmark && (
              <InfoRow label="Landmark" value={item.location.landmark} />
            )}
            {item.location.city && (
              <InfoRow
                label="City / State"
                value={`${item.location.city}${item.location.state ? ', ' + item.location.state : ''}`}
              />
            )}
            <InfoRow
              label="Verified"
              value={
                item.location.verified !== undefined ? (
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                      item.location.verified
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {item.location.verified ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                    {item.location.verified ? 'Verified' : 'Unverified'}
                  </span>
                ) : undefined
              }
            />
          </SectionCard>
        )}

        {/* 9. Sub-Services */}
        {item.subServices && item.subServices.length > 0 && (
          <SectionCard title="Sub-Services" icon={<Layers className="w-4 h-4" />}>
            <div className="space-y-3">
              {item.subServices.map((sub, idx) => (
                <div
                  key={sub._id || sub.id || idx}
                  className="border border-gray-100 rounded-lg p-4 hover:border-purple-200 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {sub.name || `Sub-service ${idx + 1}`}
                    </h4>
                    {(sub.price !== undefined || sub.actualAmount !== undefined) && (
                      <span className="font-bold text-purple-700 text-sm flex-shrink-0">
                        {formatCurrency(sub.price ?? sub.actualAmount ?? 0)}
                      </span>
                    )}
                  </div>
                  {sub.description && (
                    <p className="text-xs text-gray-500 mb-1">{sub.description}</p>
                  )}
                  {sub.subPlatformUniqueCode && (
                    <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                      {sub.subPlatformUniqueCode}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* 10. Additional Info */}
        <SectionCard title="Additional Info" icon={<Hash className="w-4 h-4" />}>
          <InfoRow
            label="Visibility"
            value={
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  item.visibilityToPublic
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Globe className="w-3 h-3" />
                {item.visibilityToPublic ? 'Public' : 'Private'}
              </span>
            }
          />
          {item.paymentMethods && item.paymentMethods.length > 0 && (
            <InfoRow
              label="Payment Methods"
              value={
                <div className="flex flex-wrap gap-1 justify-end">
                  {item.paymentMethods.map((m, i) => (
                    <span
                      key={i}
                      className="text-xs bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              }
            />
          )}
          {item.notes && (
            <InfoRow
              label="Notes"
              value={
                <span className="text-right block max-w-md">{item.notes}</span>
              }
            />
          )}
          <InfoRow label="Created" value={formatDate(item.createdAt)} />
          <InfoRow label="Updated" value={formatDate(item.updatedAt)} />
        </SectionCard>
      </div>

      {/* Footer action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-end gap-3">
          {isService && canBook && (
            <button
              onClick={() => router.push(`/admin/booking?serviceId=${itemId}`)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Book This Service
            </button>
          )}
          <button
            onClick={() => router.push(`/admin/gallery/edit/${itemId}`)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-900 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit Item
          </button>
        </div>
      </div>
    </div>
  );
}
