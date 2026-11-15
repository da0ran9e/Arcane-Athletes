# AETHERIA GRAND PRIX: TOURNAMENT OF THE REALMS
## TÀI LIỆU QUY CHUẨN TOÀN DIỆN VỀ CƠ CHẾ TRÒ CHƠI & ĐẶC TẢ TÀI NGUYÊN (MASTER SPECIFICATION)

> **Lưu ý đặc biệt**: Tài liệu này đóng gói 100% cơ chế vận hành, luật chơi chi tiết, danh mục toàn bộ 72 nhân vật và thông số kỹ thuật tài nguyên của dự án board game đua xe chiến thuật đa người chơi **"Aetheria Grand Prix"** (3–6 người chơi). Toàn bộ nội dung đã được hệ thống hóa độc lập, chuẩn xác tuyệt đối theo nguyên bản, sẵn sàng để nạp trực tiếp vào Claude mà không cần thư mục vật lý kèm theo.

---

## PHẦN I: TỔNG QUAN GIẢI ĐẤU & THÀNH PHẦN BỘ GAME

### 1. Giới thiệu & Cốt truyện
**Aetheria Grand Prix** là giải đua cờ bàn chiến thuật đỉnh cao của 4 cõi vương quốc. 72 đấu thủ (Runners) mang trong mình các năng lực ma thuật và kỹ thuật kỳ quái sẽ cạnh tranh qua một giải vô địch gồm **4 chặng đua tính điểm (Championship 4 Races)**.

### 2. Số lượng người chơi & Thời lượng
* **Số lượng người chơi chuẩn**: 3 đến 6 người chơi.
* **Biến thể 2 người chơi**: Xem quy tắc biến thể ở Phần II.
* **Biến thể 3 người chơi chạy kép (Double Runner)**: Mỗi người điều khiển 2 đấu thủ cùng lúc.
* **Thời lượng**: Khoảng 30–45 phút cho một giải đấu 4 chặng đua.

### 3. Thành phần bộ game (Component Breakdown)
* **4 Bản đồ đường đua lớn (Racetracks)**: In 2 mặt với 4 địa hình khác nhau.
* **72 Thẻ Đấu thủ (Runner Cards)**: Chia làm 2 bộ (36 Thẻ Cơ bản + 36 Thẻ Mở rộng).
* **72 Quân cờ Standee tương ứng (Runner Tokens)**: Hình cắt nhân vật có đế dựng.
* **13 Thẻ Biến Cố Thiên Nhiên (Realm Surge / Twist Cards)**: Thêm vào ở các chặng đua mở rộng.
* **6 Viên xúc xắc 6 mặt (d6)**: Tương ứng với màu sắc của 6 người chơi.
* **Hệ thống Chip Điểm Thưởng (Point Chips)**:
  * **4 Cúp Vàng (Gold 1st Place Chips)**: Dành cho Hạng 1 của 4 chặng.
  * **4 Hoa Bạc (Silver 2nd Place Chips)**: Dành cho Hạng 2 của 4 chặng.
  * **9 Chip Đồng 3 Điểm (Bronze 3-Point Chips)**: Thưởng từ kỹ năng đặc biệt.
  * **16 Chip Đồng 1 Điểm (Bronze 1-Point Chips)**: Thưởng khi vào ô Ngôi Sao trên bản đồ hoặc kỹ năng an ủi.

---

## PHẦN II: LUẬT CHƠI CHI TIẾT CHUẨN XÁC 100% (EXACT GAME RULES)

### 1. Giai đoạn Tuyển Mộ Đội Hình (Recruiting / Snake Draft Phase)
Trước khi chặng đua đầu tiên diễn ra, tất cả người chơi tham gia vào một phiên **Snake Draft** công khai để chọn ra đúng **4 Đấu Thủ** cho đội của mình.

* **Quy mô hàng bài tuyển mộ**: Mở ngửa ngẫu nhiên số lượng thẻ bài bằng **$2 \times N$** (với $N$ là số người chơi):
  * 3 người chơi: Mở 6 thẻ bài.
  * 4 người chơi: Mở 8 thẻ bài.
  * 5 người chơi: Mở 10 thẻ bài.
  * 6 người chơi: Mở 12 thẻ bài.
* **Xác định người chọn đầu**: Tất cả người chơi cùng đổ 1 viên xúc xắc d6 (Roll-off). Ai cao nhất được quyền chọn lá đầu tiên (nếu hòa đổ lại).
* **Quy trình Snake Draft (4 Vòng)**:
  * *Lượt 1 (Thuận chiều kim đồng hồ)*: Người 1 $\to$ Người 2 $\to$ ... $\to$ Người $N$.
  * *Lượt 2 (Đảo ngược chiều)*: Người $N$ chọn tiếp lá thứ hai $\to$ Người $N-1$ $\to$ ... $\to$ Người 1.
  * Sau Lượt 2, dọn hàng bài và mở tiếp một hàng bài mới ($2 \times N$ lá ngửa). Lặp lại quy trình đảo chiều để mỗi người chơi chọn tiếp lá thứ 3 và thứ 4.
  * **Kết quả**: Mỗi người chơi giữ trên tay đúng 4 thẻ đấu thủ bí mật cho cả giải đấu.

### 2. Cấu Trúc Giải Đấu & Quy Tắc "Chạy Một Lần" (One-Race Rule)
* Giải đấu trải qua đúng **4 chặng đua** liên tiếp.
* **Quy tắc cốt lõi**: Mỗi đấu thủ trong đội hình 4 người **chỉ được thi đấu duy nhất 1 lần trong cả giải đấu**. Sau khi chặng đua kết thúc, thẻ bài và quân cờ của đấu thủ đó sẽ bị loại khỏi cuộc chơi (ngoại trừ đấu thủ có năng lực hồi sinh đặc biệt).
* Vì các chặng đua sau có điểm thưởng cao hơn, người chơi phải tính toán chiến thuật: dùng đấu thủ mạnh để đoạt điểm sớm hay giữ lại cho chặng chung kết.

### 3. Chuẩn Bị Từng Chặng Đua (Race Setup)
1. **Chọn bản đồ**: Đặt bản đồ đường đua của chặng đó ra giữa bàn (Chặng 1: Thảo Nguyên, Chặng 2: Rừng Rậm, Chặng 3: Vòng Xoáy, Chặng 4: Xoắn Ốc).
2. **Ra sân đồng thời**: Tất cả người chơi bí mật chọn 1 thẻ bài đấu thủ trên tay và cùng lật ngửa cùng một lúc. Lấy quân cờ tương ứng đặt vào ô Xuất Phát (Start space).
3. **Xác định thứ tự đi**:
   * **Chặng 1**: Đổ xúc xắc (Roll-off), ai cao nhất đi đầu tiên, sau đó theo chiều kim đồng hồ.
   * **Chặng 2, 3, 4**: Người chơi có đấu thủ **về chót bảng (farthest behind) hoặc bị loại đầu tiên** ở chặng đua trước sẽ được quyền đi đầu tiên ở chặng này! Nếu hòa, đổ xúc xắc để phân định.

### 4. Diễn Biến Một Lượt Chơi Chi Tiết (Turn Sequence Step-by-Step)
Khi đến lượt của một người chơi, thực hiện tuần tự theo các bước chuẩn sau:
1. **Bước 1: Kích hoạt Đầu Lượt (Turn Start)**: Kích hoạt các kỹ năng có mô tả *"Ở đầu lượt của bạn"*.
2. **Bước 2: Kiểm tra trạng thái Bị Choáng / Bị Ngã (Tripped Check)**:
   * Nếu đấu thủ đang ở trạng thái Bị Ngã (quân cờ nằm úp):
     * Đấu thủ **BỎ QUA hoàn toàn Di chuyển Chính** (không đổ xúc xắc, không bước đi).
     * Dựng quân cờ đứng dậy (hồi phục trạng thái bình thường).
     * Chuyển thẳng sang Bước 7 (Cuối lượt).
   * Nếu đấu thủ đang đứng bình thường: Tiếp tục Bước 3.
3. **Bước 3: Đổ xúc xắc & Di chuyển Chính (Main Move)**:
   * Người chơi đổ 1 viên xúc xắc d6.
   * Giá trị xúc xắc sau khi áp dụng các hiệu ứng tăng/giảm là khoảng cách di chuyển chính. Đấu thủ bước tiến đúng số ô trên đường đua.
   * *Lưu ý thuật ngữ*: Hành động này được gọi chính xác là **Di chuyển Chính (Main Move)**. Nhiều kỹ năng chỉ kích hoạt trên Di chuyển Chính.
