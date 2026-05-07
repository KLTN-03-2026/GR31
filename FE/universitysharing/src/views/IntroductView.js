// IntroductView.js (Updated with DTU Colors)
import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AI from "../../src/assets/ai.png";
import avt from "../../src/assets/avatar-intro/avata.jpg";
import avt2 from "../../src/assets/avatar-intro/avata1.jpg";
import avt3 from "../../src/assets/avatar-intro/avata2.jpg";
import avt4 from "../../src/assets/avatar-intro/avata3.jpg";
import avt5 from "../../src/assets/avatar-intro/avata4.jpg";
import avt6 from "../../src/assets/avatar-intro/avata5.jpg";
import avt7 from "../../src/assets/avatar-intro/avata6.jpg";
import avt8 from "../../src/assets/avatar-intro/avata7.jpg";
import avt1 from "../../src/assets/avatar-intro/avata8.jpg";
import baomat from "../../src/assets/baomat.png";
import chiasexe from "../../src/assets/chiasexe.png";
import info from "../../src/assets/dadangthongtin.png";
import giaotiep from "../../src/assets/giatieppchuyenbiet.png";
import trainghiem from "../../src/assets/trainghiemnguoidunghiendai.png";
import "../styles/LandingPage.scss";

const LandingPage = () => {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  const features = [
    {
      title: "Môi trường giao tiếp chuyên biệt",
      description: "Nền tảng an toàn để sinh viên trao đổi thông tin, chia sẻ kiến thức và kinh nghiệm học tập.",
      image: giaotiep,
      icon: "💬"
    },
    {
      title: "Chia sẻ đa dạng thông tin",
      description: "Đăng tải hành trình đi lại, tài liệu học tập, đồ dùng cá nhân và các hoạt động hỗ trợ.",
      image: info,
      icon: "📚"
    },
    {
      title: "Chia sẻ chuyến đi",
      description: "Tạo, chia sẻ và tham gia các chuyến đi giữa các cơ sở hoặc đến trường.",
      image: chiasexe,
      icon: "🚗"
    },
    {
      title: "Trải nghiệm người dùng hiện đại",
      description: "Nhắn tin, thông báo, tìm kiếm thông minh và gợi ý bài đăng theo sở thích.",
      image: trainghiem,
      icon: "✨"
    },
    {
      title: "Hỗ trợ AI",
      description: "Tìm kiếm thông tin nhanh chóng và tương tác với hệ thống một cách tự nhiên.",
      image: AI,
      icon: "🤖"
    },
    {
      title: "Bảo mật và kiểm duyệt",
      description: "Giải pháp bảo mật hiện đại với hệ thống kiểm duyệt nội dung chặt chẽ.",
      image: baomat,
      icon: "🔒"
    },
  ];

  const testimonials = [
    {
      feedback:
        "University Sharing giúp tôi tìm được nhóm học tập phù hợp và chia sẻ tài liệu dễ dàng hơn bao giờ hết!",
      name: "Hồng Nhung",

      avatar: avt,
    },
    {
      feedback:
        "Nhờ tính năng chia sẻ chuyến đi, tôi đã tiết kiệm được rất nhiều chi phí đi lại giữa các cơ sở.",
      name: "Trần Văn Sơn",

      avatar: avt1,
    },
    {
      feedback:
        "Hệ thống AI hỗ trợ tìm kiếm tài liệu thật sự hữu ích, giúp tôi tiết kiệm thời gian nghiên cứu.",
      name: "Nguyễn Hồng",

      avatar: avt2,
    },
    {
      feedback:
        "Tôi rất thích tính năng nhắn tin trên University Sharing, nó giúp tôi kết nối với bạn bè nhanh chóng!",
      name: "Luyến Kim",

      avatar: avt3,
    },
    {
      feedback:
        "Chia sẻ đồ dùng cá nhân trên nền tảng thật tiện lợi, tôi đã tìm được sách giáo trình cũ với giá rất rẻ.",
      name: "Hồ Ngọc Lam",

      avatar: avt4,
    },
    {
      feedback:
        "University Sharing đã giúp tôi tìm được bạn cùng phòng lý tưởng cho kỳ học mới. Rất tuyệt vời!",
      name: "Trịnh Thư Thư",

      avatar: avt5,
    },
    {
      feedback:
        "Tính năng thông báo thông minh giúp tôi không bỏ lỡ bất kỳ sự kiện quan trọng nào của trường.",
      name: "Ngô Nguyễn Đàm Lê ",

      avatar: avt6,
    },
    {
      feedback:
        "Tôi đã tham gia một câu lạc bộ mới nhờ gợi ý bài đăng trên University Sharing. Thật sự rất hữu ích!",
      name: "Nguyễn Dung",

      avatar: avt7,
    },
    {
      feedback:
        "Nền tảng bảo mật tốt, tôi cảm thấy yên tâm khi chia sẻ thông tin cá nhân và tài liệu học tập.",
      name: "Phan Lê",

      avatar: avt8,
    },
  ];

  const cardsPerPage = 3;
  const totalCards = testimonials.length;

  const handleNext = () => {
    setCurrentIndex((prevIndex) => {
      const newIndex = prevIndex + cardsPerPage;
      return newIndex >= totalCards ? 0 : newIndex;
    });
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => {
      const newIndex = prevIndex - cardsPerPage;
      return newIndex < 0 ? totalCards - cardsPerPage : newIndex;
    });
  };

  const displayedTestimonials = testimonials.slice(
    currentIndex,
    currentIndex + cardsPerPage
  );

  return (
    <div className="landing-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="gradient-overlay"></div>
        </div>
        <div className="hero-content">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="logo-container"
          >
            <div className="dtu-logo">
              <div className="logo-letters">
                <span className="letter-d">D</span>
                <span className="letter-t">T</span>
                <span className="letter-t">U</span>
              </div>
              <div className="logo-text">
                <div className="university-text">UNIVERSITY</div>
                <div className="sharing-text">SHARING</div>
              </div>
            </div>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hero-subtitle"
          >
            Nền tảng kết nối và chia sẻ dành cho sinh viên
            <br />
            <span className="highlight">Kết nối - Chia sẻ - Phát triển</span>
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hero-buttons"
          >
            <button onClick={() => navigate("/login")} className="btn-primary">
              Đăng nhập
            </button>
            <button
              onClick={() => navigate("/register")}
              className="btn-secondary"
            >
              Đăng ký ngay
            </button>
          </motion.div>
        </div>
        
        <div className="scroll-indicator">
          <span>Khám phá ngay</span>
          <div className="arrow-down"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <motion.h2 
            className="section-title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Tính năng nổi bật
          </motion.h2>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="feature-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <div className="feature-icon">
                  <span className="emoji">{feature.icon}</span>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <div className="feature-image">
                  <img src={feature.image} alt={feature.title} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <motion.h2 
            className="section-title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Sinh viên nói gì về chúng tôi
          </motion.h2>
          
          <div className="testimonials-container">
            <button className="arrow-btn prev-btn" onClick={handlePrev}>
              ‹
            </button>
            
            <div className="testimonials-grid">
              {displayedTestimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  className="testimonial-card"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="testimonial-content">
                    <p>"{testimonial.feedback}"</p>
                    <div className="testimonial-author">
                      <img src={testimonial.avatar} alt={testimonial.name} />
                      <div className="author-info">
                        <h4>{testimonial.name}</h4>
                        <span>Sinh viên</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <button className="arrow-btn next-btn" onClick={handleNext}>
              ›
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <motion.div 
            className="cta-content"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="cta-logo">
              <div className="logo-letters">
                <span className="letter-d">D</span>
                <span className="letter-t">T</span>
                <span className="letter-t">U</span>
              </div>
              <div className="logo-text">
                <div className="university-text">UNIVERSITY</div>
                <div className="sharing-text">SHARING</div>
              </div>
            </div>
            
            <h2>Bạn đã sẵn sàng trải nghiệm?</h2>
            <p>Tham gia ngay để kết nối với cộng đồng sinh viên</p>
            
            <div className="cta-buttons">
              <button
                onClick={() => navigate("/register")}
                className="btn-primary"
              >
                Đăng ký ngay
              </button>
              <button
                onClick={() => navigate("/about")}
                className="btn-outline"
              >
                Tìm hiểu thêm
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;