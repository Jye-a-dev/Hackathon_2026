# Các Bước Triển Khai Netlify & Cấu Hình Server

## Bước 1: Cấu hình Build & Deploy trên Netlify Dashboard
1. Truy cập https://app.netlify.com -> Chọn site `trustpass`.
2. Chọn **Site configuration** -> **Build & deploy** -> **Continuous deployment** -> **Build settings** -> Bấm **Edit settings**:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Functions directory**: để trống
3. Bấm **Save**.

## Bước 2: Commit và Push file cấu hình `netlify.toml`
Chạy các lệnh Git tại thư mục gốc repository để đẩy `netlify.toml` và `@netlify/plugin-nextjs`:

```bash
git add netlify.toml client/netlify.toml client/package.json server/src/main.ts server/.env
git commit -m "fix(deploy): add netlify.toml and configure CORS for netlify"
git push origin main
```

## Bước 3: Thêm biến môi trường trên Server (Render)
Vào Render Dashboard của service `hackathon-2026-y2aa` -> **Environment**:
- Thêm biến: `FRONTEND_URL` = `https://trustpass.netlify.app`

## Bước 4: Trigger Re-deploy trên Netlify
1. Trên Netlify -> Tab **Deploys**.
2. Chọn **Trigger deploy** -> **Clear cache and deploy site**.
