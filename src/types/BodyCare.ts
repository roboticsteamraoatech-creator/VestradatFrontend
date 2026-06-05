

export interface SubService {
  name: string;
  description: string;
  subPlatformUniqueCode: string;
  uploadPicture: string;
  price: number;
}

export interface ExtendedPublicProductDetails {
  product: {
    id: string;
    organizationId: string;
    name: string;
    title: string;
    itemType: 'product' | 'service';
    location: {
      brandName: string;
      address: string;
      verified: boolean;
    };
    images: {
      main: string | null;
      video: string | null;
      all: string[];
      thumbnails: string[];
    };
    pricing: {
      originalPrice: number;
      priceAfterDiscount: number;
      platformChargePercentage: number;
      platformChargeAmount: number;
      finalPrice: number;
      youSave: number;
      discount: number;
      discountAmount: number;
      upfrontPaymentPercentage: number;
      upfrontPaymentAmount: number;
      remainingBalance: number;
    };
    productInfo: {
      category: string;
      industry: string;
      availableQuantity: number;
      sku: string;
      upc: string;
      platformUniqueCode: string;
    };
    description: string;
    ingredients: string;
    paymentMethods: string;
    notes: string;
    totalAvailableServiceProviders?: number;
    hasSubServices?: boolean;
    subServiceCount?: number;
    subServices?: SubService[];
    availability?: {
      type: string;
    };
  };
  serviceProvider: {
    producer: string;
    contact: {
      phone: string;
      email: string;
    };
    availability: {
      hours: string;
      days: string;
    };
  };
  serviceLocations: Array<{
    title: string;
    subtitle: string;
    fee: number;
    address: string;
    lga: string;
    state: string;
    country: string;
    verified: boolean;
    gallery: {
      images: string[];
      videos: string[];
    };
  }>;
}

export interface ProductCardProps {
  product: {
    id: string;
    name: string;
    title: string;
    itemType: 'product' | 'service';
    categoryName: string;
    industryName: string;
    originalPrice: number;
    discountedPrice: number;
    discount: number;
    youSave: number;
    availableQuantity: number;
    sku: string;
    upc: string;
    platformUniqueCode: string;
    imageUrl: string | null;
    videoUrl: string | null;
    location: {
      brandName: string;
      address: string;
      city: string;
      state: string;
      country: string;
      verified: boolean;
    } | null;
    businessName: string;
    createdAt: string;
    updatedAt: string;
  };
  onViewDetails: (product: any) => void;
  formatCurrency: (amount: number) => string;
}