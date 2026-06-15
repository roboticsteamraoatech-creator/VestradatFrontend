'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  X,
  Tag,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  BookOpen,
  Eye,
  Package,
  Briefcase,
  CheckCircle,
  XCircle,
  ChevronDown,
} from 'lucide-react';
import { GalleryService } from '@/services/gallery-sub-service';

interface GalleryItem {
  _id?: string;
  id?: string;
  name?: string;
  description?: string;
  itemType: 'product' | 'service';
  categoryName?: string;
  category?: string;
  categoryId?: string;
  actualAmount?: number;
  priceInDollars?: number;
  discountPercentage?: number;
  platformChargePercentage?: number;
  imageUrl?: string;
  image?: string;
  picture?: string;
  photo?: string;
  images?: { main?: string; [key: number]: string } | string[];
  media?: { url?: string };
  canBook?: boolean;
  hasBookingAvailability?: boolean;
  totalAvailableServiceProviders?: number;
  providerCount?: number;
  totalAvailableQuantity?: number;
  sku?: string;
  upc?: string;
  stock?: number;
}

interface ApiCategory {
  id?: string;
  _id?: string;
  name: string;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);

const getItemImage = (item: GalleryItem): string | null => {
  if (item.imageUrl) return item.imageUrl;
  if (item.image) return item.image;
  if (item.picture) return item.picture;
  if (item.photo) return item.photo;
  if (item.images) {
    if (Array.isArray(item.images)) {
      if ((item.images as string[]).length > 0) return (item.images as string[])[0];
    } else {
      const imgObj = item.images as { main?: string; [key: number]: string };
      if (imgObj.main) return imgObj.main;
      const keys = Object.keys(imgObj).filter((k) => k !== 'main');
      if (keys.length > 0) return imgObj[Number(keys[0])];
    }
  }
  if (item.media?.url) return item.media.url;
  return null;
};

const getItemPrice = (item: GalleryItem): number => {
  if (item.actualAmount !== undefined) return item.actualAmount;
  const base = item.priceInDollars || 0;
  const discount = item.discountPercentage || 0;
  const charge = item.platformChargePercentage || 0;
  return base - (base * discount) / 100 + (base * charge) / 100;
};

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-6 mx-auto" /></td>
    <td className="px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3.5 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    </td>
    <td className="px-4 py-3"><div className="h-5 bg-gray-200 rounded-full w-16" /></td>
    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20" /></td>
    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16" /></td>
    <td className="px-4 py-3"><div className="h-5 bg-gray-200 rounded-full w-20" /></td>
    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24" /></td>
  </tr>
);

