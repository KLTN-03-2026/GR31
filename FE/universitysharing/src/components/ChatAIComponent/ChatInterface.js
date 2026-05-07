import 'highlight.js/styles/atom-one-light.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Menu, Mic, Plus, RefreshCw, Send, StopCircle } from 'react-feather';
import ReactMarkdown from 'react-markdown';
import { useDispatch, useSelector } from 'react-redux';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { useSignalR } from '../../Service/SignalRProvider';
import axiosClient from '../../Service/axiosClient';
import { useAuth } from '../../contexts/AuthContext';
import { confirmAction, fetchChatHistory, sendQuery, stopAction } from '../../stores/action/chatAIAction';
import './ChatInterface.scss';
import ConfirmationModal from './ConfirmationModal';
// Danh sách tin nhắn thành công ngẫu nhiên cho từng endpoint
const successMessages = {
  '/api/Post/create': [
    'Xong rồi, mình đã đăng bài viết cho bạn! 😄\n**Chi tiết bài đăng:**',
    'Bài đăng của bạn đã lên sóng, tha hồ nhận tương tác nè! 🎉\n**Chi tiết bài đăng:**',
    'Đã đăng bài thành công, bạn đúng là ngôi sao! 🌟\n**Chi tiết bài đăng:**',
  ],
  '/api/Post/update-post': [
    'Bài viết đã được cập nhật, nhìn xịn hơn rồi nè! 😎\n**Chi tiết bài đăng:**',
    'Ok, bài đăng đã được chỉnh sửa xong xuôi! 🎉\n**Chi tiết bài đăng:**',
    'Cập nhật bài viết thành công, bạn pro ghê! 😄\n**Chi tiết bài đăng:**',
  ],
  '/api/Post/delete': [
    'Bài viết đã bị xóa, gọn gàng rồi nha! 🗑️',
    'Xóa bài viết xong, nhẹ cả người ha! 😌',
    'Ok, bài viết đã biến mất không dấu vết! 🕵️',
  ],
  '/api/Comment/CommentPost': [
    'Bình luận của bạn đã được đăng, hot hòn họt! 🔥\n**Chi tiết bình luận:**',
    'Xong, mình đã thêm bình luận cho bạn nè! 😎\n**Chi tiết bình luận:**',
    'Bình luận đã lên bài, mọi người sắp đọc rồi! 😄\n**Chi tiết bình luận:**',
  ],
  '/api/Comment/ReplyComment': [
    'Trả lời bình luận đã được gửi, bạn đúng là nhanh tay! 😎\n**Chi tiết trả lời:**',
    'Xong, mình đã đăng câu trả lời cho bạn! 🎉\n**Chi tiết trả lời:**',
    'Ok, trả lời bình luận đã lên bài! 😄\n**Chi tiết trả lời:**',
  ],
  '/api/Comment/UpdateComment': [
    'Bình luận đã được sửa, giờ ổn áp rồi nha! 😊\n**Chi tiết bình luận:**',
    'Xong, mình đã cập nhật bình luận cho bạn! 🎊\n**Chi tiết bình luận:**',
    'Ok, bình luận đã được chỉnh sửa, chuẩn luôn! 👍\n**Chi tiết bình luận:**',
  ],
  '/api/Comment/DeleteComment': [
    'Bình luận đã bị xóa, gọn như chưa từng có! 😶',
    'Xong, mình đã dọn dẹp bình luận cho bạn rồi! 🧹',
    'Bình luận biến mất rồi, sạch sẽ quá trời! 🚫',
  ],
  '/api/UserProfile/upProfile': [
    'Hồ sơ của bạn đã được cập nhật, nhìn cool hơn rồi! 😎\n**Chi tiết hồ sơ:**',
    'Xong, thông tin cá nhân đã được làm mới! 🌟\n**Chi tiết hồ sơ:**',
    'Ok, hồ sơ đã được chỉnh sửa, tuyệt vời! 🎉\n**Chi tiết hồ sơ:**',
  ],
  '/api/UserProfile/upInformation': [
    'Thông tin cá nhân đã được cập nhật, bạn nổi bật hơn rồi! 😄\n**Chi tiết thông tin:**',
    'Xong, thông tin của bạn đã được làm mới! 🌟\n**Chi tiết thông tin:**',
    'Ok, thông tin đã được chỉnh sửa, quá chất! 🎉\n**Chi tiết thông tin:**',
  ],
  '/api/Like/like': [
    'Thả tim thành công, bài viết thêm hot! ❤️',
    'Xong, mình đã like bài viết cho bạn nè! 😄',
    'Like đã được gửi, bạn đúng là fan số 1! 🔥',
  ],
  '/api/Like/unlike': [
    'Đã hủy thả tim, chắc bạn đổi ý nhỉ? 😢',
    'Ok, mình đã gỡ like khỏi bài viết! 👍',
    'Không còn like nữa, gọn gàng ha! 💔',
  ],
  '/api/CommentLike/like': [
    'Like bình luận xong, bạn đúng là fan số 1! 😍',
    'Xong, mình đã thả tim cho bình luận nè! 😊',
    'Ok, đã like bình luận cho bạn! 🎉',
  ],
  '/api/FriendShip/send-friend-request': [
    'Lời mời kết bạn đã được gửi, chờ hồi âm nha! 😄',
    'Xong, mình đã gửi yêu cầu kết bạn cho bạn! 🌟',
    'Yêu cầu kết bạn đã bay đi, sắp có bạn mới! 🚀',
  ],
  '/api/Share/SharePost': [
    'Bài viết đã được chia sẻ, lan tỏa ngay thôi! 📢',
    'Xong, mình đã share bài viết cho bạn nè! 😄',
    'Ok, bài viết đã được chia sẻ, hot lắm nha! 🔥',
  ],
  '/api/Ride/create': [
    'Chuyến đi đã được tạo, sẵn sàng lên xe thôi! 🚗\n**Chi tiết chuyến đi:**',
    'Xong, mình đã tạo chuyến đi cho bạn nè! 😄\n**Chi tiết chuyến đi:**',
    'Ok, chuyến đi đã được xác nhận, quá tuyệt! 🎉\n**Chi tiết chuyến đi:**',
  ],
  'default': [
    'Hành động đã hoàn tất, bạn đỉnh thật! 😄',
    'Xong xuôi hết rồi, mình làm tốt chứ? 😎',
    'Ok, mọi thứ đã được xử lý ngon lành! 🎉',
  ],
};
const paramDisplayMap = {
  '/api/Post/create': {
    Content: 'Nội dung bài đăng',
    Scope: 'Phạm vi bài đăng',
  },
  '/api/Post/update-post': {
    PostId: 'ID bài đăng',
    Content: 'Nội dung bài đăng',
    Scope: 'Phạm vi bài đăng',
  },
  '/api/Ride/create': {
    DriverId: 'ID Tài xế',
    RidePostId: 'ID bài đăng',
    IsSafetyTrackingEnabled: 'Chế độ an toàn',
  },
  '/api/Comment/CommentPost': {
    PostId: 'ID bài đăng',
    Content: 'Nội dung bình luận',
  },
  '/api/Comment/ReplyComment': {
    PostId: 'ID bài đăng',
    ParentCommentId: 'ID bình luận cha',
    Content: 'Nội dung trả lời',
  },
  '/api/Like/like': {
    PostId: 'ID bài đăng',
  },
  '/api/CommentLike/like': {
    CommentId: 'ID bình luận',
  },
  '/api/FriendShip/send-friend-request': {
    FriendId: 'ID bạn bè',
  },
  '/api/Share/SharePost': {
    PostId: 'ID bài đăng',
    Content: 'Nội dung chia sẻ',
  },
  '/api/UserProfile/upProfile': {
    FullName: 'Họ và tên',
    ProfileImage: 'Ảnh đại diện',
    BackgroundImage: 'Ảnh bìa',
    Bio: 'Tiểu sử',
    PhoneNumber: 'Số điện thoại',
    PhoneRelativeNumber: 'Số điện thoại người thân',
  },
  '/api/UserProfile/upInformation': {
    PhoneNumber: 'Số điện thoại',
    PhoneRelativeNumber: 'Số điện thoại người thân',
    Gender: 'Giới tính',
  },
};
const scopeOptions = [
  { value: 0, label: 'Công khai' },
  { value: 1, label: 'Bạn bè' },
  { value: 2, label: 'Riêng tư' },
];

