import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import AllPostHome from "../components/HomeComponent/AllPostHome";
import Header from "../components/HomeComponent/Header";
import LeftSidebar from "../components/HomeComponent/LeftSideBarHome";
import PostInputHome from "../components/HomeComponent/PostInputHome";
import RightSidebar from "../components/HomeComponent/RightSideBarHome";
import { userProfile } from "../stores/action/profileActions";
import "../styles/HomeView.scss";
import "../styles/MoblieReponsive/HomeViewMobile/HomeMobile.scss";

const HomeView = () => {
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
        <LeftSidebar usersProfile={users} />

        <div className="center-content">
          <PostInputHome usersProfile={users} />
          <AllPostHome usersProfile={users} />
        </div>

        <RightSidebar />
      </div>
    </div>
  );
};

export default HomeView;