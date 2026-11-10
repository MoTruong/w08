# HỆ THỐNG QUẢN LÝ PHÒNG KHÁM ĐA KHOA AN TÂM

> **Học phần:** Nhập môn Công nghệ Phần mềm (Intro2SE - BT04)  
> **Chức năng triển khai:** `FR-01` (Đặt lịch hẹn khám trực tuyến) & `FR-02` (Tiếp nhận & Check-in tại quầy)  
> **Phiên bản:** 1.0 (Dữ liệu tĩnh giả định & Giả lập tương tác thời gian thực)

---

## 1. Giới thiệu tổng quan

Hệ thống được xây dựng hoàn chỉnh theo đặc tả nghiệp vụ chi tiết tại [dac-ta-chuc-nang-an-tam.md](./dac-ta-chuc-nang-an-tam.md) cho **Phòng khám Đa khoa An Tâm** (06 bác sĩ đa chuyên khoa, 02 nhân viên tiếp nhận, lưu lượng 80–120 lượt khám/ngày).

Hệ thống bao gồm 4 phân hệ liên kết dữ liệu thời gian thực:
1. **Cổng Bệnh nhân - Đặt lịch trực tuyến (`FR-01`)**: Tra cứu 06 bác sĩ, chọn slot 15 phút (giới hạn tối đa 2 người/slot), kiểm tra trùng lịch, cấp Mã lịch hẹn `AT-YYYYMMDD-XXX` kèm mã QR và mô phỏng tin nhắn SMS.
2. **Cổng Bệnh nhân - Tra cứu & Quản lý lịch (`FR-01`)**: Tra cứu mã hẹn, thực thi quy tắc đổi/hủy trực tuyến trước giờ khám $\ge$ 30 phút; từ chối và cảnh báo gọi hotline nếu $< 30$ phút.
3. **Bàn Tiếp nhận & Check-in tại quầy (`FR-02`)**: Tra cứu tức thì theo Mã hẹn/SĐT/Họ tên, đối chiếu và bổ sung CCCD/BHYT, phát hiện đến trễ $> 15$ phút với badge đỏ `Đến trễ (Late)` và menu xử lý phân luồng (Chờ xen kẽ / Dời slot), quét tự động vắng mặt `No-Show`, và tiếp nhận bệnh nhân vãng lai (`Walk-in`).
4. **Màn hình Buồng khám Bác sĩ (Doctor Real-time Queue)**: Bác sĩ quan sát hàng đợi ca trực của mình theo thời gian thực (hiển thị bệnh nhân ngay sau khi check-in tại quầy $< 2$ giây), gọi bệnh nhân vào khám, hiển thị bệnh nhân ưu tiên xen kẽ và hoàn tất lượt khám.

---

## 2. Công nghệ sử dụng

- **Frontend Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + Plus Jakarta Sans Typography
- **Icons:** Lucide React
- **Quản lý trạng thái:** React Context API + LocalStorage Persistence (hỗ trợ reset dữ liệu mẫu ban đầu bất kỳ lúc nào)

---

## 3. Hướng dẫn cài đặt & Khởi chạy

### Yêu cầu môi trường:
- Node.js $\ge$ 18.0.0
- npm $\ge$ 9.0.0

### Các bước chạy:
```bash
# 1. Cài đặt thư viện phụ thuộc (nếu chưa cài)
npm install

# 2. Khởi chạy máy chủ phát triển (Dev Server)
npm run dev
```

Mở trình duyệt tại địa chỉ hiển thị trong terminal (mặc định: `http://localhost:5173/`).

### Kiểm tra bản build sản phẩm:
```bash
npm run build
npm run preview
```

---

## 4. Bảng đối chiếu Kịch bản kiểm thử (Test Scenarios Mapping)