const genderOptions = [
  { value: 'Male', label: 'Nam' },
  { value: 'Female', label: 'Nữ' },
  { value: 'Other', label: 'Khác' },
];

const isSafeOptions = [
  { value: true, label: 'Đồng ý' },
  { value: false, label: 'Không đồng ý' },
];
// Hàm tiền xử lý markdown
const preprocessMarkdown = (text) => {
  return text.replace(/^\*(\S)/gm, '* $1').replace(/^\*\*(\S)/gm, '** $1');
};

// Sửa hàm convertLinksToMarkdown
// Sửa hàm convertLinksToMarkdown
const convertLinksToMarkdown = (content) => {
  if (!content) return content;

  let tempContent = content;

  // 1. Chuyển đổi các hyperlink có URL hình ảnh từ server cụ thể thành cú pháp hình ảnh
  // Ví dụ: [https://universharing-web-app-gaereaceg0drc5e3.southeastasia-01.azurewebsites.net/images/profile/avatar/abc.jpg](https://...)
  // Hoặc: [một văn bản bất kỳ](https://universharing-web-app-gaereaceg0drc5e3.southeastasia-01.azurewebsites.net/images/...)
  // Alt text sẽ là phần trong dấu ngoặc vuông []
  tempContent = tempContent.replace(
    /\[(.*?)\]\((https?:\/\/(?:universharing-web-app-gaereaceg0drc5e3\.southeastasia-01\.azurewebsites\.net\/images\/[^\s)]+\.(?:jpg|jpeg|png|gif|webp)))\)/gi,
    (match, p1, p2) => {
      // p1 là nội dung trong [] (có thể là URL hoặc alt text)
      // p2 là URL hình ảnh thực sự
      const altText = p1 && p1.startsWith('http') ? 'Image' : p1; // Sử dụng 'Image' nếu alt text là URL, hoặc giữ nguyên
      return `![${altText}](${p2})`;
    }
  );

  // 2. Chuyển đổi các URL hình ảnh trần (không có trong []) thành cú pháp hình ảnh
  // Ví dụ: https://universharing-web-app-gaereaceg0drc5e3.southeastasia-01.azurewebsites.net/images/.../abc.jpg
  // Đảm bảo không bắt các URL đã là một phần của cú pháp Markdown hợp lệ (ví dụ: ![alt](url) hoặc [text](url))
  tempContent = tempContent.replace(
    /(?<![!(\]])(https?:\/\/(?:universharing-web-app-gaereaceg0drc5e3\.southeastasia-01\.azurewebsites\.net\/images\/[^\s)]+\.(?:jpg|jpeg|png|gif|webp)))(?![\])])/gi,
    '![]($1)' // Alt text để trống hoặc bạn có thể thêm logic để tự động tạo
  );

  // 3. Xử lý các trường hợp link ảnh bìa/ảnh đại diện được trả về dưới dạng list item với label
  // Ví dụ: * **Ảnh đại diện:** [https://universharing-web-app-gaereaceg0drc5e3.southeastasia-01.azurewebsites.net/images/profile/avatar/a7489f28-cefc-4e92-b1f5-a0fbafcaeea7.jpg](https://universharing-web-app-gaereaceg0drc5e3.southeastasia-01.azurewebsites.net/images/profile/avatar/a7489f28-cefc-4e92-b1f5-a0fbafcaeea7.jpg)
  tempContent = tempContent.replace(
    /(\*\s*\*\*Ảnh (đại diện|bìa):\*\*)\s*\[(.*?)\]\((https?:\/\/(?:universharing-web-app-gaereaceg0drc5e3\.southeastasia-01\.azurewebsites\.net\/images\/profile\/(?:avatar|background)\/[^\s)]+\.(?:jpg|jpeg|png|gif|webp)))\)/gi,
    (match, label, type, textPart, imageUrl) => {
      // Giữ lại label (Ảnh đại diện/bìa) nhưng thêm ảnh sau đó
      const altText = textPart && textPart.startsWith('http') ? type : textPart;
      return `${label} ![](${imageUrl})`; // Đặt ảnh sau label
    }
  );


  // Cuối cùng, nếu server trả về cụm từ "Link ảnh:"
  // Regex này sẽ thay thế "Link ảnh: URL" bằng cú pháp hình ảnh.
  // Đảm bảo nó không bị trùng lặp với các xử lý trên
  tempContent = tempContent.replace(
    /Link ảnh: ?[`"]?(\S+?\.(?:jpg|jpeg|png|gif|webp))[`"]?/gi,
    '![]($1)'
  );


  return tempContent;
};

