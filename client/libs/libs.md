# `libs`

## Purpose / Mục đích
- English: This folder contains low-level library setup and integration code that connects the app to third-party packages or shared internal infrastructure.
- Tiếng Việt: Thư mục này chứa phần thiết lập thư viện mức thấp và mã tích hợp để kết nối app với package bên thứ ba hoặc hạ tầng dùng chung nội bộ.

## What should live here / Nên đặt gì ở đây
- English: HTTP client setup, authentication adapters, date libraries, logger setup, environment readers, and package wrappers.
- Tiếng Việt: Cấu hình HTTP client, adapter xác thực, thư viện ngày giờ, thiết lập logger, phần đọc biến môi trường và wrapper cho package.
- English: Thin integration code that other layers import.
- Tiếng Việt: Mã tích hợp mỏng để các tầng khác import lại sử dụng.

## What should not live here / Không nên đặt ở đây
- English: Route UI, page components, or business use-case orchestration.
- Tiếng Việt: Giao diện route, component trang hoặc phần điều phối use-case nghiệp vụ.

## Example / Ví dụ
- English: `axios.ts`, `auth-client.ts`, `env.ts`, `dayjs.ts`
- Tiếng Việt: `axios.ts`, `auth-client.ts`, `env.ts`, `dayjs.ts`
