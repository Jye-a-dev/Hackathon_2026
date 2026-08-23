# `utils`

## Purpose / Mục đích
- English: This folder contains small reusable helper functions that are generic, stateless, and not tied to a specific feature.
- Tiếng Việt: Thư mục này chứa các helper nhỏ có thể tái sử dụng, mang tính tổng quát, không có state và không gắn chặt với một tính năng cụ thể.

## What should live here / Nên đặt gì ở đây
- English: Formatters, parsers, string helpers, date helpers, number helpers, and reusable pure functions.
- Tiếng Việt: Hàm format, parser, helper xử lý chuỗi, helper ngày giờ, helper số liệu và các pure function dùng lại được.
- English: Code that can be safely imported almost anywhere without side effects.
- Tiếng Việt: Mã có thể được import ở hầu hết mọi nơi mà không gây side effect.

## What should not live here / Không nên đặt ở đây
- English: React hooks, service calls, or folder-specific business rules.
- Tiếng Việt: React hook, lời gọi service hoặc rule nghiệp vụ gắn với một folder cụ thể.

## Example / Ví dụ
- English: `format-date.ts`, `cn.ts`, `slugify.ts`, `currency.ts`
- Tiếng Việt: `format-date.ts`, `cn.ts`, `slugify.ts`, `currency.ts`
