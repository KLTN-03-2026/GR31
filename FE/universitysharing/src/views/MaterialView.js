// File: views/MaterialView.js

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Header from "../components/HomeComponent/Header";
import LeftSidebar from "../components/HomeComponent/LeftSideBarHome";
import RightSidebar from "../components/HomeComponent/RightSideBarHome";
import StudyMaterial from "../components/Materials/StudyMaterial";
import { userProfile } from "../stores/action/profileActions";
import "../styles/Material/MaterialView.scss"; // Import SCSS mới

const MaterialView = () => {
  const dispatch = useDispatch();
  const usersState = useSelector((state) => state.users) || {};
  const { users } = usersState;
  
  // Giả sử bạn có state để biết sidebar có collapsed hay không
  const isSidebarCollapsed = useSelector(state => state.ui?.leftSidebarCollapsed || false);

  useEffect(() => {
    dispatch(userProfile());
  }, [dispatch]);

  return (
    <div className={`home-view with-sidebar ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Header usersProfile={users} />

      <div className="main-content">
        <LeftSidebar usersProfile={users} />
        
        <div className="center-content">
          <StudyMaterial className="study-materials" usersProfile={users} />
        </div>

        <RightSidebar />
      </div>
    </div>
  );
};

export default MaterialView;