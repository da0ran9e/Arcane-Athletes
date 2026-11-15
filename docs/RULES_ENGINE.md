# Engine luật — mô hình & diễn giải

Luật gốc ở `GAME_RULES_AND_ASSETS_MASTER.md`. File này ghi **cách engine hiện thực** và mọi chỗ phải tự diễn giải (đánh dấu ⚖). Sửa luật → sửa `shared/engine.js` / `shared/powers.js` và cập nhật bảng dưới.

## 1. Mô hình dữ liệu

```
Game    { opts, players[], deck[], twistDeck[], winners[], raceIdx, race }
Player  { name, bot, pts, hand[code], used[code], eternal?, carry[] }
Race    { track, L, c1, c2, runners[], order[], finishers[], elimOrder[], over, cancelled,
          twists[], fixed{}, monster?, chips{}, turnNo }
Runner  { id, code, owner, pos, trip, out, fin, abils[code], f{cờ theo chặng}, t{cờ theo lượt} }
```

- Vị trí `pos`: 0 = Xuất phát … `L` = Đích (`pos ≥ L` là cán đích).
- Kỹ năng tra bằng `has(runner, code)`: gồm kỹ năng gốc + kỹ năng sao chép (`abils`), cộng động kỹ năng của người dẫn đầu nếu là Miêu Tặc, trừ khi bị Hư Vô vô hiệu.
- Mọi lần kỹ năng phát động đều đi qua `act(runner, code)` → phát sự kiện `abil` và kích hoạt Cơ Hội Bứt Tốc.

## 2. Dòng chảy

1. **Roll-off**: mỗi người tự bấm tung 1 xúc xắc; xếp hạng từ cao xuống thấp (nhóm hoà tung lại với nhau). Thứ tự chọn = thứ hạng xúc xắc; người cao nhất chọn **đầu tiên và cũng chọn lá cuối cùng** của mỗi hàng (snake). **Snake draft**: hàng 2N lá; lượt 1 thuận, lượt 2 ngược; dọn hàng, mở hàng mới, lặp lại. Mỗi người 4 lá (8 lá nếu chạy kép: 4 hàng).
2. Mỗi chặng: (chặng ≥ 2 và bật biến cố) rút Biến Cố → mọi người chọn đấu thủ **đồng thời** → lật → kỹ năng chuẩn bị → vòng lượt → tính điểm.
3. Thứ tự lượt: chặng 1 theo roll-off; chặng sau bắt đầu từ chủ của đấu thủ **bị loại đầu tiên**, nếu không ai bị loại thì **đứng sau cùng** (hoà → ngẫu nhiên). Nếu một người có nhiều đấu thủ, chúng đi liên tiếp.
4. Lượt: đầu lượt → kiểm tra ngã → (hành động thay thế | đổ xúc xắc + đổ lại) → phản ứng theo mặt xúc xắc → cộng/trừ → di chuyển chính → vượt mặt → ô đặc biệt → dừng chung ô → cuối lượt.
5. Kết thúc chặng: đấu thủ thứ 2 cán đích, hoặc chỉ còn ≤ 1 đấu thủ trên đường (người đó nhận hạng kế tiếp). ⚖ Giới hạn an toàn 300 lượt/chặng: hết giới hạn thì chặng dừng, chỉ ai đã cán đích mới có hạng.
6. Điểm: Vàng 3/4/4/5, Bạc 1/2/2/3. Hoà điểm chung cuộc → cùng thắng.

## 3. Quy tắc di chuyển (hàm `move`)

- **Vượt mặt**: `from < pos_đối_thủ < to` (chỉ khi tiến). Cán đích = vượt mọi người đứng trước. Lùi không tính vượt.
- **Warp**: không vượt, không ô đặc biệt, ⚖ không kích hoạt hiệu ứng "dừng chung ô" (trừ Người Khổng Lồ đẩy lùi).
- Thứ tự sau khi tới ô: vượt mặt → ô bàn cờ (mũi tên là một lần `move` riêng, có thể nối chuỗi) → dừng chung ô.
- Không lùi quá ô 0. Ô 0 không kích hoạt hiệu ứng dừng chung ô.
- Chống lặp: độ sâu lồng `move` tối đa 10; các kỹ năng phản ứng không tự kích hoạt lại chính nó khi đang xử lý.
- Cộng/trừ Di chuyển Chính: nhân (x2, x3) áp lên mặt xúc xắc trước, sau đó cộng trừ; tối thiểu 0.

## 4. Đường đua

