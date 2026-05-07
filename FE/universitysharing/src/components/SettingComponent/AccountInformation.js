import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserInformationDetail } from "../../stores/action/profileActions";
import { toast } from "react-toastify";
import {
  FaArrowLeft,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaInfoCircle,
  FaVenusMars,
  FaCheckCircle,
  FaStar,
  FaCalendarAlt,
} from "react-icons/fa";
import "../../styles/SettingViews/AccountInformation.scss"; // Import your styles
const AccountInformation = ({ onBack }) => {
  const dispatch = useDispatch();
  const { usersDetail, loading, error } = useSelector((state) => state.users);

  // Fetch user information when component mounts
  useEffect(() => {
    dispatch(fetchUserInformationDetail()).catch((err) => {
      toast.error(err.message || "Không thể tải thông tin tài khoản!", {
        position: "top-right",
        autoClose: 3000,
      });
    });
  }, [dispatch]);

  // Handle error display
  useEffect(() => {
    if (error) {
      toast.error(error, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  }, [error]);

  return (
    <div className="change-password">
      {" "}
      {/* Reuse change-password class for consistency */}
      <button className="back-button" onClick={onBack}>
        <FaArrowLeft />
      </button>
      <h2>Thông tin tài khoản</h2>
      <div className="form-container">
        {loading && <div className="info-text">Đang tải thông tin...</div>}

        {!loading && !error && usersDetail && (
          <>
            <div className="form-group">
              <label>
                <FaUser className="icon" /> Tên đầy đủ
              </label>
              <div className="info-value">
                {usersDetail.fullName || "Chưa cập nhật"}
              </div>
            </div>

            <div className="form-group">
              <label>
                <FaEnvelope className="icon" /> Email
                {usersDetail.isVerifiedEmail && (
                  <FaCheckCircle
                    className="verified-icon"
                    title="Email đã xác minh"
                  />
                )}
              </label>
              <div className="info-value">
                {usersDetail.email || "Chưa cập nhật"}
              </div>
            </div>

            <div className="form-group">
              <label>
                <FaInfoCircle className="icon" /> Bio
              </label>
              <div className="info-value">
                {usersDetail.bio || "Chưa cập nhật"}
              </div>
            </div>

            <div className="form-group">
              <label>
                <FaPhone className="icon" /> Số điện thoại
              </label>
              <div className="info-value">
                {usersDetail.phone || "Chưa cập nhật"}
              </div>
            </div>

            <div className="form-group">
              <label>
                <FaPhone className="icon" /> Số điện thoại người thân
              </label>
              <div className="info-value">
                {usersDetail.phoneRelative || "Chưa cập nhật"}
              </div>
            </div>

            <div className="form-group">
              <label>
                <FaVenusMars className="icon" /> Giới tính
              </label>
              <div className="info-value">
                {usersDetail.gender || "Chưa cập nhật"}
              </div>
            </div>

            <div className="form-group">
              <label>
                <FaStar className="icon" /> Điểm uy tín
              </label>
              <div className="info-value">
                {usersDetail.trustScore?.toFixed(2) || "0.00"}
              </div>
            </div>

            <div className="form-group">
              <label>
                <FaCalendarAlt className="icon" /> Ngày tạo tài khoản
              </label>
              <div className="info-value">
                {usersDetail.createdAt
                  ? new Date(usersDetail.createdAt).toLocaleDateString("vi-VN")
                  : "Chưa cập nhật"}
              </div>
            </div>

            <div className="form-group">
              <label>
                <FaCalendarAlt className="icon" /> Ngày cập nhật
              </label>
              <div className="info-value">
                {usersDetail.updatedAt
                  ? new Date(usersDetail.updatedAt).toLocaleDateString("vi-VN")
                  : "Chưa cập nhật"}
              </div>
            </div>
          </>
        )}

        {!loading && error && <div className="info-text error">{error}</div>}
      </div>
    </div>
  );
};

export default AccountInformation;
