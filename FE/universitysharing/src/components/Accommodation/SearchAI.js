// File: components/AccommodationComponent/SearchAI.js

import { useEffect, useRef, useState } from 'react';
import { FaMapMarkerAlt, FaPaperPlane, FaRobot, FaTimes, FaTrash } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { searchAccommodationByAI } from '../../stores/action/searchAccommodationByAI';
import { resetSearchAIState } from '../../stores/reducers/accommodationSearchAIReducer';
import '../../styles/Accommodation/SearchAI.scss';

const SearchAI = ({ mapInstance, onResultsUpdate }) => {
  const dispatch = useDispatch();
  const { answer, results, loading, error, success } = useSelector(
    (state) => state.accommodationSearchAI || {}
  );
  
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const chatContainerRef = useRef(null);

  // Sample questions for quick selection
  const sampleQuestions = [
    "Hiện có phòng trọ nào rẻ nhất và mắc nhất?",
    "Tìm phòng trọ giá dưới 2 triệu gần trường ĐH Bách Khoa",
    "Phòng trọ nào có đầy đủ tiện nghi wifi, điều hòa?",
    "Cho tôi xem các phòng trọ còn trống",
    "Phòng trọ nào có diện tích lớn nhất?"
  ];

  // Load chat history from sessionStorage on component mount
  useEffect(() => {
    const savedChatHistory = sessionStorage.getItem('aiChatHistory');
    if (savedChatHistory) {
      try {
        setChatHistory(JSON.parse(savedChatHistory));
      } catch (error) {
        console.error('Error loading chat history:', error);
        sessionStorage.removeItem('aiChatHistory');
      }
    }
  }, []);

  // Save chat history to sessionStorage whenever it changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      sessionStorage.setItem('aiChatHistory', JSON.stringify(chatHistory));
    }
  }, [chatHistory]);

  // Prevent body scroll when AI panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Auto-scroll to bottom when new messages appear
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, loading]);

  // Reset state when component closes
  useEffect(() => {
    if (!isOpen) {
      setShowAnswer(false);
      setQuestion('');
      dispatch(resetSearchAIState());
    }
  }, [isOpen, dispatch]);

  // Add new message to chat history when AI responds
  useEffect(() => {
    if (success && answer && question) {
      const newMessage = {
        id: Date.now(),
        type: 'ai',
        content: answer,
        results: results,
        timestamp: new Date().toLocaleTimeString('vi-VN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      };
      
      setChatHistory(prev => {
        const updatedHistory = [...prev, newMessage];
        return updatedHistory;
      });
      
      setShowAnswer(true);
    }
  }, [success, answer, results, question]);

  // Handle AI search submission
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!question.trim()) {
      toast.error('Vui lòng nhập câu hỏi');
      return;
    }

    // Add user message to chat history immediately
    const userMessage = {
      id: Date.now() - 1, // Ensure user message comes before AI response
      type: 'user',
      content: question.trim(),
      timestamp: new Date().toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };

    setChatHistory(prev => [...prev, userMessage]);
    setShowAnswer(false);

    try {
      await dispatch(searchAccommodationByAI({ question: question.trim() })).unwrap();
    } catch (error) {
      console.error('AI Search error:', error);
      // Add error message to chat history
      const errorMessage = {
        id: Date.now(),
        type: 'ai',
        content: 'Xin lỗi, tôi gặp sự cố khi tìm kiếm thông tin. Vui lòng thử lại sau.',
        results: [],
        timestamp: new Date().toLocaleTimeString('vi-VN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        isError: true
      };
      setChatHistory(prev => [...prev, errorMessage]);
      setShowAnswer(true);
    }
  };

  // Handle sample question click
  const handleSampleQuestion = (sampleQuestion) => {
    setQuestion(sampleQuestion);
  };

  // Fly to result location on map
  const handleFlyToLocation = (result) => {
    if (mapInstance && result.latitude && result.longitude) {
      mapInstance.flyTo({
        center: [result.longitude, result.latitude],
        zoom: 15,
        duration: 1000
      });
      // Đóng chat panel sau khi chọn vị trí để xem bản đồ rõ hơn
      setIsOpen(false);
    }
  };

  // Clear current search
  const handleClearSearch = () => {
    setShowAnswer(false);
    setQuestion('');
    dispatch(resetSearchAIState());
    if (onResultsUpdate) {
      onResultsUpdate([]);
    }
  };

  // Clear chat history
  const handleClearChatHistory = () => {
    setChatHistory([]);
    sessionStorage.removeItem('aiChatHistory');
    setShowAnswer(false);
    setQuestion('');
    dispatch(resetSearchAIState());
    toast.success('Đã xóa lịch sử trò chuyện');
  };

  // Update parent component with results
  useEffect(() => {
    if (success && results.length > 0 && onResultsUpdate) {
      onResultsUpdate(results);
    }
  }, [success, results, onResultsUpdate]);

  // Handle error
  useEffect(() => {
    if (error) {
      toast.error(`Lỗi tìm kiếm: ${error}`);
    }
  }, [error]);

  // Render chat messages
  const renderChatMessages = () => {
    if (chatHistory.length === 0 && !loading) {
      return (
        <div className="welcome-message">
          <p>🤖 Xin chào! Tôi là trợ lý AI tìm phòng trọ</p>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
            Tôi có thể giúp bạn tìm phòng trọ phù hợp nhất với nhu cầu
          </p>
          
          <ul>
            <li>🔍 Tìm phòng theo ngân sách và vị trí</li>
            <li>📊 So sánh giá cả và tiện nghi</li>
            <li>🎯 Gợi ý phòng trọ phù hợp với bạn</li>
            <li>📍 Tìm phòng gần trường học, công ty</li>
          </ul>
          
          <div className="sample-questions">
            <p>💡 Hỏi nhanh:</p>
            {sampleQuestions.map((q, index) => (
              <button
                key={index}
                className="sample-question"
                onClick={() => handleSampleQuestion(q)}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      );
    }

    return chatHistory.map((message) => (
      <div key={message.id} className={`message ${message.type}-message`}>
        {message.type === 'ai' && (
          <div className="message-avatar">
            <FaRobot />
          </div>
        )}
        <div className={`message-content ${message.isError ? 'error' : ''}`}>
          <div className="message-text">{message.content}</div>
          
          {message.timestamp && (
            <div className="message-time">
              {message.timestamp}
            </div>
          )}
          
          {/* Results List for AI messages */}
          {message.type === 'ai' && message.results && message.results.length > 0 && (
            <div className="results-list">
              <div className="results-header">
                📍 Tìm thấy {message.results.length} phòng phù hợp
              </div>
              {message.results.map((result, index) => (
                <div key={result.id || index} className="result-item">
                  <div className="result-info">
                    <div className="result-price">
                      {result.price?.toLocaleString()} ₫
                    </div>
                    <div className="result-address">
                      {result.address || 'Đang cập nhật địa chỉ'}
                    </div>
                    <div className="result-status">
                      {result.status === 'Available' ? '🟢 Còn trống' : 
                       result.status === 'Rented' ? '🟠 Đã thuê' : '⚫ Ẩn'}
                    </div>
                  </div>
                  <button
                    className="location-button"
                    onClick={() => handleFlyToLocation(result)}
                    title="Xem vị trí trên bản đồ"
                  >
                    <FaMapMarkerAlt />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    ));
  };

  return (
    <div className="search-ai-container">
      {/* Answer Bubble */}
      {showAnswer && answer && !isOpen && (
        <div className="ai-answer-bubble">
          <div className="bubble-content">
            <div className="bubble-text">{answer}</div>
            <button 
              className="bubble-close" 
              onClick={handleClearSearch}
              title="Đóng câu trả lời"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      )}

      {/* AI Chat Button */}
      <button 
        className={`ai-chat-button ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Tìm kiếm thông minh với AI"
      >
        <FaRobot className="ai-icon" />
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="ai-chat-panel">
          <div className="chat-header">
            <h3>
              <FaRobot className="header-icon" />
              Trợ lý tìm trọ
              {chatHistory.length > 0 && (
                <span style={{ 
                  fontSize: '12px', 
                  color: '#666', 
                  marginLeft: '8px',
                  fontWeight: 'normal'
                }}>
                  ({chatHistory.length} tin nhắn)
                </span>
              )}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {chatHistory.length > 0 && (
                <button 
                  className="clear-history-button"
                  onClick={handleClearChatHistory}
                  title="Xóa lịch sử trò chuyện"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#666',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <FaTrash size={14} />
                </button>
              )}
              <button 
                className="close-panel"
                onClick={() => setIsOpen(false)}
                title="Đóng trợ lý AI"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          <div className="chat-content" ref={chatContainerRef}>
            {/* Render chat messages */}
            {renderChatMessages()}

            {/* Loading State */}
            {loading && (
              <div className="message ai-message">
                <div className="message-avatar">
                  <FaRobot />
                </div>
                <div className="message-content loading">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  Đang phân tích và tìm kiếm thông tin phù hợp nhất cho bạn...
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <form className="chat-input-area" onSubmit={handleSearch}>
            <div className="input-container">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Nhập câu hỏi về phòng trọ..."
                disabled={loading}
                className="chat-input"
              />
              <button 
                type="submit" 
                disabled={loading || !question.trim()}
                className="send-button"
                title="Gửi câu hỏi"
              >
                <FaPaperPlane />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SearchAI;