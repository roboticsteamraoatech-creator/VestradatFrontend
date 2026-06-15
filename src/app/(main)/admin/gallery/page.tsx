'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Image as ImageIcon,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Tag,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { GalleryService } from '@/services/gallery-sub-service';

interface GalleryItem {
  _id: string;
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
}

interface ApiCategory {
  id?: string;
  _id?: string;
  name: string;
}

interface Filters {
  categoryId: string;
  minPrice: string;
  maxPrice: string;
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

const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
    <div className="bg-gray-200 h-40 w-full" />
    <div className="p-4 space-y-2">
      <div className="bg-gray-200 h-4 rounded w-3/4" />
      <div className="bg-gray-200 h-3 rounded w-1/2" />
      <div className="bg-gray-200 h-3 rounded w-1/3" />
    </div>
  </div>
);

export default function GalleryManagementScreen() {
  const router = useRouter();
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('userToken') ||
        sessionStorage.getItem('userToken') ||
        ''
      : '';

  const [items, setItems] = useState<GalleryItem[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filter modal state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [pendingFilters, setPendingFilters] = useState<Filters>({
    categoryId: '',
    minPrice: '',
    maxPrice: '',
  });
  const [appliedFilters, setAppliedFilters] = useState<Filters>({
    categoryId: '',
    minPrice: '',
    maxPrice: '',
  });

  // Search
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [fetchError, setFetchError] = useState<string | null>(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<GalleryItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    const res = await GalleryService.getCategories(token);
    if (res.success && res.data) setCategories((res.data as unknown) as ApiCategory[]);
  }, [token]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const params: Parameters<typeof GalleryService.getGalleryItems>[1] = {
        page: currentPage,
        limit: 12,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };
      if (search) params.categoryId = undefined;
      if (appliedFilters.categoryId) params.categoryId = appliedFilters.categoryId;
      if (appliedFilters.minPrice) params.minPrice = Number(appliedFilters.minPrice);
      if (appliedFilters.maxPrice) params.maxPrice = Number(appliedFilters.maxPrice);

      const res = await GalleryService.getGalleryItems(token, params);
      if (res.success && res.data) {
        let fetchedItems: GalleryItem[] = ((res.data.items || []) as unknown) as GalleryItem[];
        if (search) {
          const s = search.toLowerCase();
          fetchedItems = fetchedItems.filter(
            (it) =>
              (it.name || it.description || '').toLowerCase().includes(s) ||
              (it.categoryName || it.category || '').toLowerCase().includes(s)
          );
        }
        setItems(fetchedItems);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotalItems(res.data.pagination?.total || fetchedItems.length);
      } else {
        setItems([]);
        setFetchError(res.message || 'Failed to load gallery items.');
      }
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, appliedFilters, search]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Search debounce
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const openFilterModal = () => {
    setPendingFilters({ ...appliedFilters });
    setShowFilterModal(true);
  };

  const applyFilters = () => {
    setAppliedFilters({ ...pendingFilters });
    setCurrentPage(1);
    setShowFilterModal(false);
  };

  const removeFilter = (key: keyof Filters) => {
    const updated = { ...appliedFilters, [key]: '' };
    setAppliedFilters(updated);
    setCurrentPage(1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const id = deleteTarget._id || deleteTarget.id || '';
    const res = await GalleryService.deleteGalleryItem(token, id);
    setDeleteLoading(false);
    if (res.success) {
      setDeleteTarget(null);
      fetchItems();
    } else {
      alert(res.message || 'Failed to delete item');
    }
  };

  const getCategoryName = (id: string) =>
    categories.find((c) => (c._id || c.id) === id)?.name || id;

  const activeFilterCount = [
    appliedFilters.categoryId,
    appliedFilters.minPrice,
    appliedFilters.maxPrice,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        {/* Server error banner */}
        {fetchError && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="flex-1">{fetchError}</span>
            <button
              onClick={fetchItems}
              className="shrink-0 font-medium underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gallery Management</h1>
            <p className="text-gray-500 text-sm mt-1">
              {totalItems} item{totalItems !== 1 ? 's' : ''} total
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openFilterModal}
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
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search gallery items..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {appliedFilters.categoryId && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                <Tag className="w-3 h-3" />
                {getCategoryName(appliedFilters.categoryId)}
                <button onClick={() => removeFilter('categoryId')} className="ml-1 hover:text-purple-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {appliedFilters.minPrice && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                Min {formatCurrency(Number(appliedFilters.minPrice))}
                <button onClick={() => removeFilter('minPrice')} className="ml-1 hover:text-green-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {appliedFilters.maxPrice && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                Max {formatCurrency(Number(appliedFilters.maxPrice))}
                <button onClick={() => removeFilter('maxPrice')} className="ml-1 hover:text-orange-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
            <div className="p-4 bg-gray-100 rounded-full mb-4">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">No items found</h3>
            <p className="text-gray-500 text-sm mb-6 text-center max-w-xs">
              {search || activeFilterCount > 0
                ? 'Try adjusting your search or filters.'
                : 'Get started by creating your first gallery item.'}
            </p>
            {!search && activeFilterCount === 0 && (
              <button
                onClick={() => router.push('/admin/gallery/create')}
                className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Create Item
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => {
              const imgSrc = getItemImage(item);
              const price = getItemPrice(item);
              const name = item.name || item.description || 'Unnamed Item';
              const category = item.categoryName || item.category || '';
              const itemId = item._id || item.id || '';
              return (
                <div
                  key={itemId}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
                >
                  {/* Image */}
                  <div className="relative h-40 bg-gray-100">
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-10 h-10 text-gray-300" />
                      </div>
                    )}
                    {/* Type badge */}
                    <span
                      className={`absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full ${
                        item.itemType === 'product'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {item.itemType === 'product' ? 'Product' : 'Service'}
                    </span>
                  </div>
                  {/* Info */}
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{name}</h3>
                    {category && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate flex items-center gap-1">
                        <Tag className="w-3 h-3 flex-shrink-0" />
                        {category}
                      </p>
                    )}
                    <p className="text-sm font-bold text-purple-700 mt-1">
                      {formatCurrency(price)}
                    </p>
                    {/* Actions */}
                    <div className="flex items-center gap-1 mt-3 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => router.push(`/admin/gallery/edit/${itemId}`)}
                        className="flex-1 inline-flex items-center justify-center gap-1 text-xs text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-lg py-1.5 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      {item.itemType === 'service' && (
                        <button
                          onClick={() => router.push(`/admin/booking/create?serviceId=${itemId}`)}
                          className="flex-1 inline-flex items-center justify-center gap-1 text-xs text-gray-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg py-1.5 transition-colors"
                          title="Book"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          Book
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="flex-1 inline-flex items-center justify-center gap-1 text-xs text-gray-600 hover:text-red-700 hover:bg-red-50 rounded-lg py-1.5 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-3">
            <p className="text-sm text-gray-500">
              Page {currentPage} of {totalPages} &bull; {totalItems} items
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
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
                    className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === pg
                        ? 'bg-purple-600 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pg}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => router.push('/admin/gallery/create')}
        className="fixed bottom-8 right-8 w-14 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-40"
        aria-label="Create new gallery item"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Filter Items</h2>
              <button
                onClick={() => setShowFilterModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Category
                </label>
                <select
                  value={pendingFilters.categoryId}
                  onChange={(e) =>
                    setPendingFilters((f) => ({ ...f, categoryId: e.target.value }))
                  }
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Price Range (NGN)
                </label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    placeholder="Min price"
                    value={pendingFilters.minPrice}
                    onChange={(e) =>
                      setPendingFilters((f) => ({ ...f, minPrice: e.target.value }))
                    }
                    className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="number"
                    placeholder="Max price"
                    value={pendingFilters.maxPrice}
                    onChange={(e) =>
                      setPendingFilters((f) => ({ ...f, maxPrice: e.target.value }))
                    }
                    className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setPendingFilters({ categoryId: '', minPrice: '', maxPrice: '' });
                }}
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

      {/* Delete Confirm Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Delete Item</h2>
            </div>
            <p className="text-gray-600 text-sm mb-6">
              Are you sure you want to delete{' '}
              <span className="font-semibold">
                {deleteTarget.name || deleteTarget.description || 'this item'}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {deleteLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
