import React, { useState, useEffect } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import {
  updateUserInformation,
  userProfileDetail,
} from "../../stores/action/profileActions";
import { toast } from "react-toastify";

const UpdateProfileInfo = ({ onBack }) => {
  const dispatch = useDispatch();
  const usersState = useSelector((state) => state.users) || {};
  const { usersDetail } = usersState;

  const [phoneNumber, setPhoneNumber] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [gender, setGender] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Format số hiển thị (ví dụ: 239 192 932)
  const formatPhoneNumber = (value) => {
    const digits = value.replace(/[^\d]/g, "");
    const normalized = digits.startsWith("0") ? digits : `0${digits}`; // Ensure leading 0 for display
    if (normalized.length <= 3) return normalized;
    if (normalized.length <= 6)
      return `${normalized.slice(0, 3)} ${normalized.slice(3)}`;
    if (normalized.length <= 9)
      return `${normalized.slice(0, 3)} ${normalized.slice(
        3,
        6
      )} ${normalized.slice(6)}`;
    return `${normalized.slice(0, 3)} ${normalized.slice(
      3,
      6
    )} ${normalized.slice(6, 10)}`;
  };

  // Chuẩn hóa số (thêm 0 nếu thiếu)
  const normalizePhoneNumber = (value) => {
    const digits = value.replace(/[^\d]/g, "");
    return digits.startsWith("0") ? digits : `0${digits}`;
  };

  // Validate số (10 hoặc 11 số, bắt đầu bằng 0)
  const validatePhoneNumber = (value) => {
    const digits = normalizePhoneNumber(value);
    return /^0\d{9,10}$/.test(digits);
  };

  // Xử lý thay đổi input số điện thoại
  const handlePhoneChange = (e) => {
    const value = e.target.value;
    const digits = value.replace(/[^\d]/g, "");
    if (digits.length <= 11) {
      setPhoneNumber(formatPhoneNumber(digits));
    }
  };

  // Xử lý thay đổi input số người thân
  const handleEmergencyContactChange = (e) => {
    const value = e.target.value;
    const digits = value.replace(/[^\d]/g, "");
    if (digits.length <= 11) {
      setEmergencyContact(formatPhoneNumber(digits));
    }
  };

  // Tải thông tin người dùng
  useEffect(() => {
    dispatch(userProfileDetail());
  }, [dispatch]);

  // Cập nhật state khi dữ liệu người dùng thay đổi
  useEffect(() => {
    console.log("User Profile Data (usersDetail):", usersDetail);
    if (usersDetail) {
      const phone = usersDetail?.phoneNumber || usersDetail?.phone || null;
      setPhoneNumber(phone ? formatPhoneNumber(phone) : "");
      const emergency =
        usersDetail?.phoneNumberRelative || usersDetail?.phoneRelative || null;
      setEmergencyContact(emergency ? formatPhoneNumber(emergency) : "");
      setGender(usersDetail?.gender || "");
    }
  }, [usersDetail]);

  // Xử lý submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    // Validate and prepare data
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    const normalizedEmergency = normalizePhoneNumber(emergencyContact);

    if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
      toast.error("Số điện thoại phải có 10 hoặc 11 số!", {
        position: "top-right",
        autoClose: 3000,
      });
      setIsProcessing(false);
      return;
    }

    if (!emergencyContact || !validatePhoneNumber(emergencyContact)) {
      toast.error("Số người thân phải có 10 hoặc 11 số!", {
        position: "top-right",
        autoClose: 3000,
      });
      setIsProcessing(false);
      return;
    }

    try {
      const updatedData = {
        Phone: normalizedPhone,
        PhoneRelative: normalizedEmergency,
        Gender: gender,
      };

      console.log("Sending updatedData:", updatedData); // Debug log

      const result = await dispatch(
        updateUserInformation(updatedData)
      ).unwrap();

      toast.success("Cập nhật thông tin thành công!", {
        position: "top-right",
        autoClose: 3000,
      });

      setTimeout(() => {
        dispatch(userProfileDetail());
        onBack();
      }, 3000);
    } catch (error) {
      const errorMessage = error || "Đã xảy ra lỗi không xác định";
      if (errorMessage === "Invalid phone number") {
        toast.error("Số điện thoại không hợp lệ!", {
          position: "top-right",
          autoClose: 3000,
        });
      } else if (errorMessage === "Invalid emergency contact") {
        toast.error("Số điện thoại người thân không hợp lệ!", {
          position: "top-right",
          autoClose: 3000,
        });
      } else if (errorMessage === "User not found") {
        toast.error("Người dùng không tồn tại!", {
          position: "top-right",
          autoClose: 3000,
        });
      } else if (errorMessage === "User not authenticated") {
        toast.error("Người dùng chưa xác thực!", {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        toast.error("Đã xảy ra lỗi: " + errorMessage, {
          position: "top-right",
          autoClose: 3000,
        });
      }
      setIsProcessing(false);
    }
  };

  return (
    <div className="update-profile-info">
      <button className="back-button" onClick={onBack}>
        <FaArrowLeft />
      </button>
      <h2>Cập nhật thông tin</h2>
      <form onSubmit={handleSubmit} className="form-container">
        <div className="form-group">
          <label>Số điện thoại</label>
          <div className="phone-input-wrapper">
            <span className="phone-prefix">+84</span>
            <input
              type="text"
              value={phoneNumber}
              onChange={handlePhoneChange}
              required
              pattern="^0\d{2} \d{3} \d{3,4}$"
            />
          </div>
        </div>
        <div className="form-group">
          <label>Số người thân</label>
          <div className="phone-input-wrapper">
            <span className="phone-prefix">+84</span>
            <input
              type="text"
              value={emergencyContact}
              onChange={handleEmergencyContactChange}
              required
              pattern="^0\d{2} \d{3} \d{3,4}$"
            />
          </div>
        </div>
        <div className="form-group">
          <label>Giới tính</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            required
          >
            <option value="" disabled>
              Chọn giới tính
            </option>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
            <option value="Khác">Khác</option>
          </select>
        </div>
        <button type="submit" className="save-button" disabled={isProcessing}>
          {isProcessing ? "Đang xử lý..." : "Lưu"}
        </button>
      </form>
    </div>
  );
};

export default UpdateProfileInfo;