Bố cục thật đọc từ `public/assets/tracks/track_N.json` mỗi khi bắt đầu ván. Hiện tại 4 file được lập theo ảnh bản đồ placeholder của bạn (cùng một khung: Start → 12 ô hàng trên → 2 ô cột phải → 15 ô hàng dưới → Đích):

| # | L (Đích) | Cua 1 | Cua 2 | Ô đặc biệt |
|---|---|---|---|---|
| 1 Emerald Plains | 30 | 12 | 15 | không có |
| 2 Wildwood Rapids | 30 | 12 | 15 | 1★ 5⚠ 7➜+3 11➜+1 13★ 16➜−4 17⚠ 23➜+2 24➜−2 26⚠ |
| 3 Obsidian Spiral | 30 | 12 | 15 | không có (đoạn thắt 13–14 chỉ là hình vẽ) |
| 4 Celestial Vortex | 30 | 12 | 15 | cặp ô nối nhau: 4↔6, 8↔12, 11↔15, 17↔23, 20↔22, 24↔28 |

⚖ Tự diễn giải, cần xác nhận:
- Ô "1" và "2" ở cột trái là **bục về đích** (hạng 1, hạng 2), không phải ô đường đua → Đích là vị trí 30, quân cờ về đích đứng lên bục (`podium` trong JSON).
- Khúc cua 1 = góc trên-phải (ô 12), khúc cua 2 = góc dưới-phải (ô 15).
- Mũi tên: cùng chiều chạy = tiến, ngược chiều chạy = lùi.
- Chặng 4: mỗi vòng tròn là ô mũi tên đưa quân cờ tới vòng tròn nối với nó (hai chiều). Tới nơi rồi thì không bị đưa ngược lại (quy tắc chống lặp: xử lý 1 lần).

`shared/tracks.js` vẫn giữ 4 bố cục dựng sẵn làm dự phòng khi thiếu file JSON. "Trước khúc cua 2" = `pos < c2`. "Chưa vượt qua khúc cua 2" = `pos ≤ c2`.

## 5. Diễn giải 72 kỹ năng

Chỉ ghi phần ⚖ tự diễn giải hoặc chi tiết hiện thực; phần còn lại đúng nguyên văn file master.

### Bộ cơ bản
| Mã | Tên | Hiện thực / ⚖ |
|---|---|---|
| R-19 | Creeping Larva | Đối thủ đổ 1 (kết quả cuối sau đổ lại) → mất di chuyển, Larva +1. |
| R-14 | Sticky Slime | −1 cho mọi đấu thủ khác; nhiều Slime cộng dồn. |
| R-17 | Turbo Hare | +2; một mình dẫn đầu lúc đầu lượt → bỏ di chuyển chính. |
| R-11 | Astral Sage | Đoán trước; trúng → thêm 1 lượt ngay. |
| R-30 | Parasite Hitcher | ⚖ Chỉ bám theo **Di chuyển Chính** của người chung ô; đi cùng số ô sau khi người kia đi xong. |
| R-34 | Nimble Leaper | +1 mỗi lần kỹ năng của **đấu thủ khác** phát động (`act`). Không tự kích hoạt lồng nhau. |
| R-01 | Alchemist | Đổ 1–2 → có thể đi 4. |
| R-36 | Uninvited Guest | Warp tới ô (≠ ô mình) có đúng 2 đấu thủ. |
| R-08 | Hype Cheerleader | Mọi người chót bảng (kể cả mình nếu chót) +2, mình +1. |
| R-26 | Grand Illusionist | Đổ lại tối đa 2 lần/lượt. |
| R-37 | Twin Sparks | Chọn 1 thẻ từng về Nhất chặng trước (của bất kỳ ai). |
| R-23 | Resilient Hopeful | Một mình chót bảng đầu lượt → +1 điểm. |
| R-28 | Overdrive Engineer | Nhân đôi mặt xúc xắc → ngã sau khi đi. |
| R-10 | Blade Challenger | ⚖ Được mời quyết đấu **mỗi lần có sự kiện dừng chân** khiến Kiếm Khách chung ô với ai (ô ≠ 0), 1 lần/đối thủ/sự kiện. Người thắng +2. |
| R-05 | Half-Beast Lancer | Người bị vượt lùi 2. |
| R-33 | Strict Arbiter | Người khác phải vào đích vừa khít, dư → không di chuyển (cả lần đi đó). |
| R-07 | Grease Trapper | Người vượt qua bị ngã khi kết thúc bước đi. |
| R-02 | Aero Cruiser | `pos < c2` → +3, ngược lại −1. |
| R-22 | Loyal Vanguard | Đối thủ đổ 6 → +2 trước khi họ đi. |
| R-32 | Chrono Hijacker | Người **khác** đổ 1 → Hijacker đi lượt kế tiếp, sau đó thứ tự tiếp tục từ sau Hijacker. |
| R-24 | Abyssal Maw | Chỉ khi **Maw** dừng lên ô có đúng 1 người khác. |
| R-18 | Mind Controller | Warp 1 đấu thủ bất kỳ về ô mình. |
| R-31 | Cosmic Lovers | Bất kỳ ai dừng (không phải warp) tạo ô đôi → +2. Không tự lồng. |
| R-04 | Bone Witch | Hai chiều. |
| R-03 | Veteran Mentor | +1 cho mọi người chung ô, kể cả mình. |
| R-12 | Provocateur | Đối thủ kết thúc lượt cách vị trí đầu lượt ≤ 1 ô → +2. |
| R-15 | Immense Goliath | Ai dừng/warp vào ô Goliath → lùi 1 ô; Goliath tới ô có người → đẩy họ lùi 1 ô. Trừ ô 0. |
| R-20 | Pacing Strider | Đi đúng 5 (không cộng trừ), vẫn tính là Di chuyển Chính. |
| R-27 | Festival Herald | Người phía sau +1, phía trước −1 (warp-kéo, không hiệu ứng); +1/người chung ô sau khi kéo. |
| R-29 | Endless Drifter | +4 điểm đầu chặng; đổ 6 → warp về 0, −1 điểm (không âm). |
| R-25 | Springing Toad | Ô có người không tính bước (cả tiến lẫn lùi). |
| R-06 | Mimic Phantom | ⚖ Hoà dẫn đầu → sao chép người dẫn đầu đầu tiên theo thứ tự lượt. Tự mình dẫn đầu một mình → không sao chép. Không chạy kỹ năng "chuẩn bị chặng". |
| R-16 | Quantum Shifter | Hoán đổi thay cho đổ xúc xắc. |
| R-13 | Chaos Orb | Rút 3 từ cọc, chọn 1. |
| R-21 | Grand Strategist | Đoán 1 **đối thủ**; đúng → chặng kết thúc, Quân Sư hạng 2. |
| R-09 | Fortune Dealer | Mọi người 1 lần đổ lại/lượt; đối thủ dùng → Dealer +1. |