4. **Bước 4: Xử lý Vượt Mặt (Passing Interaction)**:
   * Khái niệm **Vượt mặt (Passing)**: Khi một đấu thủ bắt đầu bước đi ở vị trí phía sau một đấu thủ khác và kết thúc bước đi ở vị trí phía trước đấu thủ đó.
   * Kích hoạt các kỹ năng dạng *"Khi vượt qua ai đó"* hoặc *"Khi bị ai đó vượt qua"*.
5. **Bước 5: Xử lý Ô Bàn Cờ Đặc Biệt (Board Space Effects)**:
   * Khi đấu thủ dừng chân tại một ô trên đường đua:
     * **Ô Mũi Tên (Arrow Space)**: Bắt buộc di chuyển thêm số ô theo hướng mũi tên chỉ dẫn. Đây là một bước di chuyển riêng biệt, **không** tính vào Di chuyển Chính.
     * **Ô Bẫy Ngã (Trip Space)**: Đấu thủ lập tức dính trạng thái Bị Ngã (Tripped) và đặt úp quân cờ.
     * **Ô Ngôi Sao (Star Space)**: Người chơi lập tức nhận 1 chip thưởng Đồng trị giá 1 điểm.
6. **Bước 6: Xử lý Dừng Chân Cùng Ô (Landing & Sharing Spaces)**:
   * Kích hoạt các kỹ năng liên quan đến việc dừng chân trên ô có người.
7. **Bước 7: Cuối Lượt (End of Turn)**:
   * Kích hoạt các kỹ năng cuối lượt. Chuyển lượt cho người chơi kế tiếp theo chiều kim đồng hồ.

### 5. Điều Kiện Kết Thúc Chặng Đua (Race End Condition)
* **KẾT THÚC TỨC THÌ**: Ngay khi **Đấu thủ thứ 2 cán qua vạch Đích**, chặng đua **KẾT THÚC NGAY LẬP TỨC**! Mọi đấu thủ còn lại trên đường đua không được đi tiếp.
* **Trường hợp loại trừ đặc biệt**: Nếu trên đường đua chỉ còn lại duy nhất 1 đấu thủ (do tất cả đối thủ khác đã bị loại bỏ bởi quái vật hoặc bẫy), chặng đua kết thúc ngay lập tức và đấu thủ đó đoạt hạng tương ứng.

### 6. Cơ Cấu Điểm Thưởng Giải Đấu (Championship Scoring Progression)
Các chip điểm Cúp Vàng (Top 1) và Hoa Bạc (Top 2) được xếp chồng theo thứ tự từ trên xuống dưới (Chặng 1 đến Chặng 4):

| Chặng Đua | Hạng 1 (Cúp Vàng) | Hạng 2 (Hoa Bạc) | Địa Hình Đường Đua | Ghi Chú |
| :--- | :---: | :---: | :--- | :--- |
| **Chặng 1** | **3 Điểm** | **1 Điểm** | Thảo Nguyên Ngọc (Emerald Plains) | Chặng khởi động |
| **Chặng 2** | **4 Điểm** | **2 Điểm** | Rừng Rậm Hoang Dã (Wildwood Rapids) | Tăng tốc |
| **Chặng 3** | **4 Điểm** | **2 Điểm** | Vòng Xoáy Hắc Diệp (Obsidian Spiral) | Khúc cua thử thách |
| **Chặng 4** | **5 Điểm** | **3 Điểm** | Xoắn Ốc Không Gian (Celestial Vortex) | Chung kết quyết định |
* **Chip thưởng phụ vô tận**:
  * **Chip 1 Điểm**: Nhận từ ô Ngôi Sao trên bản đồ hoặc kỹ năng an ủi.
  * **Chip 3 Điểm**: Nhận từ các kỹ năng đặc thù.

* **Xác Định Quán Quân**: Sau khi kết thúc Chặng 4, người chơi có tổng số điểm cao nhất từ tất cả các chip sẽ đoạt Cúp Vô Địch Aetheria Grand Prix. Nếu hòa điểm, các người chơi hòa cùng chia sẻ chiến thắng!

### 7. Từ Điển Thuật Ngữ & Quy Tắc Gỡ Rối (Glossary & Clarifications)
1. **Di chuyển Chính (Main Move)** vs **Di chuyển Khác (Other Moves)** vs **Dịch chuyển (Warp)**:
   * *Main Move*: Lần đổ xúc xắc chính thức khi bắt đầu lượt. Chỉ những kỹ năng ghi rõ "Main Move" mới áp dụng.
   * *Other Moves*: Các bước tiến thêm từ ô Mũi Tên, kỹ năng đẩy lùi hoặc nhảy cóc.
   * *Warp (Dịch chuyển tức thời)*: Di chuyển quân cờ trực tiếp từ ô này sang ô khác mà **không bước qua các ô ở giữa**. Warp KHÔNG kích hoạt hiệu ứng vượt mặt (Pass), không đạp trúng bẫy ngã hay ô mũi tên.
2. **Phía Trước (Ahead) / Phía Sau (Behind) / Chung Ô (Sharing)**:
   * Đấu thủ A được gọi là *Ahead* đấu thủ B nếu A đang dừng ở ô gần vạch Đích hơn.
   * Đấu thủ A được gọi là *Behind* đấu thủ B nếu A đang dừng ở ô gần vạch Xuất Phát hơn.
   * Nếu hai đấu thủ đứng cùng một ô, họ không được coi là Ahead hay Behind nhau.
3. **Dẫn Đầu (Lead) & Chót Bảng (Last Place)**:
   * *Lead*: Đấu thủ đang chạy gần vạch đích nhất (không tính những người đã cán đích xong).
   * *Last Place*: Đấu thủ đang ở gần vạch Xuất Phát nhất.
4. **Trạng thái Bị Ngã (Tripped)**:
   * Khi bị ngã, đấu thủ hoàn thành nốt bước di chuyển hiện tại rồi đặt úp quân cờ.
   * Lượt kế tiếp, đấu thủ bỏ qua lượt đổ xúc xắc chính và dựng cờ đứng dậy.
   * Lưu ý: Khi đang bị ngã, các kỹ năng nội tại hoặc kích hoạt ngoài lượt của nhân vật vẫn có hiệu lực bình thường.
5. **Thứ Tự Ưu Tiên Giải Quyết Khi Nhiều Hiệu Ứng Xảy Ra Cùng Lúc**:
   1. **Hiệu ứng ô bàn cờ** (Mũi tên, Bẫy ngã, Ngôi sao).
   2. **Hiệu ứng của người chơi đang trong lượt đi**.
   3. **Hiệu ứng của các người chơi khác** (lần lượt theo chiều kim đồng hồ).
6. **Quy Tắc Chống Vòng Lặp Vô Tận (Infinite Loop Prevention)**:
   * Nếu hai hoặc nhiều kỹ năng tương tác qua lại tạo thành vòng lặp vô tận (ví dụ di chuyển qua lại liên tục), thực hiện chuỗi tương tác đúng **1 lần** rồi dừng lại.
7. **Quy Tắc Đổ Lại Xúc Xắc (Reroll)**:
   * Khi một lần đổ xúc xắc bị đổ lại, kết quả đổ trước đó bị xóa bỏ hoàn toàn như chưa từng xảy ra.

---

## PHẦN III: DANH MỤC TOÀN BỘ 72 ĐẤU THỦ & 13 BIẾN CỐ THIÊN NHIÊN

### 1. Bộ 36 Đấu Thủ Cơ Bản (Base Set - 36 Runners)
Mỗi thẻ bài trong bộ cơ bản nằm trên tấm Sprite Sheet `assets/cards/765fa4bba7c0.jpg` (Kích thước ma trận $9 \times 4$ ô). Dưới đây là bảng thông số kỹ thuật và cơ chế chuẩn xác:

| CardID | Lưới (Col, Row) | Mã Đấu Thủ | Tên Đấu Thủ | Phân Loại | Thời Điểm Kích Hoạt | Mô Tả Kỹ Năng Chuẩn Xác | File Standee Quân Cờ |
| :---: | :---: | :---: | :--- | :---: | :--- | :--- | :--- |
| **124** | (6, 2) | `R-19` | **Ấu Trùng Tinh Quái (Creeping Larva)** | Quái Thú | `ON_OPPONENT_ROLL_1` | Khi bất kỳ đối thủ nào đổ ra số 1 cho Di chuyển Chính, đối thủ đó bị mất lượt di chuyển đó, còn Ấu Trùng được tiến 1 ô. | `images/830d33496f22.png` |
| **107** | (7, 0) | `R-14` | **Chất Nhầy Cản Bước (Sticky Slime)** | Khống Chế | `PASSIVE_GLOBAL` | Tất cả các đấu thủ khác đều bị trừ 1 vào giá trị Di chuyển Chính. | `images/49f457cd6401.png` |
| **113** | (4, 1) | `R-17` | **Linh Thỏ Tốc Độ (Turbo Hare)** | Thần Tốc | `ON_MAIN_MOVE_AND_TURN_START` | Được cộng 2 vào Di chuyển Chính. Tuy nhiên, nếu bắt đầu lượt khi đang một mình dẫn đầu (đứng đầu không chung ô với ai), phải bỏ qua lượt di chuyển chính. | `images/62b829adc69f.png` |
| **101** | (1, 0) | `R-11` | **Học Giả Tiên Tri (Astral Sage)** | Tiên Tri | `PRE_MAIN_ROLL` | Trước khi đổ xúc xắc Di chuyển Chính, tuyên bố đoán trước một con số cụ thể (1-6). Nếu đổ trúng chính xác số đó, nhận thêm 1 lượt đi hoàn chỉnh ngay sau đó. | `images/6eccaa296d08.png` |
| **125** | (7, 2) | `R-30` | **Cá Đuôi Bám (Parasite Hitcher)** | Ký Sinh | `ON_ANOTHER_START_MOVE_SAME_SPACE` | Khi bất kỳ đấu thủ nào đang đứng chung ô bắt đầu bước đi, nhân vật này có thể chọn bám theo và di chuyển cùng số ô với họ (giải quyết thứ tự cán đích sau người kia). | `images/89e89349ee20.png` |
| **128** | (1, 3) | `R-34` | **Cơ Hội Bứt Tốc (Nimble Leaper)** | Nhanh Nhẹn | `ON_ANY_ABILITY_ACTIVATION` | Bất cứ khi nào có năng lực của bất kỳ đấu thủ nào trên bàn cờ được kích hoạt, nhân vật này ngay lập tức được nhích tiến 1 ô. | `images/844dd5d3bcfd.png` |
| **103** | (3, 0) | `R-01` | **Nhà Giả Kim (Alchemist)** | Biến Đổi | `ON_MAIN_ROLL` | Khi đổ ra số 1 hoặc 2 cho Di chuyển Chính, có thể chọn di chuyển 4 ô thay vì số trên xúc xắc. | `images/7420ee68f89a.png` |
| **131** | (4, 3) | `R-36` | **Kẻ Phá Đám (Uninvited Guest)** | Xâm Nhập | `ON_TURN_START_WARP` | Ở đầu lượt của mình, có thể Dịch chuyển (Warp) tới bất kỳ ô nào trên đường đua đang có đúng 2 đấu thủ cùng dừng lại. | `images/362ad647a2c0.png` |
| **116** | (7, 1) | `R-08` | **Nữ Hoàng Cổ Động (Hype Cheerleader)** | Hỗ Trợ | `ON_TURN_START` | Đầu lượt của mình, có thể cho tất cả các đấu thủ đang ở vị trí chót bảng (Last place) tiến 2 ô. Nếu làm vậy, bản thân được tiến 1 ô. | `images/fac749238f2d.png` |
| **127** | (0, 3) | `R-26` | **Bậc Thầy Ảo Ảnh (Grand Illusionist)** | Ma Pháp | `ON_MAIN_ROLL_REROLL` | Có quyền đổ lại xúc xắc Di chuyển Chính tối đa 2 lần mỗi lượt (bắt buộc dùng kết quả cuối cùng). | `images/ba90816da311.png` |
| **120** | (2, 2) | `R-37` | **Cặp Đôi Song Hùng (Twin Sparks)** | Bản Sao | `PRE_RACE_SETUP` | Trước chặng đua, có thể chọn 1 đấu thủ đã từng chiến thắng ở một chặng đua trước đó để sở hữu toàn bộ năng lực của đấu thủ đó suốt chặng này. | `images/f3e98d7d18c2.png` |
| **130** | (3, 3) | `R-23` | **Ngôi Sao Cần Cù (Resilient Hopeful)** | Kiên Trì | `ON_TURN_START_LAST_PLACE` | Ở đầu lượt của mình, nếu đang đơn độc ở vị trí chót bảng (Last place), nhận ngay 1 chip thưởng 1 điểm. | `images/ce58a4178529.png` |
| **118** | (0, 2) | `R-28` | **Chuyên Gia Quá Tải (Overdrive Engineer)** | Cơ Khí | `ON_MAIN_ROLL` | Có thể chọn nhân đôi kết quả xúc xắc Di chuyển Chính. Nếu nhân đôi, sau khi hoàn thành toàn bộ bước di chuyển, nhân vật này sẽ Bị Ngã (Trip). | `images/bfd3f056f888.png` |
| **100** | (0, 0) | `R-10` | **Kiếm Khách Khiêu Chiến (Blade Challenger)** | Chiến Binh | `ON_SHARE_SPACE_ANYTIME` | Bất cứ khi nào có đấu thủ đứng chung ô (kể cả trong lượt đối thủ), có thể hô QUYẾT ĐẤU! Hai bên cùng đổ 1 viên d6, ai cao hơn được tiến 2 ô (Kiếm Khách thắng nếu hòa). Có thể quyết đấu nhiều lần trong 1 lượt. | `images/b79b5f3959e7.png` |
| **110** | (1, 1) | `R-05` | **Kỵ Sĩ Nhân Mã (Half-Beast Lancer)** | Chiến Binh | `ON_PASS_RUNNER` | Khi di chuyển vượt qua (Pass) một đấu thủ khác, đấu thủ bị vượt mặt phải lùi lại 2 ô (không thể lùi quá vạch Xuất Phát). | `images/2898c4bec70d.png` |
| **121** | (3, 2) | `R-33` | **Quan Tòa Nguyên Tắc (Strict Arbiter)** | Luật Lệ | `PASSIVE_GLOBAL_FINISH` | Mọi đấu thủ khác chỉ có thể cán đích bằng số bước di chuyển CHÍNH XÁC vừa đủ. Nếu đổ dư số bước vượt quá vạch đích, đấu thủ đó không được di chuyển. | `images/612b0c9710f2.png` |
| **115** | (6, 1) | `R-07` | **Bẫy Trơn Trượt (Grease Trapper)** | Cạm Bẫy | `ON_PASSED_BY_RUNNER` | Bất kỳ đấu thủ nào di chuyển vượt qua (Pass) nhân vật này đều sẽ Bị Ngã (Trip) ngay sau khi họ kết thúc bước di chuyển đó. | `images/f7a2964c0d3a.png` |
| **104** | (4, 0) | `R-02` | **Khinh Khí Hạm (Aero Cruiser)** | Cơ Khí | `ON_TURN_START_CHECK_POS` | Nếu bắt đầu lượt ở trước khúc cua thứ 2 của đường đua, nhận +3 vào Di chuyển Chính. Nếu ở tại hoặc sau khúc cua thứ 2, bị -1 vào Di chuyển Chính. | `images/3edc14bf5193.png` |
| **122** | (4, 2) | `R-22` | **Kẻ Bám Gót (Loyal Vanguard)** | Tùy Tùng | `ON_OPPONENT_ROLL_6` | Khi bất kỳ đối thủ nào đổ ra số 6 cho Di chuyển Chính, Kẻ Bám Gót ngay lập tức được tiến 2 ô TRƯỚC KHI đối thủ đó thực hiện di chuyển. | `images/342d4c89c3e2.png` |
| **123** | (5, 2) | `R-32` | **Kẻ Thao Túng Thời Khắc (Chrono Hijacker)** | Thời Gian | `ON_OPPONENT_ROLL_1` | Bất cứ khi nào có ai đổ ra số 1 cho Di chuyển Chính, nhân vật này ngay lập tức cướp quyền đi lượt tiếp theo trong vòng đấu. | `images/4deb6802e765.png` |
| **129** | (2, 3) | `R-24` | **Hàm Thôn Phệ (Abyssal Maw)** | Hủy Diệt | `ON_STOP_SAME_SPACE` | Khi dừng lại trên ô đang có đúng 1 đấu thủ khác, đấu thủ đó lập tức bị LOẠI (Eliminated) khỏi chặng đua. | `images/00bec5ec96a1.png` |
| **114** | (5, 1) | `R-18` | **Phù Thủy Thao Túng (Mind Controller)** | Tâm Linh | `ON_TURN_START` | Đầu lượt của mình, có thể Dịch chuyển (Warp) một đấu thủ bất kỳ trên đường đua về đứng chung ô với mình. | `images/42abd3d8d952.png` |
| **132** | (5, 3) | `R-31` | **Tâm Hồn Tri Kỷ (Cosmic Lovers)** | Cảm Xúc | `ON_ANY_SPACE_EXACTLY_TWO` | Bất cứ khi nào có bất kỳ ai dừng lại trên một ô có đúng 1 đấu thủ khác (tạo thành ô đôi), nhân vật này lập tức được tiến 2 ô. | `images/7d423887ec36.png` |
| **109** | (0, 1) | `R-04` | **Phù Thủy Chân Cốt (Bone Witch)** | Nguyền Rủa | `ON_STOP_SAME_SPACE` | Làm Bị Ngã (Trip) bất kỳ đấu thủ nào dừng lại trên ô của mình, hoặc khi nhân vật này dừng lại trên ô của họ. | `images/301237189a7a.png` |
| **105** | (5, 0) | `R-03` | **Bậc Thầy Huấn Luyện (Veteran Mentor)** | Hỗ Trợ | `ON_SHARE_SPACE_MAIN_MOVE` | Mọi đấu thủ đứng chung ô với nhân vật này (bao gồm cả bản thân) đều nhận được +1 vào Di chuyển Chính. | `images/c47164f252b7.png` |
| **102** | (2, 0) | `R-12` | **Kẻ Khích Bác (Provocateur)** | Khiêu Khích | `ON_OPPONENT_END_TURN_NEAR_ORIGIN` | Khi một đối thủ kết thúc lượt đi của họ mà chỉ cách vị trí họ bắt đầu lượt tối đa 1 ô (tức di chuyển được 0 hoặc 1 ô), nhân vật này ngay lập tức được tiến 2 ô. | `images/5bac72f111b1.png` |
| **108** | (8, 0) | `R-15` | **Người Khổng Lồ Hộ Thân (Immense Goliath)** | Hộ Vệ | `ON_ANOTHER_LAND_SAME_SPACE` | Không ai có thể đứng chung ô với nhân vật này (ngoại trừ ô Xuất Phát). Bất kỳ ai định dừng lại ở ô này đều lập tức bị đặt lùi về ô liền kề phía sau. | `images/f66dab8840b3.png` |
| **134** | (7, 3) | `R-20` | **Đôi Chân Thần Tốc (Pacing Strider)** | Thần Tốc | `ACTION_INSTEAD_OF_MAIN_ROLL` | Có thể chọn KHÔNG đổ xúc xắc Di chuyển Chính để di chuyển cố định đúng 5 ô. | `images/9d0be431d500.png` |
| **126** | (8, 2) | `R-27` | **Đầu Tàu Diễu Hành (Festival Herald)** | Lễ Hội | `ON_TURN_START_PULL` | Ở đầu lượt của mình, tất cả các đấu thủ khác bị kéo tiến 1 ô về phía nhân vật này. Mỗi đấu thủ đang đứng chung ô mang lại cho nhân vật này +1 vào Di chuyển Chính. | `images/d16f11c3312d.png` |
| **135** | (8, 3) | `R-29` | **Kẻ Gánh Trọng Tội (Endless Drifter)** | Huyền Bí | `PRE_RACE_AND_MAIN_ROLL` | Bắt đầu chặng đua với 4 chip điểm thưởng. Bất cứ khi nào đổ ra số 6 cho Di chuyển Chính, thay vì di chuyển, nhân vật này bị Dịch chuyển (Warp) về ô Xuất Phát và mất 1 chip điểm. | `images/2a290110178c.png` |
| **119** | (1, 2) | `R-25` | **Cóc Nhảy Rào (Springing Toad)** | Quái Thú | `PASSIVE_MOVEMENT` | Khi di chuyển, nhân vật này nhảy vượt qua các ô đang có người đứng mà không tính các ô đó vào số bước đi. | `images/dc9921c2c418.png` |
| **111** | (2, 1) | `R-06` | **Miêu Tặc Biến Hình (Mimic Phantom)** | Thích Khách | `PASSIVE_CONTINUOUS` | Sở hữu liên tục toàn bộ năng lực của đấu thủ hiện đang dẫn đầu (1st place) trên đường đua. Nếu có nhiều đấu thủ hòa nhau ở vị trí dẫn đầu, người chơi tự chọn một người để sao chép. | `images/ee217036a5c7.png` |
| **112** | (3, 1) | `R-16` | **Bậc Thầy Hoán Đổi (Quantum Shifter)** | Không Gian | `ACTION_INSTEAD_OF_MAIN_MOVE` | Có thể chọn KHÔNG đổ xúc xắc Di chuyển Chính để Dịch chuyển (Warp) tức thời hoán đổi vị trí của mình với bất kỳ đấu thủ nào trên đường đua. | `images/80266226b94d.png` |
| **106** | (6, 0) | `R-13` | **Quả Cầu Bất Định (Chaos Orb)** | Kỳ Bí | `PRE_RACE_SETUP` | Trước khi chặng đua bắt đầu, rút ngửa 3 thẻ nhân vật ngẫu nhiên chưa ai chọn từ cọc bài và chọn lấy 1 nhân vật để sở hữu toàn bộ năng lực của nhân vật đó suốt chặng đua. | `images/fd14f1d7cbe4.png` |
| **133** | (6, 3) | `R-21` | **Quân Sư Chiến Thuật (Grand Strategist)** | Chiến Thuật | `ON_FIRST_TURN_START` | Ở đầu lượt đầu tiên của mình, dự đoán 1 đấu thủ sẽ chiến thắng chặng đua. Nếu đấu thủ đó cán đích hạng 1, chặng đua kết thúc ngay lập tức và Quân Sư tự động đoạt hạng nhì (2nd place). | `images/958b0d441aa5.png` |
| **117** | (8, 1) | `R-09` | **Lái Buôn Vận Mệnh (Fortune Dealer)** | Thao Túng | `ON_ANY_MAIN_ROLL` | Mọi người chơi đều có quyền đổ lại xúc xắc Di chuyển Chính 1 lần mỗi lượt. Bất cứ khi nào đối thủ sử dụng quyền đổ lại này, Lái Buôn ngay lập tức tiến 1 ô TRƯỚC KHI đối thủ đó di chuyển. | `images/aa828a10af01.png` |

