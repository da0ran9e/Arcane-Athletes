# Aetheria Grand Prix — Đặc tả kỹ thuật (v1)

> Tài liệu backup công việc. Nguồn luật gốc: `GAME_RULES_AND_ASSETS_MASTER.md`.
> Tài liệu liên quan: `RULES_ENGINE.md` (diễn giải luật + 72 kỹ năng), `ASSETS.md` (tài nguyên), `SETUP.md` (cài đặt/chạy), `DEPLOY.md` (đưa lên mạng), `PROGRESS.md` (tiến độ).

## 1. Mục tiêu

- Game web 3D nhiều người chơi online (3–6 ghế, ghế trống có thể thêm bot), chơi qua trình duyệt.
- Server nhẹ, chạy tốt trên Ubuntu/Windows 4–8 GB RAM (thực tế cần < 200 MB).
- Đa ngôn ngữ (EN + VI) qua file JSON, dễ sửa/thêm ngôn ngữ.
- Asset (thẻ bài, bản đồ, standee, nhạc) **chưa có**: game tự vẽ hình thay thế (procedural); khi thả file đúng tên vào `public/assets/` thì tự dùng, không cần sửa code.
- Test local trước, sau đó đưa lên domain riêng qua Cloudflare Tunnel.

## 2. Công nghệ

| Thành phần | Lựa chọn | Lý do |
|---|---|---|
| Server | Node.js ≥ 20.11, `http` thuần + thư viện `ws` | 1 dependency, chạy giống nhau trên Ubuntu/Windows |
| Client 3D | Three.js (ES module, phục vụ từ `node_modules`, **không cần build**) | Không bundler → sửa là chạy |
| UI | HTML/CSS thuần phủ lên canvas 3D | Nhẹ, dễ dịch |
| Logic game | `shared/engine.js` dùng `async/await`, chạy **trên server** (authoritative) | Chống gian lận, client chỉ hiển thị |
| Test | `node --test` — mô phỏng hàng trăm giải đấu toàn bot | Bắt crash / vòng lặp vô tận của 72 kỹ năng |

## 3. Cấu trúc thư mục

```
run.mjs              Trình khởi chạy: đọc .env, bật server + cloudflared (xem DEPLOY.md)
server/index.js      HTTP tĩnh + WebSocket + /api/manifest + /api/tracks; hỗ trợ BASE_PATH (vd /game)
server/room.js       Phòng chơi, ghế, bot, định tuyến prompt, reconnect
shared/cards.js      Dữ liệu 72 thẻ + 13 biến cố (sinh từ file master)
shared/tracks.js     4 đường đua: loại ô, khúc cua, sinh toạ độ 3D
shared/engine.js     Engine: draft, chặng đua, di chuyển, tính điểm
shared/powers.js     Kỹ năng theo lượt (đầu lượt, đổ xúc xắc, cuối lượt)
public/index.html    Trang duy nhất
public/css/style.css
public/js/main.js    Kết nối, hàng đợi sự kiện, điều phối
public/js/ui.js      Màn hình DOM (sảnh, draft, HUD, prompt, kết quả)
public/js/scene.js   Cảnh 3D (đường đua, standee, xúc xắc, camera)
public/js/i18n.js    Nạp ngôn ngữ, hàm t()
public/js/audio.js   Nhạc nền theo phase + SFX tổng hợp
public/locales/*.json  en.json, vi.json (UI) + en.cards.json, vi.cards.json (thẻ)
public/assets/       cards/ images/ audio/  (thả asset vào đây)
tools/gen-cards.mjs  Sinh shared/cards.js + vi.cards.json từ file master
tools/gen-placeholders.mjs  Sinh asset giả đúng tên file thật (cần Chrome)
server/tracks.js     Nạp assets/tracks/track_N.json
public/track_waypoint_editor.html  Công cụ bấm toạ độ ô trên ảnh bản đồ
tools/optimize-assets.mjs  Tạo bản .webp cho bản đồ + sprite thẻ, .ogg cho nhạc (tuỳ chọn)
tools/pack.mjs       Đóng gói bản phát hành vào release/ (npm run pack)
tools/e2e.mjs        Một client + 3 bot chơi trọn giải qua WebSocket
deploy/              systemd unit + script cài service (Ubuntu)
.env.example         Mẫu cài đặt máy chủ (token tunnel, địa chỉ, cổng)
test/sim.test.js     Fuzz test engine
docs/                Đặc tả
```

