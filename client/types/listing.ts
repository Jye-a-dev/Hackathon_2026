// ─────────────────────────────────────────────
// types/listing.ts
// ─────────────────────────────────────────────
export type ListingStatus = 'ACTIVE' | 'AVAILABLE' | 'SOLD' | 'RESERVED' | 'INACTIVE';
export type ListingCondition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR';
export type ListingCategory =
  | 'FASHION'
  | 'ELECTRONICS'
  | 'ACCESSORIES'
  | 'SNEAKERS'
  | 'CAMERA'
  | 'BOOKS'
  | 'SPORTS'
  | 'OTHER';

export interface SellerProfile {
  id: string;
  username: string;
  avatarUrl?: string;
  rating: number;          // 0–5
  totalDeals?: number;
  isVerified: boolean;
  responseTimeMin?: number; // average response time in minutes
}

export interface Listing {
  id: string;
  title: string;
  description?: string;
  price: number;          // VNĐ
  images: string[];       // array of image URLs
  category: ListingCategory;
  condition: ListingCondition;
  status: ListingStatus;
  location: {
    district: string;     // Quận/Huyện
    city: string;         // Tỉnh/Thành phố
  };
  seller: SellerProfile;
  sellerId?: string;
  sellerWallet?: string;
  userId?: string;
  createdAt: string;      // ISO date string
  viewCount?: number;
  likeCount?: number;
}

export interface ListingQueryParams {
  category?: ListingCategory;
  page?: number;
  limit?: number;
  radiusKm?: number;
  lat?: number;
  lng?: number;
  search?: string;
  status?: ListingStatus;
}

export interface PaginatedListings {
  data: Listing[];
  meta: {
    total: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
  };
}