### Bộ mở rộng
| Mã | Tên | Hiện thực / ⚖ |
|---|---|---|
| E-01 | Naked Sprinter | +1 điểm/lần Di chuyển Chính có vượt ≥ 1 người. |
| E-02 | The Void Null | Người đứng trước Void: −1 và mất kỹ năng. ⚖ Tính theo Void đứng sau cùng; không đệ quy. |
| E-03 | Armored Rider | +2 đến khi bị vượt. |
| E-04 | Sovereign Tripper | Làm ngã người dẫn đầu (khác mình). |
| E-05 | Slothful Drifter | −1; cuối chặng còn trên đường và `pos ≤ c2` → +3. |
| E-06 | Guardian Patron | ⚖ "Bên trái" = người kế tiếp theo chiều kim đồng hồ (ghế +1). |
| E-07 | Water Blaster | Cuối lượt đổ d6, ngã mọi người trong 1..d ô phía trước. |
| E-08 | Bounding Hopper | Thêm lượt; ⚖ tối đa 3 lượt thêm liên tiếp. |
| E-09 | Shadow Tail | Warp tới ô ngay sau người gần nhất phía trước. |
| E-10 | Prima Vanguard | Bắt buộc; chót bảng (kể cả đồng chót) → đổi chỗ với người dẫn đầu. |
| E-11 | Dice Grandmaster | 6 xúc xắc, chọn số xuất hiện ≥ 2 lần. |
| E-12 | All-in Daredevil | Đổ tiếp cộng dồn; ≤ lần trước → 0. |
| E-13 | Apex Champion | 1: đi 7 · 2: kéo người chót về ô mình · 3: warp tới 1 người + làm ngã · 4: đi 4 + thêm lượt · 5: người dẫn đầu lùi 5 · 6: đi 6, ngã mọi người bị vượt. ⚖ Các khoảng cách này cố định, không cộng trừ. |
| E-14 | Bio Cluster | Đổ 1–2 → rút 1 thẻ, nhận kỹ năng (cộng dồn). |
| E-15 | Relentless Chaser | + số người đứng trước. |
| E-16 | Dark Mimic | ⚖ Chỉ **1 lần/chặng**: người đầu tiên (khác nó) cán đích bị loại, Dark Mimic nhận kỹ năng; hạng 1 vẫn trống. |
| E-17 | Trap Specialist | Người khác đổ 3 → đi lùi. |
| E-18 | Fallen Aeronaut | +3; đổ 6 → bị loại. |
| E-19 | Static Warden | Người khác trong 1 ô → mọi lần đổ tính là 1. |
| E-20 | Abyssal Leviathan | 1 lần/chặng. |
| E-21 | Fun Destroyer | Mọi mặt 6 đổ lại, +1 mỗi lần. (Không áp khi kết quả bị cố định bởi T-09.) |
| E-22 | Burrowing Mole | Không ai trong 1 ô → đi đúng 6. |
| E-23 | Gliding Penguin | Bị vượt → ngã; đang ngã → x2 thay vì mất lượt. |
| E-24 | Tantrum Quitter | Mọi đấu thủ khác dẫn ≥ 5 ô → huỷ chặng (không ai nhận Vàng/Bạc), +3. |
| E-25 | Tycoon Landlord | ⚖ 1 điểm trả cho **chủ Tycoon**; không có điểm → ngã. |
| E-26 | Aether Soulmate | Chọn 1 đối thủ; đầu lượt cách ≤ 5 ô → warp tới. |
| E-27 | Tempest Demon | + điểm đang có; dẫn đầu cách ≥ 4 ô đầu lượt → bị loại. |
| E-28 | Clumsy Hound | Chót (kể cả đồng chót) x3; không thì đi lùi. |
| E-29 | Card Swapper | Đổi **chủ sở hữu** hai đấu thủ. |
| E-30 | Golden Heir | Bắt đầu ở cua 1. |
| E-31 | Harsh Critic | ⚖ 1 lần trong mỗi lượt của đối thủ đứng trước mình. |
| E-32 | Vengeful Nemesis | Đổ theo; trùng → đi đúng số đó. |
| E-33 | Eternal Competitor | Sau chặng đầu tiên, tự ra sân thêm ở mọi chặng sau (vẫn tính hạng). |
| E-34 | Werewolf Fang | Đổ 1–2 → loại mọi người bị vượt trong lượt đó. |
| E-35 | Cheating Cheetah | ⚖ Tuỳ chọn thay cho đổ; "bên phải" = ghế −1; đoán trúng → đứng im; vẫn cộng trừ. |
| E-36 | Understudy | Sao chép 1 đấu thủ đối phương trong chặng. |

