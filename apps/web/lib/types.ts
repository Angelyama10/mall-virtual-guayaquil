export type UserRole = "CUSTOMER" | "MERCHANT" | "DRIVER" | "ADMIN" | "SUPER_ADMIN";

export type User = {
  id: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  isActive?: boolean;
  isSuspended?: boolean;
  createdAt?: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type ProductImage = {
  id: string;
  url: string;
  altText?: string | null;
  isPrimary: boolean;
};

export type ProductVariant = {
  id: string;
  name: string;
  price?: string | null;
  attributes?: Record<string, string> | null;
  inventory?: Array<{ stock: number; reservedStock: number; lowStockAlert: number }>;
};

export type Product = {
  id: string;
  storeId: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string | null;
  basePrice: string;
  compareAtPrice?: string | null;
  status: string;
  isFeatured: boolean;
  isAvailable: boolean;
  averageRating: string;
  reviewCount: number;
  store: { id: string; name: string; slug: string; status: string };
  category: { id: string; name: string; slug: string };
  images: ProductImage[];
  variants: ProductVariant[];
};

export type Store = {
  id: string;
  companyId: string;
  name: string;
  slug: string;
  status: string;
  isOpen: boolean;
  averageRating: string;
  reviewCount: number;
  company?: { id: string; name: string; slug: string };
  address?: {
    street: string;
    city: string;
    state?: string | null;
    reference?: string | null;
  } | null;
  settings?: {
    whatsappNumber?: string | null;
    instagramUrl?: string | null;
    acceptsWhatsapp: boolean;
    acceptsCash: boolean;
    acceptsCard: boolean;
    acceptsOnlinePayment: boolean;
    deliveryRadiusKm?: string | null;
    minimumOrderAmount?: string | null;
    freeDeliveryFromAmount?: string | null;
  } | null;
};

export type Address = {
  id: string;
  label?: string | null;
  street: string;
  city: string;
  state?: string | null;
  reference?: string | null;
  isDefault: boolean;
};

export type CartItem = {
  id: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  unitPrice?: string;
  totalPrice?: string;
  product: Pick<Product, "id" | "name" | "slug" | "basePrice" | "status" | "images">;
  variant?: ProductVariant | null;
};

export type Cart = {
  id: string;
  items: CartItem[];
  subtotal?: string;
  total?: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  userId: string;
  storeId: string;
  deliveryType: string;
  subtotal: string;
  deliveryFee: string;
  discount: string;
  total: string;
  status: string;
  notes?: string | null;
  createdAt: string;
  store?: Store;
  items?: Array<{
    id: string;
    productName: string;
    variantName?: string | null;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
  }>;
  payment?: {
    id: string;
    amount: string;
    currency: string;
    method: string;
    status: string;
  } | null;
  whatsappCheckoutUrl?: string;
};
