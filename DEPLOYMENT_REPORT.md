# Báo Cáo Kiểm Tra Deploy Smart Contract & Cấu Hình Render

- **Program ID đã deploy**: `HxRDoZFg52q9R5y1VGTSPEMqJjyW3WNgnxsz5bN8ooXk`
- **Mạng**: Solana Devnet
- **Kiểm tra on-chain (Solana JSON-RPC `getAccountInfo`)**: `executable: true`, lamports: 833,120 (~0.00083 SOL rent-exempt).
- **Artifacts**: Bytecode đã compile tại `contracts/target/deploy/p2p_escrow.so`, IDL đã đồng bộ sang server và client.
- **Kết luận**: **Contract ĐÃ DEPLOY THÀNH CÔNG lên Solana Devnet**.

---

## 2. Kiến Trúc & Quy Trình Deploy Server Lên Render

### 2.1 Thông Số Cấu Hình Trên Render (Web Service)

- **Service Type**: Web Service
- **Environment**: `Node` (Node.js >= 20)
- **Root Directory**: `server`
- **Build Command**: `npm install && npm run build`
- **Pre-deploy Command** (hoặc tích hợp vào Build Command): `npm run migration:run`
- **Start Command**: `npm run start:prod` (tương đương `node dist/main`)
- **Port**: Render tự động inject biến môi trường `PORT` (mặc định `10000`). `server/src/main.ts` đọc qua `process.env.PORT || 3000`.

### 2.2 Danh Sách Biến Môi Trường (Environment Variables)

| Key | Value Mẫu / Nguồn | Ghi chú |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Bắt buộc |
| `PORT` | `10000` | Render tự cấp |
| `DATABASE_URL` | `postgresql://postgres.qnbdnarcyeavapfncokm:Hackathon_2026@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require` | Supabase Session/Transaction Pooler |
| `SOLANA_RPC_URL` | `https://api.devnet.solana.com` | Endpoint Solana RPC |
| `SOLANA_WS_URL` | `wss://api.devnet.solana.com` | Endpoint Solana WebSocket |
| `SOLANA_PROGRAM_ID` | `HxRDoZFg52q9R5y1VGTSPEMqJjyW3WNgnxsz5bN8ooXk` | Deployed Program ID trên Solana Devnet |
| `ARBITER_PRIVATE_KEY` | `[240,142,129,226,...]` | Array bytes secret key của Arbiter |
| `ARBITER_PUBLIC_KEY` | `7VfipHZbnFv39E6kCRpm8KBnrfhzNxSaRw5ToyNDjqpo` | Public key của Arbiter ví relayer |
| `DEFAULT_TIMEOUT_DURATION` | `172800` | Thời gian hết hạn escrow (giây) |
| `JWT_SECRET` | `super_secret_jwt_key_hackathon_2026` | Khóa ký JWT authentication |
| `CLOUDINARY_URL` | `cloudinary://...` | Lưu trữ file / evidence |

### 2.3 Các Vấn Đề Cần Sửa Trước Khi Deploy Render

1. **CORS Hardcoded (`server/src/main.ts`)**:
   - Hiện tại origin chỉ cho phép: `http://localhost:5000`, `http://127.0.0.1:5000`, `http://localhost:3000`.
   - Cần bổ sung domain của frontend production (Vercel/Render) hoặc cấu hình đọc từ `process.env.CORS_ORIGIN`.
2. **WebSocket Keep-Alive (Socket.IO)**:
   - Render Free tier sẽ tự động spin down sau 15 phút idle, làm ngắt kết nối WebSocket gateway (`/escrow`). Nên sử dụng instance trả phí (Starter tier) hoặc thiết lập ping keep-alive.
3. **Thứ tự triển khai**:
   - Bước 1: Deploy Anchor program lên Solana devnet và lấy Program ID thực tế.
   - Bước 2: Cập nhật `SOLANA_PROGRAM_ID` và đồng bộ `p2p_escrow.json` (IDL).
   - Bước 3: Đẩy source code lên Git và trigger deploy trên Render.

---

## 3. File Cấu Hình Tự Động (render.yaml Blueprint)

```yaml
services:
  - type: web
    name: hackathon-server
    runtime: node
    rootDir: server
    plan: starter
    region: singapore
    buildCommand: npm install && npm run migration:run && npm run build
    startCommand: npm run start:prod
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false
      - key: SOLANA_RPC_URL
        value: https://api.devnet.solana.com
      - key: SOLANA_WS_URL
        value: wss://api.devnet.solana.com
      - key: SOLANA_PROGRAM_ID
        value: HxRDoZFg52q9R5y1VGTSPEMqJjyW3WNgnxsz5bN8ooXk
      - key: ARBITER_PRIVATE_KEY
        sync: false
      - key: ARBITER_PUBLIC_KEY
        sync: false
      - key: DEFAULT_TIMEOUT_DURATION
        value: "172800"
      - key: JWT_SECRET
        generateValue: true
      - key: CLOUDINARY_URL
        sync: false
```

