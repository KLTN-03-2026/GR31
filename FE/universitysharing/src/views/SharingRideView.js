import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Header from "../components/HomeComponent/Header";
import LeftSidebar from "../components/HomeComponent/LeftSideBarHome";
import RightSidebar from "../components/HomeComponent/RightSideBarHome";
import AllSharingRide from "../components/RideComponent/AllSharingRidePost";
import InputCreateRide from "../components/RideComponent/InputCreateRide";
import { userProfile } from "../stores/action/profileActions";
import "../styles/HomeView.scss";
import "../styles/MoblieReponsive/HomeViewMobile/HomeMobile.scss";

const SharingRideView = () => {
  const dispatch = useDispatch();
  const usersState = useSelector((state) => state.users) || {};
  const { users } = usersState;

  useEffect(() => {
    dispatch(userProfile());
  }, [dispatch]);

  return (
    <div className="home-view with-sidebar">
      <Header usersProfile={users} />

      <div className="main-content">
        {/* BỎ HẾT: overlay, left-sidebar wrapper, toggle button, Open-menu */}

        <LeftSidebar usersProfile={users} />        {/* Để nguyên, giờ nó tự xử lý cả desktop + mobile */}

        <div className="center-content">
          <InputCreateRide className="post-input" usersProfile={users} />
          <AllSharingRide className="all-posts" />
        </div>

        <RightSidebar />
      </div>
    </div>
  );
};

export default SharingRideView;