## 4. Kiến trúc chạy

```
Trình duyệt ──WebSocket /ws──► server/index.js ──► Room ──► Game (engine)
     ▲                                              │
     └────────── {t:'ev', e:sự kiện, s:snapshot, d:ms} ◄──┘
```

- Mỗi phòng có 1 đối tượng `Game` chạy `async run()` từ draft đến hết chặng 4.
- Engine phát **sự kiện** (`roll`, `move`, `trip`, `abil`…). Mỗi sự kiện gửi kèm **snapshot toàn bộ trạng thái công khai** (≈1–2 KB) và thời lượng hoạt ảnh `d`. Client diễn hoạt sự kiện trong `d` ms rồi đồng bộ cứng theo snapshot → không bao giờ lệch trạng thái, reconnect đơn giản.
- Server chờ `d` ms sau mỗi sự kiện (nhân hệ số tốc độ phòng) để hoạt ảnh và bộ đếm giờ prompt khớp nhau.
- Khi cần người chơi quyết định, engine gọi `ask(player, prompt)` → server gửi `{t:'prompt'}` cho đúng người; hết giờ (mặc định 45 s), mất kết nối hoặc là bot → dùng gợi ý `ai` do engine tính sẵn.
- Thông tin ẩn: **tay bài của người khác** (server gửi snapshot riêng cho từng ghế: `hand: null` + `handN`), lá người khác vừa tuyển (sự kiện `pick` bị bỏ mã thẻ), lá chọn ra sân trước khi lật, con số bí mật của Báo Gian Lận.

### 4.1 Giao thức WebSocket (JSON)

Client → Server:

| `t` | Trường | Ý nghĩa |
|---|---|---|
| `create` | `name` | Tạo phòng, trở thành chủ phòng |
| `join` | `code`, `name`, `token?` | Vào phòng / kết nối lại bằng token |
| `opts` | `opts` | (chủ phòng) đổi tuỳ chọn |
| `bot` | `add`/`seat` | (chủ phòng) thêm / xoá bot |
| `start` | | (chủ phòng) bắt đầu |
| `answer` | `id`, `v` | Trả lời prompt |
| `again` | | (chủ phòng) về sảnh sau khi kết thúc |

Server → Client:

| `t` | Trường | Ý nghĩa |
|---|---|---|
| `joined` | `code`, `seat`, `token` | Xác nhận, lưu token vào localStorage |
| `room` | `room` | Trạng thái sảnh (ghế, tuỳ chọn, chủ phòng, đang chơi?) |
| `ev` | `e`, `s`, `d` | Sự kiện + snapshot + thời lượng |
| `state` | `s` | Snapshot đầy đủ (khi reconnect) |
| `prompt` | `id`, `key`, `params`, `opts[]`, `ms` | Yêu cầu lựa chọn |
| `promptEnd` | `id` | Prompt đã được giải quyết |
| `err` | `key` | Lỗi (khoá i18n) |

Prompt luôn là "chọn 1 trong danh sách": mỗi option `{id, k?, r?, c?, n?}` (nhãn i18n / đấu thủ / thẻ / số). Một kiểu UI duy nhất phục vụ mọi kỹ năng.

### 4.2 Tuỳ chọn phòng

| Tuỳ chọn | Giá trị | Mặc định |
|---|---|---|
| `sets` | `base` / `exp` / `all` | `all` |
| `twists` | bật/tắt Biến Cố (mỗi chặng rút 1 lá khi đấu thủ đầu tiên vượt qua khúc cua 1) | tắt |
| `double` | Chạy kép: mỗi người draft 8, ra sân 2 đấu thủ/chặng (chỉ khi ≤ 3 ghế) | tắt |
| `speed` | 0.6 / 1 / 1.5 / 2.5 | 1 |
| `timer` | giây cho mỗi prompt | 45 |

