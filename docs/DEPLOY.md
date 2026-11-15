# Chạy & đưa lên mạng

Địa chỉ dự kiến: **https://vuducan.qzz.io/game/** (qua Cloudflare Tunnel). Máy chủ Ubuntu hoặc Windows, RAM thực dùng < 200 MB.

## 1. Đưa lên máy chủ — 4 bước

**Bước 1 — Cài trên máy chủ**
- Node.js **20.11 trở lên**: https://nodejs.org
- `cloudflared`:
  - Ubuntu: làm theo https://pkg.cloudflare.com (thêm kho, rồi `sudo apt install cloudflared`)
  - Windows: `winget install --id Cloudflare.cloudflared` (hoặc đặt `cloudflared.exe` cạnh `run.mjs`)
  - Bỏ qua nếu máy chủ đã cài sẵn `cloudflared` dạng service cho đúng tunnel này.

**Bước 2 — Chép game lên máy chủ**
- Trên máy đang làm việc: `npm run pack` → tạo `release/aetheria-grand-prix.zip` và `.tar.gz` (đã kèm thư viện, không cần `npm install` trên máy chủ).
- Giải nén trên máy chủ, ví dụ `/opt/aetheria-grand-prix` hoặc `C:\aetheria-grand-prix`.

**Bước 3 — Dán token**
- Chạy lần đầu (`./start.sh` hoặc bấm đúp `start.bat`) sẽ tự tạo file `.env`. Mở `.env`, dán token vào sau `TUNNEL_TOKEN=`.
- Token lấy ở Cloudflare dashboard → Zero Trust → Networks → Tunnels → chọn tunnel → Configure → "Install and run a connector". Dán cả dòng lệnh cũng được, chương trình tự lọc lấy token.
- Các dòng còn lại đã điền sẵn cho `vuducan.qzz.io/game`:

  | Biến | Giá trị | Ý nghĩa |
  |---|---|---|
  | `PUBLIC_URL` | `https://vuducan.qzz.io/game/` | địa chỉ người chơi mở |
  | `BASE_PATH` | `/game` | game nằm dưới đường dẫn này |
  | `PORT` | `3000` | cổng nội bộ |
  | `HOST` | `127.0.0.1` | chỉ vào được qua tunnel; đổi `0.0.0.0` nếu muốn máy trong LAN vào thẳng |

**Bước 4 — Khai báo đường đi trong Cloudflare (làm 1 lần)**

Tunnel dùng token được cấu hình trên dashboard, không phải trong thư mục game. Vào tunnel → tab **Public Hostname** → Add:

| Ô | Điền |
|---|---|
| Subdomain | (để trống) |
| Domain | `vuducan.qzz.io` |
| Path | `game` |
| Service | Type `HTTP`, URL `localhost:3000` |

Rồi chạy lại `./start.sh` / `start.bat`. Khi log hiện `[tunnel] ... Registered tunnel connection` thì mở https://vuducan.qzz.io/game/.

Lưu ý về ô **Path**: Cloudflare chuyển nguyên đường dẫn (`/game/...`) về máy chủ, game tự bỏ tiền tố `/game`. Tôi chưa kiểm chứng được trên dashboard thật cách ô này so khớp (tài liệu chính thức chỉ nói rõ cho file cấu hình: đó là biểu thức chính quy). Nếu điền `game` mà vào `/game/` vẫn ra trang khác, thử `^/game`.

## 2. Chạy nền, tự bật khi khởi động máy

**Ubuntu (systemd)**
```bash
sudo sh deploy/install-service.sh      # nếu node cài bằng nvm: sudo env "PATH=$PATH" sh deploy/install-service.sh
journalctl -u aetheria -f              # xem log
sudo systemctl restart aetheria        # sau khi sửa .env hoặc thay asset JSON
```

**Windows (Task Scheduler)** — Create Task:
- General: "Run whether user is logged on or not".
- Triggers: "At startup".
- Actions: Program `node`, Arguments `run.mjs`, Start in = thư mục game.
- Settings: bật "If the task fails, restart every 1 minute".

`run.mjs` tự khởi động lại `cloudflared` nếu nó dừng. Nếu chính game server dừng, systemd / Task Scheduler sẽ bật lại cả hai.

## 3. Chạy trên máy cá nhân để thử

```bash
npm install
npm start                 # http://localhost:3000   (không có tiền tố)
npm run online            # giống máy chủ: đọc .env, chạy server + tunnel
npm test                  # 600 giải đấu ngẫu nhiên trên engine
node tools/e2e.mjs        # (server đang chạy) 1 client + 3 bot chơi trọn giải
```
Windows PowerShell đổi cổng: `$env:PORT=8080; npm start`

- Thử đúng đường dẫn thật: `BASE_PATH=/game npm start` → http://localhost:3000/game/ (kiểm tra: `node tools/e2e.mjs ws://localhost:3000/game/ws`).
- Chơi một mình: Tạo phòng → **Thêm bot** (đủ 3 ghế) → Bắt đầu. Xem game tự chạy: thêm `?demo=1` vào địa chỉ.
- Nhiều người cùng mạng LAN: `HOST=0.0.0.0`, người khác mở `http://<IP-máy-chủ>:3000/?room=MÃ`.

## 4. Cập nhật asset hoặc code trên máy chủ
- Asset (ảnh, nhạc): chép đè vào `public/assets/`, người chơi tải lại trang là thấy (đường dẫn asset có kèm mã phiên bản).
- `public/assets/tracks/track_N.json`: được đọc lại mỗi khi bắt đầu ván mới.
- Code server (`server/`, `shared/`): phải khởi động lại.

## 5. Giới hạn hiện tại
- Trạng thái ván nằm trong RAM: khởi động lại server là mất các ván đang chơi.
- Người chơi rớt mạng tự kết nối lại; trong lúc vắng, bot quyết định thay sau 6 giây.
- Phòng không còn ai: xoá sau 2 phút (sảnh) / 30 phút (đang chơi). Tối đa 200 phòng.
- Chưa có giới hạn tần suất hay tài khoản: ai có link đều tạo phòng được.
- Nhạc: file trên 100 MB không được Cloudflare cache — nên nén WAV sang `.ogg` (`node tools/optimize-assets.mjs`); `npm run pack` tự bỏ bản WAV/PNG gốc khi đã có bản `.ogg`/`.webp`.
