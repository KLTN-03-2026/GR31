import React, { useState, useEffect } from "react";
import "../styles/AuthForm.scss";
import logo from "../assets/Logo.png";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { resetPassword, validateResetToken } from "../stores/action/authAction";
import { clearAuthState } from "../stores/reducers/authReducer";

const ResetForgotPassword = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState("");
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
    policyAgreed: false,
  });
  const [isTokenValid, setIsTokenValid] = useState(null); // null: chưa kiểm tra, true: hợp lệ, false: không hợp lệ

  const { loading, error } = useSelector((state) => state.auth);

  // Kiểm tra token khi trang được tải (chỉ chạy một lần)
  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (!tokenFromUrl) {
      dispatch(clearAuthState()); // Xóa state trước khi điều hướng
      toast.error("Liên kết đặt lại mật khẩu không hợp lệ");
      navigate("/login");
      return;
    }
    setToken(tokenFromUrl);

    let isMounted = true;

    dispatch(validateResetToken(tokenFromUrl))
      .unwrap()
      .then((result) => {
        if (isMounted && result.success) {
          setIsTokenValid(true);
        } else if (isMounted) {
          dispatch(clearAuthState()); // Xóa state trước khi điều hướng
          toast.error("Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ");
          navigate("/token-expired");
        }
      })
      .catch((err) => {
        if (isMounted) {
          dispatch(clearAuthState()); // Xóa state trước khi điều hướng
          toast.error("Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ");
          navigate("/token-expired");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [searchParams, navigate, dispatch]);

  // Hiển thị thông báo lỗi từ resetPassword
  useEffect(() => {
    if (error && !loading && isTokenValid === true) {
      toast.error(error);
      dispatch(clearAuthState()); // Xóa state sau khi hiển thị
    }
  }, [error, loading, dispatch, isTokenValid]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isTokenValid === false) {
      toast.error("Liên kết đặt lại mật khẩu không hợp lệ. Vui lòng thử lại.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Mật khẩu nhập lại không khớp!");
      setFormData((prev) => ({
        ...prev,
        password: "",
        confirmPassword: "",
      }));
      return;
    }

    if (!formData.policyAgreed) {
      toast.warning("Vui lòng đồng ý với chính sách!");
      return;
    }

    try {
      const result = await dispatch(
        resetPassword({
          Token: token,
          NewPassword: formData.password,
          ConfirmPassword: formData.confirmPassword,
        })
      ).unwrap();

      if (result.success) {
        toast.success("Đã cập nhật mật khẩu thành công!");
        dispatch(clearAuthState()); // Xóa state sau khi thành công
        navigate("/login");
      }
    } catch (error) {
      console.error("Lỗi khi đặt lại mật khẩu:", error);
    }
  };

  // Hiển thị loading trong khi kiểm tra token
  if (isTokenValid === null) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        Đang kiểm tra liên kết đặt lại mật khẩu...
      </div>
    );
  }

  // Nếu token không hợp lệ, không hiển thị form (đã điều hướng ở useEffect)
  if (isTokenValid === false) {
    return null;
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="logo">
          <img src={logo} alt="University Sharing" />
        </div>
        <h2>Chọn mật khẩu mới</h2>
        <form onSubmit={handleSubmit}>
          <label>Mật Khẩu mới</label>
          <input
            type="password"
            name="password"
            placeholder="Mật khẩu mới"
            required
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
            autoComplete="new-password"
          />

          <label>Nhập lại mật khẩu mới</label>
          <input
            type="password"
            name="confirmPassword"
            placeholder="Nhập lại mật khẩu mới"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={loading}
            autoComplete="new-password"
          />

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <label className="policy">
              <input
                type="checkbox"
                name="policyAgreed"
                checked={formData.policyAgreed}
                onChange={handleChange}
                required
                disabled={loading}
              />
              Đồng ý với chính sách
            </label>
            <a href="#" style={{ textDecoration: "none", color: "#1497ff" }}>
              Chính sách
            </a>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Đang xử lý..." : "Xác nhận"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetForgotPassword;
