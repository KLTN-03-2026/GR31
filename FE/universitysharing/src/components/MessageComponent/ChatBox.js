import EmojiPicker from 'emoji-picker-react';
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaEllipsisV,
  FaMicrophone,
  FaPaperclip,
  FaPhone,
  FaSearch,
  FaSmile,
  FaTimes,
  FaVideo,
} from "react-icons/fa";
import { FiSend } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import avatarDefault from "../../assets/AvatarDefault.png";
import { getMessagess } from "../../stores/action/messageAction";
import "../../styles/MessageView/ChatBox.scss";
import "../../styles/MoblieReponsive/ChatBoxMobile/chatBoxMoblie.scss";
import getUserIdFromToken from "../../utils/JwtDecode";
import { useChatHandle, useTypingReceiver } from "../../utils/MesengerHandle";

const TYPING_INTERVAL = 3000;

const ChatBox = ({
  conversationId,
  messenger,
  onClose,
  selectFriend,
  messengerState,
  isUserTyping,
  setIsUserTyping,
  newMessage,
  setNewMessage,
  isSending,
  setIsSending,
  handleSendMessage,
  friendId,
}) => {
  const dispatch = useDispatch();
  const { handleTyping } = useChatHandle();
  const typingTimeoutRef = useRef(null);
  const lastTypingTimeRef = useRef(0);
  const currentUserID = getUserIdFromToken();

  const [isMinimized, setIsMinimized] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);
  const textareaRef = useRef(null);
  const formRef = useRef(null);
  
  const reversedMessages = [...messenger].reverse();

  // Hàm xử lý gửi tin nhắn
  const handleSubmitMessage = useCallback((e) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!newMessage.trim() || isSending) return;

    // Tự động chuyển đổi emoji text trước khi gửi
    const processedMessage = renderMessageWithEmojis(newMessage);
    
    handleSendMessage({
      friendId: selectFriend?.friendId,
      content: processedMessage,
      conversationId: messengerState?.conversationId,
      token: localStorage.getItem("token"),
      isSending,
      setIsSending,
      setNewMessage,
      setIsUserTyping,
    });
  }, [newMessage, isSending, selectFriend, messengerState, handleSendMessage, setIsSending, setNewMessage, setIsUserTyping]);

  // Hàm xử lý phím trong textarea
  const handleKeyDown = useCallback((e) => {
    // Enter mà không có Shift => gửi tin nhắn
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Ngăn xuống dòng
      handleSubmitMessage(e);
    }
    // Shift + Enter => xuống dòng (mặc định behavior)
  }, [handleSubmitMessage]);

  // Hàm chuyển đổi text emoji thành icon
  const renderMessageWithEmojis = (text) => {
    if (!text) return '';
    
    const emojiMap = {
      ':)': '😊',
      ':-)': '😊',
      ':(': '😞',
      ':-(': '😞',
      ':D': '😃',
      ':-D': '😃',
      ';)': '😉',
      ';-)': '😉',
      ':P': '😛',
      ':-P': '😛',
      ':O': '😮',
      ':-O': '😮',
      ':*': '😘',
      ':-*': '😘',
      '<3': '❤️',
      ':heart:': '❤️',
      ':like:': '👍',
      ':thumbsup:': '👍',
      ':fire:': '🔥',
      ':laughing:': '😂',
      ':cry:': '😢',
      ':angry:': '😠',
      ':+1:': '👍',
      ':-1:': '👎',
    };

    let processedText = text;
    
    Object.keys(emojiMap).forEach(key => {
      const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      processedText = processedText.replace(regex, emojiMap[key]);
    });

    return processedText;
  };

  const handleEmojiClick = (emojiData) => {
    const startPos = textareaRef.current.selectionStart;
    const endPos = textareaRef.current.selectionEnd;
    const currentMessage = newMessage;
    
    const newText = currentMessage.substring(0, startPos) + 
                   emojiData.emoji + 
                   currentMessage.substring(endPos);
    
    setNewMessage(newText);
    
    setTimeout(() => {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        startPos + emojiData.emoji.length,
        startPos + emojiData.emoji.length
      );
    }, 0);
  };

  const handleInputChange = useCallback(
    (e) => {
      const newMessage = e.target.value;
      setNewMessage(newMessage);
      handleTyping(e, {
        conversationId,
        friendId,
        currentUserID,
        setNewMessage: setNewMessage,
        setIsUserTyping,
        lastTypingTimeRef,
        TYPING_INTERVAL,
      });
      setIsUserTyping(true);
    },
    [
      conversationId,
      friendId,
      currentUserID,
      setNewMessage,
      setIsUserTyping,
      handleTyping,
    ]
  );

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [newMessage, adjustTextareaHeight]);

  // Xử lý click outside để đóng emoji picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target) &&
        !event.target.closest(".emoji-btn")
      ) {
        setShowEmojiPicker(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Lấy thêm tin nhắn khi scroll
  const topRef = useRef(null);
  const observer = useRef(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (!topRef.current || !messengerState.nextCursor) return;

    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && messengerState?.nextCursor) {
          const token = localStorage.getItem("token");
          dispatch(
            getMessagess({
              conversationId: messengerState.conversationId,
              token,
              nextCursor: messengerState.nextCursor,
              pageSize: 20,
              append: true,
            })
          );
        }
      },
      {
        root: document.querySelector(".chat-messagess"),
        threshold: 1.0,
      }
    );

    observer.current.observe(topRef.current);
    return () => observer.current?.disconnect();
  }, [messengerState?.nextCursor, messengerState?.conversationId]);

  // Lấy trạng thái typing từ Redux
  useTypingReceiver(selectFriend?.friendId, conversationId);
  const typingUserId = useSelector((state) => state.typing[conversationId]);
  const isSelfTyping = typingUserId === currentUserID;
  const isFriendTyping = typingUserId === selectFriend?.friendId;

  return (
    <div className={`chat-box ${isMinimized ? "minimized" : ""}`}>
      <div className="chat-header" onClick={() => setIsMinimized(!isMinimized)}>
        <div className="user-info">
          <img
            src={selectFriend?.pictureProfile || avatarDefault}
            alt="Friend"
          />
          <span className="sort-name-friendly">
            {selectFriend?.fullName || "University Sharing"}
          </span>
          <span className="status-dot online"></span>
        </div>
        <div className="header-actions">
          <button className="action-btn">
            <FaVideo />
          </button>
          <button className="action-btn">
            <FaPhone />
          </button>
          <button className="action-btn">
            <FaSearch />
          </button>
          <button className="action-btn">
            <FaEllipsisV />
          </button>
          <button
            className="action-btn close-btn"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <FaTimes />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="chat-messagess" ref={scrollContainerRef}>
            {isFriendTyping && (
              <div className="message them typing">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            {isSelfTyping && (
              <div className="message me typing">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            {reversedMessages.map((msg) => {
              const isMe = msg.senderId === currentUserID;
              const messageContent = renderMessageWithEmojis(msg.content);
              
              return (
                <div key={msg.id} className={`message ${isMe ? "me" : "them"}`}>
                  <div className="message-content">
                    <p dangerouslySetInnerHTML={{ __html: messageContent }}></p>
                    <span className="message-time">
                      {new Date(msg.sentAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {isMe && (
                      <span className={`status ${msg.status?.toLowerCase()}`}>
                        {msg.status === "Sent"
                          ? "Đã gửi"
                          : msg.status === "Seen"
                          ? "Đã xem"
                          : ""}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={topRef} style={{ height: "1px" }} />
          </div>

          <form
            ref={formRef}
            className="message-input"
            onSubmit={handleSubmitMessage}
          >
            <div className="input-tools">
              <button type="button" className="tool-btn">
                <FaPaperclip />
              </button>
              <button
                type="button"
                className="tool-btn emoji-btn"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <FaSmile />
              </button>
            </div>

            {showEmojiPicker && (
              <div className="emoji-picker-container" ref={emojiPickerRef}>
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  searchDisabled={true}
                  skinTonesDisabled={true}
                  height={350}
                  width={300}
                  previewConfig={{
                    showPreview: false
                  }}
                />
              </div>
            )}

            <textarea
              ref={textareaRef}
              placeholder="Nhập vào tin nhắn..."
              rows="1"
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowEmojiPicker(false)}
            />

            <button 
              type="submit" 
              className={`send-btn ${newMessage.trim() ? 'active' : ''}`}
              disabled={isSending || !newMessage.trim()}
            >
              {newMessage.trim() ? <FiSend /> : <FaMicrophone />}
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default ChatBox;