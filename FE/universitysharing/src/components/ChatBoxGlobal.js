import React, { useEffect, useRef, useState } from "react";
import {
  closeChatBox,
  resetMessages,
} from "../stores/reducers/messengerReducer";
import { useSelector, useDispatch } from "react-redux";
import {
  getConversationss,
  getInbox,
  getMessagess,
} from "../stores/action/messageAction";
import ChatBox from "./MessageComponent/ChatBox";

import {
  useChatHandle,
  useMessageReceiver,
  useMessageReceiverData,
} from "../utils/MesengerHandle";

const ChatBoxGlobal = () => {
  const dispatch = useDispatch();
  useMessageReceiver(); // Kích hoạt nhận tin nhắn qua SignalR
  useMessageReceiverData();

  //load thêm tin nhắn
  // const topRef = useRef(null);
  // const observer = useRef(null);
  // const scrollContainerRef = useRef(null);

  //Lấy tin nhắn từ redux
  const messengerState = useSelector((state) => state.messenges || {});
  const messenges = messengerState?.messages || [];
  const selectFriend = messengerState?.selectFriend || null;
  const isOpenChatBox = messengerState?.isOpenChatBox; //Lấy trạng thái đóng mở từ redux
  const isRejectChatbox = messengerState?.isMessengerView;
  const conversationId = messengerState?.conversationId;

  const {
    handleJoin,
    handleLeaveChat,
    handleSendMessage,
    markConversationAsSeen,
  } = useChatHandle();

  //Gửi tin nhắn
  const [isUserTyping, setIsUserTyping] = useState(false); // gõ phím
  const [newMessage, setNewMessage] = useState(""); // nội dung tin nhắn
  const [isSending, setIsSending] = useState(false); // trạng thái đang gửi

  //Đóng chat box lại
  const closeChatbox = async () => {
    dispatch(resetMessages());
    await dispatch(closeChatBox());
  };
  return (
    <>
      {isOpenChatBox && !isRejectChatbox && (
        // <ChatBox
        //   onClose={closeChatbox}
        //   messenger={messenges}
        //   selectFriend={selectFriend}
        //   messengerState={messengerState}
        //   isUserTyping={isUserTyping}
        // />
        <ChatBox
          conversationId={conversationId}
          onClose={closeChatbox}
          messenger={messenges}
          selectFriend={selectFriend}
          messengerState={messengerState}
          isUserTyping={isUserTyping}
          setIsUserTyping={setIsUserTyping}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          isSending={isSending}
          setIsSending={setIsSending}
          handleSendMessage={handleSendMessage}
          friendId={selectFriend?.friendId}
        />
      )}
    </>
  );
};
export default ChatBoxGlobal;