const ChatInterface = ({ conversationId, setConversationId, toggleSidebar, onNewChat }) => {
  const dispatch = useDispatch();
  const { userId } = useAuth();
  const { signalRService, isConnected } = useSignalR();
  const { currentConversation, isLoading, error, chatHistory, currentConversationId } = useSelector((state) => state.chatAI);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [isWaitingResponse, setIsWaitingResponse] = useState(false);
  const [currentStreamId, setCurrentStreamId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chunkBufferRef = useRef('');
  const pendingChunksRef = useRef({});
  const processedChunks = useRef(new Set());
  const pendingMessageRef = useRef(null); // Lưu tin nhắn AI tạm thời
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const speechRecognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const queryAtMicStartRef = useRef('');
  const [failedMessage, setFailedMessage] = useState(null); // Lưu query thất bại để gửi lại
  const [timeoutId, setTimeoutId] = useState(null); // Lưu ID của timeout
  const [retryQuery, setRetryQuery] = useState(null);
  const startSilenceTimer = useCallback(() => {
    clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      if (speechRecognitionRef.current && isListening) { // Kiểm tra isListening để tránh gọi stop không cần thiết
        console.log('[SpeechRecognition] Silence timeout (3s). Stopping recognition.');
        speechRecognitionRef.current.stop(); // Sẽ trigger onend, và onend sẽ set isListening = false
      }
    }, 3000); // 3 giây
  }, [isListening]);
  useEffect(() => {
    console.log('[SpeechRecognition] useEffect setup running...');
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
  
    let recognitionInstance = null; // ✅ Đưa ra ngoài để dùng được trong cleanup
  
    if (SpeechRecognitionAPI) {
      console.log('[SpeechRecognition] Web Speech API is available.');
      recognitionInstance = new SpeechRecognitionAPI();
      speechRecognitionRef.current = recognitionInstance;
  
      recognitionInstance.continuous = true;
      recognitionInstance.lang = 'vi-VN';
      recognitionInstance.interimResults = true;
  
      recognitionInstance.onstart = () => {
        console.log('[SpeechRecognition] onstart: Recognition service has started.');
        startSilenceTimer();
      };
  
      recognitionInstance.onresult = (event) => {
        console.log('[SpeechRecognition] onresult event triggered.');
        startSilenceTimer();
  
        let interim_transcript = '';
        let final_transcript = queryAtMicStartRef.current;
  
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript_segment = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final_transcript += transcript_segment;
            queryAtMicStartRef.current = final_transcript;
          } else {
            interim_transcript += transcript_segment;
          }
        }
  
        setQuery(final_transcript + interim_transcript);
        console.log(`[SpeechRecognition] Interim/Final. Query set to: "${final_transcript + interim_transcript}"`);
      };
  
      recognitionInstance.onerror = (event) => {
        console.error('[SpeechRecognition] onerror event:', event.error);
        clearTimeout(silenceTimerRef.current);
        let errorMessage = `Lỗi nhận dạng giọng nói: ${event.error}`;
        if (event.error === 'no-speech') {
           errorMessage = 'Không nhận diện được giọng nói ban đầu.';
        } else if (event.error === 'audio-capture') {
           errorMessage = 'Lỗi micro. Vui lòng kiểm tra micro của bạn.';
        } else if (event.error === 'not-allowed') {
           errorMessage = 'Bạn đã không cấp quyền sử dụng micro.';
        }
        if (event.error !== 'no-speech') {
           alert(errorMessage);
        }
      };
  
      recognitionInstance.onend = () => {
        console.log('[SpeechRecognition] onend: Recognition service disconnected.');
        clearTimeout(silenceTimerRef.current);
        setIsListening(false);
        queryAtMicStartRef.current = "";
      };
    } else {
      console.warn('[SpeechRecognition] Trình duyệt này không hỗ trợ Web Speech API.');
      alert('Trình duyệt của bạn không hỗ trợ tính năng nhận dạng giọng nói.');
    }
  
    return () => {
      console.log('[SpeechRecognition] useEffect cleanup: Stopping recognition.');
      clearTimeout(silenceTimerRef.current);
      if (recognitionInstance) {
        recognitionInstance.onstart = null;
        recognitionInstance.onresult = null;
        recognitionInstance.onerror = null;
        recognitionInstance.onend = null;
        recognitionInstance.stop();
      }
    };
  }, []);
  

  const handleToggleListening = () => {
    if (!speechRecognitionRef.current) {
      alert('Tính năng nhận dạng giọng nói chưa sẵn sàng.');
      return;
    }
  
    if (isListening) {
      console.log('[SpeechControls] User stopping listening.');
      clearTimeout(silenceTimerRef.current);
      try {
        speechRecognitionRef.current.stop(); // sẽ gọi onend
      } catch (e) {
        console.error('[SpeechControls] Error stopping mic:', e);
      }
    } else {
      console.log('[SpeechControls] User starting listening.');
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
          console.log('[SpeechControls] Microphone permission granted.');
          queryAtMicStartRef.current = query;
          try {
            speechRecognitionRef.current.start();
            setIsListening(true); // ✅ Cho nút chuyển ngay
          } catch (e) {
            console.error('[SpeechControls] Error calling .start():', e);
            setIsListening(false);
            alert('Không thể bật mic. Có thể trình duyệt đang ghi âm hoặc chưa hỗ trợ.');
          }
        })
        .catch(err => {
          console.error('[SpeechControls] Cannot access microphone:', err);
          alert('Không thể truy cập micro. Vui lòng kiểm tra quyền truy cập.');
          setIsListening(false);
        });
    }
  };
  
  useEffect(() => {
    const hasModal = messages.some((msg) => msg.isConfirmationModal);
    setIsModalOpen(hasModal);
  }, [messages]);
  // Đồng bộ messages với chatHistory từ Redux
  useEffect(() => {
    console.log('[useEffect] Triggered. conversationId:', conversationId, 'currentConversationId:', currentConversationId, 'chatHistory:', chatHistory, 'isWaitingResponse:', isWaitingResponse);
  
    if (conversationId && chatHistory && chatHistory.length > 0 && !isWaitingResponse) {
      console.log('[useEffect] Syncing chatHistory with messages for conversationId:', conversationId);
  
      setMessages((prevMessages) => {
        console.log('[useEffect] Previous messages:', prevMessages);
  
        // Lọc tin nhắn thuộc conversationId hiện tại hoặc tin nhắn tạm thời
        const updatedMessages = prevMessages.filter((msg) => {
          const isCurrentConversation = msg.conversationId === conversationId;
          // Giữ tin nhắn tạm thời ngay cả khi currentStreamId là null
          const isTempMessage = msg.tempConversationId && (msg.tempConversationId === currentStreamId || currentStreamId === null);
          const shouldKeep = isCurrentConversation || isTempMessage || msg.id.startsWith('confirmation-');
          console.log('[useEffect] Keeping message:', msg, 'Keep:', shouldKeep);
          return shouldKeep;
        });
  
        const existingMessageIds = new Set(updatedMessages.map((msg) => msg.id));
  
        const filteredHistory = chatHistory
          .filter((history) => {
            const shouldInclude = (
              //history.answer !== 'Hành động đang thực thi' &&
              !history.isConfirmationModal &&
              !existingMessageIds.has(`user-${history.id}`) &&
              !existingMessageIds.has(`ai-${history.id}`) &&
              !existingMessageIds.has(`ai-confirm-${history.id}`)
            );
            console.log('[useEffect] Filtering history item:', history, 'Include:', shouldInclude);
            return shouldInclude;
          })
          .map((history) => [
            {
              id: `user-${history.id}`,
              content: history.query,
              isUser: true,
              isStreaming: false,
              showDots: false,
              timestamp: history.timestamp,
              conversationId, // Gắn conversationId
            },
            {
              id: `ai-${history.id}`,
              content: history.answer,
              isUser: false,
              isStreaming: false,
              showDots: false,
              timestamp: history.timestamp,
              conversationId, // Gắn conversationId
            },
          ])
          .flat();
  
        console.log('[useEffect] Filtered history:', filteredHistory);
  
        // Kết hợp và sắp xếp theo timestamp
        return [...updatedMessages, ...filteredHistory].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      });
    } else if (!conversationId && !isWaitingResponse) {
      console.log('[useEffect] Resetting messages for new conversation');
      setMessages([]);
    } else {
      console.log('[useEffect] Keeping current messages, no sync needed');
    }
  }, [conversationId, chatHistory, currentConversationId, isWaitingResponse, currentStreamId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset messages only when starting a new conversation
  useEffect(() => {
    if (!conversationId && !isWaitingResponse && !currentStreamId) {
      console.log('[ChatInterface] Resetting state for new conversation');
      inputRef.current?.focus();
      setMessages([]);
      setCurrentStreamId(null);
      chunkBufferRef.current = '';
      pendingChunksRef.current = {};
      pendingMessageRef.current = null;
    }
  }, [conversationId, isWaitingResponse, currentStreamId]);

  // Setup SignalR listeners
  useEffect(() => {
    if (!isConnected || !signalRService) {
      console.log('[ChatInterface] SignalR not connected, skipping listener setup');
      return;
    }

    console.log('[ChatInterface] Setting up SignalR listeners');
    const handleChunk = (chunk, streamId) => {
      console.log('[handleChunk] Received chunk:', chunk, 'StreamId:', streamId);
    
      const chunkKey = `${streamId}-${chunk}`;
      if (processedChunks.current.has(chunkKey)) {
        console.log(`[handleChunk] Skipping duplicate chunk for streamId: ${streamId}`);
        return;
      }
      processedChunks.current.add(chunkKey);
    
      const aiMessageId = `ai-${streamId}`;
      const hasMatchingMessage = messages.some((msg) => msg.id === aiMessageId) || pendingMessageRef.current?.id === aiMessageId;
    
      if (!hasMatchingMessage) {
        console.log(`[handleChunk] No matching AI message for streamId: ${streamId}, storing chunk`);
        pendingChunksRef.current[streamId] = (pendingChunksRef.current[streamId] || '') + chunk;
        return;
      }
    
      if (chunk && typeof chunk === 'string') {
        chunkBufferRef.current += chunk;
        console.log('[handleChunk] Current chunk buffer:', chunkBufferRef.current);
      } else {
        console.warn('[handleChunk] Received empty or invalid chunk:', chunk);
        return;
      }
    
      setMessages((prev) => {
        const updatedMessages = prev.map((msg) => {
          if (msg.id === aiMessageId) {
            return {
              ...msg,
              content: chunkBufferRef.current,
              showDots: true,
              timestamp: new Date().toISOString(),
            };
          }
          return msg;
        });
    
        if (!prev.some((msg) => msg.id === aiMessageId) && pendingMessageRef.current?.id === aiMessageId) {
          return [
            ...updatedMessages,
            {
              ...pendingMessageRef.current,
              content: chunkBufferRef.current,
              showDots: true,
              timestamp: new Date().toISOString(),
            },
          ];
        }
        console.log('[handleChunk] Updated messages:', updatedMessages);
        return updatedMessages;
      });
    };
    const handleComplete = (content, streamId) => {
      console.log('[ChatInterface] Received complete data:', JSON.stringify(content, null, 2), 'StreamId:', streamId);
      if (content && content.results && Array.isArray(content.results) && content.results.length > 0) {
              console.log('chunkBufferRef.current.trim()',chunkBufferRef.current.trim());
        const finalContent = chunkBufferRef.current.trim() || 'Tôi cần bạn xem xét lại các thông tin.';
        setMessages((prev) => {
          const aiMessageId = `ai-${streamId}`;
          const updatedMessages = prev.map((msg) => {
            if (msg.id === aiMessageId) {
              return {
                ...msg,
                content: finalContent,
                isStreaming: false,
                showDots: false,
                timestamp: new Date().toISOString(),
                conversationId: conversationId || msg.conversationId, // Gắn conversationId
              };
            }
            return msg;
          });
          // Chỉ thêm modal nếu chưa tồn tại
          if (!updatedMessages.some((msg) => msg.id === `confirmation-${streamId}`)) {
            return [
              ...updatedMessages,
              {
                id: `confirmation-${streamId}`,
                isUser: false,
                isStreaming: false,
                showDots: false,
                isConfirmationModal: true,
                results: content.results,
                streamId,
                chatHistoryId: content.chatHistoryId,
                timestamp: new Date().toISOString(),
                conversationId, // Gắn conversationId
              },
            ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          }
          return updatedMessages;
        });
    
        // Reset trạng thái
        setIsWaitingResponse(false);
        if (conversationId && !chatHistory.some((history) => history.id === streamId)) {
          dispatch(fetchChatHistory({ conversationId, lastMessageId: null }));
        }
        setCurrentStreamId(null);
        chunkBufferRef.current = '';
        processedChunks.current.clear();
        pendingMessageRef.current = null;
      } else {
        console.warn('[ChatInterface] Invalid or empty complete data:', JSON.stringify(content, null, 2));
        setMessages((prev) => {
          const updatedMessages = prev.filter((msg) => msg.id !== `ai-${streamId}`);
          return [
            ...updatedMessages,
            {
              id: `error-${Date.now()}`,
              content: 'Dữ liệu xác nhận không hợp lệ. Vui lòng thử lại.',
              isUser: false,
              isStreaming: false,
              showDots: false,
              isError: true,
              timestamp: new Date().toISOString(),
              conversationId, // Gắn conversationId
            },
          ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        });
        setIsWaitingResponse(false);
        setCurrentStreamId(null);
        chunkBufferRef.current = '';
        processedChunks.current.clear();
        pendingMessageRef.current = null;
      }
    };
    const handleStreamCompleted = (streamId) => {
      console.log('[handleStreamCompleted] Stream completed:', streamId);
    
      if (pendingChunksRef.current[streamId]) {
        chunkBufferRef.current = pendingChunksRef.current[streamId];
        delete pendingChunksRef.current[streamId];
      }
    
      const finalContent = chunkBufferRef.current.trim() || 'Không nhận được phản hồi từ AI.';
      setMessages((prev) => {
        const aiMessageId = `ai-${streamId}`;
        const updatedMessages = prev.map((msg) => {
          if (msg.id === aiMessageId) {
            return {
              ...msg,
              content: finalContent,
              isStreaming: false,
              showDots: false,
              timestamp: new Date().toISOString(),
              conversationId: conversationId || msg.conversationId, // Gắn conversationId
            };
          }
          return msg;
        });
    
        if (!prev.some((msg) => msg.id === aiMessageId) && pendingMessageRef.current?.id === aiMessageId) {
          return [
            ...updatedMessages,
            {
              ...pendingMessageRef.current,
              content: finalContent,
              isStreaming: false,
              showDots: false,
              timestamp: new Date().toISOString(),
              conversationId, // Gắn conversationId
            },
          ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        }
        console.log('[handleStreamCompleted] Updated messages:', updatedMessages);
        return updatedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      });
    
      setIsWaitingResponse(false);
      if (conversationId) {
        dispatch(fetchChatHistory({ conversationId, lastMessageId: null }));
      }
      // Trì hoãn đặt currentStreamId để useEffect xử lý tin nhắn tạm thời
      setTimeout(() => {
        setCurrentStreamId(null);
        chunkBufferRef.current = '';
        processedChunks.current.clear();
        pendingMessageRef.current = null;
      }, 0);
    };

    signalRService.onReceiveChunk(handleChunk);
    signalRService.onReceiveComplete(handleComplete);
    signalRService.onStreamCompleted(handleStreamCompleted);

    return () => {
      console.log('[ChatInterface] Cleaning up SignalR listeners');
      signalRService.off('ReceiveChunk', handleChunk);
      signalRService.off('ReceiveComplete', handleComplete);
      signalRService.off('StreamCompleted', handleStreamCompleted);
    };

  }, [isConnected, signalRService, dispatch]);

  const handleSendQuery = useCallback(() => {
    if (!query.trim() || isWaitingResponse) return;
    setRetryQuery(null);
    const userQuery = query.trim();
    const newStreamId = Date.now().toString();
    const userMessageId = `user-${newStreamId}`;
    const aiMessageId = `ai-${newStreamId}`;
    const now = new Date().toISOString();
  
    console.log('[handleSendQuery] Sending query:', userQuery, 'StreamId:', newStreamId);
  
    if (!conversationId) {
      setMessages([]);
      chunkBufferRef.current = '';
      pendingChunksRef.current = {};
      pendingMessageRef.current = null;
    }
  
    pendingMessageRef.current = {
      id: aiMessageId,
      content: '',
      isUser: false,
      isStreaming: true,
      showDots: true,
      timestamp: now,
      tempConversationId: newStreamId, // Gắn tempConversationId
    };
  
    const newMessages = [
      ...messages,
      {
        id: userMessageId,
        content: userQuery,
        isUser: true,
        isStreaming: false,
        showDots: false,
        timestamp: now,
        tempConversationId: newStreamId, // Gắn tempConversationId
      },
      pendingMessageRef.current,
    ];
    setMessages([...newMessages]);
    console.log('[handleSendQuery] Updated messages:', newMessages);
  
    setIsWaitingResponse(true);
    setQuery('');
    setCurrentStreamId(newStreamId);
    chunkBufferRef.current = '';
    processedChunks.current.clear();
  
    dispatch(sendQuery({ query: userQuery, conversationId: conversationId || null }))
      .then((action) => {
        const newConversationId = action.payload?.conversationId;
        const queryToSend = action.payload?.query;
        console.log('[handleSendQuery] sendQuery response:', action.payload);
  
        const streamConversationId = conversationId || newConversationId;
        if (streamConversationId && queryToSend && signalRService && isConnected) {
          console.log('[handleSendQuery] Starting stream with query:', queryToSend, 'streamId:', newStreamId);
          signalRService.sendStreamQuery(queryToSend, streamConversationId, newStreamId);
          // 👉 Thêm timeout ở đây thay vì đợi handleChunk gọi
        const fallbackTimeoutId = setTimeout(() => {
          console.log('[ChatInterface] Fallback timeout: No chunk received after 120s');
          setMessages((prev) => {
            const aiMessageId = `ai-${newStreamId}`;
            const updated = prev.map((msg) => {
              if (msg.id === aiMessageId && msg.isStreaming) {
                return {
                  ...msg,
                  content: 'Hệ thống đang gặp sự cố và không thể trả lời ngay lập tức. Vui lòng thử lại sau.',
                  isStreaming: false,
                  showDots: false,
                  isError: true, // Đánh dấu là tin nhắn lỗi
                  timestamp: new Date().toISOString(),
                };
              }
              return msg;
            });
            setRetryQuery(userQuery); // Đặt retryQuery khi timeout
            return updated;
          });
          setIsWaitingResponse(false);
          setCurrentStreamId(null);
        }, 120000);

        setTimeoutId(fallbackTimeoutId);

        } else {
          throw new Error('Cannot start stream: Missing required parameters');
        }
  
        if (!conversationId && newConversationId) {
          console.log('[handleSendQuery] New conversation created with ID:', newConversationId);
          setConversationId(newConversationId);
          // Cập nhật tempConversationId thành conversationId
          setMessages((prev) =>
            prev.map((msg) =>
              msg.tempConversationId === newStreamId
                ? { ...msg, conversationId: newConversationId, tempConversationId: undefined }
                : msg
            )
          );
          dispatch(fetchChatHistory({ conversationId: newConversationId, lastMessageId: null }));
        }
      })
      .catch((err) => {
      console.error('[handleSendQuery] Error sending message:', err);
      setIsWaitingResponse(false);
      setCurrentStreamId(null);
      setRetryQuery(userQuery); // Thêm dòng này
      setMessages((prev) => [
        ...prev.filter((msg) => msg.id !== aiMessageId),
        {
          id: `error-${Date.now()}`,
          content: 'Đã xảy ra lỗi khi gửi tin nhắn. Vui lòng thử lại.',
          isUser: false,
          isStreaming: false,
          showDots: false,
          isError: true,
          timestamp: new Date().toISOString(),
        },
      ]);
      chunkBufferRef.current = '';
      processedChunks.current.clear();
      pendingMessageRef.current = null;
    });
  }, [query, isWaitingResponse, dispatch, conversationId, signalRService, setConversationId, isConnected, messages]);

  const handleRetry = useCallback(() => {
  if (!retryQuery) return;

  // Xóa tin nhắn lỗi cuối cùng
  setMessages(prev => {
    const newMessages = [...prev];
    if (newMessages.length > 0 && newMessages[newMessages.length - 1].isError) {
      newMessages.pop();
    }
    return newMessages;
  });

  // Gửi lại query
  setQuery(retryQuery);
  setTimeout(() => {
    const sendButton = document.querySelector('.send-button');
    if (sendButton && !sendButton.disabled) {
      sendButton.click();
    }
  }, 100);
}, [retryQuery]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendQuery();
    }
  };

  const handleNewChat = useCallback(() => {
    console.log('[ChatInterface] Starting new chat');
     setRetryQuery(null);
    setMessages([]);
    setCurrentStreamId(null);
    chunkBufferRef.current = '';
    pendingChunksRef.current = {};
    pendingMessageRef.current = null;
    setConversationId(null);
    setIsWaitingResponse(false); // Đặt lại trạng thái chờ
    onNewChat();
  }, [onNewChat, setConversationId]);
 
const handleModalConfirm = useCallback(
  async (endpoint, params, redis_key, streamId,setIsLoading) => {
    console.log('[ChatInterface] Confirming action:', { endpoint, params, redis_key, streamId, conversationId });
    if (!endpoint || !params || !redis_key || !streamId) {
      console.error('[ChatInterface] Invalid confirm action parameters:', { endpoint, params, redis_key, streamId });
      setMessages((prev) => {
        const updatedMessages = prev.filter((msg) => !msg.isConfirmationModal);
        return [
          ...updatedMessages,
          {
            id: `error-${Date.now()}`,
            content: 'Thông tin xác nhận không hợp lệ. Vui lòng thử lại.',
            isUser: false,
            isStreaming: false,
            showDots: false,
            isError: true,
            timestamp: new Date().toISOString(),
            conversationId,
          },
        ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      });
      setIsModalOpen(false);
      setIsWaitingResponse(false);
      setIsLoading(false);
      return;
    }

    // Danh sách thông báo lỗi thân thiện ngẫu nhiên
    const friendlyErrorMessages = [
      'Ôi, có vẻ như hệ thống hơi mè nheo rồi! 😅',
      'Hic, có chút trục trặc nhỏ, thử lại nhé! 🛠️',
      'Úi, hệ thống đang bận tí xíu, chờ chút nha! ⏳',
      'Ôi zời, có gì đó không ổn rồi, để mình kiểm tra lại! 😓',
      'Hệ thống hơi nghịch ngợm tí, thử lại nào! 😜',
    ];

    try {
      const confirmationMessage = messages.find((msg) => msg.id === `confirmation-${streamId}`);
      const chatHistoryId = confirmationMessage?.chatHistoryId || null; // Cung cấp giá trị mặc định

      // Nếu chatHistoryId không tồn tại, ghi log cảnh báo
      if (!chatHistoryId) {
        console.warn('[ChatInterface] chatHistoryId is undefined for streamId:', streamId);
      }

      const endpointKey = endpoint.replace('https://universharing-web-app-gaereaceg0drc5e3.southeastasia-01.azurewebsites.net', '');
      const messagesForEndpoint = successMessages[endpointKey] || successMessages['default'];
      const successMessage = messagesForEndpoint[Math.floor(Math.random() * messagesForEndpoint.length)];

      // Chuẩn hóa params thành một mảng chứa một đối tượng duy nhất
      // const normalizedParams = [{
      //   ...params[0], // params đã được chuẩn hóa trong ConfirmationModal.js
      // }];
      console.log("paramsHandlerConf",params);
      // Gọi confirmAction mà không gửi successMessage
      const result = await dispatch(
        confirmAction({ endpoint, params, redis_key, conversationId, chatHistoryId })
      ).unwrap();
      console.log('[ChatInterface] Action confirmed result:', result);

      // Kiểm tra mã trạng thái từ server
      if (result.response && result.response.code === 200) {
  // Thành công: Tạo nội dung tin nhắn bao gồm successMessage và dữ liệu trả về
  const endpointKey = endpoint.replace('https://universharing-web-app-gaereaceg0drc5e3.southeastasia-01.azurewebsites.net', '');
  const messagesForEndpoint = successMessages[endpointKey] || successMessages['default'];
  const successMessage = messagesForEndpoint[Math.floor(Math.random() * messagesForEndpoint.length)];

  // Format dữ liệu trả về từ server thành chuỗi dễ đọc
  let dataMessage = '';
  if (result.response.data && paramDisplayMap[endpointKey]) {
    const data = result.response.data;
    const displayMap = paramDisplayMap[endpointKey];

    // Lọc các trường không phải ID và tạo danh sách chi tiết
    dataMessage = Object.entries(displayMap)
      .map(([paramKey, displayName]) => {
        // Bỏ qua các trường liên quan đến ID
        if (paramKey.toLowerCase().includes('id')) return null;

        // Lấy giá trị từ data, ưu tiên key từ data nếu có
        let value = data[paramKey] || data[paramKey.toLowerCase()] || data[paramKey.toUpperCase()];
        if (value === null || value === undefined) {
          // Kiểm tra các trường khác trong data nếu không tìm thấy paramKey
          const fallbackKey = Object.keys(data).find(
            (key) => key.toLowerCase() === paramKey.toLowerCase()
          );
          value = fallbackKey ? data[fallbackKey] : null;
        }
        if (value === null || value === undefined) return null;

        // Định dạng giá trị phù hợp
        if (paramKey === 'Scope') {
          const scopeOption = scopeOptions.find(
            (opt) => opt.value === value || opt.value.toString() === value.toString()
          );
          value = scopeOption ? scopeOption.label : value;
        } else if (paramKey === 'IsSafetyTrackingEnabled') {
          const safeOption = isSafeOptions.find((opt) => opt.value === value);
          value = safeOption ? safeOption.label : value;
        } else if (paramKey === 'Gender') {
          const genderOption = genderOptions.find((opt) => opt.value === value);
          value = genderOption ? genderOption.label : value;
        } else if (typeof value === 'boolean') {
          value = value ? 'Thành công' : 'Đã hủy';
        } else if (paramKey === 'Images' || paramKey === 'ProfileImage' || paramKey === 'BackgroundImage') {
          // Xử lý hình ảnh
          if (Array.isArray(value)) {
            return value
              .map((img, index) => {
                const fullUrl = img.startsWith('http') ? img : `https://universharing-web-app-gaereaceg0drc5e3.southeastasia-01.azurewebsites.net${img}`;
                return `- ${displayName} ${index + 1}: ![${displayName} ${index + 1}](${fullUrl})`;
              })
              .join('\n');
          } else if (typeof value === 'string') {
            const fullUrl = value.startsWith('http') ? value : `https://universharing-web-app-gaereaceg0drc5e3.southeastasia-01.azurewebsites.net${value}`;
            return `- ${displayName}: ![${displayName}](${fullUrl})`;
          }
          return null;
        }

        // Xử lý trường imageUrl (cho các endpoint như /api/Post/update-post)
        if (paramKey.toLowerCase() === 'imageurl' && typeof value === 'string') {
          const fullUrl = value.startsWith('http') ? value : `https://universharing-web-app-gaereaceg0drc5e3.southeastasia-01.azurewebsites.net${value}`;
          return `- ${displayName}: ![${displayName}](${fullUrl})`;
        }

        return `- ${displayName}: ${value}`;
      })
      .filter(Boolean)
      .join('\n');

    // Thêm xử lý trường imageUrl nếu không có trong displayMap
    if (data.imageUrl && typeof data.imageUrl === 'string') {
      const fullUrl = data.imageUrl.startsWith('http')
        ? data.imageUrl
        : `https://universharing-web-app-gaereaceg0drc5e3.southeastasia-01.azurewebsites.net${data.imageUrl}`;
      dataMessage += `\n- Hình ảnh: ![Hình ảnh](${fullUrl})`;
    }

    // Thêm tiêu đề chi tiết nếu có dữ liệu
    if (dataMessage) {
      dataMessage = `\n${dataMessage}`;
    }
  } else if (result.response.data) {
    // Xử lý các endpoint không có trong paramDisplayMap
    dataMessage = Object.entries(result.response.data)
      .map(([key, value]) => {
        if (value === null || value === undefined || key.toLowerCase().includes('id')) return null;
        if (key === 'createdAt') return `- Thời gian tạo: ${value}`;
        if (key === 'fullName') return `- Họ tên: ${value}`;
        if (key === 'gender') {
          const genderOption = genderOptions.find((opt) => opt.value === value);
          return `- Giới tính: ${genderOption ? genderOption.label : value}`;
        }
        if (key === 'phoneNumber') return `- Số điện thoại: ${value}`;
        if (key === 'phoneNumberRelative') return `- Số điện thoại người thân: ${value}`;
        if (key === 'content') return `- Nội dung: ${value}`;
        if (key === 'estimatedDuration') return `- Thời gian dự kiến: ${value} phút`;
        if (key === 'status') return `- Trạng thái: ${value === 1 ? 'Đã xác nhận' : 'Chưa xác nhận'}`;
        if (key === 'scope') {
          const scopeOption = scopeOptions.find(
            (opt) => opt.value === value || opt.value.toString() === value.toString()
          );
          return `- Phạm vi: ${scopeOption ? scopeOption.label : value}`;
        }
        if (key === 'imageUrl' || key === 'image' || key === 'profileImage' || key === 'backgroundImage') {
          const fullUrl = value.startsWith('http') ? value : `https://universharing-web-app-gaereaceg0drc5e3.southeastasia-01.azurewebsites.net${value}`;
          return `- Hình ảnh: ![Hình ảnh](${fullUrl})`;
        }
        if (key === 'images' && Array.isArray(value)) {
          return value
            .map((img, index) => {
              const fullUrl = img.startsWith('http') ? img : `https://universharing-web-app-gaereaceg0drc5e3.southeastasia-01.azurewebsites.net${img}`;
              return `- Hình ảnh ${index + 1}: ![Hình ảnh ${index + 1}](${fullUrl})`;
            })
            .join('\n');
        }
        return null;
      })
      .filter(Boolean)
      .join('\n');

    if (dataMessage) {
      dataMessage = `\n${dataMessage}`;
    }
  }

  // Kết hợp successMessage và dataMessage
  const combinedMessage = `${successMessage}${dataMessage}`;

  // Gửi combinedMessage đến server
  if (chatHistoryId) {
    await axiosClient.post(`/api/ChatAI/update-message`, {
      chatHistoryId,
      successMessage: combinedMessage,
      redisKey: redis_key,
    });
  } else {
    console.warn('[ChatInterface] Skipping update-message due to missing chatHistoryId');
  }

  // Cập nhật messages với combinedMessage
  setMessages((prev) => {
    const updatedMessages = prev.filter((msg) => msg.id !== `confirmation-${streamId}` && !msg.isConfirmationModal);
    return [
      ...updatedMessages,
      {
        id: `ai-confirm-${chatHistoryId || Date.now()}`,
        content: combinedMessage,
        isUser: false,
        isStreaming: false,
        showDots: false,
        timestamp: new Date().toISOString(),
        conversationId,
      },
    ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  });

  if (conversationId) {
    dispatch(fetchChatHistory({ conversationId, lastMessageId: null }));
  }
}else {
        // Lỗi: Tạo thông báo lỗi thân thiện và gửi đến server
        const serverErrorMessage = result.response?.message || 'Đã xảy ra lỗi không xác định.';
        const friendlyMessage = friendlyErrorMessages[Math.floor(Math.random() * friendlyErrorMessages.length)];
        const combinedErrorMessage = `${friendlyMessage} Lỗi: ${serverErrorMessage}`;

        if (chatHistoryId) {
          await axiosClient.post(`/api/ChatAI/update-message`, {
            chatHistoryId,
            successMessage: combinedErrorMessage,
            redisKey: redis_key,
          });
        } else {
          console.warn('[ChatInterface] Skipping update-message due to missing chatHistoryId');
        }

        setMessages((prev) => {
          const updatedMessages = prev.filter((msg) => !msg.isConfirmationModal);
          return [
            ...updatedMessages,
            {
              id: `error-${Date.now()}`,
              content: combinedErrorMessage,
              isUser: false,
              isStreaming: false,
              showDots: false,
              isError: true,
              timestamp: new Date().toISOString(),
              conversationId,
            },
          ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        });
      }

      setIsModalOpen(false);
      setIsWaitingResponse(false);
      setIsLoading(false);
    } catch (error) {
      // Xử lý lỗi ngoại lệ (ví dụ: lỗi mạng)
      console.error('[ChatInterface] Error confirming action:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      const serverErrorMessage = error.response?.data?.message || 'Đã xảy ra lỗi khi xác nhận hành động.';
      const friendlyMessage = friendlyErrorMessages[Math.floor(Math.random() * friendlyErrorMessages.length)];
      const combinedErrorMessage = `${friendlyMessage} Lỗi: ${serverErrorMessage}`;

      const confirmationMessage = messages.find((msg) => msg.id === `confirmation-${streamId}`);
      const chatHistoryId = confirmationMessage?.chatHistoryId || null;

      if (chatHistoryId) {
        await axiosClient.post(`/api/ChatAI/update-message`, {
          chatHistoryId,
          successMessage: combinedErrorMessage,
          redisKey: redis_key,
        });
      } else {
        console.warn('[ChatInterface] Skipping update-message due to missing chatHistoryId');
      }

      setMessages((prev) => {
        const updatedMessages = prev.filter((msg) => !msg.isConfirmationModal);
        return [
          ...updatedMessages,
          {
            id: `error-${Date.now()}`,
            content: combinedErrorMessage,
            isUser: false,
            isStreaming: false,
            showDots: false,
            isError: true,
            timestamp: new Date().toISOString(),
            conversationId,
          },
        ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      });
      setIsModalOpen(false);
      setIsWaitingResponse(false);
      setIsLoading(false);
    }
  },
  [dispatch, conversationId, messages]
);



  const handleModalEdit = useCallback((modalStreamId) => { // Chấp nhận modalStreamId làm tham số
    console.log('[ChatInterface] Entering edit mode for modal with streamId:', modalStreamId);
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === `confirmation-${modalStreamId}` // Sử dụng modalStreamId được truyền vào
          ? { ...msg, isEditing: true }
          : msg
      )
    );
  }, []);



  const handleModalCancel = useCallback((streamId) => {
    console.log('[ChatInterface] Cancelling modal action', { streamId });
  
    const confirmationMessage = messages.find(
      (msg) => msg.id === `confirmation-${streamId}` && msg.isConfirmationModal
    );
    console.log('[handleModalCancel] Confirmation message:', confirmationMessage);
    console.log('[handleModalCancel] Results:', confirmationMessage?.results);
  
    const redis_key = confirmationMessage?.results?.[0]?.redis_key;
    const validConversationId = conversationId || confirmationMessage?.conversationId;
  
    if (validConversationId && redis_key) {
      dispatch(stopAction({ conversationId: validConversationId, redis_key }))
        .unwrap()
        .then(() => {
          console.log('[ChatInterface] Stop action successful');
          setMessages((prev) => {
            const updatedMessages = prev.filter((msg) => !msg.isConfirmationModal);
            console.log('[ChatInterface] Messages after cancelling modal:', updatedMessages);
            return [
              ...updatedMessages,
              {
                id: `cancel-${Date.now()}`,
                content: 'Hành động đã được hủy.',
                isUser: false,
                isStreaming: false,
                showDots: false,
                timestamp: new Date().toISOString(),
              },
            ];
          });
          setIsWaitingResponse(false);
        })
        .catch((error) => {
          console.error('[ChatInterface] Error stopping action:', error);
          setMessages((prev) => {
            const updatedMessages = prev.filter((msg) => !msg.isConfirmationModal);
            console.log('[ChatInterface] Messages after cancelling modal:', updatedMessages);
            return [
              ...updatedMessages,
              {
                id: `error-${Date.now()}`,
                content: 'Lỗi khi hủy hành động. Vui lòng thử lại.',
                isUser: false,
                isStreaming: false,
                showDots: false,
                isError: true,
                timestamp: new Date().toISOString(),
              },
            ];
          });
          setIsWaitingResponse(false);
        });
    } else {
      console.warn('[ChatInterface] Không tìm thấy redis_key hoặc conversationId:', {
        redis_key,
        conversationId: validConversationId,
        results: confirmationMessage?.results?.[0],
      });
      setMessages((prev) => {
        const updatedMessages = prev.filter((msg) => !msg.isConfirmationModal);
        console.log('[ChatInterface] Messages after cancelling modal:', updatedMessages);
        return [
          ...updatedMessages,
          {
            id: `cancel-${Date.now()}`,
            content: 'Hành động đã được hủy.',
            isUser: false,
            isStreaming: false,
            showDots: false,
            timestamp: new Date().toISOString(),
          },
        ];
      });
      setIsWaitingResponse(false);
    }
  }, [dispatch, conversationId, messages]);
const extractImageUrl = (content) => {
  // Tìm kiếm đường dẫn hình ảnh trong nội dung
  const imagePathMatch = content.match(/Link ảnh: ?[`"]?(\/images\/posts\/[^\s`")\]\n]+)[`"]?/i);
  if (imagePathMatch) {
    return `https://universharing-web-app-gaereaceg0drc5e3.southeastasia-01.azurewebsites.net${imagePathMatch[1]}`;
  }
  return null;
};

const processContent = (content) => {
  if (!content) return content;

  let cleanedContent = content;

  // Loại bỏ các đoạn văn bản cụ thể không mong muốn
  cleanedContent = cleanedContent
    .replace(/\(bạn có thể xem hình ảnh tại đây:.*?\)/g, '')
    .replace(/\[Đây là link đến hình ảnh bài viết.*?\]/g, '')
    .replace(/Có hình ảnh đính kèm\.\s*\(Link ảnh:.*?`?\)/g, '')
    // Regex này có thể loại bỏ cả URL ảnh nếu không cẩn thận.
    // Chúng ta sẽ bỏ qua nó hoặc điều chỉnh nếu cần thiết.
    // Tạm thời comment lại để kiểm tra:
    // .replace(/(?<!\!\[.*?)Link ảnh: ?[`"]?(\S+?\.(?:jpg|jpeg|png|gif|webp|mp4))[`"]?(?!\))/gi, '')

    // Regex này loại bỏ "***Hình ảnh:*** ". Chúng ta cần cân nhắc nếu muốn giữ lại tiêu đề này hoặc không.
    // Nếu bạn muốn giữ lại tiêu đề "Ảnh đại diện" hoặc "Ảnh bìa" từ phản hồi server, thì không nên loại bỏ nó ở đây.
    // Phản hồi server của bạn có "* **Ảnh đại diện:**" và "* **Ảnh bìa:**"
    // Regex này sẽ loại bỏ chúng nếu nó khớp với định dạng "Hình ảnh:".
    // Tạm thời comment lại hoặc chỉ loại bỏ nếu chắc chắn nó không ảnh hưởng đến các nhãn ảnh.
    // .replace(/(\*|_)\s*\*\*Hình ảnh:\*\*\s*(?!\!)/g, ''); // Có thể gây ra lỗi nếu bạn muốn hiển thị nhãn "Ảnh đại diện:"

    // Giữ lại các regex làm sạch khác nếu chúng không ảnh hưởng đến ảnh
    .replace(/\*\*\s*Chi tiết bài đăng:\s*\*\*/g, '**Chi tiết bài đăng:**') // Làm sạch định dạng
    .replace(/\[\*\*Chi tiết bài đăng:\*\*\]/g, '**Chi tiết bài đăng:**') // Làm sạch định dạng
    .replace(/\*\*Link ảnh:.*?\*\*/g, '') // Loại bỏ cụm "**Link ảnh:**" nếu nó xuất hiện
    .replace(/\s*\n\s*\n\s*/g, '\n\n') // Thay thế nhiều dòng trống bằng một dòng
    .trim();

  return cleanedContent;
};
// Hàm hỗ trợ escape các ký tự đặc biệt trong regex
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const renderMessage = useCallback(
  (message, index) => {
    console.log('[ChatInterface] Rendering message:', message);

    if (message.isConfirmationModal) {
      const modifiedMessage = {
        ...message,
        isStreaming: false,
        showDots: false,
      };

      return (
        <div
          key={`${modifiedMessage.id}-${index}`}
          className="message-bubble ai-message confirmation-message"
          data-testid={`message-${modifiedMessage.id}`}
        >
          <ConfirmationModal
            results={modifiedMessage.results}
            streamId={modifiedMessage.streamId}
            onConfirm={handleModalConfirm}
            onEdit={handleModalEdit}
            onCancel={() => handleModalCancel(modifiedMessage.streamId)}
            conversationId={conversationId}
            isEditing={modifiedMessage.isEditing || false}
          />
          <div className="message-timestamp">
            {new Date(modifiedMessage.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      );
    }


    return (
      <div
        key={`${message.id}-${index}`}
        className={`message-bubble ${message.isUser ? 'user-message' : `ai-message ${message.isStreaming ? 'streaming' : ''}`}`}
        data-testid={`message-${message.id}`}
      >
        <div className="message-content">
          {message.content ? (
            <>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  img: ({ src, alt }) => (
                    <img 
                      src={src} 
                      alt={alt || 'Hình ảnh'} 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '300px', 
                        margin: '8px 0',
                        borderRadius: '4px',
                        border: '1px solid #eee'
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/placeholder-image.png';
                      }}
                    />
                  ),
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  )
                }}
              >
                {convertLinksToMarkdown(processContent(message.content))}
              </ReactMarkdown>
            </>
          ) : (
            <span>{message.isStreaming ? '' : 'Không có nội dung trả lời.'}</span>
          )}
          {message.isStreaming && message.showDots && (
            <span className="streaming-dots" data-testid="streaming-dots">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          )}
        </div>
        <div className="message-timestamp">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    );
  },
  [handleModalConfirm, handleModalEdit, handleModalCancel, conversationId, handleRetry]
);
  

  const renderedMessages = useMemo(() => {
    return messages.map((message, index) => renderMessage(message, index));
  }, [messages, renderMessage]);

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <button onClick={toggleSidebar} className="menu-button">
          <Menu size={20} />
        </button>
        <h2 className="chat-title">
          {conversationId ? currentConversation?.title || 'Sharing AI' : 'Sharing AI'}
        </h2>
        <button onClick={handleNewChat} className="new-chat-button">
          <Plus size={20} />
        </button>
      </div>

      <div className="chat-messages">
      {messages.length > 0 ? (
        <>
          {renderedMessages}

          {retryQuery && messages.some(msg => msg.isError) && (
            <div className="message-bubble retry-message">
              <button 
                onClick={handleRetry}
                className="retry-button"
                data-testid="retry-button"
                title="Thử lại"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          )}

        </>
      ) : (
          <div className="welcome-screen">
            <div className="welcome-content">
              <h3>Chào mừng đến với Sharing AI</h3>
              <p>Tôi có thể giúp gì cho bạn?</p>
            </div>
          </div>
        )}
      <div ref={messagesEndRef} />
    </div>


      <div className="chat-input-container">
        <div className="chat-input">
          <textarea
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn..."
            rows={1}
            disabled={isWaitingResponse || isModalOpen || isListening} // Disable khi đang nghe
          />
          {/* Nút Microphone */}
        {(window.SpeechRecognition || window.webkitSpeechRecognition) && (
          <button
            onClick={handleToggleListening}
            className={`mic-button ${isListening ? 'listening' : ''}`} // Thêm class 'listening' để có thể style khác biệt
            title={isListening ? "Dừng ghi âm" : "Ghi âm giọng nói"}
            disabled={isWaitingResponse || isModalOpen} // isModalOpen và isWaitingResponse là ví dụ
          >
            {isListening ? <StopCircle size={18} color="red" /> : <Mic size={18} />}
          </button>
        )}
          <button
            onClick={handleSendQuery}
            disabled={!query.trim() || isWaitingResponse || isListening} // Disable khi đang nghe
            className="send-button"
          >
            {isWaitingResponse ? <div className="spinner" /> : <Send size={18} />}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
    
    </div>
  );
};

export default ChatInterface;