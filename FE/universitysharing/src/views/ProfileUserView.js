import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom"; // Add useLocation
import AllPosts from "../components/HomeComponent/AllPostHome";
import FooterHome from "../components/HomeComponent/FooterHome";
import Header from "../components/HomeComponent/Header";
import PostInput from "../components/HomeComponent/PostInputHome";
import ProfileFriends from "../components/ProfileUserComponent/ProfileFriends";
import ProfileHeader from "../components/ProfileUserComponent/ProfileHeader";
import ProfileIntro from "../components/ProfileUserComponent/ProfileIntro";
import ProfilePhotos from "../components/ProfileUserComponent/ProfilePhotos";
import AllRideRatings from "../components/RideComponent/AllRideRatings";
import { fetchListFriend } from "../stores/action/friendAction";
import { fetchPostsByOwner } from "../stores/action/listPostActions";
import { fetchPostImagesPreview, userProfile } from "../stores/action/profileActions";
import "../styles/MoblieReponsive/HomeViewMobile/HomeMobile.scss";
import "../styles/ProfileTabs.scss";
import "../styles/ProfileView.scss";
import getUserIdFromToken from "../utils/JwtDecode";

const ProfileUserView = () => {
  const dispatch = useDispatch();
  const location = useLocation(); // Get navigation state
  const { post } = useSelector((state) => state.users);
  const usersState = useSelector((state) => state.users) || {};
  const { users } = usersState;
  const { listFriend } = useSelector((state) => state.listFriends) || {};
  const [shouldFocusBio, setShouldFocusBio] = useState(false);
  const [activeTab, setActiveTab] = useState("posts"); // Track active tab
  const profileHeaderRef = useRef();
  const userId = getUserIdFromToken();

  const handleEditBioClick = () => {
    setShouldFocusBio(true);
    if (profileHeaderRef.current) {
      profileHeaderRef.current.openModal();
    }
  };

  useEffect(() => {
    dispatch(userProfile()); // Fetch user profile
    dispatch(fetchPostImagesPreview(userId)); // Fetch profile images
    dispatch(fetchListFriend()); // Fetch friends list
    dispatch(fetchPostsByOwner()); // Fetch user's posts
  }, [dispatch, userId]);

  // Set activeTab from navigation state if provided
  useEffect(() => {
    if (location.state?.activeTab === "ratings") {
      setActiveTab("ratings");
    }
  }, [location.state]);

  return (
    <>
      <div className="home-vieww">
        <Header className="header" usersProfile={users} />
      </div>
      <div className="profile-user-view">
        <ProfileHeader
          ref={profileHeaderRef}
          shouldFocusBio={shouldFocusBio}
          onModalOpened={() => setShouldFocusBio(false)}
        />
        <div className="profile-user-view__content">
          <div className="left-sidebar-container">
            <div className="left-sidebar-content">
              <ProfileIntro
                usersProfile={users}
                onEditBioClick={handleEditBioClick}
              />
              <ProfilePhotos usersProfile={users} />
              <ProfileFriends usersProfile={users} />
              <FooterHome />
            </div>
          </div>
          <div className="profile-user-view__right">
            <div className="tabs">
              <button
                className={`tab ${activeTab === "posts" ? "active" : ""}`}
                onClick={() => setActiveTab("posts")}
              >
                Tất cả bài viết
              </button>
              <button
                className={`tab ${activeTab === "ratings" ? "active" : ""}`}
                onClick={() => setActiveTab("ratings")}
              >
                Tất cả bài đánh giá chuyến đi
              </button>
            </div>

            {activeTab === "posts" && (
              <div>
                <PostInput className="post-input" usersProfile={users} />
                <AllPosts
                  usersProfile={users}
                  post={post}
                  showOwnerPosts={true}
                  isFriendProfile={false} // Thêm prop này
                  userFriendId={null}
                />
              </div>
            )}
            {activeTab === "ratings" && (
              <AllRideRatings className="all-posts" driverId={userId} />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileUserView;
