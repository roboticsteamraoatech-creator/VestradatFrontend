// services/CartService.ts

import { CartResponse, CheckoutProcessResponse } from '@/types/cart';

const BASE_URL = 'https://datacapture-backend.onrender.com';

export class CartService {
  private static getHeaders(token: string) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  static async getCart(token: string): Promise<CartResponse> {
    const response = await fetch(`${BASE_URL}/api/cart`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    return response.json();
  }

  static async addToCart(galleryItemId: string, quantity: number, token: string): Promise<CartResponse> {
    const response = await fetch(`${BASE_URL}/api/cart/add`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify({ galleryItemId, quantity }),
    });
    return response.json();
  }

  static async updateQuantity(galleryItemId: string, quantity: number, token: string): Promise<CartResponse> {
    const response = await fetch(`${BASE_URL}/api/cart/update/${galleryItemId}`, {
      method: 'PATCH',
      headers: this.getHeaders(token),
      body: JSON.stringify({ quantity }),
    });
    return response.json();
  }

  static async removeItem(galleryItemId: string, token: string): Promise<CartResponse> {
    const response = await fetch(`${BASE_URL}/api/cart/remove/${galleryItemId}`, {
      method: 'DELETE',
      headers: this.getHeaders(token),
    });
    return response.json();
  }

  static async setPaymentType(galleryItemId: string, paymentType: 'full' | 'upfront', token: string): Promise<CartResponse> {
    const response = await fetch(`${BASE_URL}/api/cart/payment-type/${galleryItemId}`, {
      method: 'PATCH',
      headers: this.getHeaders(token),
      body: JSON.stringify({ paymentType }),
    });
    return response.json();
  }

  static async toggleCheck(galleryItemId: string, token: string): Promise<CartResponse> {
    const response = await fetch(`${BASE_URL}/api/cart/toggle-check/${galleryItemId}`, {
      method: 'PATCH',
      headers: this.getHeaders(token),
    });
    return response.json();
  }

  static async clearCart(token: string): Promise<CartResponse> {
    const response = await fetch(`${BASE_URL}/api/cart/clear`, {
      method: 'DELETE',
      headers: this.getHeaders(token),
    });
    return response.json();
  }

  static async processCheckout(payload: { customerName: string; customerPhone?: string; platform: string }, token: string): Promise<CheckoutProcessResponse> {
    const response = await fetch(`${BASE_URL}/api/checkout/process`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(payload),
    });
    return response.json();
  }
}