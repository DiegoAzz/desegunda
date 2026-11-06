export type ProductType = 'NEW' | 'USED' | 'GIFT' | 'DIGITAL';

export type ProductCondition = 'GOOD' | 'DETAILS' | 'DAMAGED';

export type ProductStatus =
  | 'DRAFT'
  | 'AVAILABLE'
  | 'RESERVED'
  | 'SOLD'
  | 'GIVEN_AWAY'
  | 'HIDDEN';

export const DEFAULT_CATEGORIES = [
  'Tecnología',
  'Electrodomésticos',
  'Hogar',
  'Muebles',
  'Ropa',
  'Herramientas',
  'Servicios Digitales',
  'Otros',
] as const;

export const CATEGORIES = DEFAULT_CATEGORIES;

export type Category = string;

export interface ProductImageItem {
  id: string;
  productId: string;
  storagePath: string;
  sortOrder: number;
  altText: string | null;
}

export interface ProductItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: ProductType;
  category: string;
  condition: ProductCondition | null;
  damageDetails: string | null;
  priceCop: number | null;
  stock: number;
  acceptsOffers: boolean;
  status: ProductStatus;
  deliveryArea: string | null;
  videoUrl?: string | null;
  allowWompiPayment?: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  images: ProductImageItem[];
}

export interface StoreSettingsItem {
  id: string;
  storeName: string;
  tagline: string;
  whatsappNumber: string;
  defaultDeliveryArea: string;
  logoPath: string | null;
}