## 6. Biến cố (⚖ nhiều chỗ file master mô tả ngắn)

⚖ Thời điểm rút: file master không nêu. Engine rút **1 lá mỗi chặng, ngay sau lượt mà có đấu thủ đầu tiên đứng quá khúc cua 1** — đấu thủ đó là "người kích hoạt". Các kỹ năng cộng/trừ thụ động (Slime, Mentor…) không gọi `fire()` nên không kích hoạt Cơ Hội Bứt Tốc.


| Mã | Hiện thực |
|---|---|
| T-01 | Quái thú ở ô 0, đi d6 sau mỗi lượt; đấu thủ có `from < pos < to` bị loại. |
| T-02 | Rút thêm 2 lá, áp lần lượt. |
| T-03 | Dừng ở L−1 hoặc L−2 → lùi 5. |
| T-04 | Đảo đường đua giữa chặng: ô i ↔ L−i (đấu thủ giữ nguyên chỗ đứng vật lý, ai còn ở Xuất phát thì đứng ở L−1), mũi tên đổi dấu, cua 1/2 hoán đổi. |
| T-05 | Sau mỗi lượt đổ d6, bỏ qua bấy nhiêu lượt kế tiếp. |
| T-06 | Mọi người warp tới ô 1; +3 Di chuyển Chính cả chặng. |
| T-07 | Di chuyển Chính ≥ 6 ô → bị loại. |
| T-08 | 1 chip (1 điểm) trên mỗi ô sau cua 1; ai dừng thì nhặt. |
| T-09 | Mỗi người đổ 1 lần, cố định cho mọi lần đổ trong chặng. |
| T-10 | Đấu thủ kích hoạt bị loại khỏi chặng, ra sân thêm ở chặng sau (chặng 4: chỉ bị loại). |
| T-11 | Người chót bảng (mọi người đồng chót) +7 ngay. |
| T-13 | Mỗi người rút 1 thẻ; nếu đổi, đấu thủ trên sân giữ vị trí nhưng mang thẻ + kỹ năng mới. |
| T-12 | ⚖ Sau chặng: hạng 1 và 2 đua tay đôi từ cua 2 chỉ bằng d6 thuần (không kỹ năng), hạng 2 đi trước; người thắng nhận Vàng. |
