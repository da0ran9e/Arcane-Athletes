# Tiến độ (cập nhật 2026-11-15)

## Đã xong (v1)
- [x] Đặc tả: `SPEC.md`, `RULES_ENGINE.md`, `ASSETS.md`, `DEPLOY.md`
- [x] Dữ liệu 72 thẻ + 13 biến cố sinh từ file master (`tools/gen-cards.mjs` → `shared/cards.js`, `vi.cards.json`)
- [x] Engine luật đầy đủ: draft snake, 4 chặng, 72 kỹ năng, 13 biến cố, chạy kép, tính điểm (`shared/engine.js`, `shared/powers.js`)
- [x] 4 đường đua do tôi thiết kế (`shared/tracks.js`)
- [x] Server: file tĩnh, WebSocket, phòng, bot, hẹn giờ prompt, reconnect (`server/`)
- [x] Client 3D Three.js + UI DOM, EN/VI, nhạc theo phase + SFX tổng hợp (`public/`)
- [x] Asset thay thế tự vẽ; tự nhận asset thật qua `/api/manifest`

## Đợt 2 (2026-11-15)
- [x] Tuyển mộ: mỗi người tự bấm tung xúc xắc; thứ tự chọn theo điểm xúc xắc (hoà thì tung lại), người cao nhất chọn đầu và chọn lá cuối mỗi hàng.
- [x] Giấu bài: server gửi snapshot riêng từng ghế; tay bài người khác chỉ hiện mặt sau, lá người khác vừa tuyển không được công bố. Thẻ chỉ lộ khi ra sân.
- [x] Asset giả đúng tên file thật (`tools/gen-placeholders.mjs`): sprite sheet, mặt sau, 72 standee, 4 bản đồ, waypoint JSON, nhạc.
- [x] Bàn chơi dùng ảnh bản đồ + `assets/tracks/track_N.json` (schema Phần V.2); bỏ đường đua dựng bằng hình khối.
- [x] Standee = PNG làm dày nhiều lát, có bóng, ngã thì nằm bẹp.
- [x] `public/track_waypoint_editor.html` (file master nhắc tới nhưng không có trong thư mục nên tôi tự viết).

## Đợt 3 (2026-11-15)
- [x] Môi trường 3D theo chủ đề (cây/pha lê, trời, sương, sao) quay lại; ảnh bản đồ đặt trên bệ giữa cảnh, không còn ô tile dựng hình.
- [x] 4 file `tracks/track_N.json` lập theo ảnh placeholder mới của người dùng (31 vị trí, bục về đích). Diễn giải: xem `RULES_ENGINE.md` §4.
- [x] Asset gửi `no-cache` để thay file là thấy ngay. Test fuzz chạy cả trên track từ file.

## Đợt 4 (2026-11-15)
- [x] Làm lại toàn bộ giao diện: trang chủ, sảnh, tung xúc xắc, tuyển mộ (chọn rồi xác nhận), chọn đấu thủ, thanh theo dõi chặng đua, khung quyết định, kết quả, chung cuộc, thư viện thẻ, cách chơi, bố cục điện thoại.
- [x] Quân cờ to hơn, có viền sáng; bàn chơi luôn lấy tỉ lệ từ chính file ảnh bản đồ.
- [x] Luật bế tắc: 12 vòng không ai tiến thêm thì dừng chặng (⚖ cần xác nhận). Lý do: bản đồ mới + xúc xắc cố định có thể lặp vô tận.
- [x] Chạy được dưới đường dẫn con (`BASE_PATH=/game`), client chỉ dùng URL tương đối.
- [x] Đóng gói: `run.mjs`, `.env.example`, `start.sh`, `start.bat`, `deploy/`, `npm run pack` → `release/`.
- [x] Asset tối ưu (.webp/.ogg) chỉ được dùng khi không cũ hơn file gốc; `optimize-assets` làm thêm sprite thẻ.

