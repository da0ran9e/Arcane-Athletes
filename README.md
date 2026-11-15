# Aetheria Grand Prix

Board game đua chiến thuật 3–6 người, bản web 3D nhiều người chơi (Node.js + WebSocket + Three.js, không cần build).

## Chạy thử trên máy
```bash
npm install
npm start      # http://localhost:3000
npm test
```

## Đưa lên mạng (Cloudflare Tunnel → https://vuducan.qzz.io/game/)
```bash
npm run pack   # tạo release/aetheria-grand-prix.zip (đã kèm thư viện)
```
Trên máy chủ: giải nén → mở `.env`, dán token vào `TUNNEL_TOKEN=` → chạy `./start.sh` (Ubuntu) hoặc `start.bat` (Windows).
Chi tiết và phần khai báo trên Cloudflare: `docs/DEPLOY.md`.

## Tài liệu
- Luật gốc: `GAME_RULES_AND_ASSETS_MASTER.md`
- Đặc tả & tiến độ: `docs/SPEC.md`, `docs/PROGRESS.md`
- Cách engine hiểu luật (các chỗ ⚖ cần xác nhận): `docs/RULES_ENGINE.md`
- Asset (thả vào `public/assets/`): `docs/ASSETS.md`
- Ngôn ngữ: `public/locales/*.json`
