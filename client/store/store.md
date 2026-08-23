# `store`

## Purpose / Mục đích
- English: This folder stores shared client state management logic for data that must be accessed across multiple components or pages.
- Tiếng Việt: Thư mục này lưu logic quản lý state dùng chung phía client cho dữ liệu cần được truy cập ở nhiều component hoặc nhiều trang.

## What should live here / Nên đặt gì ở đây
- English: Zustand stores, Redux slices, context state modules, selectors, and shared state actions.
- Tiếng Việt: Zustand store, Redux slice, module state của context, selector và action state dùng chung.
- English: Centralized state that should not be recreated inside each component.
- Tiếng Việt: State trung tâm không nên bị tạo lại bên trong từng component riêng lẻ.

## What should not live here / Không nên đặt ở đây
- English: One-off local component state or server-only logic.
- Tiếng Việt: Local state chỉ dùng một lần trong component hoặc logic chỉ chạy phía server.

## Example / Ví dụ
- English: `auth-store.ts`, `theme-store.ts`, `sidebar-store.ts`
- Tiếng Việt: `auth-store.ts`, `theme-store.ts`, `sidebar-store.ts`
