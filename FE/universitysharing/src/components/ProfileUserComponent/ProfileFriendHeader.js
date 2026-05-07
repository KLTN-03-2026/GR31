import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import { BsChatDots, BsChevronDown, BsThreeDots } from "react-icons/bs";
import { FaUserCheck, FaUserClock, FaUserPlus } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import avatarDefaut from "../../assets/AvatarDefaultFill.png";
import logoWeb from "../../assets/Logo.png";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  fetchFriendsByUserId,
  fetchListFriend,
  fetchListFriendReceive,
  fetchSentFriendRequests,
  rejectFriendRequest,
  removeFriend,
  sendFriendRequest,
} from "../../stores/action/friendAction";
import {
  getConversationss,
  getMessagess
} from "../../stores/action/messageAction";
import { userProfileDetail } from "../../stores/action/profileActions";
import {
  closeChatBox,
  openChatBox,
  resetMessages,
  setSelectFriend,
} from "../../stores/reducers/messengerReducer";
import "../../styles/MoblieReponsive/ProfileFriendMobile/ProfileHeaderMobile.scss";
import "../../styles/ProfileUserView/ProfileHeader.scss";
import "../../styles/ProfileUserView/UserReportUserModal.scss";
import getUserIdFromToken from "../../utils/JwtDecode";
import {
  useChatHandle
} from "../../utils/MesengerHandle";
import EditProfileModal from "./EditProfileModal";
import UserReportUserModal from "./UserReportUserModal"; // Sửa đường dẫn import
const ProfileFriendHeader = forwardRef((props, ref) => {
  const {
    shouldFocusBio,
    onModalOpened,
    isFriendProfile = false,
    userData = null,
  } = props;

  const userId = getUserIdFromToken();
  const dispatch = useDispatch();

  //Các hàm tin nhắn từ chat handle
  const {
    handleJoin,
    handleLeaveChat,
    handleSendMessage,
    markConversationAsSeen,
  } = useChatHandle();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [showFriendOptions, setShowFriendOptions] = useState(false);
  const [friendStatus, setFriendStatus] = useState({
    isFriend: false,
    hasFriendRequest: false,
    isRequestSent: false,
  });
  const [isLoading, setIsLoading] = useState({
    action: false,
    initialLoad: true,
  });
  const [showCreditHistoryModal, setShowCreditHistoryModal] = useState(false); // State để mở/đóng modal lịch sử điểm uy tín
  const [creditHistory, setCreditHistory] = useState([]); // State để lưu lịch sử điểm uy tín

  // Selectors
  const friendsData = useSelector((state) => state.friends.listFriends);
  const friendUserOtherData = useSelector(
    (state) => state.friends.listFriendsByUser
  );
  const friendRequests = useSelector(
    (state) => state.friends.listFriendReceived || []
  );
  const sentRequests = useSelector((state) => state.friends.sentFriendRequests);

  const messengerState = useSelector((state) => state.messenges || {});

  // Hàm delay
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  //chọn bạn nhắn tin để mở chatbox
  const handleSelectedFriend = async (friendData) => {
    const token = localStorage.getItem("token");
    try {
      //Thoát khỏi cuộc trò chuyện nếu join vào cuộc trò chuyện nào trước đó
      if (messengerState.conversationId) {
        await handleLeaveChat(messengerState.conversationId);
      }
      // Lấy dữ liệu cuộc trò chuyện mới
      const conversationData = await dispatch(
        getConversationss({ friendId: friendData.friendId, token })
      ).unwrap();

      const conversationId = conversationData.id;

      dispatch(resetMessages());
      dispatch(setSelectFriend(friendData));

      // Tham gia cuộc trò chuyện mới qua SignalR

      await handleJoin(conversationId);
      const messages = await dispatch(
        getMessagess({
          conversationId,
          token,
          nextCursor: null,
          pageSize: 20,
        })
      );

      await markConversationAsSeen({
        conversationId: conversationId, // Dùng trực tiếp conversationId mới
        friendId: friendData.friendId, // Dùng trực tiếp friendId mới
        messages: messages.payload.data || [], // ✅ Lấy đúng mảng tin nhắn
        status: 2,
      });

      dispatch(closeChatBox());

      dispatch(openChatBox());
    } catch (error) {
      console.error("Lỗi chọn bạn để chat:", error);
    }
  };

  // Hàm xử lý gửi lời mời kết bạn
  const handleAddFriend = useCallback(async () => {
    if (!userData?.id || isLoading.action) return;

    setIsLoading((prev) => ({ ...prev, action: true }));
    try {
      await dispatch(sendFriendRequest(userData.id)).unwrap();
      toast.success("Đã gửi lời mời kết bạn");

      setFriendStatus((prev) => ({
        ...prev,
        isRequestSent: true,
        hasFriendRequest: false,
      }));

      await delay(5000);

      await Promise.all([
        dispatch(fetchListFriendReceive()),
        dispatch(fetchSentFriendRequests()),
      ]);
    } catch (error) {
      toast.error(error || "Gửi lời mời thất bại");
    } finally {
      setIsLoading((prev) => ({ ...prev, action: false }));
    }
  }, [userData?.id, dispatch, isLoading.action]);
  //hàm nhắn tin

  // Hàm xử lý hủy lời mời kết bạn
  const handleCancelRequest = useCallback(async () => {
    if (!userData?.id || isLoading.action) return;

    setIsLoading((prev) => ({ ...prev, action: true }));
    try {
      await dispatch(cancelFriendRequest(userData.id)).unwrap();
      toast.success("Đã hủy lời mời kết bạn");

      setFriendStatus((prev) => ({
        ...prev,
        isRequestSent: false,
        hasFriendRequest: false,
      }));

      await delay(5000);

      await Promise.all([
        dispatch(fetchListFriendReceive()),
        dispatch(fetchSentFriendRequests()),
      ]);
    } catch (error) {
      toast.error(error || "Hủy lời mời thất bại");
    } finally {
      setIsLoading((prev) => ({ ...prev, action: false }));
    }
  }, [userData?.id, dispatch, isLoading.action]);

  // Hàm xử lý chấp nhận lời mời
  const handleAcceptRequest = useCallback(async () => {
    if (!userData?.id || isLoading.action) return;

    setIsLoading((prev) => ({ ...prev, action: true }));
    try {
      await dispatch(acceptFriendRequest(userData.id)).unwrap();
      toast.success("Đã chấp nhận lời mời kết bạn");

      setFriendStatus({
        isFriend: true,
        hasFriendRequest: false,
        isRequestSent: false,
      });

      await Promise.all([
        dispatch(fetchListFriend()),
        dispatch(fetchListFriendReceive()),
        dispatch(fetchSentFriendRequests()),
      ]);
    } catch (error) {
      toast.error(error || "Chấp nhận lời mời thất bại");
    } finally {
      setIsLoading((prev) => ({ ...prev, action: false }));
    }
  }, [userData?.id, dispatch, isLoading.action]);

  // Hàm xử lý từ chối lời mời
  const handleRejectRequest = useCallback(async () => {
    if (!userData?.id || isLoading.action) return;

    setIsLoading((prev) => ({ ...prev, action: true }));
    try {
      await dispatch(rejectFriendRequest(userData.id)).unwrap();
      toast.success("Đã từ chối lời mời kết bạn");

      setFriendStatus({
        isFriend: false,
        hasFriendRequest: false,
        isRequestSent: false,
      });

      await Promise.all([
        dispatch(fetchListFriendReceive()),
        dispatch(fetchSentFriendRequests()),
      ]);
    } catch (error) {
      toast.error(error || "Từ chối lời mời thất bại");
    } finally {
      setIsLoading((prev) => ({ ...prev, action: false }));
    }
  }, [userData?.id, dispatch, isLoading.action]);

  // Hàm xử lý hủy kết bạn với xác nhận
  const handleCancelFriendRequest = useCallback(async () => {
    if (!userData?.id || isLoading.action) return;

    confirmAlert({
      title: "Xác nhận hủy kết bạn",
      message: `Bạn có chắc chắn muốn hủy kết bạn với ${
        userData?.fullName || "người này"
      }?`,
      buttons: [
        {
          label: "Xác nhận",
          onClick: async () => {
            setIsLoading((prev) => ({ ...prev, action: true }));
            try {
              const result = await dispatch(removeFriend(userData.id));

              if (result.error) {
                throw new Error(result.error.message || "Hủy kết bạn thất bại");
              }

              toast.success("Đã hủy kết bạn thành công", {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
              });

              setFriendStatus({
                isFriend: false,
                hasFriendRequest: false,
                isRequestSent: false,
              });

              setShowFriendOptions(false);

              dispatch(fetchListFriend()).catch(console.error);
              dispatch(fetchFriendsByUserId(userData.id)).catch(console.error);
            } catch (error) {
              toast.error(error.message || "Hủy kết bạn thất bại", {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
              });
            } finally {
              setIsLoading((prev) => ({ ...prev, action: false }));
            }
          },
        },
        {
          label: "Hủy",
          onClick: () => setShowFriendOptions(false),
        },
      ],
      closeOnEscape: true,
      closeOnClickOutside: true,
      afterClose: () => setShowFriendOptions(false),
    });
  }, [userData, dispatch, isLoading.action]);

  // Kiểm tra trạng thái kết bạn
  useEffect(() => {
    if (!userData?.id) return;

    const isAlreadyFriend = friendsData?.friends?.some(
      (friend) => friend.friendId === userData.id
    );
    const hasPendingRequest = friendRequests.some(
      (request) => request.friendId === userData.id
    );
    const hasSentRequest = sentRequests.some(
      (request) => request.friendId === userData.id
    );

    setFriendStatus({
      isFriend: isAlreadyFriend,
      hasFriendRequest: hasPendingRequest,
      isRequestSent: hasSentRequest,
    });
  }, [userData?.id, friendsData, friendRequests, sentRequests]);

  // Load dữ liệu ban đầu
  useEffect(() => {
    const abortController = new AbortController();

    const loadInitialData = async () => {
      try {
        await Promise.all([
          dispatch(fetchListFriendReceive()),
          dispatch(fetchSentFriendRequests()),
          dispatch(fetchListFriend()),
          dispatch(userProfileDetail()),
        ]);

        if (userData?.id) {
          await dispatch(fetchFriendsByUserId(userData.id));
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error("Failed to load initial data:", error);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading((prev) => ({ ...prev, initialLoad: false }));
        }
      }
    };

    loadInitialData();

    return () => {
      abortController.abort();
    };
  }, [dispatch, userData?.id]);

  // Cho phép component cha gọi hàm mở modal EditProfileModal
  useImperativeHandle(ref, () => ({
    openModal: () => setIsModalOpen(true),
  }));

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  if (isLoading.initialLoad) {
    return <div className="profile-header loading">Đang tải...</div>;
  }

  return (
    <div className="profile-header">
      <div className="profile-header__background">
        <img
          src={userData?.backgroundPicture || logoWeb}
          alt="Background"
          className="profile-header__background-image"
        />
      </div>
      <div className="profile-header__container">
        <div className="profile-header__info">
          <img
            src={userData?.profilePicture || avatarDefaut}
            alt="Avatar"
            className="profile-header__avatar"
          />
          <div className="profile-header__details">
            <h1 className="profile-header__name">
              {userData?.fullName || "Chưa có thông tin."}
            </h1>
            <p className="profile-header__stats">
              {friendUserOtherData?.countFriend || 0} bạn bè
            </p>
            <span className="profile-header__trust">
              Điểm uy tín: {userData?.trustScore || 0}
            </span>
          </div>

          {friendStatus.hasFriendRequest ? (
            <>
              <button
                className="profile-header__accept-button"
                onClick={handleAcceptRequest}
                disabled={isLoading.action}
              >
                {isLoading.action ? (
                  "Đang xử lý..."
                ) : (
                  <>
                    <FaUserCheck style={{ marginRight: "8px" }} />
                    Chấp nhận
                  </>
                )}
              </button>
              <button
                className="profile-header__reject-button"
                onClick={handleRejectRequest}
                disabled={isLoading.action}
              >
                {isLoading.action ? "Đang xử lý..." : "Xóa lời mời"}
              </button>
            </>
          ) : friendStatus.isFriend ? (
            <div className="profile-header__friend-actions">
              {userId !== userData?.id && ( 
              <button
              className="profile-header__message-button"
              onClick={() =>
                    handleSelectedFriend({
                      friendId: userData.id,
                      fullName: userData.fullName,
                      pictureProfile: userData.profilePicture,
                      conversationId: 0,
                    })
                  }
              >
              <BsChatDots style={{ marginRight: "8px" }} />
              Nhắn tin
              </button>
              )}
              <button
                className="profile-header__friend-button"
                onClick={() => setShowFriendOptions(!showFriendOptions)}
              >
                <FaUserCheck style={{ marginRight: "8px" }} />
                Bạn bè
                <BsChevronDown
                  style={{
                    marginLeft: "8px",
                    transform: showFriendOptions
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                />
              </button>
              {showFriendOptions && (
                <div className="friend-options-dropdown">
                  <button
                    className="friend-option-item cancel-friend"
                    onClick={handleCancelFriendRequest}
                    disabled={isLoading.action}
                  >
                    {isLoading.action ? "Đang xử lý..." : "Hủy kết bạn"}
                  </button>
                </div>
              )}
            </div>
          ) : friendStatus.isRequestSent ? (
            <button
              className="profile-header__cancel-request-button"
              onClick={handleCancelRequest}
              disabled={isLoading.action}
            >
              {isLoading.action ? (
                "Đang xử lý..."
              ) : (
                <>
                  <FaUserClock style={{ marginRight: "8px" }} />
                  Hủy lời mời
                </>
              )}
            </button>
          ) : (
            <button
              className="profile-header__addfriend-button"
              onClick={handleAddFriend}
              disabled={isLoading.action}
            >
              {isLoading.action ? (
                "Đang xử lý..."
              ) : (
                <>
                  <FaUserPlus style={{ marginRight: "8px" }} />
                  Thêm bạn bè
                </>
              )}
            </button>
          )}

          <div className="relative">
            <button
              className="profile-header__option-button"
              onClick={() => setIsReportModalOpen(true)}
            >
              <BsThreeDots />
            </button>
          </div>

          <UserReportUserModal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            reportedUserId={userData?.id}
          />
        </div>
      </div>
      <EditProfileModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        shouldFocusBio={shouldFocusBio}
        onModalOpened={onModalOpened}
      />
    </div>
  );
});

export default ProfileFriendHeader;