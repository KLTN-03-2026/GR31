import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axiosClient from "../Service/axiosClient";
import AuthForm from "../components/AuthForm";
const Register = () => {
  const navigate = useNavigate();
  const handleRegister = async (e, formData) => {
    e.preventDefault();

    // Kiểm tra định dạng email
    // const emailPattern = /^[a-zA-Z0-9._%+-]+@dtu\.edu\.vn$/;
    // if (!emailPattern.test(formData.email)) {
    //   toast.error("Email phải có định dạng đuôi là:@dtu.edu.vn");
    //   return;
    // }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Mật khẩu nhập lại không khớp");
      return; // Dừng hàm tại đây, không gửi request lên API
    }
    if (formData.password.length < 6) {
      toast.error("Mật khẩu tối thiểu là 6 ký tự");
      return;
    }
    //console.log("Dữ liệu gửi lên API:", formData);
    NProgress.start(); // 🔥 Bắt đầu hiển thị loading bar
    try {
      const response = await axiosClient.post(
        "/api/Auth/register",
        {
          fullName: formData.name,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }
      );

      console.log("Data API :", response);

      if (response.data.success) {
        toast.success(
          "Đăng ký thành công!Vui lòng xác nhận tài khoản qua mail!"
        );
        //chuyển hướng sang đăng nhập
        navigate("/login");
      } else {
        toast.error("Đăng ký tài khoản thất bại");
      }
    } catch (error) {
      console.error("Lỗi đăng ký:", error.response?.data);
      // toast.error(error.response?.data?.message || "Đăng nhập thất bại!");
      if (
        error.response?.data?.message ===
        "This Email already exists Or Email Don't accept"
      ) {
        toast.error("Tài khoản đã tồn tại trên hệ thống!");
      } else {
        toast.error("Đăng ký tài khoản thất bại");
      }
    } finally {
      NProgress.done(); // 🔥 Kết thúc loading bar
    }
  };
  return <AuthForm type="register" onSubmit={handleRegister} />;
};

export default Register;
