# Next Client Template

## Clone repo này
```bash
git clone  https://github.com/Jye-a-dev/template_next_client.git
```
Template khởi tạo cho frontend dùng **Next.js App Router** theo hướng dễ mở rộng, rõ layout, rõ route group, và đủ gọn để làm base cho project mới.

## Stack hiện tại

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- ESLint

Template này phù hợp khi bạn muốn bắt đầu với một client app bằng Next.js nhưng vẫn giữ cấu trúc folder rõ từ đầu để mở rộng tiếp cho `public`, `auth`, `dashboard`, `services`, `store`, `types`, `utils`.

## 1. Project này đang setup theo kiểu nào?

Repo hiện tại là kiểu:

`Next.js + React + TypeScript + Tailwind CSS + App Router`

Đây là setup phù hợp cho:

- Website có nhiều khu vực giao diện
- Dashboard hoặc admin panel
- Client app cần chia layout theo nhóm route
- Dự án muốn chuẩn bị sẵn khung `public`, `auth`, `dashboard`
- Team muốn đi theo file-based routing của Next.js

Template này hiện đang là một base giao diện tối giản:

- đã có route group `app/(public)`
- đã có khung layout `@base` và `(public)`
- đã có folder placeholder cho `auth` và `dashboard`
- đã có các folder nền cho `services`, `store`, `types`, `utils`, `hooks`, `libs`, `constants`

## 2. Khi nào nên dùng template này?

Nên dùng template này khi bạn cần:

- file-based routing của Next.js
- layout theo khu vực như `public`, `auth`, `dashboard`
- khả năng mở rộng dần từ template nhỏ lên project lớn
- React + TypeScript nhưng không muốn tự dựng cấu trúc từ đầu

Không nên dùng template này nếu bạn cần một project cực nhỏ chỉ có 1 đến 2 component demo. Khi đó `create-next-app` mặc định là đủ.

## 3. Khi nào nên chọn Next.js thay vì React + Vite?

Nên chọn **Next.js** khi bạn muốn:

- routing theo file/folder
- layout lồng nhau
- metadata theo route
- khả năng mở rộng sang SSR, SSG hoặc full-stack sau này
- tổ chức app theo App Router ngay từ đầu

Nên chọn **React + Vite** nếu bạn chỉ cần một SPA client-side rất gọn, không cần cơ chế route/layout kiểu Next.js, và muốn setup tối thiểu hơn.

Project này đang đi theo hướng **Next.js App Router**, không phải `React + Vite + React Router`.

## 4. Cài và chạy project

### Yêu cầu

- Node.js 20+
- npm 10+

### Cài dependency

```bash
npm install
```

### Chạy môi trường dev

```bash
npm run dev
```

### Build production

```bash
npm run build
```

### Chạy production server

```bash
npm run start
```

### Lint

```bash
npm run lint
```

## 5. Cấu trúc thư mục hiện tại

```text
app/
├─ (auth)/
│  └─ Auth.md
├─ (dashboard)/
│  └─ Dashbaord.md
├─ (public)/
│  ├─ layout.tsx
│  └─ page.tsx
└─ globals.css

components/
├─ layouts/
│  ├─ (dashboard)/
│  │  └─ dashboeard.md
│  ├─ (public)/
│  │  ├─ Footer/
│  │  │  └─ PublicFooter.tsx
│  │  ├─ Navbar/
│  │  │  └─ PublicNavbar.tsx
│  │  └─ PublicSetup.tsx
│  └─ @base/
│     ├─ Footer/
│     │  └─ BaseFooter.tsx
│     └─ Navbar/
│        └─ BaseNavbar.tsx
└─ pages/
   └─ MainPage/
      └─ Index.tsx

constants/
hooks/
libs/
middlewares/
public/
├─ img/
│  └─ img.md
services/
store/
types/
utils/
```

## 6. Ý nghĩa chính của từng phần

- `app/`: nơi chứa route theo chuẩn App Router của Next.js
- `app/(public)`: khu vực public hiện đang được render thật
- `app/(auth)`: nơi chuẩn bị cho các route xác thực
- `app/(dashboard)`: nơi chuẩn bị cho các route sau đăng nhập
- `components/layouts/@base`: các khung layout gốc, chỉ lo phần shell
- `components/layouts/(public)`: các layout component dành riêng cho public area
- `components/pages`: UI page-level đã tách khỏi route file
- `constants`: nơi để hằng số cố định
- `hooks`: nơi để custom hooks
- `libs`: nơi để setup thư viện dùng chung
- `middlewares`: nơi để helper cho middleware hoặc logic guard
- `services`: nơi để logic gọi API hoặc orchestration dữ liệu
- `store`: nơi để state dùng chung nếu project cần
- `types`: nơi để type/interface dùng chung
- `utils`: nơi để helper function thuần
- `public/img`: nơi để static image phục vụ trực tiếp qua URL

## 7. Luồng render hiện tại của app

