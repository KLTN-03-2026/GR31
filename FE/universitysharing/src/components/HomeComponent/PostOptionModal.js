import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import "../../styles/PostOptionModal.scss";
import EditModal from "../EditPostModal";
import ReportModal from "../ReportModal";

const PostOptionsModal = ({
  isOwner,
  onClose,
  position,
  postId,
  handleDeletePost,
  post,
}) => {
  const modalRef = useRef(null);
  const dispatch = useDispatch();
  const [isHidden, setIsHidden] = useState(false);
  const [isOpenEdit, setOpenEdit] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [adjustedPosition, setAdjustedPosition] = useState({ top: 0, left: 0 });

  const handleOpenEditModal = () => {
    setOpenEdit(true);
    setIsHidden(true);
  };

  const handleCloseEditModal = () => {
    setOpenEdit(false);
    onClose();
  };

  const handleOpenReportModal = () => {
    setIsReportModalOpen(true);
    setIsHidden(true);
  };

  const handleCloseReportModal = () => {
    setIsReportModalOpen(false);
    onClose();
  };

  // Điều chỉnh vị trí modal để không bị tràn ra ngoài màn hình
  useEffect(() => {
    if (position) {
      const modalWidth = 180; // Chiều rộng ước tính của modal
      const modalHeight = 120; // Chiều cao ước tính của modal
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedLeft = position.left;
      let adjustedTop = position.top;

      // Kiểm tra và điều chỉnh vị trí trái/phải
      if (position.left + modalWidth > viewportWidth) {
        adjustedLeft = viewportWidth - modalWidth - 10; // Cách lề phải 10px
      } else if (position.left < 10) {
        adjustedLeft = 10; // Cách lề trái 10px
      }

      // Kiểm tra và điều chỉnh vị trí trên/dưới
      if (position.top + modalHeight > viewportHeight) {
        adjustedTop = viewportHeight - modalHeight - 10; // Cách lề dưới 10px
      } else if (position.top < 10) {
        adjustedTop = 10; // Cách lề trên 10px
      }

      setAdjustedPosition({
        top: adjustedTop,
        left: adjustedLeft
      });
    }
  }, [position]);

  // Xử lý click outside để đóng modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Xử lý sự kiện scroll để đóng modal
  useEffect(() => {
    const handleScroll = () => {
      onClose();
    };

    window.addEventListener("scroll", handleScroll, true);
    
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [onClose]);

  // Xử lý sự kiện escape key
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [onClose]);

  return (
    <>
      {!isHidden && (
        <div className="modal-postOption-overlay">
          <div
            className="modal-postOption-content"
            onClick={(e) => e.stopPropagation()}
            ref={modalRef}
            style={{
              position: "fixed",
              top: `${adjustedPosition.top}px`,
              left: `${adjustedPosition.left}px`,
              zIndex: 10001
            }}
          >
            {isOwner ? (
              <>
                <p
                  className="option-item option-edit"
                  onClick={handleOpenEditModal}
                >
                  Chỉnh sửa bài viết
                </p>
                <p
                  className="option-item option-delete"
                  onClick={() => {
                    handleDeletePost(postId);
                    onClose();
                  }}
                >
                  Xóa bài viết
                </p>
              </>
            ) : (
              <p
                className="option-item option-report"
                onClick={handleOpenReportModal}
              >
                Báo cáo bài viết
              </p>
            )}
          </div>
        </div>
      )}
      
      {isOpenEdit && (
        <EditModal
          isOpen={isOpenEdit}
          postId={postId}
          post={post}
          onClose={handleCloseEditModal}
        />
      )}
      
      {isReportModalOpen && (
        <ReportModal postId={postId} onClose={handleCloseReportModal} />
      )}
    </>
  );
};

PostOptionsModal.propTypes = {
  isOwner: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  position: PropTypes.shape({
    top: PropTypes.number,
    left: PropTypes.number,
  }),
  postId: PropTypes.string,
  handleDeletePost: PropTypes.func,
  post: PropTypes.object,
};

export default PostOptionsModal;