### 2. Bộ 36 Đấu Thủ Mở Rộng (Expansion Set - 36 Runners)
Nằm trên tấm Sprite Sheet `assets/cards/34c4ebe58b94.jpg` (Kích thước ma trận $10 \times 4$ ô):

| CardID | Lưới (Col, Row) | Mã Đấu Thủ | Tên Đấu Thủ | Phân Loại | Thời Điểm Kích Hoạt | Mô Tả Kỹ Năng Chuẩn Xác | File Standee Quân Cờ |
| :---: | :---: | :---: | :--- | :---: | :--- | :--- | :--- |
| **526** | (6, 2) | `E-01` | **Tia Chớp Tự Do (Naked Sprinter)** | Tự Do | `ON_PASS_RUNNER` | Khi di chuyển vượt qua (Pass) một hoặc nhiều đấu thủ trong Di chuyển Chính, nhận ngay 1 chip 1 điểm. | `images/fdf2504666d5.png` |
| **515** | (5, 1) | `E-02` | **Hư Vô Vực Thẳm (The Void Null)** | Hư Không | `PASSIVE_GLOBAL` | Tất cả các đấu thủ đứng phía trước nhân vật này đều bị trừ 1 vào Di chuyển Chính và bị mất sạch toàn bộ năng lực. | `images/4e14d281ac6f.png` |
| **513** | (3, 1) | `E-03` | **Kỵ Sĩ Thú Cưỡi (Armored Rider)** | Chiến Binh | `SPECIAL_MOUNT` | Bắt đầu chặng đua trên lưng thú cưỡi (được +2 vào Di chuyển Chính). Khi có ai vượt qua mặt, nhân vật này bị mất thú cưỡi. | `images/67ce775c60b2.png` |
| **517** | (7, 1) | `E-04` | **Vương Quyền Quật Ngã (Sovereign Tripper)** | Khống Chế | `ON_TURN_START` | Ở đầu lượt của mình, có thể chọn làm Bị Ngã (Trip) đấu thủ hiện đang dẫn đầu cuộc đua. | `images/4f114357c085.png` |
| **534** | (4, 3) | `E-05` | **Kẻ Chậm Chạp (Slothful Drifter)** | Chậm Rãi | `ON_RACE_END_SCORING` | Bị trừ 1 vào Di chuyển Chính. Khi chặng đua kết thúc, nếu nhân vật này vẫn chưa vượt qua khúc cua thứ 2 của đường đua, nhận ngay 3 điểm thưởng! | `images/7f91f2f64233.png` |
| **521** | (1, 2) | `E-06` | **Người Bảo Hộ (Guardian Patron)** | Bảo Hộ | `PASSIVE_NEIGHBOR` | Đấu thủ của người chơi ngồi bên trái mình được +2 vào Di chuyển Chính. Nếu đấu thủ đó về Nhất chặng đua, Người Bảo Hộ nhận 3 điểm thưởng. | `images/cae5d710e38e.png` |
| **529** | (9, 2) | `E-07` | **Vòi Rồng Áp Lực (Water Blaster)** | Nguyên Tố | `ON_TURN_END_SPLASH` | Ở cuối lượt của mình, đổ 1 viên d6 và làm Bị Ngã tất cả các đấu thủ nằm trong phạm vi số ô đó ở phía trước mặt. | `images/41b5897eb9f8.png` |
| **528** | (8, 2) | `E-08` | **Cóc Phi Thân (Bounding Hopper)** | Nhanh Nhẹn | `ON_TURN_END_BEHIND` | Khi kết thúc lượt đi của mình ở vị trí ngay liền kề phía sau (1 ô) một đấu thủ khác, nhân vật này lập tức nhận thêm 1 lượt đi hoàn chỉnh. | `images/531ef2cf2635.png` |
| **530** | (0, 3) | `E-09` | **Cái Đuôi Vết Lăn (Shadow Tail)** | Ám Muội | `ON_TURN_START_WARP` | Đầu lượt của mình, có thể Dịch chuyển (Warp) tức thời tới ô ngay liền kề phía sau đấu thủ đứng gần nhất trước mặt. | `images/66f3f817dadd.png` |
| **503** | (3, 0) | `E-10` | **Ngôi Sao Kiêu Kỳ (Prima Vanguard)** | Kiêu Hãnh | `ON_TURN_START_SWAP` | Nếu đang ở vị trí chót bảng (Last place) vào đầu lượt của mình, nhân vật này lập tức Dịch chuyển (Warp) hoán đổi vị trí với đấu thủ đang dẫn đầu cuộc đua. | `images/f26592520402.png` |
| **531** | (1, 3) | `E-11` | **Đại Sư Lục Xúc (Dice Grandmaster)** | Xúc Xắc | `ON_MAIN_ROLL_MULTI` | Đổ toàn bộ 6 viên xúc xắc cho Di chuyển Chính và chọn lấy một số bất kỳ xuất hiện từ 2 lần trở lên (nếu cả 6 viên đều ra 6 số khác nhau, không di chuyển). | `images/1821d4920cac.png` |
| **522** | (2, 2) | `E-12` | **Kẻ Liều Lĩnh (All-in Daredevil)** | Liều Lĩnh | `ON_MAIN_ROLL_CHAIN` | Sau khi đổ Di chuyển Chính, có thể tiếp tục đổ thêm nhiều lần và cộng dồn số bước đi. Tuy nhiên, nếu đổ ra số bằng hoặc thấp hơn lần đổ trước đó, nhân vật này đứng im tại chỗ (0 ô)! | `images/639633d45663.png` |
| **516** | (6, 1) | `E-13` | **Đấu Thủ Toàn Năng (Apex Champion)** | Huyền Thoại | `ON_MAIN_ROLL_SPECIAL` | Khi đổ Di chuyển Chính, kích hoạt hiệu ứng theo mặt xúc xắc: 1=Đi 7 ô; 2=Kéo người chót bảng về ô mình; 3=Dịch chuyển tới 1 người và làm ngã họ; 4=Đi 4 ô và đi thêm lượt; 5=Đẩy người dẫn đầu lùi 5 ô; 6=Đi 6 ô và làm ngã mọi người đi qua. | `images/20e0b5bdd562.png` |
| **532** | (2, 3) | `E-14` | **Khối Sinh Khối Tế Bào (Bio Cluster)** | Ký Sinh | `ON_MAIN_ROLL_1_2` | Khi đổ ra số 1 hoặc 2 cho Di chuyển Chính, rút thêm 1 thẻ đấu thủ mới từ cọc bài và sở hữu vĩnh viễn toàn bộ năng lực của thẻ đó suốt chặng đua còn lại. | `images/54be6fa161d1.png` |
| **524** | (4, 2) | `E-15` | **Kẻ Đuổi Bắt (Relentless Chaser)** | Báo Thù | `ON_MAIN_MOVE_AHEAD_COUNT` | Được cộng thêm số ô Di chuyển Chính đúng bằng số lượng đấu thủ hiện đang chạy phía trước mặt mình. | `images/21a0b032774c.png` |
| **505** | (5, 0) | `E-16` | **Bản Sao Hắc Ám (Dark Mimic)** | Ám Muội | `ON_FIRST_PLACE_ELIMINATE` | Bất kỳ đấu thủ nào cán đích Hạng 1 sẽ bị LOẠI thay vì chiến thắng. Bản Sao Hắc Ám nhận lấy năng lực của đấu thủ đó. | `images/da20ad18842f.png` |
| **501** | (1, 0) | `E-17` | **Kẻ Phá Hoại (Trap Specialist)** | Cạm Bẫy | `ON_OPPONENTS_ROLL_3` | Bất cứ khi nào có đấu thủ khác đổ ra số 3 cho Di chuyển Chính, đấu thủ đó bắt buộc phải di chuyển lùi lại thay vì tiến lên. | `images/c1c50573a02e.png` |
| **502** | (2, 0) | `E-18` | **Cánh Bay Sa Ngã (Fallen Aeronaut)** | Thần Thoại | `ON_MAIN_ROLL` | Được cộng 3 vào Di chuyển Chính. Tuy nhiên, nếu đổ ra số 6 cho Di chuyển Chính, nhân vật này bị LOẠI (Eliminated) khỏi chặng đua. | `images/b4a17ce5e79a.png` |
| **509** | (9, 0) | `E-19` | **Nữ Hoàng Choáng Váng (Static Warden)** | Khống Chế | `PASSIVE_AURA` | Mọi đấu thủ khác đứng trong phạm vi 1 ô quanh nhân vật này chỉ được tính kết quả xúc xắc là 1 cho mọi lần đổ. | `images/e04f8271cb03.png` |
| **518** | (8, 1) | `E-20` | **Thủy Quái Xúc Tu (Abyssal Leviathan)** | Quái Thú | `ON_TURN_START_ONCE` | Một lần duy nhất trong cả chặng đua, ở đầu lượt của mình, có thể Dịch chuyển (Warp) toàn bộ đấu thủ khác trên đường đua về ô của mình và làm Bị Ngã tất cả bọn họ! | `images/af6c6a84c3ba.png` |
| **537** | (7, 3) | `E-21` | **Kẻ Phá Tiệc (Fun Destroyer)** | Triệt Tiêu | `PASSIVE_GLOBAL_SIX` | Mọi lần đổ ra số 6 trên toàn bộ bàn chơi đều bắt buộc phải đổ lại. Bất cứ khi nào có số 6 bị đổ lại, nhân vật này được tiến 1 ô. | `images/f45671a40814.png` |
| **535** | (5, 3) | `E-22` | **Chuột Chũi Độn Thổ (Burrowing Mole)** | Quái Thú | `ACTION_INSTEAD_OF_ROLL` | Nếu xung quanh phạm vi 1 ô không có bất kỳ ai, có thể chọn KHÔNG đổ xúc xắc mà di chuyển cố định đúng 6 ô. | `images/023b05e3a480.png` |
| **514** | (4, 1) | `E-23` | **Băng Điểu Lướt Băng (Gliding Penguin)** | Băng Tuyết | `ON_PASSED_AND_TRIPPED` | Bất cứ khi nào bị ai vượt qua mặt, nhân vật này Bị Ngã. Khi đang Bị Ngã, nhân vật này được NHÂN ĐÔI kết quả đổ xúc xắc Di chuyển Chính (thay vì bỏ lượt) và hồi phục sau lượt đi. | `images/a13e6a3811ee.png` |
| **519** | (9, 1) | `E-24` | **Kẻ Bỏ Cuộc Phá Đám (Tantrum Quitter)** | Hỗn Loạn | `ON_TURN_START_CHECK_LEAD` | Nếu ở đầu lượt của mình, tất cả các đối thủ khác đều đang dẫn trước từ 5 ô trở lên, chặng đua bị HỦY NGAY LẬP TỨC và Kẻ Phá Đám nhận 3 điểm! | `images/1d3109c55a19.png` |
| **500** | (0, 0) | `E-25` | **Nhà Tài Phiệt Đất (Tycoon Landlord)** | Kinh Tế | `ON_ANOTHER_LAND_SAME_SPACE` | Bất kỳ đấu thủ nào dừng chân tại ô của Nhà Tài Phiệt đều phải nộp phạt 1 điểm. Nếu không có điểm để nộp, họ sẽ Bị Ngã (Trip). | `images/0fe87ba20914.png` |
| **512** | (2, 1) | `E-26` | **Linh Hồn Tri Kỷ (Aether Soulmate)** | Liên Kết | `ON_TURN_START_NEAR_TARGET` | Trước chặng đua, chọn 1 đối thủ. Khi bắt đầu lượt trong phạm vi 5 ô cách họ, Dịch chuyển (Warp) thẳng đến ô của họ. | `images/f02c0dc83699.png` |
| **527** | (7, 2) | `E-27` | **Cuồng Phong Bão Táp (Tempest Demon)** | Bóng Đêm | `ON_MAIN_MOVE_POINTS_SCALE` | Được cộng thêm số ô Di chuyển Chính bằng tổng số điểm người chơi đang có. Tuy nhiên, nếu dẫn đầu cách biệt 4 ô trở lên ở đầu lượt, bị LOẠI ngay lập tức. | `images/d2d10630bd8f.png` |
| **504** | (4, 0) | `E-28` | **Cẩu Vụng Về (Clumsy Hound)** | Hỗn Loạn | `ON_MAIN_ROLL_LAST_PLACE` | Khi đang ở vị trí chót bảng, nhân 3 kết quả đổ xúc xắc Di chuyển Chính. Khi KHÔNG ở vị trí chót bảng, nhân vật này di chuyển lùi lại. | `images/dc7b6066d3b0.png` |
| **520** | (0, 2) | `E-29` | **Thợ Tráo Thẻ (Card Swapper)** | Gian Xảo | `ON_TURN_END_ADJACENT` | Khi kết thúc lượt mà đứng cách đối thủ tối đa 1 ô, có thể tráo đổi quyền điều khiển thẻ nhân vật với đối thủ đó! | `images/2cb3e5718b20.png` |
| **511** | (1, 1) | `E-30` | **Con Cưng Thừa Kế (Golden Heir)** | Đặc Quyền | `PRE_RACE_START_CORNER` | Bắt đầu chặng đua tại khúc cua đầu tiên của đường đua thay vì vạch Xuất Phát. | `images/1f2d4434ce86.png` |
| **507** | (7, 0) | `E-31` | **Nhà Phê Bình Khắt Khe (Harsh Critic)** | Khống Chế | `ON_OPPONENT_MAIN_ROLL` | Mỗi lượt 1 lần, có thể bắt buộc một đấu thủ đang chạy phía trước mình phải đổ lại xúc xắc Di chuyển Chính. | `images/cd4b63858395.png` |
| **525** | (5, 2) | `E-32` | **Kẻ Báo Thù Định Mệnh (Vengeful Nemesis)** | Báo Thù | `ON_OPPONENT_MAIN_ROLL_MATCH` | Khi một đối thủ đổ xúc xắc Di chuyển Chính, Kẻ Báo Thù được quyền đổ 1 viên d6 theo. Nếu ra cùng số, Kẻ Báo Thù được di chuyển đúng bằng số đó! | `images/b8d099e9c55f.png` |
| **533** | (3, 3) | `E-33` | **Đấu Thủ Hồi Sinh (Eternal Competitor)** | Vĩnh Hằng | `ON_RACE_END_EXTRA_RUNNER` | Sau khi tham gia chặng đua đầu tiên, đấu thủ này KHÔNG bị loại bỏ mà sẽ tham gia như một đấu thủ phụ cộng thêm trong toàn bộ các chặng đua còn lại! | `images/072e8c0cf33d.png` |
| **508** | (8, 0) | `E-34` | **Ma Sói Hóa Thân (Werewolf Fang)** | Hóa Hình | `ON_MAIN_ROLL_TRANSFORM` | Khi đổ ra số 1 hoặc 2 cho Di chuyển Chính, hóa thân thành Quái Thú Thôn Phệ, loại bỏ ngay lập tức bất kỳ đấu thủ nào bị nó vượt qua! | `images/62003c61722f.png` |
| **506** | (6, 0) | `E-35` | **Báo Gian Lận (Cheating Cheetah)** | Gian Lận | `ACTION_INSTEAD_OF_ROLL_SECRET` | Thay vì đổ xúc xắc Di chuyển Chính, bí mật đặt viên xúc xắc vào mặt số tùy chọn. Nếu người chơi ngồi bên phải đoán trúng số đó, nhân vật này đứng im. | `images/53b62d8ab1e1.png` |
| **523** | (3, 2) | `E-36` | **Kẻ Đóng Thế Kép (Understudy Stand-in)** | Bản Sao | `PRE_RACE_SETUP` | Trước chặng đua, chọn sao chép toàn bộ năng lực của một đấu thủ đối phương có mặt trong chặng đua đó. | `images/a2141ff23097.png` |

