# `constants`

## Purpose / Mục đích
- English: This folder stores fixed values that do not change at runtime, such as labels, route names, enum-like maps, limits, and default settings.
- Tiếng Việt: Thư mục này lưu các giá trị cố định không thay đổi khi chạy, ví dụ nhãn hiển thị, tên route, map kiểu enum, giới hạn và cấu hình mặc định.

## What should live here / Nên đặt gì ở đây
- English: Static configuration objects, route constants, menu definitions, and reusable app-wide labels.
- Tiếng Việt: Object cấu hình tĩnh, hằng số route, định nghĩa menu và các nhãn dùng lại toàn app.
- English: Values that help avoid hard-coded strings scattered across files.
- Tiếng Việt: Các giá trị giúp tránh việc viết chuỗi cứng rải rác ở nhiều file.

## What should not live here / Không nên đặt ở đây
- English: Functions with behavior, async logic, or user-specific state.
- Tiếng Việt: Function có hành vi xử lý, logic bất đồng bộ hoặc state phụ thuộc người dùng.

## Example / Ví dụ
- English: `ROUTES`, `APP_NAME`, `DEFAULT_PAGE_SIZE`, `NAV_ITEMS`
- Tiếng Việt: `ROUTES`, `APP_NAME`, `DEFAULT_PAGE_SIZE`, `NAV_ITEMS`
