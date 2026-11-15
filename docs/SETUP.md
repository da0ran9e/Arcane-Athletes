# Cài đặt & chạy

Node.js **20.11 trở lên** là yêu cầu duy nhất. Không có bước build: sửa file là chạy.

## Chạy thử trên máy

```bash
npm install
npm start                 # http://localhost:3000
npm test                  # 600 giải đấu ngẫu nhiên trên engine
node tools/e2e.mjs        # (server đang chạy) 1 client + 3 bot chơi trọn giải
```

Đổi cổng — Windows PowerShell: `$env:PORT=8080; npm start`, Ubuntu/macOS: `PORT=8080 npm start`.

Nhiều người trong cùng mạng LAN: đặt `HOST=0.0.0.0`, người khác mở `http://<IP-máy-này>:3000/?room=MÃ`.

Chạy dưới đường dẫn con giống lúc đã lên mạng: `BASE_PATH=/arcaneathletes npm start` → http://localhost:3000/arcaneathletes/ (kiểm tra WebSocket: `node tools/e2e.mjs ws://localhost:3000/arcaneathletes/ws`).

## Chạy kèm Cloudflare Tunnel

```bash
npm run online            # = node run.mjs: đọc .env, chạy server + tunnel
```

Windows có thể bấm đúp **`start-server.cmd`** thay cho lệnh trên. Lần đầu trên máy mới, file tự lo phần thiếu: Node.js portable vào `runtime\`, `cloudflared` vào `bin\`, và `npm ci` nếu chạy từ bản git. Ubuntu/macOS dùng `./start.sh`. Đóng cửa sổ là tắt server.

Các bước khai báo một lần trên Cloudflare, chạy nền và tự bật khi khởi động máy: `DEPLOY.md`.

## Cấu hình: file `.env`

`run.mjs` tự tạo `.env` từ `.env.example` ở lần chạy đầu. File này chứa bí mật nên nằm trong `.gitignore` — không đưa lên git, không gửi cho người khác. Biến môi trường thật (đặt ngoài shell) luôn thắng giá trị trong file.

| Biến | Ý nghĩa |
|---|---|
| `PORT` | cổng nội bộ của server (mặc định `3000`) |
| `HOST` | `127.0.0.1` = chỉ vào được qua tunnel (nên dùng khi đã lên mạng); `0.0.0.0` = mở cho cả máy trong LAN |
| `PUBLIC_URL` | địa chỉ người chơi mở. Phần đường dẫn của nó là `BASE_PATH` mặc định |
| `BASE_PATH` | game được gắn dưới đường dẫn này (vd `/arcaneathletes`); để trống nếu nằm ngay gốc tên miền |
| `TUNNEL_TOKEN` | token connector lấy trên Cloudflare dashboard. `off` = không bật tunnel từ đây |
| `TUNNEL_CONFIG` | **cách còn lại**: đường dẫn file config của cloudflared, ingress nằm trong file. Cần khi game dùng chung hostname với dịch vụ khác và chia theo đường dẫn — kiểu ingress này không khai được trên dashboard. Dùng cách này thì đặt `TUNNEL_TOKEN=off` |
| `TUNNEL_NAME` | tên tunnel truyền cho `cloudflared tunnel run`, dùng kèm `TUNNEL_CONFIG` |

Đã có đủ tham số trong `.env` thì không bị hỏi gì khi chạy: phần hỏi token chỉ bật khi không có token hợp lệ, không có `TUNNEL_CONFIG`, `TUNNEL_TOKEN` không phải `off`, **và** đang chạy trong cửa sổ dòng lệnh thật. Chạy nền qua systemd / Task Scheduler không bao giờ đợi nhập.

## Đóng gói mang sang máy khác

```bash
npm run pack              # -> release/aetheria-grand-prix.zip và .tar.gz
```

Bản đóng gói kèm sẵn thư viện nên máy đích không cần `npm install`. Nó cũng bỏ bản WAV/PNG gốc khi đã có bản `.ogg`/`.webp` tối ưu.

## Cập nhật sau khi đã chạy

| Thay gì | Cần làm |
|---|---|
| Ảnh, nhạc trong `public/assets/` | chép đè, người chơi tải lại trang là thấy |
| `public/assets/tracks/track_N.json` | được đọc lại mỗi khi bắt đầu ván mới |
| Code trong `server/`, `shared/` | khởi động lại server |
| `.env` | khởi động lại server |