### 3. Bộ 13 Thẻ Biến Cố Thiên Nhiên (13 Realm Surge / Twist Cards)
Nằm trên tấm Sprite Sheet `assets/cards/9ebfa55272d8.jpg` (Kích thước ma trận $7 \times 2$ ô):

| CardID | Lưới (Col, Row) | Mã Biến Cố | Tên Thẻ Biến Cố | Cơ Chế Chi Tiết Khi Rút Phải |
| :---: | :---: | :---: | :--- | :--- |
| **300** | (0, 0) | `T-01` | **Tràn Phòng Thí Nghiệm Biến Dị (Bio-Hazard Containment Breach)** | Đặt Quái Thú Thôn Phệ tại ô Start. Đổ xúc xắc d6 cho nó di chuyển sau mỗi lượt của từng người chơi. Bất kỳ đấu thủ nào bị nó vượt qua đều bị LOẠI khỏi chặng đua ngay lập tức! |
| **301** | (1, 0) | `T-02` | **Khán Giả Nổi Loạn (The Fans Demand Chaos)** | Rút ngay 2 thẻ Biến Cố tiếp theo từ cọc bài và áp dụng lần lượt cả hai hiệu ứng theo thứ tự. |
| **302** | (2, 0) | `T-03` | **Bọ Chặn Đường Vạch Đích (Finish Line Infestation)** | Bất cứ khi nào có đấu thủ dừng lại ở 2 ô liền trước vạch Đích, họ lập tức bị đẩy lùi về sau 5 ô. |
| **303** | (3, 0) | `T-04` | **Băng Chuyền Đảo Chiều (Conveyor Belt Reversed)** | Toàn bộ hướng chạy của chặng đua bị đảo ngược: vạch Xuất Phát trở thành Đích và vạch Đích trở thành Xuất Phát! |
| **304** | (4, 0) | `T-05` | **Đũa Phép Hỗn Loạn (Chaos Wand For All)** | Sau lượt của mỗi người chơi, người đó đổ 1 viên xúc xắc. Bỏ qua số lượng người chơi tương ứng theo thứ tự lượt tiếp theo. |
| **305** | (5, 0) | `T-06` | **Thuyết Thế Giới Gương (Mirror World Confirmed)** | Dịch chuyển tất cả các đấu thủ tới ô liền sau ô Start. Mọi người chơi đều nhận +3 vào Di chuyển Chính suốt chặng đua. |
| **306** | (6, 0) | `T-07` | **Cấm Chạy Quanh Hồ Tiên Tri (Scrying Pool Hazard)** | Bất kỳ đấu thủ nào di chuyển từ 6 ô trở lên trong Di chuyển Chính sẽ bị LOẠI khỏi cuộc đua ngay lập tức. |
| **307** | (0, 1) | `T-08` | **Vỡ Túi Quà Trời Ban (The Leaking Pinata)** | Đặt 1 chip điểm lên mọi ô trống sau khúc cua đầu tiên của đường đua. Bất kỳ ai dừng chân tại ô có chip sẽ thu thập chip đó. |
| **308** | (1, 1) | `T-09` | **Quy Luật Ngẫu Nhiên Biến Mất (Cease of Randomness)** | Tất cả người chơi đổ xúc xắc 1 lần duy nhất trước chặng: số đó sẽ là kết quả cố định cho mọi lần đổ của họ suốt chặng đua. |
| **309** | (2, 1) | `T-10` | **Dẫm Trúng Quỷ Thời Gian (Time Imp Trample)** | Đấu thủ kích hoạt lá này bị loại khỏi chặng đua hiện tại, nhưng được quyền tham gia chặng đua tiếp theo như một đấu thủ phụ cộng thêm! |
| **310** | (3, 1) | `T-11` | **Bữa Tiệc Giữa Đường (Feast on the Ground)** | Đấu thủ đang ở vị trí chót bảng (Last place) ngay lập tức được thưởng bước tiến 7 ô. |
| **311** | (4, 1) | `T-12` | **Trận Chung Kết Tay Đôi (Season Finale Showdown)** | Hai đấu thủ về Nhất và Nhì sẽ bước vào một chặng đua ngắn tay đôi từ khúc cua số 2 để tranh cúp chung cuộc! |
| **312** | (5, 1) | `T-13` | **Chợ Phiên Hoán Đổi (The Swap Meet)** | Tất cả người chơi cùng rút 1 thẻ đấu thủ mới từ cọc bài và có quyền chọn đổi lấy đấu thủ đang đua trên sân. |

