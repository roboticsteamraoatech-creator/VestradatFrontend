"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/api/hooks/useAuth';
import { CartService } from '@/services/CartService';
import { ICart, ICartItem } from '@/types/cart';
import { ShoppingCart, Trash2, ShieldCheck, AlertCircle, ArrowLeft, Loader2, Info, CheckSquare, Square } from 'lucide-react';

const CartPage = () => {
  const { user, token } = useAuth();
  const router = useRouter();

  const [cart, setCart] = useState<ICart | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null); // Track item loading states locally

  useEffect(() => {
    if (user && token) {
      loadCart();
    } else if (!user && !loading) {
      setLoading(false);
      setError("Please sign in to access your shopping cart account profile.");
    }
  }, [user, token]);

  const loadCart = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const res = await CartService.getCart(token);
      if (res.success) {
        setCart(res.data.cart);
      } else {
        setError(res.message || "Failed to load shopping cart.");
      }
    } catch (err: any) {
      setError(err.message || "Network error loading cart parameters.");
    } finally {
      setLoading(false);
    }
  };

  const fmt = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Handler: Modify Item Quantities
  const handleUpdateQuantity = async (galleryItemId: string, currentQty: number, change: number) => {
    if (!token || !cart) return;
    const targetQty = currentQty + change;
    if (targetQty < 1) return;

    setActionId(galleryItemId);
    try {
      const res = await CartService.updateQuantity(galleryItemId, targetQty, token);
      if (res.success) {
        setCart(res.data.cart);
      } else {
        alert(res.message);
      }
    } catch (err: any) {
      alert(err.message || "Failed to alter parameter quantities.");
    } finally {
      setActionId(null);
    }
  };

  // Handler: Remove Item From Cart
  const handleRemoveItem = async (galleryItemId: string) => {
    if (!token) return;
    setActionId(galleryItemId);
    try {
      const res = await CartService.removeItem(galleryItemId, token);
      if (res.success) {
        setCart(res.data.cart);
      } else {
        alert(res.message);
      }
    } catch (err: any) {
      alert(err.message || "Could not decouple cart target record.");
    } finally {
      setActionId(null);
    }
  };

  // Handler: Toggle Per-Item Payment Rules (Full vs Upfront Split)
  const handleTogglePaymentType = async (galleryItemId: string, currentType: 'full' | 'upfront') => {
    if (!token) return;
    const targetType = currentType === 'full' ? 'upfront' : 'full';
    setActionId(`${galleryItemId}-payType`);
    try {
      const res = await CartService.setPaymentType(galleryItemId, targetType, token);
      if (res.success) {
        setCart(res.data.cart);
      } else {
        alert(res.message);
      }
    } catch (err: any) {
      alert(err.message || "Failed changing operational checkout layout methods.");
    } finally {
      setActionId(null);
    }
  };

  // Handler: Toggle Checked Items Deferment on Partially Paid Items
  const handleToggleCheck = async (galleryItemId: string) => {
    if (!token) return;
    setActionId(`${galleryItemId}-toggleCheck`);
    try {
      const res = await CartService.toggleCheck(galleryItemId, token);
      if (res.success) {
        setCart(res.data.cart);
      } else {
        alert(res.message);
      }
    } catch (err: any) {
      alert(err.message || "Failed matching verification checkboxes.");
    } finally {
      setActionId(null);
    }
  };

  // Handler: Flush all pending items out
  const handleClearCart = async () => {
    if (!token || !confirm("Are you sure you want to remove all pending items?")) return;
    setLoading(true);
    try {
      const res = await CartService.clearCart(token);
      if (res.success) {
        setCart(res.data.cart);
      }
    } catch (err: any) {
      alert(err.message || "Failed flushing cart items.");
    } finally {
      setLoading(false);
    }
  };

  // Handler: Process Consolidated Unified Checkout Payment Link
  const handleCheckoutProcess = async () => {
    if (!token || !cart || !user) return;
    setCheckoutLoading(true);
    setError(null);

    try {
      const payload = {
        customerName: (user as any).fullName || "Customer Profile Account",
        customerPhone: (user as any).phoneNumber || "",
        platform: "web"
      };

      const res = await CartService.processCheckout(payload, token);
      if (res.success && res.data.paymentLink) {
        window.location.href = res.data.paymentLink; // Pass directly to Flutterwave hosted gateway
      } else {
        setError(res.message || "Checkout pipeline routing parameters failed.");
      }
    } catch (err: any) {
      setError(err.message || "Error setting up transaction link.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <Loader2 className="animate-spin h-10 w-10 text-[#5d2a8b] mx-auto" />
          <p className="text-sm text-gray-500 font-medium">Syncing live account cart matrix state...</p>
        </div>
      </div>
    );
  }

  const hasItems = cart && cart.items && cart.items.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="ml-0 md:ml-[350px] pt-8 p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* Header Layout */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
                <p className="text-xs text-gray-500 mt-0.5">Manage products and process split-payment schedules</p>
              </div>
            </div>
            {hasItems && (
              <button onClick={handleClearCart} className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors self-start sm:self-center bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl">
                Clear Pending Items
              </button>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3 items-start animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">
                <p className="font-bold">System Error Notification</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {!hasItems ? (
            <div className="bg-white border rounded-2xl p-12 text-center max-w-xl mx-auto border-dashed shadow-sm space-y-4">
              <div className="w-16 h-16 bg-purple-50 text-[#5d2a8b] rounded-full flex items-center justify-center mx-auto shadow-inner">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900">Your Cart is Empty</h3>
                <p className="text-xs text-gray-400">Add high-traffic utility items or products to initialize checkout orders.</p>
              </div>
              <button onClick={() => router.push('/user/body-care')} className="bg-[#5d2a8b] hover:bg-[#7a3aa3] text-white px-5 py-2.5 rounded-xl font-semibold text-xs transition-colors shadow-sm">
                Explore Products
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Left Column: Cart Items Loop list container */}
              <div className="lg:col-span-2 space-y-4">
                {cart?.items.map((item: ICartItem) => {
                  const isPending = item.paymentStatus === 'pending';
                  const isProcessing = actionId === item.galleryItemId || actionId === `${item.galleryItemId}-payType` || actionId === `${item.galleryItemId}-toggleCheck`;

                  return (
                    <div key={item.galleryItemId} className={`border rounded-2xl p-5 bg-white shadow-sm flex gap-4 relative transition-all ${!item.isChecked && !isPending ? 'opacity-60 bg-gray-50/50' : 'border-gray-100'}`}>
                      
                      {/* Checkbox selector for partially paid items only */}
                      {!isPending && (
                        <button 
                          disabled={isProcessing}
                          onClick={() => handleToggleCheck(item.galleryItemId)}
                          className="text-[#5d2a8b] self-center flex-shrink-0 p-1 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                          {item.isChecked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-gray-300" />}
                        </button>
                      )}

                      {/* Item Image layout section */}
                      <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border shadow-inner">
                        <img src={item.imageUrl || "/placeholder-product.png"} alt={item.name} className="w-full h-full object-cover" />
                      </div>

                      {/* Informational Details Section layout fields */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h3 className="text-sm font-bold text-gray-900 truncate">{item.name}</h3>
                            <p className="text-[11px] text-purple-700 font-semibold">{item.organizationName}</p>
                          </div>
                          
                          {/* Payment State Status Badges */}
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isPending ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
                            {isPending ? 'Pending Order' : 'Partially Paid'}
                          </span>
                        </div>

                        {/* Operational controllers section toggling variables parameters */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                          
                          {/* Conditional Controllers: Only adjust quantities for pending items */}
                          {isPending ? (
                            <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 p-1">
                              <button disabled={isProcessing || item.quantity <= 1} onClick={() => handleUpdateQuantity(item.galleryItemId, item.quantity, -1)} className="w-7 h-7 flex items-center justify-center font-bold text-gray-600 hover:bg-white rounded-lg disabled:opacity-40 transition-colors">-</button>
                              <span className="w-8 text-center text-xs font-bold text-gray-800">{item.quantity}</span>
                              <button disabled={isProcessing} onClick={() => handleUpdateQuantity(item.galleryItemId, item.quantity, 1)} className="w-7 h-7 flex items-center justify-center font-bold text-gray-600 hover:bg-white rounded-lg transition-colors">+</button>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500 font-medium">Committed Qty: <strong className="text-gray-800 font-bold">{item.quantity} units</strong></p>
                          )}

                          {/* Dynamic Currency Matrix Readouts */}
                          <div className="text-right">
                            <p className="text-[10px] text-gray-400 font-medium">Unit Cost: {fmt(item.finalPricePerUnit)}</p>
                            <p className="text-sm font-bold text-gray-900 mt-0.5">
                              {isPending 
                                ? fmt(item.finalPricePerUnit * item.quantity) 
                                : `Owed Balance: ${fmt(item.remainingBalance || 0)}`
                              }
                            </p>
                          </div>
                        </div>

                        {/* Split Configuration Select Toggles UI Modules */}
                        <div className="pt-2 flex items-center justify-between gap-4 border-t border-gray-100 text-xs">
                          {isPending ? (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 text-[11px]">Payment Mode:</span>
                              <button
                                disabled={isProcessing || item.upfrontPaymentPercentage === 0}
                                onClick={() => handleTogglePaymentType(item.galleryItemId, item.selectedPaymentType)}
                                className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors border ${
                                  item.selectedPaymentType === 'upfront'
                                    ? 'bg-purple-100 text-[#5d2a8b] border-purple-300'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
                                }`}
                              >
                                {item.selectedPaymentType === 'upfront' ? `Upfront (${item.upfrontPaymentPercentage}%)` : 'Full Payment'}
                              </button>
                              {item.upfrontPaymentPercentage === 0 && (
                                <span className="text-[10px] text-gray-400 italic">Upfront un-supported</span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                              <Info size={12} className="text-orange-500" />
                              <span>Linked Order reference code: <strong className="text-gray-700">{item.linkedOrderId?.slice(-6)}</strong></span>
                            </div>
                          )}

                          {/* Delete Button Guard: Block deletion of partially paid assets */}
                          {isPending && (
                            <button disabled={isProcessing} onClick={() => handleRemoveItem(item.galleryItemId)} className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors ml-auto">
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Pricing Calculations Summary Panel */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
                  <h3 className="text-base font-bold text-gray-900 border-b pb-2">Order Pricing Breakdown</h3>
                  
                  <div className="space-y-2.5 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Pending Subtotal</span>
                      <span className="font-semibold text-gray-900">{fmt(cart?.subtotal || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform Surcharges</span>
                      <span className="font-semibold text-gray-900">{fmt(cart?.totalPlatformCharge || 0)}</span>
                    </div>
                    {cart?.totalSubServices && cart.totalSubServices > 0 ? (
                      <div className="flex justify-between">
                        <span>Optional Sub-services</span>
                        <span className="font-semibold text-gray-900">{fmt(cart.totalSubServices)}</span>
                      </div>
                    ) : null}
                    {cart?.partiallyPaidTotal && cart.partiallyPaidTotal > 0 ? (
                      <div className="flex justify-between text-orange-600">
                        <span>Deferred Balance Total</span>
                        <span className="font-semibold">{fmt(cart.partiallyPaidTotal)}</span>
                      </div>
                    ) : null}

                    <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline">
                      <div>
                        <p className="text-sm font-bold text-[#5d2a8b]">Total Due Owed Now</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Combined unified checkout amount</p>
                      </div>
                      <span className="text-xl font-black text-[#5d2a8b]">{fmt(cart?.grandTotal || 0)}</span>
                    </div>
                  </div>

                  <div className="pt-2 bg-gray-50 rounded-xl p-3 border border-gray-100 flex gap-2 items-start text-[11px] text-gray-500">
                    <ShieldCheck className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p>Secured unified encryption checkout provided securely via Flutterwave engine handlers.</p>
                  </div>

                  <button
                    onClick={handleCheckoutProcess}
                    disabled={checkoutLoading || cart?.grandTotal === 0}
                    className="w-full py-3 bg-[#5d2a8b] hover:bg-[#7a3aa3] text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:bg-gray-300 shadow-md"
                  >
                    {checkoutLoading ? (
                      <Loader2 className="animate-spin h-4 w-4 text-white" />
                    ) : (
                      "Proceed to Secure Checkout →"
                    )}
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CartPage;