export default function AdminGalleryItemsScreen() {
  const router = useRouter();
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('userToken') || sessionStorage.getItem('userToken') || ''
      : '';

  const [items, setItems] = useState<GalleryItem[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [pendingItemType, setPendingItemType] = useState<'product' | 'service' | ''>('');
  const [pendingCategoryId, setPendingCategoryId] = useState('');
  const [activeItemType, setActiveItemType] = useState<'product' | 'service' | ''>('');
  const [activeCategoryId, setActiveCategoryId] = useState('');

  const fetchCategories = useCallback(async () => {
    const res = await GalleryService.getCategories(token);
    if (res.success && res.data) setCategories((res.data as unknown) as ApiCategory[]);
  }, [token]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await GalleryService.getAdminGalleryItems({
        page: currentPage,
        limit: 15,
        search: search || undefined,
        itemType: activeItemType || undefined,
        categoryId: activeCategoryId || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      if (res.success && res.data) {
        const list: GalleryItem[] = res.data.items || res.data.galleryItems || res.data || [];
        setItems(list);
        const pg = res.data.pagination;
        setTotalPages(pg?.totalPages || 1);
        setTotalItems(pg?.total || list.length);
      } else {
        setItems([]);
        setFetchError(res.message || 'Failed to load items.');
      }
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, search, activeItemType, activeCategoryId]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchItems(); }, [fetchItems]);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setCurrentPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const applyFilters = () => {
    setActiveItemType(pendingItemType);
    setActiveCategoryId(pendingCategoryId);
    setCurrentPage(1);
    setShowFilterModal(false);
  };

  const getCategoryName = (id: string) =>
    categories.find((c) => (c._id || c.id) === id)?.name || id;

  const activeFilterCount = [activeItemType, activeCategoryId].filter(Boolean).length;

  const startRow = (currentPage - 1) * 15 + 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Services & Products</h1>
            <p className="text-gray-500 text-sm mt-1">
              {totalItems} item{totalItems !== 1 ? 's' : ''} in your organisation
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setPendingItemType(activeItemType); setPendingCategoryId(activeCategoryId); setShowFilterModal(true); }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                activeFilterCount > 0
                  ? 'bg-purple-50 border-purple-300 text-purple-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button
              onClick={() => router.push('/admin/gallery/create')}
              className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Create Item
            </button>
          </div>
        </div>

        {/* Error banner */}
        {fetchError && (
          <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="flex-1">{fetchError}</span>
            <button onClick={fetchItems} className="shrink-0 font-medium underline hover:no-underline">Retry</button>
          </div>
        )}

        {/* Search + active chips row */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name…"
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          {activeItemType && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">
              {activeItemType === 'product' ? <Package className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
              {activeItemType.charAt(0).toUpperCase() + activeItemType.slice(1)}
              <button onClick={() => { setActiveItemType(''); setCurrentPage(1); }} className="ml-1 hover:text-indigo-600"><X className="w-3 h-3" /></button>
            </span>
          )}
          {activeCategoryId && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
              <Tag className="w-3 h-3" />
              {getCategoryName(activeCategoryId)}
              <button onClick={() => { setActiveCategoryId(''); setCurrentPage(1); }} className="ml-1 hover:text-purple-600"><X className="w-3 h-3" /></button>
            </span>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-10 text-center">#</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Availability</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-3 bg-gray-100 rounded-full">
                          <ImageIcon className="w-7 h-7 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-sm">
                          {search || activeFilterCount > 0
                            ? 'No items match your search or filters.'
                            : 'No gallery items found for your organisation.'}
                        </p>
                        {!search && activeFilterCount === 0 && (
                          <button
                            onClick={() => router.push('/admin/gallery/create')}
                            className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium mt-1"
                          >
                            <Plus className="w-4 h-4" /> Create Item
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => {
                    const imgSrc = getItemImage(item);
                    const price = getItemPrice(item);
                    const name = item.name || item.description || 'Unnamed Item';
                    const category = item.categoryName || item.category || '—';
                    const itemId = item._id || item.id || '';
                    const providerCount = item.totalAvailableServiceProviders ?? item.providerCount;
                    const stockQty = item.totalAvailableQuantity ?? item.stock;
                    const bookable = item.hasBookingAvailability;
                    const canBook = item.canBook;

                    return (
                      <tr key={itemId || index} className="hover:bg-gray-50 transition-colors">
                        {/* Row # */}
                        <td className="px-4 py-3 text-center text-xs text-gray-400 tabular-nums">
                          {startRow + index}
                        </td>

                        {/* Item thumbnail + name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3 min-w-[200px]">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              {imgSrc ? (
                                <img src={imgSrc} alt={name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="w-4 h-4 text-gray-300" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">{name}</p>
                              {item.itemType === 'product' && (item.sku || item.upc) && (
                                <p className="text-xs text-gray-400 font-mono mt-0.5">
                                  {item.sku ? `SKU: ${item.sku}` : `UPC: ${item.upc}`}
                                </p>
                              )}
                              {item.itemType === 'service' && providerCount !== undefined && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {providerCount} provider{providerCount !== 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Type badge */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                            item.itemType === 'product'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {item.itemType === 'product'
                              ? <Package className="w-3 h-3" />
                              : <Briefcase className="w-3 h-3" />}
                            {item.itemType === 'product' ? 'Product' : 'Service'}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{category}</td>

                        {/* Price */}
                        <td className="px-4 py-3 text-sm font-semibold text-purple-700 whitespace-nowrap tabular-nums">
                          {formatCurrency(price)}
                          {item.discountPercentage && item.discountPercentage > 0 ? (
                            <span className="block text-xs font-normal text-green-600">
                              {item.discountPercentage}% off
                            </span>
                          ) : null}
                        </td>

                        {/* Availability */}
                        <td className="px-4 py-3">
                          {item.itemType === 'service' ? (
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                              bookable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {bookable ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {bookable ? 'Bookable' : 'Not Bookable'}
                            </span>
                          ) : (
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                              (stockQty ?? 0) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                            }`}>
                              {(stockQty ?? 0) > 0 ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {stockQty !== undefined ? `Stock: ${stockQty}` : 'No stock info'}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {item.itemType === 'service' && canBook && (
                              <button
                                onClick={() => router.push(`/admin/booking/create?serviceId=${itemId}`)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap"
                              >
                                <BookOpen className="w-3 h-3" />
                                Book
                              </button>
                            )}
                            <button
                              onClick={() => router.push(`/admin/gallery/items/${itemId}`)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                            >
                              <Eye className="w-3 h-3" />
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table footer / pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-100 gap-3">
              <p className="text-xs text-gray-500">
                Showing {startRow}–{Math.min(startRow + items.length - 1, totalItems)} of {totalItems} items
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pg: number;
                  if (totalPages <= 5) pg = i + 1;
                  else if (currentPage <= 3) pg = i + 1;
                  else if (currentPage >= totalPages - 2) pg = totalPages - 4 + i;
                  else pg = currentPage - 2 + i;
                  return (
                    <button
                      key={pg}
                      onClick={() => setCurrentPage(pg)}
                      className={`min-w-[32px] h-8 rounded-lg text-xs font-medium transition-colors ${
                        currentPage === pg
                          ? 'bg-purple-600 text-white'
                          : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pg}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Filter Items</h2>
              <button onClick={() => setShowFilterModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Item Type</label>
                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                  {([
                    { label: 'All', value: '' },
                    { label: 'Service', value: 'service' },
                    { label: 'Product', value: 'product' },
                  ] as { label: string; value: '' | 'product' | 'service' }[]).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setPendingItemType(opt.value)}
                      className={`flex-1 py-2 text-sm font-medium transition-colors ${
                        pendingItemType === opt.value
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                <div className="relative">
                  <select
                    value={pendingCategoryId}
                    onChange={(e) => setPendingCategoryId(e.target.value)}
                    className="w-full appearance-none px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 pr-8"
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c._id || c.id} value={c._id || c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setPendingItemType(''); setPendingCategoryId(''); }}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={applyFilters}
                className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
