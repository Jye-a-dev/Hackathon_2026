# `components/layouts/(dashboard)`

## Purpose / Mục đích
- English: This folder contains dashboard-specific layout components used to wrap authenticated pages with a consistent shell.
- Tiếng Việt: Thư mục này chứa các component layout dành riêng cho dashboard để bọc các trang đã đăng nhập bằng một khung giao diện thống nhất.

## What should live here / Nên đặt gì ở đây
- English: Sidebar layouts, dashboard headers, content wrappers, page sections, and dashboard-only navigation containers.
- Tiếng Việt: Layout có sidebar, header dashboard, wrapper nội dung, section của trang và các container điều hướng chỉ dùng cho dashboard.
- English: Components that define screen structure, not business data logic.
- Tiếng Việt: Các component định nghĩa khung màn hình, không phải logic dữ liệu nghiệp vụ.

## What should not live here / Không nên đặt ở đây
- English: API calls, store logic, or generic base components used by every part of the app.
- Tiếng Việt: API call, logic store hoặc base component dùng chung cho toàn bộ app.

## Example / Ví dụ
- English: `DashboardShell`, `DashboardSidebar`, `DashboardTopbar`
- Tiếng Việt: `DashboardShell`, `DashboardSidebar`, `DashboardTopbar`