---

## PHẦN IV: ĐẶC TẢ CHI TIẾT CẤU TRÚC & THUỘC TÍNH TÀI NGUYÊN (ASSET SPECIFICATIONS)

Tất cả các tài nguyên đều được tổ chức chuẩn trong thư mục `assets/`. Dưới đây là thông số kỹ thuật chính xác để Claude có thể lập trình xử lý đồ họa và âm thanh mà không cần mở file trực tiếp:

### 1. Thư Mục Thẻ Bài (`assets/cards/`)
* **File Sheet Bài Cơ Bản**: `assets/cards/765fa4bba7c0.jpg`
  * Kích thước tổng thể: **5000 x 3104 pixels**.
  * Cấu trúc ma trận: **9 cột x 4 hàng** = 36 thẻ bài.
  * Kích thước mỗi lá bài: Chiều rộng **555.55 px**, Chiều cao **776 px**.
  * Công thức cắt tọa độ: $\text{col} = \text{CardID} \% 100 \% 9$, $\text{row} = (\text{CardID} \% 100) / 9$.
  * Tọa độ pixel góc trên bên trái: $X = \text{col} \times 555.55$, $Y = \text{row} \times 776$.
* **File Sheet Bài Mở Rộng**: `assets/cards/34c4ebe58b94.jpg`
  * Kích thước tổng thể: **4061 x 2270 pixels**.
  * Cấu trúc ma trận: **10 cột x 4 hàng** = 40 ô (chứa 36 thẻ bài).
  * Kích thước mỗi lá bài: Chiều rộng **406.1 px**, Chiều cao **567.5 px**.
  * Công thức cắt tọa độ: $\text{col} = \text{CardID} \% 100 \% 10$, $\text{row} = (\text{CardID} \% 100) / 10$.
