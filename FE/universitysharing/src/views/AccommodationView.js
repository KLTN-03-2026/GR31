// File: AccommodationView.js
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import AllAccommodationPosts from "../components/Accommodation/AllAccommodationPosts";
import Header from "../components/HomeComponent/Header";
import { userProfile } from "../stores/action/profileActions";
import "../styles/Accommodation/AccommodationView.scss";

const AccommodationView = () => {
 const dispatch = useDispatch();
  const usersState = useSelector((state) => state.users) || {};
  const { users } = usersState;

  useEffect(() => {
    dispatch(userProfile());
  }, [dispatch]);


  return (
    <div className="accommodation-view">
      <Header className="header" usersProfile={users} />
      <div className="accommodation-main-content">
       

        {/* Main content - Bản đồ chiếm phần còn lại */}
        <div className="accommodation-map-content">
          <AllAccommodationPosts />
        </div>
      </div>
    </div>
  );
};

export default AccommodationView;