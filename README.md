# Aetheria Grand Prix

Board game đua chiến thuật 3–6 người, bản web 3D nhiều người chơi (Node.js + WebSocket + Three.js, không cần build).

Đang chạy tại **https://game.vuducan.qzz.io/arcaneathletes/**

## Windows: bấm một file là chạy

Bấm đúp **`start-server.cmd`** — server game và Cloudflare Tunnel cùng lên, địa chỉ công khai hiện ngay trong cửa sổ. Đóng cửa sổ là tắt.

Lần đầu trên một máy mới, file tự lo phần thiếu: chưa có Node.js 20.11+ thì tải bản portable vào `runtime\`, chưa có `cloudflared` thì tải bản chính thức vào `bin\`, chạy từ bản git thì `npm ci`. Thiếu cấu hình tunnel thì nó hỏi token và lưu vào `.env`; đã có sẵn trong `.env` thì không hỏi gì.

## Chạy thử trên máy

```bash
npm install
npm start      # http://localhost:3000
npm test       # 600 giải đấu ngẫu nhiên trên engine
```

Chơi một mình: Tạo phòng → **Thêm bot** cho đủ ghế → Bắt đầu. Xem game tự chạy: thêm `?demo=1` vào địa chỉ.

## Đưa lên mạng

| Cách | Khi nào dùng |
|---|---|
| `start-server.cmd` (Windows) / `./start.sh` (Ubuntu, macOS) | thường ngày |
| `npm run online` | giống trên, chạy sẵn trong cửa sổ dòng lệnh |
| `npm run pack` → `release/aetheria-grand-prix.zip` | chép sang máy chủ, đã kèm thư viện |

Cấu hình nằm trong `.env` (không đưa lên git). Tunnel chạy được hai kiểu: **token** (ingress khai trên Cloudflare dashboard) hoặc **file config** (`TUNNEL_CONFIG`, ingress nằm trong file — cần khi game dùng chung hostname với dịch vụ khác và chia theo đường dẫn). Các bước khai báo một lần, chạy nền và tự bật khi khởi động máy: `docs/DEPLOY.md`.

## Tài liệu

- Luật gốc: `GAME_RULES_AND_ASSETS_MASTER.md`
- Đặc tả & tiến độ: `docs/SPEC.md`, `docs/PROGRESS.md`
- Cách engine hiểu luật (các chỗ ⚖ cần xác nhận): `docs/RULES_ENGINE.md`
- Asset (thả vào `public/assets/`): `docs/ASSETS.md`
- Ngôn ngữ: `public/locales/*.json`
