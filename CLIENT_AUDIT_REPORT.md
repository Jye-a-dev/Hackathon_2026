# BÁO CÁO KIỂM TOÁN TOÀN DIỆN FRONTEND & UX/UI: CLIENT TRUSTPASS / CHỢ KÝ QUỸ
**Target**: `client/` (Next.js 14+ App Router, TypeScript, Tailwind CSS v4, Zustand, TanStack Query v5)  
**Auditor**: Senior Frontend Architect & Principal Design System Engineer  
**Standard**: Luxury Minimalist Architecture (Apple / Linear / Grailed), Enterprise Type Safety & Zero-Mock Integrity

---

## 1. DEFECT MATRIX TABLE

| Component / File Path | Severity | Category | Root Cause & Current Code | Required Concrete Solution |
| :--- | :--- | :--- | :--- | :--- |
| `libs/api.ts` (L144-153) | **P0** | **Logic** | `ordersApi.create` omits `orderId`. Backend `CreateOrderDto` has `@IsNotEmpty() @IsNumberString() orderId!: string`. API returns 400 Bad Request immediately. | Generate cryptographic 64-bit numeric string (`Date.now().toString() + Math.floor(Math.random()*1000)`) in `ordersApi.create` or request backend schema adjustment. |
| `libs/api.ts` (L226-229) <br/> `hooks/useMarketplace.ts` (L122) | **P0** | **Logic** | `paymentsApi.getPaymentQr` calls `GET /orders/${orderId}/payment-qr`. Endpoint DOES NOT EXIST in NestJS backend (returns 404). Backend generates QR via `POST /payments/intent` with `{ orderId, amountVnd }`. | Refactor `usePaymentQr` and `paymentsApi` to invoke `POST /api/payments/intent` with `{ orderId, amountVnd }` and poll `GET /api/payments/intent/:id`. |
| `libs/socket.ts` (L59-67) <br/> `checkout/[orderId]/page.tsx` (L111-123) | **P0** | **Logic** | Client socket emits `join_order` and listens for `PAYMENT_LOCKED` / `PAYMENT_CONFIRMED`. Backend `EscrowGateway` ONLY listens to `subscribe:order` and broadcasts `escrow:updated` with `{ orderId, status }`. Real-time WS payment sync is dead. | Align WebSocket contract: `socket.emit('subscribe:order', { orderId })`, listen to `escrow:updated` where `data.status === 'LOCKED'`, and leave via `unsubscribe:order`. |
| `app/(public)/sell/page.tsx` (L128-138) <br/> `libs/api.ts` (L122-127) | **P0** | **Logic** | `listingsApi.create` submits `FormData` (`multipart/form-data`) with keys `price_vnd`, `location_name`. Backend `ListingsController.create` expects JSON `CreateListingDto` (`priceVnd`, `locationName`, `sellerWallet`, `images: string[]`) with no Multer interceptor. Always throws 400. | Upload media to CDN/Cloudinary endpoint first to acquire URL array, then dispatch JSON payload matching `CreateListingDto` with `sellerWallet: user.id`. |
| `app/(public)/chat/page.tsx` (L73) | **P0** | **Logic** | `useConversations(currentWallet ? 'me' : '')` literally sends query param `?wallet=me`. Backend queries PostgreSQL `WHERE buyer_wallet = 'me' OR seller_wallet = 'me'`. Always returns 0 conversations. | Replace `'me'` with authenticated user ID/wallet: `useConversations(currentWallet)`. |
| `app/(public)/layout.tsx` (L13-19) vs Page Headers | **P0** | **UX/UI** | `(public)/layout.tsx` already renders `<PublicNavbar />`, `<PublicFooter />`, and `<MobileBottomNav />`. Pages (`orders/page.tsx`, `orders/[id]/page.tsx`, `checkout/[orderId]/page.tsx`, `chat/page.tsx`, `profile/page.tsx`, `search/page.tsx`) re-import and render `<Header />` and `<BottomNav />`, resulting in double-stacked headers and footers. | Purge all redundant `<Header />` and `<BottomNav />` imports inside route pages. Standardize global layout wrappers. |
| `components/orders/OrderStepper.tsx` (L63-88) | **P1** | **Logic / UI** | When `order.status === 'COMPLETED'`, `currentStep` = 4, but `isDone = currentStep > idx + 1` evaluates `4 > 4` (false) for step 4, rendering "Completed" as active neutral-900 instead of completed emerald Check. | Fix predicate: `const isDone = currentStep > idx + 1 \|\| (currentStep === 4 && idx === 3)`. |
| `components/orders/DisputeModal.tsx` (L45-56) <br/> `user/orders/page.tsx` (L151-165) | **P1** | **Logic** | Dispute forms send multipart `FormData` to `POST /orders/:id/dispute`. Backend `RaiseDisputeDto` is JSON (`{ buyerWallet, reason, evidenceUrls }`). Multer is not configured on dispute endpoint. | Send JSON `{ reason, evidenceUrls }` to `POST /orders/:id/dispute` or use dedicated endpoint `POST /orders/:id/dispute/evidence`. |
| `components/orders/DisputeModal.tsx` (L86-176) | **P1** | **UX / Logic** | Missing `react-hook-form` + `zod` schema. Form uses unvalidated local state, raw input, and inconsistent red tokens (`text-red-500`, `bg-red-600`). | Implement Zod schema `z.object({ reason: z.string().min(10), evidenceFiles: z.array(z.any()) })` with `useForm`. |
| `app/(public)/chat/page.tsx` (L184-192) <br/> `chat/[conversationId]/page.tsx` (L128-136) | **P1** | **Mock** | On API failure, chat catch block silently pushes a synthetic message (`id: 'msg-' + Date.now()`) to state without notifying user or indicating send failure. | Remove silent mock fallback. Set message status `FAILED`, display retry action, and trigger `toast.error()`. |
| `components/modules/ProductCard.tsx` (L50-56) <br/> `libs/normalizers.ts` (L89-91) | **P1** | **Mock** | Hardcoded synthetic seller fallback (`rating: 5.0`, `isVerified: true`) and Dicebear avatar synthesis if missing in DB. Normalizer synthesizes data rather than honoring nullable state. | Eliminate synthetic object. Render `null`/unverified UI state cleanly if seller metadata is absent. |
| `app/(public)/orders/[id]/page.tsx` (L128, 227) <br/> `user/orders/page.tsx` (L335) <br/> `OrderModal.tsx` (L80) | **P1** | **Logic / UX** | Leaking raw crypto jargon (`Vault PDA`, `LOCKED_IN_ESCROW`, `0.003 SOL`) with arbitrary conflicting exchange rates (`3,500,000` vs `5,000,000` VND/SOL) to fiat buyers. | Pure fiat abstraction: Format all amounts strictly in VNĐ via `Intl.NumberFormat`. Hide raw PDAs and SOL conversion from public buyer view. |
| `components/layouts/PublicNavbar.tsx` (L469) | **P1** | **UX** | Public header displays prominent badge `<span>Solana 48h Escrow</span>` to non-web3 visitors. | Rebrand to consumer-friendly trust badge: `<span>Ký quỹ An toàn 48h</span>` or `<span>Bảo chứng Quỹ Tự động</span>`. |
| `app/(public)/search/page.tsx` (L13-22) <br/> `orders/page.tsx` (L105) | **P1** | **UI** | Juvenile emojis (`✨`, `📷`, `💻`, `👕`, `👟`, `⌚`, `📚`, `⚽`, `⚠️`, `📦`, `⭐`) used as category icons and status headers. | Replace all emojis with refined Lucide icons (`Sparkles`, `Camera`, `Laptop`, `Shirt`, `Footprints`, `Watch`, `BookOpen`, `Trophy`, `AlertTriangle`). |
| `app/(public)/listings/[id]/page.tsx` (L196) <br/> `search/page.tsx` (L147) | **P1** | **UI** | Product media containers use `aspect-square sm:aspect-[4/3]` and `aspect-square` instead of the Luxury Minimalist standard `aspect-[4/5]`. | Enforce strict `aspect-[4/5]` fixed ratio across all listing cards, carousels, and media skeletons. |
| `app/(public)/page.tsx` (L27) <br/> `components/layouts/PublicNavbar.tsx` (L450, 662) | **P1** | **UI** | Non-standard Tailwind class `max-w-auto` and unconstrained container widths lacking `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`. Header and feed stretch to screen edges on ultrawide monitors. | Wrap all public content and navbar tiers in unified container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`. |
| `app/globals.css` (L151-155) | **P1** | **UI** | `.gradient-primary` defines clashing neon green-to-indigo gradient (`linear-gradient(135deg, #10b981 0%, #6366f1 100%)`). | Align with Luxury Minimalist Design System: Solid `bg-neutral-900` buttons with subtle emerald accents (`bg-emerald-600 hover:bg-emerald-700`, `border-emerald-200`). |
| `src/` Directory Duplication | **P2** | **Logic** | `client/src/` duplicates `client/` root directories (`src/components`, `src/domain`, `src/hooks`, `src/libs`, `src/services`) with circular re-exports, confusing module resolution. | Delete entire `client/src/` zombie tree; normalize `tsconfig.json` paths to `"@/*": ["./*"]`. |
| Dead Navigation Routes | **P2** | **UX** | Dead links in user and admin navbars: `/user/sales`, `/user/listings`, `/user/settings`, `/admin/logs` do not exist (return 404). | Implement placeholder dashboard modules or remove dead links from navigation configurations. |
| Duplicate Order & Profile Pages | **P2** | **Logic / UX** | Parallel route sets exist: `(public)/orders` vs `user/orders`; `(public)/profile` vs `user/dashboard`. Code and designs are diverging. | Consolidate onto authenticated `user/orders` and `user/dashboard` paths with Next.js middleware redirects. |

---

## 2. CRITICAL UX/UI FAILS (VISUAL BREAKDOWNS)

### 2.1 Double Headers and Double Footers Rendering Stack
- **Affected Files**:
  - [client/app/(public)/layout.tsx](file:///d:/Code/Hackathon/client/app/%28public%29/layout.tsx#L12-L19)
  - [client/app/(public)/orders/page.tsx](file:///d:/Code/Hackathon/client/app/%28public%29/orders/page.tsx#L58-L187)
  - [client/app/(public)/orders/[id]/page.tsx](file:///d:/Code/Hackathon/client/app/%28public%29/orders/%5Bid%5D/page.tsx#L133)
  - [client/app/(public)/checkout/[orderId]/page.tsx](file:///d:/Code/Hackathon/client/app/%28public%29/checkout/%5BorderId%5D/page.tsx#L288)
  - [client/app/(public)/chat/page.tsx](file:///d:/Code/Hackathon/client/app/%28public%29/chat/page.tsx#L229-L472)
  - [client/app/(public)/profile/page.tsx](file:///d:/Code/Hackathon/client/app/%28public%29/profile/page.tsx#L25-L117)
  - [client/app/(public)/search/page.tsx](file:///d:/Code/Hackathon/client/app/%28public%29/search/page.tsx#L58-L173)
- **Visual Breakdown**:  
  `PublicLayout` wraps all public route children with `<PublicNavbar />`, `<PublicFooter />`, and `<MobileBottomNav />`. Concurrently, each child page manually renders `<Header title="..." />` and `<BottomNav />`. On screen, this causes:
  1. Two sticky navbars stacked on top of each other at `top: 0`, consuming ~130px of vertical viewport.
  2. `components/common/Header.tsx` (L51-53) has its Brand logo commented out, showing a blank awkward space on the left.
  3. Two fixed bottom navigation bars overlapping at the bottom on mobile devices.

### 2.2 Broken Aspect Ratios on Product Media
- **Standard**: Strictly fixed `aspect-[4/5]` for luxury editorial product framing (Grailed / Linear style).
- **Violations**:
  - `components/common/ImageCarousel.tsx` & `(public)/listings/[id]/page.tsx` (L196): Uses `aspect-square sm:aspect-[4/3]`, resulting in horizontal distortion and banner-like image crops.
  - `(public)/listings/[id]/page.tsx` (L108): Skeleton uses `aspect-square`.
  - `(public)/search/page.tsx` (L147): Results grid items use `aspect-square w-full`.
  - `(public)/orders/page.tsx` (L152): Thumbnails use `h-16 w-16` rounded-2xl with inconsistent padding.

### 2.3 Unconstrained Containers on Ultrawide Displays
- **Affected Files**:
  - `app/(public)/page.tsx` (L27): `<div className="mx-auto max-w-auto px-4 py-6 sm:px-6 lg:px-8">` — `max-w-auto` is invalid Tailwind; feed spans full 3840px on 4K screens.
  - `components/layouts/PublicNavbar.tsx` (L450, 662): Header content lacks `max-w-7xl mx-auto`, pushing brand logo to the extreme left edge and profile pill to the extreme right edge.
  - `components/common/Header.tsx` (L49): `flex h-16 w-full items-center gap-4 px-4` lacks max-width bounding.

### 2.4 Color Clashes & Cheap Neon Gradients
- **Affected Files**:
  - `app/globals.css` (L151-153): `.gradient-primary` is hardcoded to `#10b981` (emerald) to `#6366f1` (neon indigo).
  - `app/(public)/listings/[id]/page.tsx` (L243): Primary CTA button uses `gradient-primary shadow-lg shadow-emerald-200`, looking like an amateur crypto token site rather than a luxury escrow marketplace.
  - Inconsistent status badges: Red hexes (`bg-red-100 text-red-800`, `text-red-500`) in `DisputeModal.tsx` and `(public)/orders/page.tsx` clash with the `rose-50` / `rose-700` design system tokens.
  - Background fragmentation: `#fafafa` vs `bg-slate-50` vs `bg-neutral-50` mixed arbitrarily across adjoining screens.

### 2.5 Juvenile Emojis & Unprofessional Typography
- **Affected Files**:
  - `app/(public)/search/page.tsx` (L14-22): Category filter bar renders raw OS emojis (`✨`, `📷`, `💻`, `👕`, `👟`, `⌚`, `📚`, `⚽`).
  - `app/(public)/orders/page.tsx` (L105): Empty/error banner displays `<p className="text-3xl mb-2">⚠️</p>`.
  - `app/(public)/listings/[id]/page.tsx` (L125, 252): `<p className="text-4xl mb-3">📦</p>` and CTA button reads `💬 Nhắn tin cho người bán`.
  - `app/(public)/profile/page.tsx` (L55): Rating rendered as `⭐ {user.rating.toFixed(1)} / 5.0`.

---

## 3. LOGIC DISCONNECTS & LEAKS

### 3.1 Order Creation Handshake Failure (P0 Blocker)
- **Client**: `client/libs/api.ts` (`ordersApi.create`)
  ```typescript
  const res = await http.post<unknown>('/orders', {
    buyerWallet: data.buyerWallet,
    sellerWallet: data.sellerWallet,
    listingId: data.listingId,
    amount: String(data.amountVnd),
  });
  ```
- **Backend**: `server/src/modules/escrow/dto/create-order.dto.ts`
  ```typescript
  export class CreateOrderDto {
    @IsNotEmpty()
    @IsNumberString()
    orderId!: string;
    ...
  }
  ```
- **Root Cause**: The client comment states `// Server generates orderId — no client-side Date.now()`, but the NestJS `ValidationPipe` strictly rejects requests lacking numeric `orderId` with `400 Bad Request: orderId should not be empty, orderId must be a number string`. No user can create an order.

### 3.2 VietQR Payment Intent & QR Generation Disconnect (P0 Blocker)
- **Client**: `client/libs/api.ts` (L226-229) & `hooks/useMarketplace.ts` (L122)
  ```typescript
  getPaymentQr: async (orderId: string): Promise<PaymentQrResponse> => {
    const res = await http.get<PaymentQrResponse>(`/orders/${orderId}/payment-qr`);
    return res.data;
  }
  ```
- **Backend**: Endpoint `GET /api/orders/:id/payment-qr` does not exist. The NestJS backend payment flow is located in `server/src/modules/payment/payment.controller.ts`:
  - `POST /api/payments/intent` with body `{ orderId: string, amountVnd: number }` creates a 15-minute intent, calculating SOL/VND rate and generating VietQR URL: `https://img.vietqr.io/image/970422-0888888888-compact2.png?...`.
  - `GET /api/payments/intent/:id` returns intent state.
- **Root Cause**: The checkout screen calls a non-existent URL, catches a 404, displays "Không thể tải mã QR", and halts checkout completely.

### 3.3 WebSocket Room & Event Synchronization Blackout (P0 Blocker)
- **Client**: `client/libs/socket.ts` (L59-67) & `app/(public)/checkout/[orderId]/page.tsx` (L111-123)
  ```typescript
  socket.emit('join_order', { orderId });
  socket.on('PAYMENT_LOCKED', handlePaymentSuccess);
  socket.on('PAYMENT_CONFIRMED', handlePaymentSuccess);
  ```
- **Backend**: `server/src/modules/escrow/escrow.gateway.ts` (L33, 64-77)
  ```typescript
  @SubscribeMessage('subscribe:order')
  handleSubscribeOrder(@MessageBody() data: { orderId: string }) { ... }

  this.server.to(`order:${orderId}`).emit('escrow:updated', eventData);
  ```
- **Root Cause**:
  1. Client emits `join_order`; server only listens to `subscribe:order`. Client is NEVER added to the socket room.
  2. Server emits event name `escrow:updated` with payload `{ orderId, status: 'LOCKED' }`; client listens for non-existent events `PAYMENT_LOCKED` and `PAYMENT_CONFIRMED`.
  3. Real-time VietQR payment notification NEVER reaches the frontend.

### 3.4 Listing Submission Crash on Multipart Form (P0 Blocker)
- **Client**: `app/(public)/sell/page.tsx` (L129-138)
  Sends `FormData` with fields `title`, `category`, `condition`, `price_vnd`, `location_name`, `images` (File objects).
- **Backend**: `server/src/modules/listings/listings.controller.ts` & `dto/create-listing.dto.ts`
  Accepts raw JSON with `sellerWallet`, `title`, `priceVnd`, `category`, `images?: string[]`. No Multer interceptor is attached to `POST /api/listings`.
- **Root Cause**: NestJS `ValidationPipe({ whitelist: true })` fails to parse multipart files, finds missing required `sellerWallet`, strips unknown keys `price_vnd` and `location_name`, and rejects with 400.

### 3.5 Conversation Lookup Broken by Hardcoded String (P0 Blocker)
- **Client**: `app/(public)/chat/page.tsx` (L73)
  ```typescript
  const { data: conversations } = useConversations(currentWallet ? 'me' : '');
  ```
- **Backend**: `server/src/modules/chat/chat.service.ts` (L32)
  Executes SQL: `SELECT ... WHERE buyer_wallet = $1 OR seller_wallet = $1` with parameter `$1 = 'me'`.
- **Root Cause**: Client passes the literal word `'me'` instead of `currentWallet`. Database matches zero records. Conversation list is permanently empty.

### 3.6 Multipart Dispute Upload Rejected by Backend (P1 Blocker)
- **Client**: `DisputeModal.tsx` & `user/orders/page.tsx` send `FormData` to `POST /api/orders/:id/dispute`.
- **Backend**: `OrdersController.raiseDispute` expects `RaiseDisputeDto` (`{ buyerWallet, reason, evidenceUrls: string[] }`).
- **Root Cause**: Multer is absent on `/orders/:id/dispute`. Sending binary `File` objects directly in `FormData` triggers 400 Bad Request.

### 3.7 Leaking Web3 Crypto Jargon to Public Buyers (P1 Defect)
- **Violations**:
  - `PublicNavbar.tsx` (L469): Header pill displays `Solana 48h Escrow`.
  - `(public)/orders/[id]/page.tsx` (L220-229): Receipt box displays `Vault PDA: Vault48h_...` and `Tương đương SOL: 0.003 SOL`.
  - `user/orders/page.tsx` (L335): Displays `≈ 0.003 SOL` with hardcoded multiplier `5_000_000`.
  - `checkout/[orderId]/page.tsx` (L144, 170): Displays `Khóa tiền an toàn trong Solana Vault`.
  - `user/dashboard/page.tsx` (L73): Displays `Được bảo vệ 100% tại Solana Vault`.
- **Root Cause**: Internal blockchain implementation details are exposed directly in customer-facing UI rather than presenting a seamless fiat e-commerce experience.

---

## 4. EXECUTION PRIORITY CHECKLIST (REFACTOR ROADMAP)

### Phase 1: P0 Operational Blockers (Contract & Communication Fixes)
- [ ] **Step 1.1: Fix Order Creation Contract**
  - File: `client/libs/api.ts` & `client/types/order.ts`
  - Action: Update `CreateOrderPayload` and `ordersApi.create` to supply a deterministic numeric `orderId` string (`Date.now().toString()`) satisfying NestJS `CreateOrderDto`.
- [ ] **Step 1.2: Refactor Payment QR to use Backend Payment Intent**
  - File: `client/libs/api.ts`, `client/hooks/useMarketplace.ts`, `client/app/(public)/checkout/[orderId]/page.tsx`
  - Action: Deprecate `getPaymentQr(/orders/:id/payment-qr)`. Update `usePaymentQr` to call `paymentsApi.createIntent(orderId, amountVnd)` and poll `paymentsApi.getIntent(intentId)`.
- [ ] **Step 1.3: Align WebSocket Namespace, Rooms, and Events**
  - File: `client/libs/socket.ts` & `client/app/(public)/checkout/[orderId]/page.tsx` & `client/app/(public)/orders/[id]/page.tsx`
  - Action: Update `joinOrderRoom` to emit `subscribe:order` with `{ orderId }`. Listen for `escrow:updated` event and verify `payload.status === 'LOCKED'`.
- [ ] **Step 1.4: Fix Sell Page Payload Casing & Image Pipeline**
  - File: `client/app/(public)/sell/page.tsx` & `client/libs/api.ts`
  - Action: Add `sellerWallet: user.id`, map `priceVnd: Number(values.price)` and `locationName: values.district + ', ' + values.city`. Convert file uploads to valid URL strings or match backend endpoint expectations.
- [ ] **Step 1.5: Fix Chat Conversation Wallet Parameter**
  - File: `client/app/(public)/chat/page.tsx`
  - Action: Change `useConversations(currentWallet ? 'me' : '')` to `useConversations(currentWallet)`.

### Phase 2: Architecture Clean-up & Anti-Duplication (P1)
- [ ] **Step 2.1: Eliminate Double Headers and Footers**
  - Files: `app/(public)/orders/page.tsx`, `app/(public)/orders/[id]/page.tsx`, `app/(public)/checkout/[orderId]/page.tsx`, `app/(public)/chat/page.tsx`, `app/(public)/profile/page.tsx`, `app/(public)/search/page.tsx`
  - Action: Remove all `<Header ... />` and `<BottomNav />` imports and JSX tags from route page files. Rely exclusively on `PublicLayout` and `UserLayout`.
- [ ] **Step 2.2: Delete Zombie `src/` Directory**
  - Action: Remove `client/src/` completely. Ensure `tsconfig.json` only contains `"@/*": ["./*"]`.
- [ ] **Step 2.3: Remove Deprecated `components/common/Header.tsx` and `BottomNav.tsx`**
  - Action: Delete `client/components/common/Header.tsx` (which has broken/missing brand logo) and duplicate `client/components/common/BottomNav.tsx`.

### Phase 3: Visual Polish & Luxury Minimalist Standard (P1/P2)
- [ ] **Step 3.1: Unify Container Bounds**
  - Files: `app/(public)/page.tsx`, `components/layouts/PublicNavbar.tsx`
  - Action: Replace `max-w-auto` with `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`. Wrap `PublicNavbar` inner content in `max-w-7xl mx-auto`.
- [ ] **Step 3.2: Enforce Strict `aspect-[4/5]` Media Frames**
  - Files: `components/modules/ProductCard.tsx`, `components/common/ImageCarousel.tsx`, `app/(public)/search/page.tsx`, `app/(public)/listings/[id]/page.tsx`
  - Action: Standardize all product image containers, carousels, and card skeletons to fixed `aspect-[4/5] overflow-hidden`.
- [ ] **Step 3.3: Purge Neon Gradients & Clashing Palette**
  - Files: `app/globals.css`, `app/(public)/listings/[id]/page.tsx`
  - Action: Replace `.gradient-primary` with refined solid neutral luxury styling (`bg-neutral-900 text-white hover:bg-neutral-800` with emerald badges `bg-emerald-50 text-emerald-800 border-emerald-200`).
- [ ] **Step 3.4: Eradicate Juvenile Emojis**
  - Files: `app/(public)/search/page.tsx`, `app/(public)/orders/page.tsx`, `app/(public)/listings/[id]/page.tsx`, `app/(public)/profile/page.tsx`
  - Action: Replace all raw emojis with Lucide SVG icons.

### Phase 4: Business Logic & State Machine Refinements (P1/P2)
- [ ] **Step 4.1: Fix Stepper Completed State**
  - File: `components/orders/OrderStepper.tsx`
  - Action: Update step state calculation so that `COMPLETED` highlights the 4th step as emerald completed rather than neutral current.
- [ ] **Step 4.2: Abstract Away Crypto Jargon**
  - Files: `components/layouts/PublicNavbar.tsx`, `app/(public)/orders/[id]/page.tsx`, `app/user/orders/page.tsx`, `components/orders/OrderModal.tsx`, `app/(public)/checkout/[orderId]/page.tsx`
  - Action: Remove `Solana Vault`, `Vault PDA`, and raw `SOL` equivalent displays from buyer screens. Frame all security as "Bảo vệ Ký quỹ 48h".
- [ ] **Step 4.3: Implement React Hook Form + Zod in Dispute Submission**
  - Files: `components/orders/DisputeModal.tsx`
  - Action: Integrate `react-hook-form` with `zod` validation schema for dispute reason and evidence validation.
- [ ] **Step 4.4: Fix Dispute Resolution DTO Mapping**
  - Files: `components/orders/DisputeModal.tsx`, `app/user/orders/page.tsx`, `libs/api.ts`
  - Action: Transmit dispute evidence as URL strings in JSON body matching `RaiseDisputeDto`.