Luồng cơ bản hiện tại:

```text
Request "/"
-> app/(public)/layout.tsx
-> components/layouts/(public)/PublicSetup.tsx
-> PublicNavbar
-> BaseNavbar
-> app/(public)/page.tsx
-> components/pages/MainPage/Index.tsx
-> PublicFooter
-> BaseFooter
```

Ý nghĩa:

- `layout.tsx` lo khung ngoài cùng của route group
- `PublicSetup.tsx` compose navbar, nội dung và footer
- `PublicNavbar.tsx` và `PublicFooter.tsx` truyền nội dung vào base layout
- `BaseNavbar.tsx` và `BaseFooter.tsx` chỉ là khung nhận `props`
- `page.tsx` chỉ render page component chính

## 8. Quy ước layout hiện tại

Project đang đi theo hướng:

- `@base` chỉ là khung
- layout cụ thể sẽ truyền nội dung vào base qua `props`
- phần setup theo khu vực như `public` sẽ là nơi gọi navbar, footer và bọc `children`

Ví dụ:

- `BaseNavbar.tsx`: nhận `brand`, `action`
- `BaseFooter.tsx`: nhận `left`, `right`
- `PublicNavbar.tsx`: truyền brand/action cụ thể cho public area
- `PublicFooter.tsx`: truyền nội dung footer cụ thể cho public area
- `PublicSetup.tsx`: compose `PublicNavbar`, `children`, `PublicFooter`

Cách chia này giúp:

- base component sạch hơn
- layout dễ tái sử dụng
- nội dung theo từng khu vực không bị cứng trong base

## 9. Tailwind trong project này

Project hiện dùng **Tailwind CSS 4** qua CSS import:

```css
@import "tailwindcss";
```

Hiện tại project chưa dùng `@tailwindcss/vite` vì đây là repo Next.js, không phải Vite app.

Nên dùng Tailwind trong repo này cho:

- layout
- spacing
- typography
- border
- responsive

Khi project lớn hơn, có thể chuẩn hóa tiếp:

- color tokens
- spacing tokens
- reusable wrappers
- component variants

## 10. TypeScript trong project này

Project đang bật TypeScript với cấu hình đủ dùng cho Next.js:

- `strict: true`
- alias `@/*`
- `moduleResolution: "bundler"`
- plugin Next.js trong `tsconfig.json`

Nên giữ nguyên hướng:

- type dùng chung đặt trong `types/`
- prop type đặt gần component nếu chỉ dùng cục bộ
- tránh để type rải rác không có tổ chức

## 11. Quy tắc tổ chức code nên giữ

- `page.tsx` chỉ nên lo ghép màn hình ở mức route
- `components/pages` nên chứa UI theo page nhưng tách khỏi route file
- `components/layouts` chỉ nên lo shell và structure
- `@base` không nên chứa nội dung cứng theo từng khu vực
- `services` không render UI
- `hooks` không chứa JSX
- `utils` nên là pure function càng nhiều càng tốt
- `types` nên là nơi tập trung contract dùng chung

## 12. Hướng mở rộng hợp lý cho repo này

Từ base hiện tại, bạn có thể mở rộng thêm:

- auth flow
- protected dashboard routes
- middleware guard
- API client wrapper
- env config
- global store
- form library như React Hook Form
- schema validation bằng Zod
- loading state và error boundary
- toast system
- theme switch

Nếu app lớn dần, có thể bổ sung thêm:

- `features/`
- `schemas/`
- `providers/`
- `api/`

## 13. Khi nào nên tách theo feature?

Nên tách theo feature khi:

- app có nhiều module nghiệp vụ rõ ràng
- mỗi module có page, service, type, hook riêng
- team có nhiều người cùng làm song song

Ví dụ sau này:

```text
features/
├─ auth/
├─ dashboard/
├─ profile/
└─ orders/
```

Nếu project vẫn nhỏ, giữ cấu trúc hiện tại là đủ và dễ đọc hơn.

## 14. Checklist khi dùng template này để bắt đầu project mới

- đổi tên metadata và brand theo dự án thật
- thêm route thật vào `app/(public)`, `app/(auth)`, `app/(dashboard)`
- bổ sung middleware nếu có protected route
- thêm service layer để gọi backend
- chuẩn hóa type dùng chung
- thêm state management nếu app cần
- thống nhất naming convention từ đầu
- giữ `base` là khung, không nhét nội dung nghiệp vụ vào đó

## 15. Tóm tắt

Nếu bạn muốn một base Next.js có:

- App Router
- cấu trúc layout rõ
- route group rõ
- component base/public tách vai trò rõ
- sẵn chỗ để scale tiếp

thì repo này đang đi đúng hướng.

Nó không còn là template `React + Vite + React Router`, mà là một **Next.js client-oriented template** với cấu trúc đủ sạch để phát triển tiếp thành website, dashboard hoặc frontend app có nhiều khu vực giao diện.
