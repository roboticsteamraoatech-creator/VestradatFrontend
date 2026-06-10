"use client";

import { useState } from 'react';
import { MapPin, ShoppingCart, Eye, Package, Scissors } from 'lucide-react';
import type { PublicProduct } from '@/types/publicProduct';

interface ProductCardProps {
  product: PublicProduct;
  onViewDetails: (product: PublicProduct) => void;
  onAddToCart?: (productId: string) => Promise<void> | void; 
  formatCurrency: (amount: number) => string;
}

const ProductCard = ({ product, onViewDetails, onAddToCart, formatCurrency }: ProductCardProps) => {
  const [adding, setAdding] = useState(false);

  const handleAddToCartClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!onAddToCart) return;
    try {
      setAdding(true);
      await onAddToCart(product.id);
    } catch (err) {
      console.error(err);
    } 
    finally {
      setAdding(false);
    }
  };

  const isService = product.itemType === 'service';
  const isOutOfStock = product.itemType === 'product' && product.availableQuantity <= 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 p-3 flex flex-col justify-between space-y-4">
      
      {/* Product Image Window Frame */}
      <div className="bg-gray-50 aspect-[4/3] rounded-xl flex items-center justify-center p-2 relative overflow-hidden group">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
            {isService ? (
              <Scissors className="w-8 h-8 text-gray-400" />
            ) : (
              <Package className="w-8 h-8 text-gray-400" />
            )}
          </div>
        )}

        {/* Top Floating Badges (Out of Stock indicator) */}
        {isOutOfStock && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm uppercase tracking-wide">
            Out of Stock
          </div>
        )}
      </div>

      {/* Product Informational Details Section */}
      <div className="flex-1 space-y-2.5 px-1">
        
        {/* Title, Brand, Category */}
        <div className="space-y-0.5">
          <h3 className="text-base font-bold text-gray-900 leading-snug truncate">{product.name}</h3>
          <p className="text-xs text-[#5d2a8b] font-semibold truncate">
            {product.location?.brandName || product.businessName}
          </p>
          <p className="text-xs text-gray-400 font-medium">{product.categoryName}</p>
        </div>

        {/* Location Section */}
        {product.location && (
          <div className="space-y-1">
            <div className="flex items-center text-xs text-gray-500 font-medium truncate">
              <MapPin className="w-3.5 h-3.5 text-gray-400 mr-1 flex-shrink-0" />
              <span>
                {product.location.brandName ? `${product.location.brandName} • ` : ""}
                {product.location.city.trim()}, {product.location.state.trim()}
              </span>
            </div>
            
            {product.location.verified && (
              <div className="flex items-center text-[11px] text-green-600 font-bold gap-1 mt-0.5">
                <span className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center text-[9px]">✔</span>
                Verified Location
              </div>
            )}
          </div>
        )}

        {/* Price display block */}
        <div className="pt-1 flex items-baseline justify-between">
          <span className="text-lg font-extrabold text-[#5d2a8b]">
            {formatCurrency(product.finalPrice)}
          </span>
        </div>

        {/* Stock status readout */}
        {!isService && (
          <div className="flex items-center text-xs text-gray-400 gap-1 mt-1 font-medium">
            <span className="text-gray-500">📦</span>
            <span className={isOutOfStock ? "text-red-500 font-semibold" : ""}>
              {isOutOfStock ? "0 left in stock" : `${product.availableQuantity} left`}
            </span>
          </div>
        )}
      </div>

      {/* Card Footer Actions Controls */}
      <div className={isService ? "w-full pt-1" : "grid grid-cols-2 gap-2 pt-1"}>
        {isService ? (
          <button 
            type="button"
            onClick={() => onViewDetails(product)}
            className="w-full py-2.5 px-3 bg-[#5d2a8b] hover:bg-[#7a3aa3] text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1 shadow-sm"
          >
            <Eye size={14} />
            View Details
          </button>
        ) : (
          <>
            <button 
              type="button"
              onClick={() => onViewDetails(product)}
              className="py-2.5 px-3 border border-[#5d2a8b] text-[#5d2a8b] hover:bg-purple-50/50 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1"
            >
              <Eye size={14} />
              Details
            </button>
            
            <button 
              type="button"
              disabled={adding || isOutOfStock}
              onClick={handleAddToCartClick}
              className="py-2.5 px-3 bg-[#5d2a8b] hover:bg-[#7a3aa3] text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1 disabled:bg-gray-300"
            >
              <ShoppingCart size={14} />
              {adding ? "Adding..." : isOutOfStock ? "Out of Stock" : "Add to Cart"}
            </button>
          </>
        )}
      </div>

    </div>
  );
};

export default ProductCard;