* **File Sheet Bài Biến Cố (Twist)**: `assets/cards/9ebfa55272d8.jpg`
  * Kích thước tổng thể: **9107 x 1432 pixels**.
  * Cấu trúc ma trận: **7 cột x 2 hàng** = 14 ô (chứa 13 thẻ bài biến cố).
  * Kích thước mỗi lá bài: Chiều rộng **1301 px**, Chiều cao **716 px**.
  * Công thức cắt: $\text{col} = (\text{CardID} - 300) \% 7$, $\text{row} = (\text{CardID} - 300) / 7$.
* **Mặt sau thẻ bài (Card Backs)**:
  * Mặt sau thẻ bài đấu thủ: `assets/cards/4a7954234c04.jpg` (257 x 358 px).
  * Mặt sau thẻ biến cố: `assets/cards/ffcbbc9bd1d4.jpg` (330 x 186 px).

### 2. Thư Mục Bản Đồ Đường Đua (`assets/images/`)
Bốn bản đồ đường đua tương ứng với 4 chặng thi đấu, chất lượng cực cao:

| Chặng Đua | Tên Bản Đồ Mới | Đường Dẫn File Trong Assets | Độ Phân Giải Pixel | Định Dạng & Hệ Màu |
| :---: | :--- | :--- | :---: | :--- |
| **Chặng 1: Thảo Nguyên Ngọc (Emerald Plains)** | Đường đua cơ bản chuẩn mực, các góc cua rộng và ít bẫy, thích hợp cho các đấu thủ tăng tốc đầu trận. | `assets/images/bc84b1380de5.png` | **8000 x 8000 px** | PNG / RGB |
| **Chặng 2: Rừng Rậm Hoang Dã (Wildwood Rapids)** | Đường đua nhiều bẫy ngã (Trip spaces) và các ô mũi tên bất ngờ, tính hỗn loạn bắt đầu gia tăng. | `assets/images/cf3c7ffb6ddc.png` | **8000 x 8000 px** | PNG / RGB |
| **Chặng 3: Vòng Xoáy Hắc Diệp (Obsidian Spiral)** | Đường đua xoắn ốc với nhiều đoạn thắt cổ chai, tạo điều kiện cho các đấu thủ có kỹ năng va chạm và tương tác cùng ô. | `assets/images/07245029d251.png` | **8000 x 8000 px** | PNG / RGB |
| **Chặng 4: Xoắn Ốc Không Gian (Celestial Vortex)** | Chặng đua chung kết kịch tính với địa hình phức tạp, quyết định ngôi vị vô địch của cả giải đấu. | `assets/images/875e1c0e6ba2.png` | **8000 x 8000 px** | PNG / RGB |

### 3. Thư Mục Quân Cờ & Standees (`assets/images/`)
* Tất cả **72 quân cờ nhân vật** là các file ảnh định dạng **PNG với nền trong suốt (RGBA 8-bit Alpha Channel)**.
* Chiều rộng thông thường dao động từ **120 px đến 280 px**, chiều cao từ **220 px đến 450 px** tùy theo hình thể nhân vật (chuẩn tỉ lệ đứng).
* Bảng ánh xạ từ mã nhân vật đến tên file ảnh standee cụ thể đã được ghi rõ ở cột cuối cùng của Bảng 36 Đấu Thủ Cơ Bản và Bảng 36 Đấu Thủ Mở Rộng ở Phần III.

### 4. Thư Mục Âm Thanh (`assets/audio/`)
Gồm 19 file âm thanh chất lượng cao định dạng WAV dùng cho nhạc nền và hiệu ứng âm thanh:

