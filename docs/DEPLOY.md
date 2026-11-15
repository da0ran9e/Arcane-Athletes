# Chạy & đưa lên mạng

Địa chỉ dự kiến: **https://game.vuducan.qzz.io/arcaneathletes/** (qua Cloudflare Tunnel). Máy chủ Ubuntu hoặc Windows, RAM thực dùng < 200 MB.

## 1. Windows — bấm một file

1. Lấy game về máy: `git clone https://github.com/da0ran9e/Arcane-Athletes`, hoặc tải ZIP trên GitHub, hoặc giải nén `release/aetheria-grand-prix.zip`.
2. Bấm đúp **`start-server.cmd`**. Lần đầu, file tự làm lần lượt:
   - máy chưa có Node.js 20.11+ → tải Node.js bản portable (kiểm tra SHA-256) vào `runtime\`; không cài vào hệ thống, xoá thư mục là gỡ;
   - chạy từ bản git → cài thư viện game (`npm ci`);
   - hỏi **Cloudflare Tunnel token**: dán vào (chuột phải hoặc Ctrl+V) rồi Enter. Token được lưu trong `.env`; file này nằm trong `.gitignore`, không bị đẩy lên GitHub;
   - máy chưa có `cloudflared` → tải bản chính thức từ GitHub của Cloudflare vào `bin\`.
3. Cửa sổ hiện `✔ Đã lên mạng` → mở https://game.vuducan.qzz.io/arcaneathletes/. Nếu chưa vào được: làm **Bước 4** ở mục 2 (khai báo Public Hostname, chỉ một lần).

Lần sau chỉ cần bấm đúp. Tắt máy chủ: đóng cửa sổ. Đổi token: mở `.env`, xoá giá trị sau `TUNNEL_TOKEN=` rồi chạy lại để được hỏi. Máy đã chạy `cloudflared` dạng service cho đúng tunnel này: ghi `TUNNEL_TOKEN=off` để không bị hỏi nữa.

Windows có thể hiện cảnh báo bảo mật với file tải từ mạng: chọn *More info → Run anyway* (hoặc *Run*).

## 2. Máy chủ (Ubuntu hoặc Windows) — 4 bước

**Bước 1 — Cài trên máy chủ**
- Node.js **20.11 trở lên**: https://nodejs.org (Windows: `start-server.cmd` tự tải bản portable nếu thiếu).
- `cloudflared`: nếu chưa có, chương trình tự tải bản chính thức vào `bin/` (Windows, Linux x64/ARM). Muốn tự cài:
  - Ubuntu: làm theo https://pkg.cloudflare.com (thêm kho, rồi `sudo apt install cloudflared`)
  - Windows: `winget install --id Cloudflare.cloudflared`
  - Máy chủ đã cài sẵn `cloudflared` dạng service cho đúng tunnel này: ghi `TUNNEL_TOKEN=off` trong `.env`.

**Bước 2 — Chép game lên máy chủ**
- `git clone https://github.com/da0ran9e/Arcane-Athletes` (lần đầu chạy sẽ tự `npm ci`), hoặc
- trên máy đang làm việc: `npm run pack` → `release/aetheria-grand-prix.zip` và `.tar.gz` (đã kèm thư viện, không cần `npm install` trên máy chủ). Giải nén, ví dụ vào `/opt/aetheria-grand-prix` hoặc `C:\aetheria-grand-prix`.

**Bước 3 — Dán token**
- Windows: `start-server.cmd` hỏi token và tự ghi vào `.env`. Ubuntu: chạy `./start.sh` trong cửa sổ dòng lệnh cũng được hỏi như vậy; hoặc mở `.env` (tự tạo ở lần chạy đầu), dán token vào sau `TUNNEL_TOKEN=`.
- Token lấy ở Cloudflare dashboard → Zero Trust → Networks → Tunnels → chọn tunnel → Configure → "Install and run a connector". Dán cả dòng lệnh cũng được, chương trình tự lọc lấy token. Token thiếu ký tự khi copy sẽ bị báo ngay.
- Các dòng còn lại đã điền sẵn cho `game.vuducan.qzz.io/arcaneathletes`:

  | Biến | Giá trị | Ý nghĩa |
  |---|---|---|
  | `PUBLIC_URL` | `https://game.vuducan.qzz.io/arcaneathletes/` | địa chỉ người chơi mở |
  | `BASE_PATH` | `/arcaneathletes` | game nằm dưới đường dẫn này |
  | `PORT` | `3000` | cổng nội bộ |
  | `HOST` | `127.0.0.1` | chỉ vào được qua tunnel; đổi `0.0.0.0` nếu muốn máy trong LAN vào thẳng |

**Bước 4 — Khai báo đường đi trong Cloudflare (làm 1 lần)**

