import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { resendVerificationEmail } from "../stores/action/authAction";
import { clearAuthState } from "../stores/reducers/authReducer";
import { FaEnvelope, FaPaperPlane, FaSpinner } from "react-icons/fa";
import "../styles/ResendVerification.scss";

const ResendVerification = () => {
  const [email, setEmail] = useState("");
  const dispatch = useDispatch();
  const { loading, error, success } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearAuthState()); // Clear previous state
    try {
      const response = await dispatch(resendVerificationEmail(email)).unwrap();
      if (
        response.success &&
        response.message === "New verification email sent successfully."
      ) {
        // Message is handled by Redux state
      } else if (response.message === "Email already verified") {
        setTimeout(() => {
          window.location.href = "http://localhost:3000/Home";
        }, 2000);
      }
    } catch (err) {
      // Error is handled by Redux state
    }
  };

  return (
    <div className="resend-verification-container">
      <div className="resend-verification-card">
        <div className="header-verify">
          <h1>University Sharing</h1>
        </div>
        <div className="content">
          <div className="icon-container">
            <h3>Mã xác nhận đã hết hạn</h3>
            <FaEnvelope className="icon-envelope" />
          </div>
          <h2>Gửi lại email xác thực</h2>
          <p>Nhập địa chỉ email để nhận lại liên kết xác thực tài khoản.</p>

          <form onSubmit={handleSubmit} className="form">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email của bạn"
              required
              className="input"
            />
            <button
              type="submit"
              className="continue-button-resend"
              disabled={loading}
            >
              {loading ? (
                <FaSpinner className="spinner" />
              ) : (
                <>
                  <FaPaperPlane className="icon-send" />
                  Gửi email
                </>
              )}
            </button>
          </form>

          {success && (
            <p className="success">Email xác minh mới được gửi thành công.</p>
          )}
          {error && <p className="error">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default ResendVerification;