Biến thể 2 người (file master không mô tả chi tiết) → thiết kế: 2 người + bot, hoặc bật `double`.

## 5. Client

### 5.1 Màn hình
Mọi URL trong client là **tương đối** nên game chạy được ở bất kỳ đường dẫn nào (vd `game.vuducan.qzz.io/arcaneathletes/`).

1. **Trang chủ**: tên, chọn ngôn ngữ, Tạo phòng / Nhập mã phòng, 3 dòng tóm tắt cách chơi. Link mời `…/?room=ABCD`.
2. **Sảnh**: mã phòng, 6 ghế (avatar màu, nhãn chủ phòng / bạn / bot), thêm/xoá bot, tuỳ chọn dạng nút gạt có chú thích, Rời phòng, nút Bắt đầu (khoá khi chưa đủ ghế).
3. **Tung xúc xắc**: bảng kết quả từng người, nút tung (phím Enter), báo hoà → tung lại.
4. **Tuyển mộ**: dải thứ tự chọn (snake), hàng thẻ, **chọn rồi mới xác nhận** (không chọn nhầm được), khay "Đội của bạn".
5. **Chọn đấu thủ**: thông tin đường đua (số ô, 2 khúc cua, số ô đặc biệt, điểm thưởng) + tay bài của mình.
6. **Chặng đua**: cảnh 3D +
   - cột trái: người chơi, điểm, đấu thủ (chân dung, vị trí, thanh tiến độ), tay bài (của người khác là mặt sau);
   - **thanh theo dõi** trên cùng: đường thẳng Xuất phát → Đích với ô đặc biệt, cờ khúc cua, quân của từng đấu thủ trượt theo;
   - cột phải: nhật ký (bật/tắt được, chỉ tự cuộn khi đang ở cuối);
   - giữa: thông báo kỹ năng (kèm hình thẻ), khung quyết định ở đáy, thanh đếm giờ dưới thanh tiêu đề;
   - bấm quân cờ để xem thẻ, hoặc để trả lời khi game đang hỏi "chọn đấu thủ nào" (quân được chọn nhấp nháy vàng).
7. **Kết quả chặng** (bục 🥇🥈 + bảng điểm + thanh chờ) và **Chung cuộc** (quán quân, bảng điểm, người thắng từng chặng, pháo giấy).
8. **Thư viện thẻ** (tìm kiếm, lọc theo bộ), **Cách chơi**, **Cài đặt** (ngôn ngữ, đồ hoạ, âm thanh, toàn màn hình).

Phím tắt: `1–6` chọn số, `Y`/`N`, `Enter` xác nhận, `Esc` đóng hộp thoại. Màn hình hẹp (≤ 900px): người chơi thành dải ngang, nhật ký thành ngăn kéo, camera zoom gần và tự bám theo đấu thủ đang đi.

`ui.js` chỉ thay DOM khi nội dung đổi (`setHTML`), nên hover / cuộn / hoạt ảnh CSS không bị giật khi có sự kiện mới.

