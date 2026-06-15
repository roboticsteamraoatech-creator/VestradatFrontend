'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Image as ImageIcon,
  Video,
  Upload,
  X,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { GalleryService } from '@/services/gallery-sub-service';
import { HttpService } from '@/services/HttpService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiCategory { id?: string; _id?: string; name: string }
interface ApiLocation {
  locationIndex: number;
  brandName: string;
  cityRegion: string;
  status: string;
}
interface MediaUsage {
  images: { current: number; max: number; remaining: number };
  videos: { current: number; max: number; remaining: number };
  verified: boolean;
}
interface SubServiceEdit {
  name: string;
  description: string;
  price: string;
  uploadPicture: string;
  newFile: File | null;
  uploading: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getToken = () =>
  typeof window !== 'undefined'
    ? localStorage.getItem('userToken') || sessionStorage.getItem('userToken') || ''
    : '';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

const UsageBar = ({ label, current, max }: { label: string; current: number; max: number }) => {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const colour = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-400' : 'bg-green-500';
  return (
    <div className="flex items-center gap-3 text-xs text-gray-600">
      <span className="w-12 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colour}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="shrink-0">{current}/{max}</span>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EditGalleryItemPage() {
  const router = useRouter();
  const params = useParams();
  const itemId = params.id as string;
  const invalidId = !itemId || itemId === 'undefined' || itemId === 'null';

  // ALL HOOKS DECLARED BEFORE ANY CONDITIONAL RETURN
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [locations, setLocations] = useState<ApiLocation[]>([]);
  const [mediaUsage, setMediaUsage] = useState<MediaUsage | null>(null);

  const [commissionRate, setCommissionRate] = useState(0);
  const [loadingCommission, setLoadingCommission] = useState(false);

  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [hasSubServices, setHasSubServices] = useState(false);
  const [subServices, setSubServices] = useState<SubServiceEdit[]>([]);

  const [form, setForm] = useState({
    name: '',
    description: '',
    itemType: '' as 'product' | 'service' | '',
    categoryId: '',
    categoryName: '',
    sku: '',
    upc: '',
    platformUniqueCode: '',
    totalAvailableQuantity: '0',
    priceInDollars: '0.00',
    discountPercentage: '0',
    platformChargePercentage: '5',
    upfrontPaymentPercentage: '0',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '23:59',
    visibilityToPublic: true,
    notes: '',
    locationIndex: '',
  });

  const set = (key: keyof typeof form, val: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const prevCategoryId = useRef('');

  // Commission fetch when category changes
  useEffect(() => {
    if (!form.categoryId || form.categoryId === prevCategoryId.current) return;
    prevCategoryId.current = form.categoryId;
    const token = getToken();
    setLoadingCommission(true);
    GalleryService.getCommissionByCategory(token, form.categoryId)
      .then(res => {
        if (res.success && res.data) setCommissionRate((res.data as any).commissionRate ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoadingCommission(false));
  }, [form.categoryId]);

  // Mount: 4 parallel API calls
  useEffect(() => {
    if (invalidId) {
      setLoadError('Invalid item ID');
      setLoading(false);
      return;
    }

    const token = getToken();

    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [itemRes, catRes, locRes, mediaRes] = await Promise.all([
          GalleryService.getGalleryItem(token, itemId),
          GalleryService.getCategories(token),
          GalleryService.getLocations(token),
          GalleryService.getMediaUsage(token),
        ]);

        if (!itemRes.success || !itemRes.data) {
          setLoadError(itemRes.message || 'Failed to load item');
          return;
        }

        const item = itemRes.data as any;
        const cats: ApiCategory[] = (catRes.success && catRes.data) ? catRes.data as ApiCategory[] : [];
        setCategories(cats);
        if (locRes.success && locRes.data) setLocations(locRes.data as ApiLocation[]);
        if (mediaRes.success && mediaRes.data) setMediaUsage(mediaRes.data as unknown as MediaUsage);

        const catId = item.categoryId || item.category || '';
        const catName = cats.find(c => (c._id || c.id) === catId)?.name || '';

        setCurrentImage(item.imageUrl || null);
        setCurrentVideo(item.videoUrl || null);

        if (item.hasSubServices && Array.isArray(item.subServices) && item.subServices.length > 0) {
          setHasSubServices(true);
          setSubServices(item.subServices.map((s: any) => ({
            name: s.name || '',
            description: s.description || '',
            price: (s.price ?? 0).toString(),
            uploadPicture: s.uploadPicture || '',
            newFile: null,
            uploading: false,
          })));
        }

        setForm({
          name: item.name || '',
          description: item.description || '',
          itemType: item.itemType || '',
          categoryId: catId,
          categoryName: catName,
          sku: item.sku || '',
          upc: item.upc || '',
          platformUniqueCode: item.platformUniqueCode || '',
          totalAvailableQuantity: (item.totalAvailableQuantity ?? 0).toString(),
          priceInDollars: (item.priceInDollars ?? 0).toString(),
          discountPercentage: (item.discountPercentage ?? 0).toString(),
          platformChargePercentage: (item.platformChargePercentage ?? 5).toString(),
          upfrontPaymentPercentage: (item.upfrontPaymentPercentage ?? 0).toString(),
          startDate: item.startDate ? item.startDate.split('T')[0] : '',
          startTime: item.startTime || '09:00',
          endDate: item.endDate ? item.endDate.split('T')[0] : '',
          endTime: item.endTime || '23:59',
          visibilityToPublic: item.visibilityToPublic !== false,
          notes: item.notes || '',
          locationIndex: item.locationIndex != null ? item.locationIndex.toString() : '',
        });
      } catch (e: any) {
        setLoadError(e.message || 'Failed to load item. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [itemId, invalidId]);

  // ── live price ──
  const price = parseFloat(form.priceInDollars) || 0;
  const discount = parseFloat(form.discountPercentage) || 0;
  const charge = commissionRate || parseFloat(form.platformChargePercentage) || 0;
  const upfrontPct = parseFloat(form.upfrontPaymentPercentage) || 0;
  const actualAmount = price - (price * discount) / 100 + (price * charge) / 100;
  const upfrontAmount = (actualAmount * upfrontPct) / 100;

  // ── media handlers ──
  const handlePickImage = () => {
    const hasExisting = !!currentImage;
    if (!hasExisting && mediaUsage && mediaUsage.images.remaining <= 0) {
      alert('You have reached your image upload limit.');
      return;
    }
    imageInputRef.current?.click();
  };

  const handlePickVideo = () => {
    if (!mediaUsage?.verified) {
      alert('Your organisation must be verified before uploading videos.');
      return;
    }
    const hasExisting = !!currentVideo;
    if (!hasExisting && mediaUsage.videos.remaining <= 0) {
      alert('You have reached your video upload limit.');
      return;
    }
    videoInputRef.current?.click();
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (newImagePreview) URL.revokeObjectURL(newImagePreview);
    setNewImageFile(file);
    setNewImagePreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewVideoFile(file);
    e.target.value = '';
  };

  const handleSubServiceImageChange = async (index: number, file: File) => {
    setSubServices(prev => prev.map((s, i) => i === index ? { ...s, newFile: file, uploading: true } : s));
    const token = getToken();
    const res = await GalleryService.uploadSubServiceImage(token, itemId, index, file);
    if (res.success && res.data?.uploadPicture) {
      setSubServices(prev => prev.map((s, i) =>
        i === index ? { ...s, uploadPicture: res.data!.uploadPicture, newFile: null, uploading: false } : s
      ));
    } else {
      setSubServices(prev => prev.map((s, i) => i === index ? { ...s, newFile: null, uploading: false } : s));
      setSubmitError(`Sub-service ${index + 1} image upload failed: ${res.message || 'Unknown error'}`);
    }
  };

  // ── submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.description.trim() || !form.categoryId) {
      setSubmitError('Please fill in all required fields (Name, Description, Category)');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    const token = getToken();

    try {
      const putBody: Record<string, any> = {
        name: form.name,
        description: form.description,
        itemType: form.itemType,
        categoryId: form.categoryId,
        sku: form.sku,
        upc: form.upc,
        totalAvailableQuantity: parseInt(form.totalAvailableQuantity) || 0,
        priceInDollars: parseFloat(form.priceInDollars) || 0,
        discountPercentage: parseFloat(form.discountPercentage) || 0,
        upfrontPaymentPercentage: parseFloat(form.upfrontPaymentPercentage) || 0,
        startDate: form.startDate,
        startTime: form.startTime,
        endDate: form.endDate,
        endTime: form.endTime,
        visibilityToPublic: form.visibilityToPublic,
        notes: form.notes,
        locationIndex: parseInt(form.locationIndex) || 0,
      };

      if (hasSubServices && subServices.length > 0) {
        putBody.hasSubServices = true;
        putBody.subServiceCount = subServices.length;
        putBody.subServices = subServices.map(s => ({
          name: s.name,
          description: s.description,
          price: parseFloat(s.price) || 0,
          ...(s.uploadPicture ? { uploadPicture: s.uploadPicture } : {}),
        }));
      }

      const putRes = await HttpService.put<{ success: boolean; message?: string }>(
        `/api/admin/gallery/${itemId}`,
        putBody
      );

      if (!putRes.success) {
        setSubmitError((putRes as any).message || 'Failed to update item');
        return;
      }

      const mediaWarnings: string[] = [];

      if (newImageFile) {
        try {
          const imgRes = await GalleryService.uploadImage(token, itemId, newImageFile);
          if (!imgRes.success) mediaWarnings.push(`Image: ${imgRes.message || 'upload failed'}`);
        } catch (e: any) {
          mediaWarnings.push(`Image: ${e.message || 'upload failed'}`);
        }
      }

      if (newVideoFile) {
        try {
          const vidRes = await GalleryService.uploadVideo(token, itemId, newVideoFile);
          if (!vidRes.success) mediaWarnings.push(`Video: ${vidRes.message || 'upload failed'}`);
        } catch (e: any) {
          mediaWarnings.push(`Video: ${e.message || 'upload failed'}`);
        }
      }

      if (mediaWarnings.length > 0) {
        setSubmitError(`Item saved, but media upload failed — ${mediaWarnings.join('; ')}`);
        setSubmitting(false);
        return;
      }

      setSubmitSuccess(true);
      router.push('/admin/gallery');
      router.refresh();
    } catch (e: any) {
      setSubmitError(e.message || 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render states ────────────────────────────────────────────────────────

  if (invalidId || (loadError && !form.name)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl border border-red-200 p-8 text-center max-w-sm">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-red-700 font-semibold mb-1">{invalidId ? 'Invalid item ID' : 'Failed to load item'}</p>
          {loadError && !invalidId && <p className="text-sm text-red-500 mb-4">{loadError}</p>}
          <button onClick={() => router.back()} className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-purple-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading item…</p>
        </div>
      </div>
    );
  }

  // ─── Main Form ────────────────────────────────────────────────────────────

  const inputCls = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent';
  const readonlyCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="min-h-screen bg-gray-50">
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFileChange} />
      <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoFileChange} />

      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Edit Gallery Item</h1>
            <p className="text-sm text-gray-500">{form.name || 'Unnamed item'}</p>
          </div>
        </div>

        {submitSuccess && (
          <div className="mb-6 flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
            <p className="text-sm text-green-700 font-medium">Item updated successfully! Redirecting…</p>
          </div>
        )}

        {submitError && (
          <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{submitError}</p>
            <button onClick={() => setSubmitError(null)} className="ml-auto">
              <X className="w-4 h-4 text-red-400" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* 1. Location Picker */}
          {locations.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Location</h2>
              <div className="space-y-2">
                {locations.map(loc => {
                  const isPending = loc.status === 'Pending Payment';
                  const isSelected = form.locationIndex === loc.locationIndex.toString();
                  return (
                    <label
                      key={loc.locationIndex}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isPending
                          ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200'
                          : isSelected
                          ? 'bg-purple-50 border-purple-300'
                          : 'bg-white border-gray-200 hover:border-purple-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="locationIndex"
                        value={loc.locationIndex.toString()}
                        checked={isSelected}
                        disabled={isPending}
                        onChange={() => !isPending && set('locationIndex', loc.locationIndex.toString())}
                        className="mt-0.5 accent-purple-600"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{loc.brandName}</p>
                        <p className="text-xs text-gray-500 truncate">{loc.cityRegion}</p>
                      </div>
                      {isPending && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full shrink-0">
                          Pending Payment
                        </span>
                      )}
                      {isSelected && !isPending && (
                        <CheckCircle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Item Type */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Item Type</h2>
            <div className="flex gap-4">
              {(['product', 'service'] as const).map(t => (
                <label
                  key={t}
                  className={`flex-1 flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    form.itemType === t ? 'bg-purple-50 border-purple-300' : 'bg-white border-gray-200 hover:border-purple-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="itemType"
                    value={t}
                    checked={form.itemType === t}
                    onChange={() => set('itemType', t)}
                    className="accent-purple-600"
                  />
                  <span className="text-sm font-medium capitalize text-gray-800">{t}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 3. Basic Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Basic Information</h2>

            <div>
              <label className={labelCls}>Name <span className="text-red-500">*</span></label>
              <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Item name" />
            </div>

            <div>
              <label className={labelCls}>Description <span className="text-red-500">*</span></label>
              <textarea rows={3} className={inputCls} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Item description" />
            </div>

            <div>
              <label className={labelCls}>Category <span className="text-red-500">*</span></label>
              <button
                type="button"
                onClick={() => setShowCategoryModal(true)}
                className={`${inputCls} flex items-center justify-between text-left`}
              >
                <span className={form.categoryName ? 'text-gray-900' : 'text-gray-400'}>
                  {form.categoryName || 'Select category…'}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
              </button>
            </div>

            {form.categoryId && (
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 flex items-center gap-2">
                {loadingCommission
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin text-green-600" />
                  : <CheckCircle className="w-3.5 h-3.5 text-green-600" />}
                <p className="text-xs text-green-700">Platform Commission: <strong>{commissionRate}%</strong></p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Price ₦</label>
                <input type="number" min="0" step="0.01" className={inputCls} value={form.priceInDollars} onChange={e => set('priceInDollars', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Discount %</label>
                <input type="number" min="0" max="100" step="0.1" className={inputCls} value={form.discountPercentage} onChange={e => set('discountPercentage', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Upfront Payment %</label>
                <input type="number" min="0" max="100" step="1" className={inputCls} value={form.upfrontPaymentPercentage} onChange={e => set('upfrontPaymentPercentage', e.target.value)} />
                {upfrontPct > 0 && (
                  <div className="mt-1.5 bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5">
                    <p className="text-xs text-orange-700">Upfront amount: <strong>{formatCurrency(upfrontAmount)}</strong></p>
                  </div>
                )}
              </div>
              <div>
                <label className={labelCls}>Platform Charge %</label>
                <input type="text" readOnly className={readonlyCls} value={`${commissionRate || parseFloat(form.platformChargePercentage) || 0}%`} />
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-purple-700">Actual Amount</span>
              <span className="text-base font-bold text-purple-800">{formatCurrency(actualAmount)}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Start Date</label>
                <input type="date" className={inputCls} value={form.startDate} onChange={e => set('startDate', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Start Time</label>
                <input type="time" className={inputCls} value={form.startTime} onChange={e => set('startTime', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>End Date</label>
                <input type="date" className={inputCls} value={form.endDate} onChange={e => set('endDate', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>End Time</label>
                <input type="time" className={inputCls} value={form.endTime} onChange={e => set('endTime', e.target.value)} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Visibility to Public</label>
              <div className="flex gap-4">
                {([true, false] as const).map(val => (
                  <label
                    key={String(val)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer text-sm transition-colors ${
                      form.visibilityToPublic === val
                        ? 'bg-purple-50 border-purple-300 text-purple-700 font-medium'
                        : 'border-gray-200 text-gray-600 hover:border-purple-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="visibilityToPublic"
                      checked={form.visibilityToPublic === val}
                      onChange={() => set('visibilityToPublic', val)}
                      className="accent-purple-600"
                    />
                    {val ? 'Yes' : 'No'}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={labelCls}>Notes</label>
              <textarea rows={3} className={inputCls} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any notes…" />
            </div>

            {/* Product-only fields */}
            {form.itemType === 'product' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
                <div>
                  <label className={labelCls}>SKU</label>
                  <input className={inputCls} value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="Stock Keeping Unit" />
                </div>
                <div>
                  <label className={labelCls}>UPC</label>
                  <input className={inputCls} value={form.upc} onChange={e => set('upc', e.target.value)} placeholder="Universal Product Code" />
                </div>
                <div>
                  <label className={labelCls}>Qty Available</label>
                  <input type="number" min="0" className={inputCls} value={form.totalAvailableQuantity} onChange={e => set('totalAvailableQuantity', e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {/* 4. Current Media */}
          {(currentImage || currentVideo) && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Current Media</h2>
              {currentImage && (
                <div className="w-full rounded-lg overflow-hidden border border-gray-200 mb-3" style={{ height: 200 }}>
                  <img src={currentImage} alt="Current" className="w-full h-full object-cover" />
                </div>
              )}
              {currentVideo && (
                <div className="flex items-center gap-3 bg-gray-50 rounded-lg border border-gray-200 px-4 py-3">
                  <Video className="w-8 h-8 text-gray-400" />
                  <p className="text-sm text-gray-600">Video uploaded</p>
                </div>
              )}
            </div>
          )}

          {/* 5. Update Media */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-2">Update Media</h2>
            {mediaUsage && (
              <div className="space-y-2 mb-5 p-3 bg-gray-50 rounded-lg">
                {mediaUsage.images && (
                  <UsageBar label="Images" current={mediaUsage.images.current ?? 0} max={mediaUsage.images.max ?? 0} />
                )}
                {mediaUsage.videos && (
                  <UsageBar label="Videos" current={mediaUsage.videos.current ?? 0} max={mediaUsage.videos.max ?? 0} />
                )}
                {!mediaUsage.verified && (
                  <p className="text-xs text-yellow-700 bg-yellow-50 rounded px-2 py-1 mt-1">
                    Organisation not verified — video upload unavailable
                  </p>
                )}
              </div>
            )}
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                {newImagePreview ? (
                  <div className="relative">
                    <img src={newImagePreview} alt="New" className="w-full h-40 object-cover rounded-lg border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => { if (newImagePreview) URL.revokeObjectURL(newImagePreview); setNewImageFile(null); setNewImagePreview(null); }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <p className="text-xs text-gray-500 mt-1 truncate">{newImageFile?.name}</p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handlePickImage}
                    className="w-full h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-purple-400 hover:bg-purple-50 transition-colors gap-2"
                  >
                    <ImageIcon className="w-6 h-6" />
                    <span className="text-xs font-medium">{currentImage ? 'Replace Image' : 'Upload Image'}</span>
                  </button>
                )}
              </div>
              <div className="flex-1 min-w-[200px]">
                {newVideoFile ? (
                  <div className="h-24 flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4">
                    <Video className="w-6 h-6 text-indigo-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-indigo-700 font-medium truncate">{newVideoFile.name}</p>
                      <p className="text-xs text-indigo-500">{(newVideoFile.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                    <button type="button" onClick={() => setNewVideoFile(null)} className="p-1 rounded-full hover:bg-indigo-100">
                      <X className="w-4 h-4 text-indigo-500" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handlePickVideo}
                    className="w-full h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-400 hover:bg-indigo-50 transition-colors gap-2"
                  >
                    <Video className="w-6 h-6" />
                    <span className="text-xs font-medium">{currentVideo ? 'Replace Video' : 'Upload Video'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 6. Sub-services (service items only) */}
          {form.itemType === 'service' && hasSubServices && subServices.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Sub-services</h2>
              <div className="space-y-5">
                {subServices.map((sub, idx) => (
                  <div key={idx} className="border border-gray-100 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Sub-service {idx + 1}</p>

                    <div>
                      <label className={labelCls}>Name</label>
                      <input
                        className={inputCls}
                        value={sub.name}
                        onChange={e => setSubServices(prev => prev.map((s, i) => i === idx ? { ...s, name: e.target.value } : s))}
                        placeholder="Sub-service name"
                      />
                    </div>

                    <div>
                      <label className={labelCls}>Description</label>
                      <textarea
                        rows={2}
                        className={inputCls}
                        value={sub.description}
                        onChange={e => setSubServices(prev => prev.map((s, i) => i === idx ? { ...s, description: e.target.value } : s))}
                        placeholder="Sub-service description"
                      />
                    </div>

                    <div>
                      <label className={labelCls}>Price ₦</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className={inputCls}
                        value={sub.price}
                        onChange={e => setSubServices(prev => prev.map((s, i) => i === idx ? { ...s, price: e.target.value } : s))}
                      />
                    </div>

                    <div>
                      <label className={labelCls}>Image</label>
                      {sub.uploading ? (
                        <div className="flex items-center gap-2 text-sm text-purple-600">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading…
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          {sub.uploadPicture && (
                            <img
                              src={sub.uploadPicture}
                              alt={`Sub-service ${idx + 1}`}
                              className="w-16 h-16 object-cover rounded-lg border border-gray-200 shrink-0"
                            />
                          )}
                          <label className="cursor-pointer flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-purple-400 hover:bg-purple-50 transition-colors">
                            <ImageIcon className="w-4 h-4" />
                            {sub.uploadPicture ? 'Replace image' : 'Upload image'}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) handleSubServiceImageChange(idx, file);
                                e.target.value = '';
                              }}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. Additional Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Additional Information</h2>
            <textarea
              rows={4}
              className={inputCls}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Additional notes or instructions…"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60 bg-purple-600 hover:bg-purple-700 text-white"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</>
            ) : (
              <><Upload className="w-4 h-4" /> Update Gallery Item</>
            )}
          </button>
        </form>
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[1001] flex flex-col bg-white">
          <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
            <button onClick={() => setShowCategoryModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-gray-900">Select Category</h2>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {categories.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-12">No categories available</p>
            ) : (
              categories.map(cat => {
                const id = cat._id || cat.id || '';
                const isActive = form.categoryId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => { set('categoryId', id); set('categoryName', cat.name); setShowCategoryModal(false); }}
                    className={`w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors ${isActive ? 'bg-purple-50' : ''}`}
                  >
                    <span className={`text-sm font-medium ${isActive ? 'text-purple-700' : 'text-gray-800'}`}>{cat.name}</span>
                    {isActive && <CheckCircle className="w-4 h-4 text-purple-600" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
