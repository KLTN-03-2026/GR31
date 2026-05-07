import { useEffect } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import "./App.css";

import { ToastContainer, toast } from "react-toastify";

import { useDispatch, useSelector } from "react-redux";
import "react-toastify/dist/ReactToastify.css";
import { AxiosConfigProvider } from "../src/Service/axiosClient";
import { SignalRProvider } from "../src/Service/SignalRProvider";
import AdminPostManagement from "./admin/views/AdminPostManagement";
import AccountVerified from "./components/AccountVerified";
import CommentModalBackGround from "./components/CommentModalBackgroud.";
import ResendVerification from "./components/ResendVerification";
import { useAuth } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import ChatBotAIView from "./views/ChatBotAIView";
import ForgotPass from "./views/ForgotPassword";
import FriendProfileView from "./views/FriendProfileView";
import FriendView from "./views/FriendView";
import Homeview from "./views/HomeView";
import Login from "./views/Login";
import MessageView from "./views/MessageView";
import Notifications from "./views/Notifications";
import ProfileUserView from "./views/ProfileUserView";
import Register from "./views/Register";
import ResetForgotPassword from "./views/ResetForgotPassword";
import ResultSearchView from "./views/ResultSearchView";
import SearchView from "./views/SearchView";
import SettingsView from "./views/SettingsView";
import SharingRideView from "./views/SharingRideView";
import YourRideView from "./views/YourRideView";

import AdminRideDetails from "./admin/views/AdminRideDetails";
import AdminRideManagement from "./admin/views/AdminRideManagement";
import Dashboard from "./admin/views/DashBoardView";
import UserReport from "./admin/views/UserReportManagerView";

import { DeeplinkCommentModal } from "./stores/action/deepLinkAction";

import TestDispatchAPI from "./views/TestDispatchAPI";

import UserManagement from "./admin/views/UserManagement";

import NotificationAdmin from "./admin/views/NotificationManagement";
import LocationTracker from "./components/RideComponent/LocationTracker"; // Import component mới
import Site404 from "./views/404Site";


import ChatBoxGlobal from "./components/ChatBoxGlobal";


import LandingPage from "./views/IntroductView";

import AccommodationView from "./views/AccommodationView";
import MaterialView from "./views/MaterialView";
function App() {
  const { isAuthenticated, userRole, isLoading } = useAuth();
  // console.warn("Role người dùng>>", userRole);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const state = location.state;
  const background = state && state.background;
  const isSelectPostOpen = useSelector(
    (state) => state.deeplink.isSelectPostOpen
  );
  const selectedPost = useSelector((state) => state.posts.selectedPost);
  const error = useSelector((state) => state.deeplink.error);

  // useEffect(() => {
  //   if (isAuthenticated && location.pathname === "/login") {
  //     window.history.replaceState(null, "", "/home");
  //   }
  // }, [isAuthenticated, location.pathname]);

  useEffect(() => {
    console.log("App useEffect:", {
      isAuthenticated,
      pathname: location.pathname,
      state: location.state,
    });
    // Chỉ chuyển hướng nếu đã đăng nhập, đang ở /login, và không phải từ đăng nhập
    if (
      isAuthenticated &&
      location.pathname === "/login" &&
      !location.state?.fromLogin
    ) {
      navigate("/home", { replace: true });
    }

    if (selectedPost) {
      return;
    }

    const pathMatch = location.pathname.match(/^\/post\/(.+)$/);
    if (pathMatch) {
      const postId = pathMatch[1];
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(postId)) {
        console.error("postId không hợp lệ:", postId);
        navigate("/home", { replace: true });
        return;
      }
      if (isAuthenticated) {
        dispatch(DeeplinkCommentModal(postId));
      } else {
        navigate("/login", { replace: true });
      }
    }
  }, [isAuthenticated, location.pathname, dispatch, navigate]);

  useEffect(() => {
    // Hiển thị thông báo lỗi nếu có
    if (error) {
      toast.error(error || "Không thể tải bài viết");
    }
  }, [error]);

  return (
    <>
      <ToastContainer />
      <NotificationProvider>
        <AxiosConfigProvider />
        <SignalRProvider>
          <LocationTracker /> {/* Thêm component LocationTracker */}
          <Routes location={background || location}>
            {!isAuthenticated && (
              <>
                {/* Route không cần xác thực */}
                <Route path="/LandingPage" element={<LandingPage />} />
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgotpassword" element={<ForgotPass />} />
                <Route
                  path="/reset-password"
                  element={<ResetForgotPassword />}
                />
                <Route
                  path="/ResendVerification"
                  element={<ResendVerification />}
                />
                <Route path="/AccountVerified" element={<AccountVerified />} />
                <Route path="*" element={<Navigate to="/LandingPage" replace />} />
              </>
            )}
            {/* Route dành cho admin */}
            {isAuthenticated && userRole.toLowerCase() === "admin" && (
              <>
                <Route
                  path="/admin/tripnotifications"
                  element={<NotificationAdmin />}
                />
                <Route path="/admin/dashboard" element={<Dashboard />} />
                <Route path="/admin/rides" element={<AdminRideManagement />} />
                <Route
                  path="/admin/ride-details/:rideId"
                  element={<AdminRideDetails />}
                />
                <Route path="/admin/userreport" element={<UserReport />} />
                <Route
                  path="/admin/postmanager"
                  element={<AdminPostManagement />}
                />
                <Route path="/settings" element={<SettingsView />} />
                <Route path="/admin/users" element={<UserManagement />} />
                {/* Admin không thể truy cập vào route của user */}
                <Route
                  path="*"
                  element={<Navigate to="/admin/dashboard" replace />}
                />
              </>
            )}

            {/* Route dành cho user */}
            {isAuthenticated && userRole.toLowerCase() === "user" && (
              <>
                <Route path="/home" element={<Homeview />} />
                <Route path="/search" element={<SearchView />} />
                <Route path="/sharing-ride" element={<SharingRideView />} />
                <Route path="/your-ride" element={<YourRideView />} />
                <Route path="/post/:id" element={<Homeview />} />
                <Route path="/MessageView" element={<MessageView />} />
                <Route path="/MessageView/:id" element={<MessageView />} />
                <Route path="/ProfileUserView" element={<ProfileUserView />} />
                <Route path="/settings" element={<SettingsView />} />
                <Route
                  path="/profile/:userId"
                  element={<FriendProfileView />}
                />
                <Route path="/accommodation" element={<AccommodationView />} />
                <Route path="/material" element={<MaterialView />} />
                <Route path="/friend" element={<FriendView />} />
                <Route
                  path="/ResultSearchView"
                  element={<ResultSearchView />}
                />
                <Route path="/notify" element={<Notifications />} />
                <Route
                  path="/chatBoxAI/:conversationId?"
                  element={<ChatBotAIView />}
                />
                <Route path="/test" element={<TestDispatchAPI />} />
                <Route path="/404Site" element={<Site404 />} />
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="*" element={<Navigate to="/home" replace />} />
              </>
            )}

            {/* Chuyển hướng mặc định */}
            <Route path="*" element={<Site404 />} />
          </Routes>
          {/* {background && isAuthenticated && (
            <Routes>
              <Route path="/post/:id" element={<CommentModalBackGround />} />
            </Routes>
          )} */}
          {isAuthenticated && <CommentModalBackGround />}
          {isAuthenticated && <ChatBoxGlobal />}
        </SignalRProvider>
      </NotificationProvider>
    </>
  );
}

export default App;

