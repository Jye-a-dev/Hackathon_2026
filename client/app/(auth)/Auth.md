# `app/(auth)`

## Purpose / Mục đích
- English: This folder contains authentication routes such as login, register, forgot password, reset password, or verify account screens.
- Tiếng Việt: Thư mục này chứa các route liên quan đến xác thực như đăng nhập, đăng ký, quên mật khẩu, đặt lại mật khẩu hoặc xác minh tài khoản.

## What should live here / Nên đặt gì ở đây
- English: Route files like `page.tsx`, nested layouts, loading states, and auth-specific UI pages.
- Tiếng Việt: Các file route như `page.tsx`, layout lồng nhau, trạng thái loading và các trang giao diện dành riêng cho xác thực.
- English: Form pages that only exist for signing in or managing access.
- Tiếng Việt: Các trang form chỉ phục vụ đăng nhập hoặc quản lý quyền truy cập.

## What should not live here / Không nên đặt ở đây
- English: Shared business logic, API clients, or reusable validation helpers. Those should go into `services`, `libs`, `utils`, or `types`.
- Tiếng Việt: Logic nghiệp vụ dùng chung, API client hoặc helper validation tái sử dụng. Các phần đó nên đặt trong `services`, `libs`, `utils` hoặc `types`.

## Example / Ví dụ
- English: `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`
- Tiếng Việt: `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`
