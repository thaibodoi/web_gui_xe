# TÀI LIỆU BÁO CÁO CHI TIẾT CÁC CHỨC NĂNG BACKEND
*(Dành cho sinh viên báo cáo, thuyết trình dự án Hệ thống Quản lý Bãi xe)*

Tài liệu này tổng hợp toàn bộ các chức năng của hệ thống bãi giữ xe, cách thức hoạt động ở giao diện (Frontend) kết nối xuống logic xử lý cụ thể dưới Backend (trong thư mục `src/main/java`) như thế nào để bạn dễ dàng trình bày trước giáo viên.

---

## BẢN ĐỒ LIÊN KẾT NHANH ĐẾN MÃ NGUỒN CỐT LÕI
* **Tài khoản & Đăng nhập**: [AuthenticationServiceImpl.java](file:///d:/demo_gui_xe/parking-management-backend/src/main/java/com/group1/parking_management/service/impl/AuthenticationServiceImpl.java)
* **Quản lý Xe vào/ra & Tính tiền**: [ParkingServiceImpl.java](file:///d:/demo_gui_xe/parking-management-backend/src/main/java/com/group1/parking_management/service/impl/ParkingServiceImpl.java)
* **Đăng ký vé tháng**: [MonthlyRegistrationServiceImpl.java](file:///d:/demo_gui_xe/parking-management-backend/src/main/java/com/group1/parking_management/service/impl/MonthlyRegistrationServiceImpl.java)
* **Báo mất thẻ & Phạt mất thẻ**: [MissingReportServiceImpl.java](file:///d:/demo_gui_xe/parking-management-backend/src/main/java/com/group1/parking_management/service/impl/MissingReportServiceImpl.java)
* **Báo cáo thống kê doanh thu**: [StatisticServiceImpl.java](file:///d:/demo_gui_xe/parking-management-backend/src/main/java/com/group1/parking_management/service/impl/StatisticServiceImpl.java)
* **Cấu hình ca trực**: [ConfigServiceImpl.java](file:///d:/demo_gui_xe/parking-management-backend/src/main/java/com/group1/parking_management/service/impl/ConfigServiceImpl.java)

---

## CHI TIẾT 7 CHỨC NĂNG CỐT LÕI & CÁCH XỬ LÝ TRONG CODE

### Chức năng 1: Đăng nhập & Bảo mật hệ thống (Authentication)
* **Mô tả chức năng**: Nhân viên bảo vệ hoặc Admin đăng nhập vào hệ thống để bắt đầu ca làm việc.
* **Quy trình xử lý dưới code**:
  1. Người dùng gửi Tên đăng nhập và Mật khẩu lên hệ thống.
  2. Hệ thống tìm tài khoản trong bảng `Account`.
  3. Sử dụng công cụ mã hóa `passwordEncoder.matches(...)` để so khớp mật khẩu đã mã hóa trong cơ sở dữ liệu (đảm bảo bảo mật tối đa, admin cũng không tự đọc được mật khẩu).
  4. Nếu khớp, hệ thống tạo ra một chuỗi **JWT Token** (như một chiếc "vé thông hành điện tử"). Giao diện lưu token này lại để tự gửi kèm ở các chức năng sau, giúp xác thực quyền mà không cần đăng nhập lại nhiều lần.
* **Code xử lý chính**: Hàm `login(...)` tại dòng 38 trong [AuthenticationServiceImpl.java](file:///d:/demo_gui_xe/parking-management-backend/src/main/java/com/group1/parking_management/service/impl/AuthenticationServiceImpl.java#L38-L51).

---

### Chức năng 2: Cho xe vào bãi (Check-in)
* **Mô tả chức năng**: Nhân viên quẹt thẻ vật lý hoặc nhận dạng biển số xe tại cổng để cho xe vào đỗ.
* **Quy trình xử lý dưới code**:
  1. Frontend gửi lên biển số xe, mã thẻ và loại xe.
  2. **Kiểm tra hợp lệ**: Hệ thống kiểm tra xem xe này có đang đỗ sẵn trong bãi chưa. Nếu có rồi thì chặn lại (tránh lỗi quẹt 2 lần liên tiếp).
  3. **Kiểm tra danh sách đen**: Kiểm tra xem xe này có đang bị báo mất thẻ (nằm trong danh sách mất thẻ chưa giải quyết) hay không. Nếu có thì từ chối cho vào.
  4. **Phân loại thẻ**: Hệ thống kiểm tra nhanh xem biển số xe này có đăng ký vé tháng (`MONTHLY`) còn hạn không. Nếu không có, tự động đánh dấu là xe khách vãng lai (`DAILY`).
  5. **Lưu dữ liệu**: Tạo một bản ghi mới trong bảng `ParkingRecord` (Xe trong bãi) lưu giờ vào và nhân viên thực hiện.
* **Code xử lý chính**: Hàm `registerEntry(...)` tại dòng 70 trong [ParkingServiceImpl.java](file:///d:/demo_gui_xe/parking-management-backend/src/main/java/com/group1/parking_management/service/impl/ParkingServiceImpl.java#L70-L115).

---

### Chức năng 3: Cho xe ra bãi (Check-out) & Tính tiền tự động
* **Mô tả chức năng**: Khách trả thẻ xe tại cổng ra, hệ thống tự động tính tiền và cho xe xuất bãi.
* **Quy trình xử lý dưới code**:
  1. Nhân viên quét thẻ ở cổng ra, hệ thống tìm xe tương ứng trong bảng xe đang đỗ (`ParkingRecord`).
  2. **Tính toán phí gửi xe (`calculateParkingFee`)**:
     - Nếu xe đăng ký **vé tháng**: Hệ thống tính phí = **0đ**.
     - Nếu xe dùng **vé ngày**: Hệ thống đo thời gian từ lúc xe vào đến hiện tại:
       - Đỗ tròn ngày: Phí = số ngày * (giá ngày + giá đêm).
       - Đỗ lẻ giờ: Hệ thống so khớp thời gian lẻ đó nằm trong khung giờ Ngày hay Đêm (cấu hình động) để áp giá tiền tương ứng và cộng vào hóa đơn.
  3. **Tạo hóa đơn**: Lưu hóa đơn thanh toán vào bảng `Payment`.
  4. **Chuyển lịch sử**: Tạo bản ghi lưu trữ thông tin xe ra vào bảng Lịch sử (`ParkingRecordHistory`), ghi nhận nhân viên kiểm soát đầu ra.
  5. **Giải phóng chỗ**: Xóa xe khỏi danh sách xe đang đỗ trong bãi.
* **Code xử lý chính**: Hàm `processExit(...)` và `calculateParkingFee(...)` tại dòng 120 trong [ParkingServiceImpl.java](file:///d:/demo_gui_xe/parking-management-backend/src/main/java/com/group1/parking_management/service/impl/ParkingServiceImpl.java#L120-L213).

---

### Chức năng 4: Đăng ký vé tháng (Monthly Registration)
* **Mô tả chức năng**: Người dùng (Sinh viên hoặc Giảng viên) đăng ký gửi xe theo tháng để được hưởng giá ưu đãi và không mất tiền lẻ mỗi lượt ra vào.
* **Quy trình xử lý dưới code**:
  1. Nhân viên nhập thông tin chủ xe (Tên, SĐT, MSSV/Mã giảng viên, Lớp, Khoa), thông tin xe (Biển số, Màu, Thương hiệu) và số tháng muốn đăng ký.
  2. Hệ thống kiểm tra xe này đã đăng ký vé tháng chưa, tránh trùng lặp.
  3. Lấy bảng giá vé tháng tương ứng với loại xe trong bảng `Price` nhân với số tháng đăng ký để ra tổng tiền cần đóng.
  4. Tạo hóa đơn thanh toán với loại giao dịch là `MONTHLY`.
  5. Lưu thông tin đăng ký vào bảng `ActiveMonthlyRegistration` (Vé tháng đang hoạt động), lưu giờ kích hoạt và giờ hết hạn.
* **Code xử lý chính**: Hàm `createMonthlyRegistration(...)` tại dòng 61 trong [MonthlyRegistrationServiceImpl.java](file:///d:/demo_gui_xe/parking-management-backend/src/main/java/com/group1/parking_management/service/impl/MonthlyRegistrationServiceImpl.java#L61-L125).

---

### Chức năng 5: Báo mất thẻ xe & Xử phạt (Missing Report)
* **Mô tả chức năng**: Khách hàng báo làm mất thẻ vật lý, nhân viên lập hồ sơ xác minh để cho xe ra và phạt tiền mất thẻ.
* **Quy trình xử lý dưới code**:
  1. Nhân viên bảo vệ tìm xe trong bãi bằng cách nhập biển số xe trực tiếp trên phần mềm.
  2. Kiểm tra xem loại xe khai báo có khớp với xe đang đỗ thực tế trong bãi hay không (chống trộm).
  3. Tạo một hóa đơn phạt trị giá **50.000 VNĐ** (được gán cứng trong code).
  4. Chuyển thông tin xe sang bảng lịch sử xe ra (`ParkingRecordHistory`) và gán kèm mã hóa đơn phạt mất thẻ này. Xóa xe khỏi danh sách xe đang đỗ trong bãi.
  5. Lưu thông tin xác minh của người báo mất (Họ tên, SĐT, CMND/CCCD, Mô tả màu xe/hãng xe) vào bảng `MissingReport` để làm bằng chứng bảo mật.
* **Code xử lý chính**: Hàm `createMissingReport(...)` tại dòng 50 trong [MissingReportServiceImpl.java](file:///d:/demo_gui_xe/parking-management-backend/src/main/java/com/group1/parking_management/service/impl/MissingReportServiceImpl.java#L50-L102).

---

### Chức năng 6: Thống kê doanh thu & Lượt xe qua lại (Statistics)
* **Mô tả chức năng**: Admin xem báo cáo thống kê doanh số tiền thu được và lưu lượng xe ra vào bãi theo từng tuần của một tháng xác định.
* **Quy trình xử lý dưới code**:
  1. Admin gửi yêu cầu chọn Tháng và Năm cần xem.
  2. Hệ thống tự động chia tháng đó thành các tuần (ví dụ: tuần 1 từ ngày 1-7, tuần 2 từ ngày 8-14...).
  3. **Thống kê doanh thu**: Sử dụng câu lệnh cộng dồn (`sumRevenueBetween`) trong bảng `Payment` để lấy ra tổng số tiền thu được của từng tuần.
  4. **Thống kê lượt xe**: Sử dụng lệnh đếm (`sumVehicleBetween`) trong bảng lịch sử `ParkingRecordHistory` để biết có bao nhiêu xe đã đi ra/vào bãi trong khoảng thời gian đó.
* **Code xử lý chính**: Hàm `getMonthlyRevenue(...)` và `getMonthlyTraffic(...)` tại dòng 30 trong [StatisticServiceImpl.java](file:///d:/demo_gui_xe/parking-management-backend/src/main/java/com/group1/parking_management/service/impl/StatisticServiceImpl.java#L30-L108).

---

### Chức năng 7: Cấu hình ca trực & Khung giờ hệ thống
* **Mô tả chức năng**: Thay đổi giờ bắt đầu ca Ngày và ca Đêm để làm căn cứ tính tiền gửi xe theo thời gian thực.
* **Quy trình xử lý dưới code**:
  * Khi tính tiền xe lẻ giờ, hệ thống sẽ gọi cấu hình từ `ConfigService` để xem giờ Ngày bắt đầu từ mấy giờ (ví dụ: 6h sáng) và giờ Đêm bắt đầu lúc nào (ví dụ: 18h tối), từ đó áp dụng giá vé Ngày/Đêm tương ứng cực kỳ linh hoạt mà không cần phải viết cứng giờ trong code.
* **Code liên quan**: [ConfigServiceImpl.java](file:///d:/demo_gui_xe/parking-management-backend/src/main/java/com/group1/parking_management/service/impl/ConfigServiceImpl.java).

---

## KỊCH BẢN GIẢ ĐỊNH & CÁCH TRẢ LỜI CÂU HỎI HỘI ĐỒNG

| Tình huống hỏi | Cách trả lời của bạn |
| :--- | :--- |
| **"Làm sao hệ thống biết xe nào là vé tháng khi nó quẹt thẻ ở cổng vào?"** | Thưa cô/thầy, khi quẹt thẻ đi vào, Backend sẽ lấy biển số xe đó chạy vào bảng `ActiveMonthlyRegistration` (đăng ký vé tháng đang hoạt động) để tìm kiếm. Nếu có bản ghi khớp và còn hạn, hệ thống tự động gán loại vé là `MONTHLY` (vé tháng), ngược lại gán là `DAILY` (vé ngày). |
| **"Tại sao khi báo mất thẻ lại cần lưu nhiều thông tin cá nhân như CCCD, hãng xe, màu xe làm gì?"** | Dạ thưa cô/thầy, vì khách hàng đã làm mất thẻ gửi xe vật lý, không thể đối chiếu thẻ lúc vào được nữa. Việc lưu lại thông tin CCCD, SĐT và đặc điểm xe giúp tránh kẻ gian giả danh chủ xe để lấy trộm xe. Đây là cơ sở pháp lý để đối chiếu nếu có tranh chấp sau này. |
| **"Nếu có lỗi xảy ra trong quá trình trừ tiền hay lưu lịch sử thì dữ liệu có bị sai lệch không?"** | Dạ không ạ, vì tụi em sử dụng nhãn `@Transactional` trên các hàm xử lý nghiệp vụ phức tạp. Nếu bất kỳ một bước nào bị lỗi (ví dụ: tạo hóa đơn thành công nhưng xóa xe khỏi bãi bị lỗi), hệ thống sẽ tự động khôi phục (Rollback) lại trạng thái ban đầu của dữ liệu như chưa hề có thao tác nào xảy ra. |
| **"Mật khẩu của người dùng được bảo vệ như thế nào?"** | Mật khẩu được băm (hash) bằng thuật toán **BCrypt** mạnh mẽ trước khi lưu vào database. Kể cả quản trị viên hệ thống có truy cập thẳng vào cơ sở dữ liệu cũng chỉ nhìn thấy một chuỗi ký tự ngẫu nhiên đã được mã hóa, không thể đọc được mật khẩu gốc của người dùng. |