Đã thử ở đợt này:
- `npm test` (3 bài): 600 giải ngẫu nhiên trên cả track dựng sẵn lẫn track từ file; bài riêng cho luật bế tắc.
- Chrome headless, cả máy tính (1400px) và điện thoại (390px): mọi màn hình, không lỗi console.
- Dưới tiền tố `/game`: chuyển hướng `/game` → `/game/`, tải asset, WebSocket, tạo phòng, phím Enter, bật/tắt nhật ký, chọn-rồi-xác-nhận; trọn một ván qua `/game/ws`.
- Bản giải nén từ `release/`: tự tạo `.env`, chạy không cần `npm install`, trọn một ván.
- `run.mjs` với cloudflared **giả**: truyền token qua biến môi trường, tự bật lại khi connector dừng, dừng theo khi tắt; báo rõ khi chưa cài cloudflared.
- `optimize-assets` với `sharp` (ảnh). Bộ đọc kích thước PNG / WebP / JPEG khớp với `sips`.

CHƯA thử được (không có điều kiện trên máy này):
- [ ] Tunnel Cloudflare thật với token thật và ô Path trên dashboard.
- [ ] `start.bat` và Task Scheduler trên Windows; `deploy/install-service.sh` trên Ubuntu (mới kiểm cú pháp).
- [ ] Phần nén nhạc bằng `ffmpeg` trong `optimize-assets`.
- [ ] Người thật chơi nhiều máy; điện thoại thật (mới giả lập kích thước).

## Đã kiểm thử
- `npm test`: 600 giải đấu ngẫu nhiên (3–6 người, mọi tuỳ chọn, trả lời ngẫu nhiên) chạy hết, không treo; mọi kỹ năng có `fire()` đều đã kích hoạt ít nhất 1 lần.
- `tools/e2e.mjs`: trọn 1 giải qua WebSocket thật.
- Chrome headless (`?demo=1`): trang chủ, draft, chặng đua 3D với asset giả hiển thị đúng, không lỗi console.
- `tools/e2e.mjs` kiểm tra thêm: không có tay bài/lá tuyển của người khác bị gửi tới client.
- Chưa thử: editor waypoint mới chỉ mở được không lỗi, chưa bấm tạo thử một file hoàn chỉnh.

## Chưa kiểm thử / chưa làm
- [ ] Chưa có người thật chơi nhiều máy cùng lúc; chưa thử trên điện thoại (CSS responsive mới ở mức cơ bản).
- [ ] Chưa thử với asset thật (sprite thẻ, standee PNG, ảnh bản đồ, nhạc) — code đường dẫn đã có nhưng chưa chạy với file thật.
- [ ] Chưa có unit test khẳng định đúng luật cho từng kỹ năng (mới chỉ fuzz chống crash).
- [ ] Bot chơi theo heuristic đơn giản (draft và chọn đấu thủ ngẫu nhiên).
- [ ] Chưa triển khai Cloudflare Tunnel (hướng dẫn ở `DEPLOY.md`).
- [ ] Khớp toạ độ ô với ảnh bản đồ thật khi có ảnh (`ASSETS.md` §4).
- [ ] Ngoài phạm vi v1: xem `SPEC.md` §8.

## Cần bạn xác nhận (các chỗ tôi tự diễn giải luật)
Xem các dòng đánh dấu ⚖ trong `RULES_ENGINE.md`, quan trọng nhất:
1. Biến cố được rút giữa chặng (khi có người vượt cua 1), mỗi chặng 1 lá.
2. Dark Mimic chỉ có hiệu lực 1 lần/chặng.
3. Hàng bài tuyển mộ vẫn ngửa công khai, nên người tinh ý có thể suy ra lá vừa bị lấy (lá biến mất khỏi hàng). Muốn kín hoàn toàn phải đổi cách draft.
4. Warp không kích hoạt hiệu ứng "dừng chung ô".
5. "Bên trái" = ghế kế tiếp theo chiều kim đồng hồ; "bên phải" = ghế trước đó.
