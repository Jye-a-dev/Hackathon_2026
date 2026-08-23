# `app/(dashboard)`

## Purpose / Mục đích
- English: This folder is for protected application pages that users see after signing in, such as overview, profile, settings, reports, or internal tools.
- Tiếng Việt: Thư mục này dùng cho các trang ứng dụng cần đăng nhập, ví dụ tổng quan, hồ sơ, cài đặt, báo cáo hoặc công cụ nội bộ.

## What should live here / Nên đặt gì ở đây
- English: Dashboard route pages, nested route groups, dashboard layouts, loading states, and error boundaries for authenticated pages.
- Tiếng Việt: Các trang route của dashboard, route group lồng nhau, layout dashboard, trạng thái loading và error boundary cho các trang đã xác thực.
- English: Page-level composition for protected screens.
- Tiếng Việt: Phần ghép giao diện ở cấp trang cho các màn hình cần bảo vệ.

## What should not live here / Không nên đặt ở đây
- English: Shared UI primitives, data fetching services, or global state definitions.
- Tiếng Việt: UI dùng chung, service gọi dữ liệu hoặc định nghĩa state toàn cục.

## Example / Ví dụ
- English: `app/(dashboard)/overview/page.tsx`, `app/(dashboard)/settings/page.tsx`
- Tiếng Việt: `app/(dashboard)/overview/page.tsx`, `app/(dashboard)/settings/page.tsx`