| File Âm Thanh | Tên Đoạn Nhạc / Hiệu Ứng | Dung Lượng | Ứng Dụng Trong Game |
| :--- | :--- | :---: | :--- |
| `assets/audio/7a51de6c732a.wav` | **Awakening** | ~20MB - 50MB | Nhạc nền theo phase hoặc hiệu ứng chiến đấu/tung xúc xắc |
| `assets/audio/725c65ca467f.wav` | **Calm** | ~20MB - 50MB | Nhạc nền theo phase hoặc hiệu ứng chiến đấu/tung xúc xắc |
| `assets/audio/ec306252ee5f.wav` | **Day Travel** | ~20MB - 50MB | Nhạc nền theo phase hoặc hiệu ứng chiến đấu/tung xúc xắc |
| `assets/audio/11f56ebd7af3.wav` | **Death** | ~20MB - 50MB | Nhạc nền theo phase hoặc hiệu ứng chiến đấu/tung xúc xắc |
| `assets/audio/4836b4f7a3a8.wav` | **Epilude** | ~20MB - 50MB | Nhạc nền theo phase hoặc hiệu ứng chiến đấu/tung xúc xắc |
| `assets/audio/f99fca88af73.wav` | **Goblin Combat** | ~20MB - 50MB | Nhạc nền theo phase hoặc hiệu ứng chiến đấu/tung xúc xắc |
| `assets/audio/c0bb6e40dd7a.wav` | **Human Combat 1** | ~20MB - 50MB | Nhạc nền theo phase hoặc hiệu ứng chiến đấu/tung xúc xắc |
| `assets/audio/3ccf4beaef3c.wav` | **Human Combat 2** | ~20MB - 50MB | Nhạc nền theo phase hoặc hiệu ứng chiến đấu/tung xúc xắc |
| `assets/audio/52e4fee42b7d.wav` | **Intrigue** | ~20MB - 50MB | Nhạc nền theo phase hoặc hiệu ứng chiến đấu/tung xúc xắc |
| `assets/audio/e2a840af2c58.wav` | **Map** | ~20MB - 50MB | Nhạc nền theo phase hoặc hiệu ứng chiến đấu/tung xúc xắc |
| `assets/audio/18cf6745aed1.wav` | **Mistique** | ~20MB - 50MB | Nhạc nền theo phase hoặc hiệu ứng chiến đấu/tung xúc xắc |
| `assets/audio/a91a1fd56436.wav` | **Night Travel** | ~20MB - 50MB | Nhạc nền theo phase hoặc hiệu ứng chiến đấu/tung xúc xắc |
| `assets/audio/485d17c7f06e.wav` | **Orc Combat 1** | ~20MB - 50MB | Nhạc nền theo phase hoặc hiệu ứng chiến đấu/tung xúc xắc |
| `assets/audio/882f19abf609.wav` | **Orc Combat 2** | ~20MB - 50MB | Nhạc nền theo phase hoặc hiệu ứng chiến đấu/tung xúc xắc |
| `assets/audio/b72fe54926cb.wav` | **Prelude** | ~20MB - 50MB | Nhạc nền theo phase hoặc hiệu ứng chiến đấu/tung xúc xắc |
| `assets/audio/4d807db012f3.wav` | **Reflective** | ~20MB - 50MB | Nhạc nền theo phase hoặc hiệu ứng chiến đấu/tung xúc xắc |
| `assets/audio/ea20e830418a.wav` | **Setting Up** | ~20MB - 50MB | Nhạc nền theo phase hoặc hiệu ứng chiến đấu/tung xúc xắc |
| `assets/audio/59db7703c5a3.wav` | **Tension** | ~20MB - 50MB | Nhạc nền theo phase hoặc hiệu ứng chiến đấu/tung xúc xắc |
| `assets/audio/46582ff5f072.wav` | **Undead Combat** | ~20MB - 50MB | Nhạc nền theo phase hoặc hiệu ứng chiến đấu/tung xúc xắc |

### 5. Thiết Lập Tọa Độ Bàn Chơi Mẫu (Spatial Setup Coordinates)
Dành cho trường hợp render bàn cờ 2D/3D trên Client:
* **12 Vị Trí Ô Tuyển Mộ (Draft Zones)**: Đặt tại tọa độ $Z = 13.0$, phân bổ đều theo trục $X$ từ $-26.0$ đến $+26.0$ (bước nhảy khoảng cách $\Delta X \approx 4.73$).
* **6 Vị Trí Ghế Người Chơi (Player Card Zones)**: Đặt tại tọa độ $Z = -22.0$, gồm 6 vị trí đặt thẻ tương ứng $X = -37.1, -22.1, -7.1, +7.3, +22.3, +37.3$.
* **Bục Trao Thưởng & Chồng Chip Điểm (Podium & Chips)**: Tọa độ $Z = 7.55$:
  * Vị trí Chồng Cúp Vàng (Top 1): $X = -4.4$.
  * Vị trí Chồng Hoa Bạc (Top 2): $X = -1.4$.
  * Vị trí Túi Chip Điểm Phụ: $X = +1.5$ (Chip 3 Điểm) và $X = +4.1$ (Chip 1 Điểm).

---

## PHẦN V: ĐẶC TẢ KỸ THUẬT QUÂN CỜ (2.5D STANDEE) & TỌA ĐỘ ĐƯỜNG ĐUA (WAYPOINTS)

### 1. Bản Chất Hiển Thị Quân Cờ Nhân Vật (Character Standee Architecture)
Trong toàn bộ hệ thống tài nguyên, các nhân vật **hoàn toàn không sử dụng model 3D đa giác (.obj / .fbx)**. Chúng là **Quân cờ Standee 2.5D (Cardboard Cutout Figurines)** được xây dựng trực tiếp từ các file ảnh PNG tách nền (RGBA 8-bit Alpha Channel):

* **Nếu triển khai Web 3D (Three.js / WebGL)**:
  * Mỗi quân cờ là một mặt phẳng đứng (`THREE.PlaneGeometry`) mang texture ảnh PNG của nhân vật (`transparent: true`).
  * Mặt phẳng này dựng vuông góc $90^\circ$ với mặt bàn cờ (hoặc Billboard luôn hướng về camera), chân quân cờ có một hình tròn đen mờ làm bóng đổ (`drop shadow`).
  * **Trạng thái Bình Thường**: Quân cờ đứng thẳng.
  * **Trạng thái Bị Ngã (Tripped)**: Xoay Plane $90^\circ$ nằm bẹp sát mặt bàn cờ. Khi hồi phục ở lượt sau, xoay dựng đứng trở lại.
* **Nếu triển khai Web 2D (HTML5 Canvas / PixiJS / Phaser)**:
  * Render trực tiếp Sprite PNG tại tọa độ tâm của ô cờ.
  * Khi di chuyển: Áp dụng hiệu ứng nhảy parabol (Jump Arc Tween) từ ô này qua ô khác.
  * Khi Bị Ngã: Xoay nghiêng $90^\circ$ hoặc gắn icon hiệu ứng choáng váng trên đầu.

### 2. Định Dạng Cấu Trúc Tọa Độ Đường Đua (Track Waypoints Schema)
Bốn file ảnh đường đua là hình ảnh tĩnh. Game Engine cần một file cấu trúc dữ liệu JSON để xác định tọa độ chính xác của từng ô cờ trên bản đồ:

```json
{
  "track_id": "track_1",
  "track_name": "Emerald Plains",
  "image_path": "assets/images/bc84b1380de5.png",
  "image_resolution": { "width": 3180, "height": 975 },
  "total_spaces": 30,
  "first_corner_index": 8,
  "second_corner_index": 20,
  "finish_space_index": 28,
  "waypoints": [
    { "index": 0, "type": "START", "norm_x": 0.1250, "norm_y": 0.8200 },
    { "index": 1, "type": "NORMAL", "norm_x": 0.1820, "norm_y": 0.8200 },
    { "index": 5, "type": "TRIP", "norm_x": 0.4210, "norm_y": 0.8200 },
    { "index": 9, "type": "ARROW", "steps": 2, "norm_x": 0.6500, "norm_y": 0.5100 },
    { "index": 14, "type": "STAR", "points": 1, "norm_x": 0.4500, "norm_y": 0.1800 },
    { "index": 28, "type": "FINISH", "norm_x": 0.0820, "norm_y": 0.8200 }
  ]
}
```
* **Lưu ý quan trọng**: Tọa độ được lưu dưới dạng chuẩn hóa tỷ lệ phần trăm (`norm_x`, `norm_y` từ $0.0 \to 1.0$) để khi giao diện web co giãn trên bất kỳ độ phân giải màn hình nào (mobile, tablet, desktop), quân cờ đều bám chính xác vào ô cờ trên ảnh nền.
* **Các thuộc tính ô cần lưu ý**:
  * `first_corner_index` & `second_corner_index`: Phục vụ các kỹ năng kiểm tra vị trí khúc cua (như `R-02 Khinh Khí Hạm`, `E-05 Kẻ Chậm Chạp`, `E-30 Con Cưng Thừa Kế`).
  * `type`: Gồm `START`, `NORMAL`, `TRIP` (bẫy ngã), `ARROW` (mũi tên trượt tiếp), `STAR` (ô nhận chip 1 điểm), `FINISH`.

### 3. Công Cụ Trực Quan Xác Định Tọa Độ (Visual Track Mapper Tool)
Trong thư mục dự án đã tích hợp sẵn công cụ `track_waypoint_editor.html`. Người phát triển có thể mở file này trực tiếp trên trình duyệt web, click chuột theo thứ tự các ô từ ô Xuất Phát (Start) tới ô Vạch Đích (Finish) và xuất ra file JSON tọa độ hoàn chỉnh trong 2 phút.

---