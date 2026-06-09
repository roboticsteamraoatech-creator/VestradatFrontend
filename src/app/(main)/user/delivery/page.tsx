"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Package,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  Building2,
  ChevronRight,
  X,
  Upload,
  Trash2,
  AlertCircle,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import DeliveryService from "@/services/DeliveryService";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Payment {
  paymentNumber: number;
  amount: number;
  status: string;
  transactionReference: string;
  paymentGateway: string;
  dateTime: string;
  _id: string;
}

interface DeliveryConfirmation {
  deliveryMode: string;
  deliveryAddress?: string;
  imageComment?: string;
  satisfactionDeclaration?: string;
  confirmedAt: string;
}

interface Order {
  _id: string;
  productName: string;
  organizationName: string;
  productPrice: number;
  totalAmountPaid: number;
  upfrontAmountPaid: number;
  upfrontRemainingBalance: number;
  orderStatus: string;
  deliveryStatus: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  itemType: string;
  payments: Payment[];
  createdAt: string;
  updatedAt: string;
  deliveryConfirmation?: DeliveryConfirmation;
}

type DeliveryMode = "pickup_center" | "shipping" | "organization_location";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    confirmed:    { label: "Delivered",    cls: "bg-green-100 text-green-700" },
    pending:      { label: "Pending",      cls: "bg-yellow-100 text-yellow-700" },
    fully_paid:   { label: "Fully Paid",   cls: "bg-blue-100 text-blue-700" },
    partial:      { label: "Partial",      cls: "bg-orange-100 text-orange-700" },
    successful:   { label: "Successful",   cls: "bg-green-100 text-green-700" },
  };
  const s = map[status] ?? { label: status.replace(/_/g, " "), cls: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${s.cls}`}>
      {s.label}
    </span>
  );
}

function ImageUploadBox({
  label,
  preview,
  onFile,
  onClear,
}: {
  label: string;
  preview: string | null;
  onFile: (f: File) => void;
  onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 h-28">
          <img src={preview} alt={label} className="w-full h-full object-cover" />
          <button
            onClick={onClear}
            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => ref.current?.click()}
          className="w-full h-28 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-[#5d2a8b] hover:bg-[#5d2a8b]/5 transition-colors"
        >
          <Upload className="w-5 h-5 text-gray-400" />
          <span className="text-xs text-gray-400">Upload</span>
        </button>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DeliveryPage() {
  const deliveryService = new DeliveryService();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [confirmedOrders, setConfirmedOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<"pending" | "confirmed">("pending");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Form state
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("shipping");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [pickupCenterName, setPickupCenterName] = useState("");
  const [imageComment, setImageComment] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [declaration, setDeclaration] = useState("");
  const [productImg, setProductImg] = useState<File | null>(null);
  const [productPreview, setProductPreview] = useState<string | null>(null);
  const [repImg, setRepImg] = useState<File | null>(null);
  const [repPreview, setRepPreview] = useState<string | null>(null);
  const [userImg, setUserImg] = useState<File | null>(null);
  const [userPreview, setUserPreview] = useState<string | null>(null);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("userToken");
      if (!token) return;
      const res = await deliveryService.getUserOrders(token);
      if (res.success && res.data) {
        const all = res.data.orders as Order[];
        setOrders(all.filter(o => o.orderStatus === "fully_paid" && o.deliveryStatus !== "confirmed"));
        setConfirmedOrders(all.filter(o => o.deliveryStatus === "confirmed"));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openModal = async (order: Order) => {
    setSelectedOrder(order);
    setDeliveryMode("shipping");
    setDeliveryAddress("");
    setPickupCenterName("");
    setImageComment("");
    setVideoUrl("");
    setDeclaration("");
    setProductImg(null); setProductPreview(null);
    setRepImg(null); setRepPreview(null);
    setUserImg(null); setUserPreview(null);
    setErrorMsg("");
    // Auto-load template
    const token = localStorage.getItem("userToken");
    if (token) {
      const tmpl = await deliveryService.getDeliveryTemplate(order._id, token);
      if (tmpl.success && tmpl.data) setDeclaration(tmpl.data.template);
    }
    setShowModal(true);
  };

  const handleFile = (
    file: File,
    setFile: (f: File) => void,
    setPreview: (s: string) => void
  ) => {
    setFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const isValid = () => {
    if (!declaration.trim()) return false;
    if (deliveryMode === "shipping" && !deliveryAddress.trim()) return false;
    if ((deliveryMode === "pickup_center" || deliveryMode === "organization_location") && !pickupCenterName.trim()) return false;
    return true;
  };

  const handleConfirm = async () => {
    if (!selectedOrder || !isValid()) return;
    setSubmitting(true);
    setErrorMsg("");
    try {
      const token = localStorage.getItem("userToken");
      if (!token) return;
      const res = await deliveryService.confirmDelivery(selectedOrder._id, token, {
        deliveryMode,
        deliveryAddress: deliveryAddress || undefined,
        pickupCenterName: pickupCenterName || undefined,
        productImage: productImg || undefined,
        representativeImage: repImg || undefined,
        userImage: userImg || undefined,
        imageComment: imageComment || undefined,
        videoUrl: videoUrl || undefined,
        satisfactionDeclaration: declaration,
      });
      if (res.success) {
        setShowModal(false);
        setSuccessMsg(`Delivery confirmed for "${selectedOrder.productName}". Payment will be released to the merchant.`);
        loadOrders();
        setTimeout(() => setSuccessMsg(""), 6000);
      } else {
        setErrorMsg(res.message || "Failed to confirm delivery.");
      }
    } catch {
      setErrorMsg("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const displayOrders = tab === "pending" ? orders : confirmedOrders;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="ml-0 md:ml-[350px] p-4 md:p-8">
        <div className="max-w-5xl mx-auto">

          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Delivery Confirmation</h1>
            <p className="text-gray-500 text-sm mt-1">Confirm receipt of your purchased products and services</p>
          </div>

          {/* Success banner */}
          {successMsg && (
            <div className="mb-6 flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">{successMsg}</p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-6 w-fit">
            {(["pending", "confirmed"] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  tab === t ? "bg-[#5d2a8b] text-white" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t === "pending" ? `Awaiting Confirmation (${orders.length})` : `Confirmed (${confirmedOrders.length})`}
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center h-48 gap-3 text-gray-500">
              <RefreshCw className="w-5 h-5 animate-spin" />
              Loading orders...
            </div>
          ) : displayOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                {tab === "pending" ? "No orders awaiting delivery confirmation" : "No confirmed deliveries yet"}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {tab === "pending" ? "Orders must be fully paid to appear here" : "Confirmed orders will show here"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayOrders.map(order => (
                <div key={order._id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-[#5d2a8b]/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#5d2a8b]/10 flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-[#5d2a8b]" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{order.productName}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{order.organizationName}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <StatusBadge status={order.orderStatus} />
                          <StatusBadge status={order.deliveryStatus} />
                          <span className="text-xs text-gray-400">{fmtDate(order.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-gray-900">{fmt(order.totalAmountPaid)}</p>
                      <p className="text-xs text-gray-400 mt-0.5 capitalize">{order.itemType}</p>
                    </div>
                  </div>

                  {/* Payment summary */}
                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <p className="text-xs text-gray-400">Product Price</p>
                      <p className="text-sm font-medium text-gray-700">{fmt(order.productPrice)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Total Paid</p>
                      <p className="text-sm font-medium text-gray-700">{fmt(order.totalAmountPaid)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Payments</p>
                      <p className="text-sm font-medium text-gray-700">{order.payments.length} transaction{order.payments.length !== 1 ? "s" : ""}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Customer</p>
                      <p className="text-sm font-medium text-gray-700 truncate">{order.customerName}</p>
                    </div>
                  </div>

                  {/* Confirmed delivery details */}
                  {order.deliveryConfirmation && (
                    <div className="mt-4 pt-4 border-t border-gray-100 bg-green-50 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <p className="text-sm font-medium text-green-700">Delivery Confirmed</p>
                        <span className="text-xs text-green-600 ml-auto">{fmtDate(order.deliveryConfirmation.confirmedAt)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div><span className="text-gray-400">Mode: </span>{order.deliveryConfirmation.deliveryMode.replace(/_/g, " ")}</div>
                        {order.deliveryConfirmation.deliveryAddress && (
                          <div><span className="text-gray-400">Address: </span>{order.deliveryConfirmation.deliveryAddress}</div>
                        )}
                        {order.deliveryConfirmation.imageComment && (
                          <div className="col-span-2"><span className="text-gray-400">Note: </span>{order.deliveryConfirmation.imageComment}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action */}
                  {tab === "pending" && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => openModal(order)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#5d2a8b] text-white rounded-xl text-sm font-semibold hover:bg-[#7a3aa3] transition-colors"
                      >
                        Confirm Delivery
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Confirmation Modal ── */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white w-full md:max-w-2xl md:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto">

            {/* Modal header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Confirm Delivery</h2>
                <p className="text-sm text-gray-500 truncate max-w-xs">{selectedOrder.productName}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">

              {/* Order summary */}
              <div className="bg-[#5d2a8b]/5 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-gray-400">Order ID</p><p className="font-medium text-gray-700 font-mono text-xs">{selectedOrder._id.slice(-8).toUpperCase()}</p></div>
                <div><p className="text-xs text-gray-400">Amount Paid</p><p className="font-semibold text-[#5d2a8b]">{fmt(selectedOrder.totalAmountPaid)}</p></div>
                <div><p className="text-xs text-gray-400">Customer</p><p className="font-medium text-gray-700">{selectedOrder.customerName}</p></div>
                <div><p className="text-xs text-gray-400">Phone</p><p className="font-medium text-gray-700">{selectedOrder.customerPhone}</p></div>
              </div>

              {/* Delivery mode */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Delivery Mode</label>
                <div className="grid grid-cols-1 gap-2">
                  {([
                    { val: "shipping", label: "Shipping", icon: Truck, desc: "Item shipped to an address" },
                    { val: "pickup_center", label: "Pickup Center", icon: MapPin, desc: "Collected from a pickup point" },
                    { val: "organization_location", label: "Organization Location", icon: Building2, desc: "Collected from merchant's location" },
                  ] as { val: DeliveryMode; label: string; icon: any; desc: string }[]).map(opt => (
                    <label key={opt.val} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      deliveryMode === opt.val ? "border-[#5d2a8b] bg-[#5d2a8b]/5" : "border-gray-200 hover:border-gray-300"
                    }`}>
                      <input type="radio" name="mode" value={opt.val} checked={deliveryMode === opt.val}
                        onChange={() => setDeliveryMode(opt.val)} className="accent-[#5d2a8b]" />
                      <opt.icon className="w-4 h-4 text-[#5d2a8b]" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                        <p className="text-xs text-gray-400">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Conditional address fields */}
              {deliveryMode === "shipping" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address <span className="text-red-500">*</span></label>
                  <input type="text" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)}
                    placeholder="Enter full delivery address"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#5d2a8b] outline-none" />
                </div>
              )}
              {(deliveryMode === "pickup_center" || deliveryMode === "organization_location") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {deliveryMode === "pickup_center" ? "Pickup Center Name" : "Organization Location"} <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={pickupCenterName} onChange={e => setPickupCenterName(e.target.value)}
                    placeholder={deliveryMode === "pickup_center" ? "Enter pickup center name" : "Enter organization location"}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#5d2a8b] outline-none" />
                </div>
              )}

              {/* Satisfaction declaration */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Satisfaction Declaration <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-400 mb-2">Edit the pre-filled template with your actual details</p>
                <textarea value={declaration} onChange={e => setDeclaration(e.target.value)} rows={5}
                  placeholder="Describe your satisfaction with the delivery..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#5d2a8b] outline-none resize-none" />
                {declaration && <p className="text-xs text-gray-400 mt-1 text-right">{declaration.length} chars</p>}
              </div>

              {/* Image uploads */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Upload Images (Optional)</label>
                <div className="grid grid-cols-3 gap-3">
                  <ImageUploadBox label="Product" preview={productPreview}
                    onFile={f => handleFile(f, setProductImg, setProductPreview)}
                    onClear={() => { setProductImg(null); setProductPreview(null); }} />
                  <ImageUploadBox label="Representative" preview={repPreview}
                    onFile={f => handleFile(f, setRepImg, setRepPreview)}
                    onClear={() => { setRepImg(null); setRepPreview(null); }} />
                  <ImageUploadBox label="User" preview={userPreview}
                    onFile={f => handleFile(f, setUserImg, setUserPreview)}
                    onClear={() => { setUserImg(null); setUserPreview(null); }} />
                </div>
              </div>

              {/* Extra fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image Comment (Optional)</label>
                  <input type="text" value={imageComment} onChange={e => setImageComment(e.target.value)}
                    placeholder="Comment about uploaded images"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#5d2a8b] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Video URL (Optional)</label>
                  <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#5d2a8b] outline-none" />
                </div>
              </div>

              {/* Error */}
              {errorMsg && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{errorMsg}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleConfirm} disabled={!isValid() || submitting}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-colors ${
                    !isValid() || submitting ? "bg-gray-300 cursor-not-allowed" : "bg-[#5d2a8b] hover:bg-[#7a3aa3]"
                  }`}>
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Confirming...
                    </span>
                  ) : "Confirm Delivery"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
