import { useEffect, useState } from "react";
import { FiArrowLeft, FiTrash2 } from "react-icons/fi"; // Thêm icon thùng rác
import { useDispatch, useSelector } from "react-redux";
import {
  deleteConversation,
  fetchChatHistory,
  fetchConversations,
} from "../../stores/action/chatAIAction";
import "./ConversationList.scss";

// Component Modal đơn giản
const ConfirmationModal = ({ isOpen, onClose, onConfirm, message }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h4>Xác nhận xóa</h4>
        <p>{message}</p>
        <div className="modal-actions">
          <button onClick={onClose} className="btn-cancel">
            Hủy
          </button>
          <button onClick={onConfirm} className="btn-confirm">
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
};

const ConversationList = ({
  setConversationId,
  isOpen,
  onNewChat,
  toggleSidebar,
}) => {
  const dispatch = useDispatch();
  const { conversations, nextCursor, isLoading, error } = useSelector(
    (state) => state.chatAI
  );
  const [initialLoading, setInitialLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);

  useEffect(() => {
    dispatch(fetchConversations({ lastConversationId: null })).finally(() => {
      setInitialLoading(false);
    });
  }, [dispatch]);

  const handleLoadMore = () => {
    if (nextCursor && !isLoading) {
      dispatch(fetchConversations({ lastConversationId: nextCursor }));
    }
  };

  const handleConversationClick = (conversationId) => {
    console.log("[ConversationList] Clicking conversation:", conversationId);
    setConversationId(conversationId);
    dispatch(fetchChatHistory({ conversationId, lastMessageId: null }))
      .then((action) => {
        console.log(
          "[ConversationList] fetchChatHistory response:",
          action.payload
        );
      })
      .catch((error) => {
        console.error("[ConversationList] Error fetching chat history:", error);
      });
  };

  // Mở modal xác nhận
  const handleDeleteClick = (e, conversationId) => {
    e.stopPropagation(); // Ngăn không cho sự kiện click lan lên li
    setConversationToDelete(conversationId);
    setIsModalOpen(true);
  };

  // Đóng modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setConversationToDelete(null);
  };

  // Xác nhận xóa
  const handleConfirmDelete = () => {
    if (conversationToDelete) {
      dispatch(deleteConversation({ conversationId: conversationToDelete }))
        .then(() => {
            // Có thể thêm thông báo thành công ở đây nếu cần
            console.log("Xóa thành công!");
        })
        .catch((err) => {
            // Có thể thêm thông báo lỗi ở đây
            console.error("Lỗi khi xóa:", err);
        });
      handleCloseModal();
    }
  };

  return (
    <div className={`conversation-list ${isOpen ? "open" : ""}`}>
      <div className="conversation-header">
        <div className="return-chat" onClick={toggleSidebar}>
          <FiArrowLeft />
        </div>
        <h3>Lịch sử trò chuyện</h3>
        <button onClick={onNewChat} className="new-chat-btn">
          + Mới
        </button>
      </div>

      <div className="conversation-scroll">
        {initialLoading ? (
          <div className="loading-conversations">
            <div className="loading-spinner"></div>
            <span>Đang tải...</span>
          </div>
        ) : conversations.length > 0 ? (
          <ul>
            {conversations.map((conversation) => (
              <li
                key={conversation.conversationId}
                onClick={() =>
                  handleConversationClick(conversation.conversationId)
                }
                className="conversation-item"
              >
                <div className="conversation-info">
                   <div className="conversation-title">
                        {conversation.title || "Cuộc trò chuyện mới"}
                    </div>
                    <div className="conversation-preview">
                        {conversation.preview || "..."}
                    </div>
                </div>
                {/* Nút xóa */}
                <button
                  className="delete-btn"
                  onClick={(e) => handleDeleteClick(e, conversation.conversationId)}
                  title="Xóa cuộc trò chuyện"
                >
                  <FiTrash2 />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-conversations">Chưa có cuộc trò chuyện nào</div>
        )}

        {nextCursor && (
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="load-more-btn"
          >
            {isLoading ? "Đang tải..." : "Tải thêm"}
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Modal xác nhận */}
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        message="Bạn có chắc chắn muốn xóa cuộc trò chuyện này không? Hành động này không thể hoàn tác."
      />
    </div>
  );
};

export default ConversationList;