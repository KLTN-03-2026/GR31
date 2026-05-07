import React, { useState } from "react";
import { Modal, DatePicker, message } from "antd";
import moment from "moment";

const BlockUserModal = ({ visible, onConfirm, onCancel, userId, title }) => {
  const [blockUntil, setBlockUntil] = useState(null);

  const handleConfirm = () => {
    if (!blockUntil) {
      message.error("Vui lòng chọn thời gian hết hạn.");
      return;
    }
    onConfirm(blockUntil.toISOString());
    setBlockUntil(null); // Reset sau khi xác nhận
  };

  const handleCancel = () => {
    setBlockUntil(null); // Reset khi hủy
    onCancel();
  };

  return (
    <Modal
      title={title || "Chọn thời gian hết hạn"}
      visible={visible}
      onOk={handleConfirm}
      onCancel={handleCancel}
      okText="Xác nhận"
      cancelText="Hủy"
      okButtonProps={{ disabled: !blockUntil }} // Vô hiệu hóa nút "Xác nhận" nếu chưa chọn thời gian
    >
      <DatePicker
        showTime
        format="YYYY-MM-DD HH:mm:ss"
        onChange={(date) => setBlockUntil(date)}
        placeholder="Chọn thời gian hết hạn"
        style={{ width: "100%" }}
        disabledDate={(current) => current && current < moment().startOf("day")}
        value={blockUntil} // Liên kết giá trị với state
      />
    </Modal>
  );
};

export default BlockUserModal;
