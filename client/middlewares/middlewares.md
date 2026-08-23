# `middlewares`

## Purpose / Mục đích
- English: This folder is for middleware-related helpers or logic that control access, request flow, redirects, and security checks before a page or API handler runs.
- Tiếng Việt: Thư mục này dùng cho helper hoặc logic liên quan middleware để kiểm soát quyền truy cập, luồng request, chuyển hướng và kiểm tra bảo mật trước khi trang hoặc API handler chạy.

## What should live here / Nên đặt gì ở đây
- English: Auth guards, path matchers, role checks, locale redirects, and reusable middleware helper functions.
- Tiếng Việt: Auth guard, path matcher, kiểm tra role, chuyển hướng theo ngôn ngữ và các helper middleware tái sử dụng.
- English: Shared logic that can support a root `middleware.ts` file.
- Tiếng Việt: Logic dùng chung để hỗ trợ cho file `middleware.ts` ở root.

## What should not live here / Không nên đặt ở đây
- English: UI components, client-side hooks, or page-specific business logic.
- Tiếng Việt: UI component, hook phía client hoặc logic nghiệp vụ chỉ dành cho một trang cụ thể.

## Example / Ví dụ
- English: `auth-guard.ts`, `match-protected-route.ts`, `role-access.ts`
- Tiếng Việt: `auth-guard.ts`, `match-protected-route.ts`, `role-access.ts`
