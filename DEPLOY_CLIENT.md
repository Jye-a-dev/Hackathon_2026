# Hướng Dẫn Deploy Client Lên Vercel

## Cách 1: Deploy qua Vercel Dashboard (Khuyên dùng)

### Bước 1: Push code mới nhất lên GitHub
```bash
git add .
git commit -m "chore: deploy client to vercel"
git push origin main
```

### Bước 2: Tạo Project trên Vercel
1. Đăng nhập [vercel.com](https://vercel.com) -> Bấm **Add New...** -> **Project**.
2. Chọn Repository của bạn và bấm **Import**.
3. Tại phần **Configure Project**:
   - **Root Directory**: Bấm **Edit** -> Chọn thư mục `client` -> Bấm **Continue**.
   - **Framework Preset**: Chọn `Next.js` (Vercel tự nhận diện).
   - **Build and Output Settings**: Giữ nguyên mặc định (Build Command: `npm run build`, Output Directory: `.next`).

### Bước 3: Thêm Environment Variables
Mở phần **Environment Variables** và nhập 4 biến sau:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://hackathon-2026-y2aa.onrender.com/api` |
| `NEXT_PUBLIC_SOCKET_URL` | `https://hackathon-2026-y2aa.onrender.com` |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | `https://api.devnet.solana.com` |
| `NEXT_PUBLIC_PROGRAM_ID` | `HxRDoZFg52q9R5y1VGTSPEMqJjyW3WNgnxsz5bN8ooXk` |

### Bước 4: Triển khai
- Bấm **Deploy**. Vercel sẽ tự động tối ưu hoá SSR, App Router và cấp domain dạng `https://ten-du-an.vercel.app`.

---

## Cách 2: Deploy trực tiếp bằng Vercel CLI

```bash
# 1. Di chuyển vào thư mục client
cd client

# 2. Cài đặt và chạy Vercel CLI
npx vercel

# 3. Khi được hỏi:
# - Set up and deploy?: Y
# - Which scope?: chọn tài khoản của bạn
# - Link to existing project?: N
# - What's your project's name?: trustpass-client
# - In which directory is your code located?: ./
# - Want to modify these settings?: N

# 4. Deploy bản production
npx vercel --prod
```
