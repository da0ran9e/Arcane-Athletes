# Tài nguyên (assets)

Thả file vào `public/assets/` đúng đường dẫn dưới đây. Server quét thư mục (`/api/manifest`, làm mới mỗi 30 giây), client tự dùng file nào có và vẽ thay thế file nào thiếu. **Không cần sửa code.**

## 1. Thẻ bài — `public/assets/cards/`

| File | Kích thước | Lưới | Cắt ô |
|---|---|---|---|
| `765fa4bba7c0.jpg` (bộ cơ bản) | 5000×3104 | 9×4 | `col = id%100%9`, `row = ⌊id%100/9⌋` |
| `34c4ebe58b94.jpg` (mở rộng) | 4061×2270 | 10×4 | `col = id%100%10`, `row = ⌊id%100/10⌋` |
| `9ebfa55272d8.jpg` (biến cố) | 9107×1432 | 7×2 | `col = (id−300)%7`, `row = ⌊(id−300)/7⌋` |
| `4a7954234c04.jpg` | 257×358 | — | mặt sau thẻ đấu thủ |
| `ffcbbc9bd1d4.jpg` | 330×186 | — | mặt sau thẻ biến cố |

Client hiển thị bằng CSS sprite (`background-size: cols*100% rows*100%`). Trên ô thẻ nhỏ (tuyển mộ, thư viện) chỉ hiện **62% phía trên** của lá bài để vừa màn hình; lá bài đầy đủ hiện trong khung chi tiết. Đổi tỉ lệ này bằng hằng số `ART_CROP` đầu file `public/js/ui.js` (đặt `1` để luôn hiện cả lá). Thiếu sheet → thẻ vẽ bằng CSS + emoji (dự phòng). Mô tả kỹ năng luôn lấy từ file ngôn ngữ nên đổi ngôn ngữ vẫn đúng dù ảnh thẻ in 1 thứ tiếng.

## 2. Bản đồ & standee — `public/assets/images/`

| Chặng | File gốc (8000×8000 PNG) | Bản tối ưu client ưu tiên |
|---|---|---|
| 1 Emerald Plains | `bc84b1380de5.png` | `bc84b1380de5.webp` |
| 2 Wildwood Rapids | `cf3c7ffb6ddc.png` | `cf3c7ffb6ddc.webp` |
| 3 Obsidian Spiral | `07245029d251.png` | `07245029d251.webp` |
| 4 Celestial Vortex | `875e1c0e6ba2.png` | `875e1c0e6ba2.webp` |

- Ảnh bản đồ được trải lên bệ giữa cảnh 3D. **Bàn luôn có đúng tỉ lệ của file ảnh** (đọc từ chính file), nên 4 bản đồ có thể khác kích thước điểm ảnh. Ảnh rất lớn → chạy `node tools/optimize-assets.mjs` (cần `npm i sharp`) để tạo bản `.webp` cạnh dài ≤ 4096px; game chỉ dùng bản `.webp` khi nó không cũ hơn file gốc, nên sửa file gốc xong không cần xoá bản `.webp` cũ (nhưng nên chạy lại script).
- 72 standee: PNG nền trong suốt, tên file theo cột cuối bảng thẻ trong file master (đã nằm trong `shared/cards.js`, trường `img`). Thiếu → standee vẽ canvas.

## 3. Âm thanh — `public/assets/audio/`

Client ưu tiên `.ogg` / `.mp3` cùng tên gốc nếu chúng không cũ hơn file `.wav`, ngược lại dùng `.wav`. Phân vai (sửa trong `public/js/audio.js`, bảng `MUSIC`):

| Phase | Bản nhạc | File |
|---|---|---|
| Trang chủ / sảnh | Prelude | `b72fe54926cb` |
| Draft | Setting Up | `ea20e830418a` |
| Chọn đấu thủ | Intrigue | `52e4fee42b7d` |
| Chặng 1 | Day Travel | `ec306252ee5f` |
| Chặng 2 | Goblin Combat | `f99fca88af73` |
| Chặng 3 | Night Travel | `a91a1fd56436` |
| Chặng 4 | Tension | `59db7703c5a3` |
| Kết quả chặng | Reflective | `4d807db012f3` |
| Chung cuộc | Epilude | `4836b4f7a3a8` |

Các bản còn lại (Awakening, Calm, Death, Human/Orc/Undead Combat, Map, Mistique) để dành. SFX (xúc xắc, bước, ngã, điểm, về đích) được tổng hợp bằng WebAudio, không cần file.

Khuyến nghị nén: `ffmpeg -i x.wav -c:a libvorbis -q:a 4 x.ogg` (script optimize tự làm nếu máy có `ffmpeg`).

## 4. Toạ độ đường đua — `public/assets/tracks/track_1.json` … `track_4.json`

Schema đúng như Phần V.2 file master (`finish_space_index`, `first_corner_index`, `second_corner_index`, `image_path`, `image_resolution`, `waypoints[{index,type,steps?,norm_x,norm_y}]`). Server đọc lại mỗi khi bắt đầu ván; file thiếu/lỗi → dùng bố cục dựng sẵn.

- `image_path` quyết định ảnh bản đồ; `image_resolution` quyết định tỉ lệ khung (ảnh không vuông vẫn đúng).
- Waypoint thiếu toạ độ được nội suy; thiếu `type` coi là `NORMAL`.
- Tạo file: mở `http://localhost:3000/track_waypoint_editor.html`, chọn chặng, nạp ảnh, bấm lần lượt các ô từ Start đến Finish, đặt loại ô, tải JSON về và chép vào `public/assets/tracks/`.

## 5. Asset giả (placeholder)

`node tools/gen-placeholders.mjs` (cần Google Chrome; `--force` để vẽ lại) sinh đủ bộ với **đúng tên file thật**: 3 sprite sheet + 2 mặt sau, 72 standee PNG trong suốt, 4 bản đồ 2048px, 4 file waypoint, 19 đoạn nhạc ngắn.

**Khi có asset thật: dán đè thư mục `assets` của bạn lên `public/assets/`** (cards/, images/, audio/). Lưu ý duy nhất: 4 file `tracks/track_N.json` placeholder mô tả bản đồ giả — phải thay bằng JSON khớp bản đồ thật (dùng editor ở trên), nếu không quân cờ sẽ đứng lệch ô.
