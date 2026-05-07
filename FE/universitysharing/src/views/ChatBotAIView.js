import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import ChatLayout from "../components/ChatAIComponent/ChatLayout";
import Header from "../components/HomeComponent/Header";
import LeftSidebar from "../components/HomeComponent/LeftSideBarHome";
import { userProfile } from "../stores/action/profileActions";
import "../styles/ChatAI/ChatBotAIView.scss";
import "../styles/HomeView.scss";
import "../styles/MoblieReponsive/HomeViewMobile/HomeMobile.scss";
const ChatBotAIView = () => {
const dispatch = useDispatch();
  const usersState = useSelector((state) => state.users) || {};
  const { users } = usersState;

  useEffect(() => {
    dispatch(userProfile());
  }, [dispatch]);

  return (
    <div className="home-view">
      <Header usersProfile={users} />

      <div className="main-content">
        {/* BỎ HẾT: overlay, left-sidebar wrapper, toggle button, Open-menu */}

        <LeftSidebar usersProfile={users} />        {/* Để nguyên, giờ nó tự xử lý cả desktop + mobile */}

        <div className="center-content">
          <div className="chat-ai-container">
            <ChatLayout />
          </div>
        </div>

       
      </div>
    </div>
  );
};

export default ChatBotAIView;