### 5.2 Cảnh 3D
- Môi trường 3D theo chủ đề từng chặng (cây / pha lê bằng `InstancedMesh`, màu trời, sương, sao).
- Bàn chơi = **ảnh bản đồ** (`assets/images/*.png|webp`) trải phẳng trên mặt bàn; vị trí và loại ô lấy từ `assets/tracks/track_N.json` (schema Phần V.2 file master). Không dựng lại bản đồ bằng hình khối.
- Kích thước bàn = tỉ lệ thật của file ảnh (server đọc header PNG/WebP/JPEG; client kiểm tra lại khi ảnh tải xong), không phụ thuộc `image_resolution` trong JSON.
- Standee = ảnh PNG nhân vật **làm dày**: 7 lát cùng texture cắt theo alpha xếp chồng (dày 0.2 đơn vị), 2 mặt ngoài là hình, các lát giữa tô màu bìa; cao 6 đơn vị, có **viền trắng + mép tối** quanh hình (shader nở viền theo alpha) để nổi trên nền bản đồ, bóng tròn mờ, vòng màu người chơi dưới chân và huy hiệu chữ cái đầu tên chủ phía trên đầu (viền vàng = của bạn). Luôn quay về camera; ngã = nằm bẹp 90°.
- Cờ khúc cua 1 / 2 cắm cạnh ô tương ứng.
- Xúc xắc 3D lăn rồi dừng đúng mặt; hiệu ứng warp, loại, về đích.
- Camera: OrbitControls (xoay/zoom/pan). Mặc định tự lùi cho vừa cả bàn trong phần cửa sổ không bị HUD che (`setInsets` + `setViewOffset`); nút ⟲ đặt lại, ▦ nhìn từ trên xuống, nhấp đúp để đặt lại. Khi zoom gần thì tự bám nhẹ theo đấu thủ đang đi. Người chơi đã tự xoay thì game không tự chỉnh nữa.

### 5.3 Tối ưu
- Giới hạn `devicePixelRatio` (1 / 1.5 / 2 theo mức chất lượng), bóng đổ chỉ ở mức Cao.
- Trang trí dùng `InstancedMesh`; texture canvas nhỏ (256px), dùng chung geometry/material.
- Ảnh lớn (bản đồ, sprite thẻ): `tools/optimize-assets.mjs` tạo bản `*.webp` cạnh dài tối đa 4096px. Client dùng bản tối ưu **chỉ khi nó không cũ hơn file gốc** (so thời điểm sửa file trong manifest), nên thay file gốc không bao giờ bị hiện hình cũ.
- Nhạc WAV 20–50 MB: phát dạng stream bằng `<audio>` (không giải mã vào RAM); khuyến nghị nén sang `.ogg/.mp3` (client tự ưu tiên).
- Server: file tĩnh có `Cache-Control`, hỗ trợ `Range` cho audio; phòng rảnh 30 phút tự xoá; giới hạn kích thước message 8 KB.

## 6. Đa ngôn ngữ

- `public/locales/<lang>.json`: chuỗi giao diện, nhật ký, prompt (khoá phẳng `nhóm.tên`, tham số `{r}`, `{p}`, `{n}`…).
- `public/locales/<lang>.cards.json`: `cards[code] = {name, cat, desc}`, `twists[code] = {name, desc}`, `tracks[id] = {name, desc}`.
- Server chỉ gửi **khoá + tham số**, mỗi client tự dịch → mỗi người chơi dùng ngôn ngữ riêng trong cùng phòng.
- Thêm ngôn ngữ: chép 2 file `en*.json` thành `<mã>*.json`, thêm mã vào `LANGS` trong `public/js/i18n.js`.
- Thiếu khoá → rơi về tiếng Anh → rồi hiện chính khoá đó.

## 7. Bảo mật & giới hạn
- Server authoritative; client chỉ gửi `answer` cho prompt của chính mình (kiểm tra id + ghế + option hợp lệ).
- Chống path traversal khi phục vụ file tĩnh. Tên người chơi cắt 16 ký tự, escape HTML phía client.
- Tối đa 200 phòng, 6 ghế/phòng. Trạng thái nằm trong RAM (restart server = mất ván đang chơi; chấp nhận ở v1).

## 8. Ngoài phạm vi v1 (ghi nhận để làm sau)
- Tài khoản, lưu lịch sử, xếp hạng.
- Lưu ván xuống đĩa / phục hồi sau restart.
- "Chế độ bàn chơi" dùng toạ độ Draft Zones / Player Zones / Podium ở Phần IV.5 file master (v1 dùng UI DOM cho draft và điểm).
- Công cụ căn toạ độ ô theo ảnh bản đồ thật (xem `ASSETS.md` §4).
