import type { Listing, PaginatedListings, ListingQueryParams } from '@/types/listing';

export const MOCK_LISTINGS: Listing[] = [
  {
    id: 'lst-001',
    title: 'Máy ảnh Sony Alpha A7 III + Lens 28-70mm OSS Fullbox 99%',
    description: 'Máy chụp tầm 5k shot, nguyên zin chưa sửa chữa, kèm pin sạc zin, dây đeo, filter UV. Bao test 48h ký quỹ an toàn.',
    price: 24500000,
    images: [
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=1000&q=80',
    ],
    category: 'CAMERA',
    condition: 'LIKE_NEW',
    status: 'ACTIVE',
    location: {
      district: 'Quận 1',
      city: 'Hồ Chí Minh',
    },
    seller: {
      id: 'usr-hoangnam',
      username: 'Nam Vũ Photo',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      rating: 4.9,
      totalDeals: 64,
      isVerified: true,
      responseTimeMin: 5,
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // 35 min ago
    likeCount: 42,
    viewCount: 310,
  },
  {
    id: 'lst-002',
    title: 'Áo khoác da thật Vintage Biker Jacket size L chuẩn form',
    description: 'Da bò thật nhập Ý 100%, lót lụa satin êm ái, kéo khóa YKK đồng cổ. Mặc đúng 2 lần đi Đà Lạt.',
    price: 1850000,
    images: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?auto=format&fit=crop&w=1000&q=80',
    ],
    category: 'FASHION',
    condition: 'LIKE_NEW',
    status: 'ACTIVE',
    location: {
      district: 'Quận Bình Thạnh',
      city: 'Hồ Chí Minh',
    },
    seller: {
      id: 'usr-linhchi',
      username: 'Linh Chi Vintage',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      rating: 5.0,
      totalDeals: 112,
      isVerified: true,
      responseTimeMin: 2,
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 140).toISOString(), // 2h ago
    likeCount: 88,
    viewCount: 750,
  },
  {
    id: 'lst-003',
    title: 'Giày Nike Air Jordan 1 Retro High OG Chicago Lost & Found',
    description: 'Size 42.5 EU / 9 US. Mua tại Atmos Tokyo có hoá đơn điện tử, phụ kiện đầy đủ dây dự phòng và receipt.',
    price: 6800000,
    images: [
      'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=1000&q=80',
    ],
    category: 'SNEAKERS',
    condition: 'NEW',
    status: 'ACTIVE',
    location: {
      district: 'Cầu Giấy',
      city: 'Hà Nội',
    },
    seller: {
      id: 'usr-sneakerhead',
      username: 'Minh Hoàng Kicks',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      rating: 4.8,
      totalDeals: 38,
      isVerified: true,
      responseTimeMin: 10,
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
    likeCount: 156,
    viewCount: 1200,
  },
  {
    id: 'lst-004',
    title: 'Bàn phím cơ Custom Keychron Q1 Pro Wireless Knob Carbon',
    description: 'Switch Gateron Oil King đã lube mượt, stab plate mount cân chỉnh kỹ, gõ êm không ping rỗng.',
    price: 3200000,
    images: [
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=1000&q=80',
    ],
    category: 'ELECTRONICS',
    condition: 'GOOD',
    status: 'ACTIVE',
    location: {
      district: 'Quận 3',
      city: 'Hồ Chí Minh',
    },
    seller: {
      id: 'usr-techgeek',
      username: 'Duy Long Mech',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      rating: 4.9,
      totalDeals: 25,
      isVerified: false,
      responseTimeMin: 15,
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 500).toISOString(),
    likeCount: 34,
    viewCount: 420,
  },
  {
    id: 'lst-005',
    title: 'Đồng hồ Seiko 5 Sports SRPD55K1 Automatic Dây Thép',
    description: 'Mặt số đen huyền bí, dạ quang LumiBrite siêu sáng, chống nước 100m. Còn bảo hành chính hãng 8 tháng.',
    price: 4350000,
    images: [
      'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1000&q=80',
    ],
    category: 'ACCESSORIES',
    condition: 'LIKE_NEW',
    status: 'ACTIVE',
    location: {
      district: 'Quận 7',
      city: 'Hồ Chí Minh',
    },
    seller: {
      id: 'usr-watchvn',
      username: 'Watch Collector VN',
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80',
      rating: 5.0,
      totalDeals: 82,
      isVerified: true,
      responseTimeMin: 3,
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
    likeCount: 71,
    viewCount: 630,
  },
];

export function getMockListings(params?: ListingQueryParams): PaginatedListings {
  let filtered = [...MOCK_LISTINGS];
  if (params?.category && params.category !== 'OTHER') {
    filtered = filtered.filter((l) => l.category === params.category);
  }
  return {
    data: filtered,
    meta: {
      total: filtered.length,
      page: 1,
      limit: 10,
      hasNextPage: false,
    },
  };
}
