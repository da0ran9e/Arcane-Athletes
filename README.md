# Aetheria Grand Prix

Giải đua cờ bàn chiến thuật của 4 cõi vương quốc: 72 đấu thủ mang năng lực ma thuật kỳ quái tranh ngôi vô địch qua 4 chặng đua. Bản web 3D, chơi nhiều người qua trình duyệt — không cần cài gì.

**Chơi tại: https://game.vuducan.qzz.io/arcaneathletes/**

3–6 người · một giải khoảng 30–45 phút · tiếng Việt và English · ghế trống điền bot

## Một giải diễn ra thế nào

**Tuyển mộ.** Snake draft: mỗi người lần lượt chọn cho mình đội hình 4 đấu thủ từ 72 thẻ. Thẻ nào vào tay ai là của riêng người đó.

**Bốn chặng đua.** Mỗi chặng một địa hình riêng, điểm thưởng tăng dần về cuối:

| Chặng | Đường đua | Hạng 1 | Hạng 2 |
|---|---|:---:|:---:|
| 1 | Thảo Nguyên Ngọc | 3 | 1 |
| 2 | Rừng Rậm Hoang Dã | 4 | 2 |
| 3 | Vòng Xoáy Hắc Diệp | 4 | 2 |
| 4 | Xoắn Ốc Không Gian | 5 | 3 |

Vào chặng, mọi người bí mật chọn một đấu thủ rồi cùng lật. Đi theo lượt: đổ xúc xắc, di chuyển, kích hoạt kỹ năng của đấu thủ mình.

**Luật "chạy một lần".** Mỗi đấu thủ chỉ được ra sân **đúng một lần trong cả giải** — xong chặng là rời cuộc chơi. Đây là chỗ cân não: đốt quân mạnh để ăn điểm sớm, hay giữ cho chặng 4 đáng giá nhất?

**Điểm lẻ.** Ô Ngôi Sao trên đường đua và một số kỹ năng cho thêm chip 1 hoặc 3 điểm. Hết chặng 4, ai nhiều điểm nhất vô địch; hoà thì cùng thắng.

Thêm vị: 13 thẻ **Biến Cố Thiên Nhiên** xáo trộn đường đua ở các chặng mở rộng.

## Vào chơi

Mở địa chỉ trên → **Tạo phòng** → gửi mã 4 chữ cho bạn bè (hoặc gửi thẳng link `?room=MÃ`). Ghế nào không có người thì **Thêm bot**. Đủ người thì **Bắt đầu**.

Chơi một mình cũng được: tạo phòng, thêm bot cho đủ ghế, bắt đầu. Muốn xem game tự chạy thì thêm `?demo=1` vào địa chỉ.

Mất mạng giữa ván không sao: vào lại là tiếp tục, trong lúc vắng bot quyết định thay sau 6 giây.

## Tài liệu

| | |
|---|---|
| Luật đầy đủ, 72 đấu thủ, 13 biến cố | `GAME_RULES_AND_ASSETS_MASTER.md` |
| Cách engine diễn giải luật (các chỗ ⚖ cần xác nhận) | `docs/RULES_ENGINE.md` |
| **Cài đặt, chạy, cấu hình** | **`docs/SETUP.md`** |
| Đưa lên mạng qua Cloudflare Tunnel | `docs/DEPLOY.md` |
| Đặc tả kỹ thuật & tiến độ | `docs/SPEC.md`, `docs/PROGRESS.md` |
| Thay ảnh, nhạc, thẻ bài | `docs/ASSETS.md` |
| Thêm/sửa ngôn ngữ | `public/locales/*.json` |