Game chạy bằng **tunnel riêng tên `aetheria`, cấu hình bằng file** (không dùng token + dashboard), vì nó dùng chung hostname `game.vuducan.qzz.io` với dịch vụ khác và được chia theo đường dẫn — ingress kiểu path phải nằm trong file config.

1. Tạo tunnel (dùng `cert.pem` có sẵn sau `cloudflared tunnel login`):
   ```
   cloudflared tunnel create aetheria
   ```
2. Tạo file `~/.cloudflared/aetheria.yml` (Windows: `C:\Users\<tên>\.cloudflared\aetheria.yml`):
   ```yaml
   tunnel: aetheria
   credentials-file: C:\Users\<tên>\.cloudflared\<tunnel-id>.json
   ingress:
     - hostname: game.vuducan.qzz.io
       path: ^/arcaneathletes
       service: http://127.0.0.1:3000
     - service: http_status:404
   ```
   Dùng `127.0.0.1`, **không** dùng `localhost`: trên Windows cloudflared resolve `localhost` ra IPv6 `[::1]` trước, server chỉ nghe IPv4 sẽ bị từ chối.
3. Trỏ DNS về tunnel. **Bắt buộc có `--config`**, nếu không `~/.cloudflared/config.yml` (của tunnel khác) sẽ ghi đè tên tunnel truyền trên dòng lệnh và DNS trỏ nhầm tunnel:
   ```
   cloudflared --config ~/.cloudflared/aetheria.yml tunnel route dns --overwrite-dns aetheria game.vuducan.qzz.io
   ```
   Output phải hiện đúng tunnel id của `aetheria`. Kiểm tra thêm: `cloudflared --config ~/.cloudflared/aetheria.yml tunnel ingress validate` và `... tunnel ingress rule https://game.vuducan.qzz.io/arcaneathletes/`.
4. Trong `.env` đặt `TUNNEL_TOKEN=off`, `TUNNEL_CONFIG=<đường dẫn aetheria.yml>`, `TUNNEL_NAME=aetheria`, rồi chạy `./start.sh` / `start-server.cmd`.

Sau khi đổi DNS, các edge của Cloudflare lan dần trong khoảng 1-2 phút: trong lúc đó có request lác đác trả **530 / error 1033**. Đợi rồi thử lại trước khi đi tìm lỗi khác.

**Vì sao không dùng `vuducan.qzz.io/game`:** hostname gốc trỏ thẳng (DNS-only) vào GitHub Pages cho portfolio, nên request không bao giờ đi qua tunnel — trả về 404 của chính site portfolio. Một hostname chỉ có một origin.

## 3. Chạy nền, tự bật khi khởi động máy

Chạy nền không có cửa sổ để hỏi token: chạy tay một lần trước (hoặc dán token vào `.env`).

**Ubuntu (systemd)**
```bash
sudo sh deploy/install-service.sh      # nếu node cài bằng nvm: sudo env "PATH=$PATH" sh deploy/install-service.sh
journalctl -u aetheria -f              # xem log
sudo systemctl restart aetheria        # sau khi sửa .env hoặc thay asset JSON
```

**Windows (Task Scheduler)** — Create Task:
- General: "Run whether user is logged on or not".
- Triggers: "At startup".
- Actions: Program `node` (dùng Node portable thì điền `<thư mục game>\runtime\node\node.exe`), Arguments `run.mjs`, Start in = thư mục game.
- Settings: bật "If the task fails, restart every 1 minute".

`run.mjs` tự khởi động lại `cloudflared` nếu nó dừng. Nếu chính game server dừng, systemd / Task Scheduler sẽ bật lại cả hai.

## 4. Chạy trên máy cá nhân để thử

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

## 5. Cập nhật asset hoặc code trên máy chủ
- Bản git: `git pull` rồi chạy lại.
- Asset (ảnh, nhạc): chép đè vào `public/assets/`, người chơi tải lại trang là thấy (đường dẫn asset có kèm mã phiên bản).
- `public/assets/tracks/track_N.json`: được đọc lại mỗi khi bắt đầu ván mới.
- Code server (`server/`, `shared/`): phải khởi động lại.

## 6. Giới hạn hiện tại
- Trạng thái ván nằm trong RAM: khởi động lại server là mất các ván đang chơi.
- Người chơi rớt mạng tự kết nối lại; trong lúc vắng, bot quyết định thay sau 6 giây.
- Phòng không còn ai: xoá sau 2 phút (sảnh) / 30 phút (đang chơi). Tối đa 200 phòng.
- Chưa có giới hạn tần suất hay tài khoản: ai có link đều tạo phòng được.
- Nhạc: file trên 100 MB không được Cloudflare cache — nên nén WAV sang `.ogg` (`node tools/optimize-assets.mjs`); `npm run pack` tự bỏ bản WAV/PNG gốc khi đã có bản `.ogg`/`.webp`.
