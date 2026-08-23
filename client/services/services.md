# `services`

## Purpose / Mục đích
- English: This folder contains business-facing service functions that fetch, send, transform, or coordinate data for the application.
- Tiếng Việt: Thư mục này chứa các hàm service hướng nghiệp vụ để lấy, gửi, biến đổi hoặc điều phối dữ liệu cho ứng dụng.

## What should live here / Nên đặt gì ở đây
- English: API request modules, auth services, profile services, dashboard data services, and use-case level data orchestration.
- Tiếng Việt: Module gọi API, service xác thực, service hồ sơ, service dữ liệu dashboard và phần điều phối dữ liệu ở mức use-case.
- English: Functions that sit above `libs` and below page components.
- Tiếng Việt: Các hàm nằm phía trên `libs` và phía dưới page/component.

## What should not live here / Không nên đặt ở đây
- English: Raw UI components or tiny generic helpers unrelated to business data flow.
- Tiếng Việt: UI component thuần hoặc helper nhỏ không liên quan luồng dữ liệu nghiệp vụ.

## Example / Ví dụ
- English: `auth.service.ts`, `user.service.ts`, `dashboard.service.ts`
- Tiếng Việt: `auth.service.ts`, `user.service.ts`, `dashboard.service.ts`
