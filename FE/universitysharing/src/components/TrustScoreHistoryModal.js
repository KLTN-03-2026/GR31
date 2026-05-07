import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  FiAward,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiHelpCircle,
  FiX
} from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { fetchTrustScoreHistories } from "../stores/action/profileActions";
import "../styles/TrustScoreHistoryModal.scss";

const TrustScoreHistoryModal = ({ isOpen, onClose, refresh }) => {
  const dispatch = useDispatch();
  const { trustScoreHistories, loading, error, userProfile } = useSelector(
    (state) => state.users
  );
  const [expandedRecord, setExpandedRecord] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const observerTarget = useRef(null);
  const tooltipRef = useRef(null);
  const infoIconRef = useRef(null);

  // Tính toán vị trí tooltip
  const updateTooltipPosition = () => {
    if (infoIconRef.current) {
      const rect = infoIconRef.current.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left - 280,
        y: rect.bottom + 10
      });
    }
  };

  // Đóng tooltip khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        tooltipRef.current && 
        !tooltipRef.current.contains(event.target) &&
        infoIconRef.current &&
        !infoIconRef.current.contains(event.target)
      ) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener("mousedown", handleClickOutside);
      updateTooltipPosition();
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showTooltip]);

  // Cập nhật vị trí khi resize window
  useEffect(() => {
    const handleResize = () => {
      if (showTooltip) {
        updateTooltipPosition();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showTooltip]);

  // Load initial data
  useEffect(() => {
    if (isOpen && (!trustScoreHistories?.histories?.length || refresh)) {
      dispatch(fetchTrustScoreHistories());
    }
  }, [isOpen, dispatch, trustScoreHistories?.histories?.length, refresh]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !loading &&
          trustScoreHistories?.nextCursor
        ) {
          dispatch(fetchTrustScoreHistories(trustScoreHistories.nextCursor));
        }
      },
      { threshold: 1.0 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [dispatch, loading, trustScoreHistories?.nextCursor]);

  const toggleExpand = (index) => {
    setExpandedRecord(expandedRecord === index ? null : index);
  };

  const handleTooltipToggle = () => {
    if (!showTooltip) {
      updateTooltipPosition();
    }
    setShowTooltip(!showTooltip);
  };

  const formatDateTime = (timestamp) => {
    return new Date(timestamp).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Xác định level hiện tại dựa trên điểm số
  const getCurrentLevel = () => {
    const currentScore = userProfile?.trustScore || 0;
    
    if (currentScore >= 50) return { level: "Cao", color: "#28a745", description: "Bạn có đầy đủ quyền truy cập" };
    if (currentScore >= 30) return { level: "Khá", color: "#17a2b8", description: "Quyền truy cập mở rộng" };
    return { level: "Trung bình", color: "#ffc107", description: "Quyền truy cập cơ bản" };
  };

  const currentLevel = getCurrentLevel();
  const currentScore = userProfile?.trustScore || 0;

  const creditHistory = trustScoreHistories?.histories?.map((record) => ({
    id: record.id,
    timestamp: record.createdAt,
    change: record.scoreChange,
    reason: record.reason,
    newCreditScore: record.totalScoreAfterChange,
  })) || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-score-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
        >
          <motion.div
            className="modal-score-content"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-score-header">
              <h3>
                <FiAward className="header-score-icon" /> 
                Lịch sử điểm uy tín
                <div className="trust-score-info">
                  <FiHelpCircle 
                    ref={infoIconRef}
                    className="info-icon" 
                    onClick={handleTooltipToggle}
                  />
                </div>
              </h3>
              <button className="close-score-btn" onClick={onClose}>
                <FiX />
              </button>
            </div>
            
            <div className="modal-score-body">
              {error ? (
                <div className="error-state">Lỗi: {error}</div>
              ) : creditHistory.length > 0 ? (
                <>
                  <div className="credit-history-list">
                    {creditHistory.map((record, index) => (
                      <motion.div
                        key={record.id || index}
                        className={`history-record ${
                          expandedRecord === index ? "expanded" : ""
                        }`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <div
                          className="record-score-summary"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(index);
                          }}
                        >
                          <div className="record-info">
                            <div className="record-date">
                              <FiClock className="record-icon" />
                              <span>{formatDateTime(record.timestamp)}</span>
                            </div>
                            <div className="record-change">
                              <span
                                className={`change-amount ${
                                  record.change > 0 ? "positive" : "negative"
                                }`}
                              >
                                {record.change > 0
                                  ? `+${record.change}`
                                  : record.change}
                              </span>
                              <span className="change-label"> điểm</span>
                            </div>
                          </div>
                          <div className="expand-icon">
                            {expandedRecord === index ? (
                              <FiChevronUp />
                            ) : (
                              <FiChevronDown />
                            )}
                          </div>
                        </div>
                        {expandedRecord === index && (
                          <motion.div
                            className="record-details"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="detail-item">
                              <label>Lý do:</label>
                              <span>{record.reason}</span>
                            </div>
                            <div className="detail-item">
                              <label>Điểm sau cập nhật:</label>
                              <span>{record.newCreditScore} điểm</span>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                  <div ref={observerTarget} style={{ height: "10px" }} />
                  {loading && (
                    <div className="loading-state">Đang tải thêm...</div>
                  )}
                  {!trustScoreHistories?.nextCursor &&
                    creditHistory.length > 0 && (
                      <div className="end-of-list">Đã tải hết lịch sử</div>
                    )}
                </>
              ) : (
                <div className="empty-score-state">
                  <FiAward className="empty-icon" />
                  <p>Chưa có lịch sử cập nhật điểm uy tín</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Tooltip render outside modal content */}
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                ref={tooltipRef}
                className="trust-score-tooltip"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                style={{
                  left: `${tooltipPosition.x}px`,
                  top: `${tooltipPosition.y}px`,
                }}
              >
                <div className="tooltip-header">
                  <h4>Hệ thống điểm uy tín</h4>
                  <button 
                    className="close-tooltip"
                    onClick={() => setShowTooltip(false)}
                  >
                    <FiX />
                  </button>
                </div>
                
                {/* <div className="current-level">
                  <div className="level-text">Mức độ hiện tại: {currentLevel.level}</div>
                  <div className="level-score">({currentScore} điểm)</div>
                </div> */}
                
                <div className="level-system">
                  <div className="level-item">
                    <div className="level-range">0-30</div>
                    <div className="level-permissions">
                      • Tạo bài đăng, bình luận, chia sẻ, like
                    </div>
                  </div>
                  
                  <div className="level-item">
                    <div className="level-range">30-50</div>
                    <div className="level-permissions">
                      • Quản lý nhà trọ & bình luận về trọ<br/>
                      • Quản lý tài liệu & bình luận tài liệu
                    </div>
                  </div>
                  
                  <div className="level-item">
                    <div className="level-range">50+</div>
                    <div className="level-permissions">
                      • Quản lý chuyến đi & nhận xét chuyến đi
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TrustScoreHistoryModal;