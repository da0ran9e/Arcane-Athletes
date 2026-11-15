# Aetheria Grand Prix

Board game đua chiến thuật 3–6 người, bản web 3D nhiều người chơi (Node.js + WebSocket + Three.js, không cần build).

## Windows: bấm một file là chạy
Bấm đúp **`start-server.cmd`**. Lần đầu, dán Cloudflare Tunnel token khi được hỏi (chuột phải hoặc Ctrl+V, rồi Enter); lần sau chỉ cần bấm đúp.
Máy thiếu Node.js hay `cloudflared` thì file tự tải về ngay trong thư mục game. Phần khai báo một lần trên Cloudflare: `docs/DEPLOY.md`.

## Chạy thử trên máy
```bash
npm install
npm start      # http://localhost:3000
npm test
```

## Đưa lên mạng (Cloudflare Tunnel → https://vuducan.qzz.io/game/)
- Windows: `start-server.cmd` như trên.
- Ubuntu: `./start.sh` (chạy trong cửa sổ dòng lệnh sẽ được hỏi token; hoặc dán token vào `.env`).
- Bản đóng gói kèm sẵn thư viện: `npm run pack` → `release/aetheria-grand-prix.zip`.

Chi tiết, chạy nền và phần khai báo trên Cloudflare: `docs/DEPLOY.md`.

## Tài liệu
- Luật gốc: `GAME_RULES_AND_ASSETS_MASTER.md`
- Đặc tả & tiến độ: `docs/SPEC.md`, `docs/PROGRESS.md`
- Cách engine hiểu luật (các chỗ ⚖ cần xác nhận): `docs/RULES_ENGINE.md`
- Asset (thả vào `public/assets/`): `docs/ASSETS.md`
- Ngôn ngữ: `public/locales/*.json`
