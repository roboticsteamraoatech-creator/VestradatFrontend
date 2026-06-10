// types/cart.ts

export interface ICartSubService {
  subServiceId: string;
  name: string;
  code: string;
  price: number;
}

export interface ICartItem {
  galleryItemId: string;
  organizationId: string;
  organizationName: string;
  itemType: 'product';
  name: string;
  imageUrl: string;
  quantity: number;
  
  // Pricing snapshots
  priceInDollars: number;
  discountPercentage: number;
  platformChargePercentage: number;
  upfrontPaymentPercentage: number;

  // Calculated properties
  priceAfterDiscount: number;
  platformChargeAmount: number;
  finalPricePerUnit: number;

  // Per-item state tracking parameters
  selectedPaymentType: 'full' | 'upfront';
  paymentStatus: 'pending' | 'partially_paid';
  linkedOrderId?: string | null;
  remainingBalance?: number | null;
  isChecked: boolean;

  // Sub-services / Add-ons configurations
  hasSubServices: boolean;
  availableSubServices: ICartSubService[];
  selectedSubServices: ICartSubService[];
  subServicesTotal: number;
  addedAt: string;
}

export interface ICart {
  id: string;
  customerId: string;
  items: ICartItem[];
  subtotal: number;
  totalPlatformCharge: number;
  totalSubServices: number;
  partiallyPaidTotal: number;
  grandTotal: number;
  itemCount?: number;
  productCount?: number;
  pendingCount?: number;
  partiallyPaidCount?: number;
}

export interface CartResponse {
  success: boolean;
  data: {
    cart: ICart;
  };
  message: string;
}

export interface CheckoutProcessResponse {
  success: boolean;
  data: {
    orderIds: string[];
    totalAmount: number;
    paymentLink: string;
    transactionReference: string;
    organizationsInvolved: string[];
  };
  message: string;
}