| Test Case | Yêu cầu | Kịch bản thao tác trên giao diện | Tiêu chí đạt (Pass Criteria) |
| :--- | :--- | :--- | :--- |
| **TC-BOOK-01** | `FR-01` | Vào tab **FR-01: Đặt lịch**, chọn BS Nguyễn Văn An, ngày 10/11, slot **08:30**, điền thông tin và bấm Xác nhận. | Tạo thành công mã `AT-..`, trạng thái `Confirmed`, gửi SMS mô phỏng trong 15s, slot 08:30 tăng số lượng chỗ đã đặt. |
| **TC-BOOK-02** | `FR-01` | Tại ngày 10/11 của BS Nguyễn Văn An, slot **09:00** đã được nạp sẵn 2 bệnh nhân (2/2 chỗ). Thử bấm chọn hoặc gửi đăng ký vào slot này. | Nút slot hiển thị `Hết chỗ (2/2)` bị vô hiệu hóa; nếu xung đột gửi lên sẽ hiển thị cảnh báo thân thiện và **gợi ý các slot trống khác + bác sĩ khác cùng chuyên khoa**. |
| **TC-RECP-01** | `FR-02` | Trên thanh giả lập, chỉnh giờ thành **08:00**. Vào tab **FR-02: Quầy tiếp nhận**, tìm lịch `AT-20261110-001` (khung giờ 08:00), bấm **Tiếp nhận / Check-in**. | Trạng thái chuyển thành `Waiting` (Đang chờ khám), được cấp số thứ tự khám (STT); mở tab **Hàng đợi Bác sĩ** thấy bệnh nhân xuất hiện tức thì trong danh sách chờ (< 2 giây). |
| **TC-RECP-02** | `FR-02` | Trên thanh giả lập, chỉnh giờ thành **08:20** (quá 20 phút so với giờ hẹn 08:00 của lịch `AT-20261110-001`). Vào tab Quầy tiếp nhận. | Hiển thị badge đỏ `Đến trễ (Late)`, mở hộp thoại phân luồng với 2 tùy chọn: **1. Chờ khám xen kẽ (Ưu tiên)** hoặc **2. Dời sang khung giờ trống kế tiếp trong ca trực**. |
| **TC-CANCEL-30M** | `FR-01` | Chỉnh giờ hệ thống thành **08:50**. Vào tab **FR-01: Tra cứu & Quản lý lịch**, tra cứu lịch 09:00 (còn 10 phút < 30p) và thử bấm Hủy lịch. | Hệ thống từ chối hủy trực tuyến do vi phạm quy tắc trước 30 phút; hiển thị cảnh báo kèm hướng dẫn gọi hotline **1900 6868**. |
| **TC-NOSHOW-WALKIN** | `FR-02` | Chỉnh giờ hệ thống thành **08:20**, bấm nút **"Quét No-Show tự động"**. Lịch lúc 07:30 chưa check-in sẽ chuyển sang `No-Show` và giải phóng slot. Bấm nút **"Tiếp nhận vãng lai (Walk-in)"** tại quầy. | Slot được mở lại, tiếp nhận thành công bệnh nhân vãng lai vào thẳng hàng đợi khám của Bác sĩ. |

---

## 5. Danh sách 06 Bác sĩ mẫu

1. **BS. CKI Nguyễn Văn An** – Chuyên khoa Nội tổng quát – Phòng 101 (Tầng 1)
2. **ThS. BS Trần Thị Mai** – Chuyên khoa Nhi – Phòng 102 (Tầng 1)
3. **BS. CKI Lê Hoàng Nam** – Chuyên khoa Tai Mũi Họng – Phòng 103 (Tầng 1)
4. **BS. CKII Phạm Thu Hà** – Chuyên khoa Tim mạch – Phòng 201 (Tầng 2)
5. **BS. Đỗ Minh Quân** – Chuyên khoa Cơ Xương Khớp – Phòng 202 (Tầng 2)
6. **ThS. BS Vũ Bích Ngọc** – Chuyên khoa Da liễu – Phòng 203 (Tầng 2)

