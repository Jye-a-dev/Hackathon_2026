# `hooks`

## Purpose / Mục đích
- English: This folder holds reusable React hooks that package stateful UI behavior into a clean interface.
- Tiếng Việt: Thư mục này chứa các React hook tái sử dụng để gom hành vi UI có state vào một giao diện sạch và dễ dùng lại.

## What should live here / Nên đặt gì ở đây
- English: Hooks such as form helpers, modal state hooks, screen-size hooks, debounce hooks, and data coordination hooks for components.
- Tiếng Việt: Các hook như helper cho form, hook quản lý modal, hook kích thước màn hình, debounce hook và hook phối hợp dữ liệu cho component.
- English: Hooks that are reused in more than one component or page.
- Tiếng Việt: Các hook được dùng lại ở nhiều component hoặc nhiều trang.

## What should not live here / Không nên đặt ở đây
- English: Plain utility functions with no React state, or full API service layers.
- Tiếng Việt: Utility function thuần không liên quan React state, hoặc toàn bộ tầng service gọi API.

## Example / Ví dụ
- English: `useToggle`, `useDebounce`, `useAuthRedirect`, `useTableState`
- Tiếng Việt: `useToggle`, `useDebounce`, `useAuthRedirect`, `useTableState`
