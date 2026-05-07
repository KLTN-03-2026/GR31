// components/LocationTracker.js
import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext'; // Để kiểm tra trạng thái đăng nhập
import { setCurrentUserLocation } from "../../stores/action/ridePostAction"; // hoặc locationAction

// Hàm tính khoảng cách giữa hai điểm (ví dụ: Haversine formula)
// Hàm này có thể đặt ở một file tiện ích riêng
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180; // φ, λ in radians
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const d = R * c; // in metres
  return d; // Trả về khoảng cách theo mét
};

const LocationTracker = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const currentRide = useSelector((state) => state.rides.currentRide); // Lấy currentRide từ Redux

  // Ref để lưu vị trí cuối cùng đã được lưu vào Redux / gửi lên server
  const lastSavedLocationRef = useRef(null);
  // Ref để lưu ID của watchPosition để có thể clear
  const watchIdRef = useRef(null);

  const handleGeolocationSuccess = useCallback((position) => {
    const { latitude, longitude } = position.coords;
    const newLocation = { lat: latitude, lng: longitude }; // Chuyển đổi định dạng nếu cần

    // Chỉ cập nhật nếu vị trí thay đổi đáng kể (ví dụ > 10 mét)
    if (
      !lastSavedLocationRef.current ||
      calculateDistance(
        lastSavedLocationRef.current.lat,
        lastSavedLocationRef.current.lng,
        latitude,
        longitude
      ) > 10 // 10 mét
    ) {
      console.log("Vị trí mới:", newLocation);
      // Dispatch action để cập nhật vị trí vào Redux store
      dispatch(setCurrentUserLocation(newLocation));
      lastSavedLocationRef.current = newLocation; // Cập nhật ref

      // Optional: Nếu bạn muốn gửi vị trí lên server mỗi khi nó thay đổi đáng kể
      // và có một chuyến đi đang hoạt động.
      // if (currentRide) {
      //   dispatch(sendLocationToServer({
      //     rideId: currentRide.id, // Đảm bảo currentRide có id
      //     location: newLocation
      //   }));
      // }
    }
  }, [dispatch /*, currentRide (thêm vào nếu dùng logic currentRide ở đây) */]);

  const handleGeolocationError = useCallback((error) => {
    console.error("Lỗi khi lấy vị trí:", error);
    // Tùy chọn: Hiển thị thông báo cho người dùng
    // toast.error("Không thể lấy vị trí hiện tại. Vui lòng bật dịch vụ vị trí.");
  }, []);

  useEffect(() => {
    // Điều kiện theo dõi:
    // 1. Người dùng đã đăng nhập (`isAuthenticated`).
    // 2. Tùy chọn: Có một chuyến đi đang diễn ra (`currentRide`).
    //    Nếu bạn muốn theo dõi toàn cục từ đăng nhập đến đăng xuất (ko phụ thuộc ride), bỏ `&& currentRide`.
    const shouldStartTracking = isAuthenticated; // || (isAuthenticated && currentRide); // Thay đổi tùy theo yêu cầu

    if (shouldStartTracking) {
      console.log("[LocationTracker] Bắt đầu theo dõi vị trí...");
      if (navigator.geolocation) {
        // Dừng theo dõi cũ trước khi bắt đầu cái mới (nếu có)
        if (watchIdRef.current) {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
          handleGeolocationSuccess,
          handleGeolocationError,
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 } // maximumAge: 0 để luôn lấy vị trí mới nhất
        );
      } else {
        toast.error("Trình duyệt không hỗ trợ Geolocation.");
      }
    } else {
      console.log("[LocationTracker] Người dùng chưa đăng nhập hoặc không có chuyến đi, dừng theo dõi vị trí.");
      // Dừng theo dõi khi điều kiện không còn đúng
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      lastSavedLocationRef.current = null; // Reset vị trí đã lưu
    }

    return () => {
      console.log("[LocationTracker] Cleanup: Dừng theo dõi vị trí.");
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      lastSavedLocationRef.current = null; // Reset vị trí đã lưu khi unmount
    };
    // Dependencies: isAuthenticated, currentRide (nếu bạn muốn theo dõi theo ride),
    // và các hàm callback để tránh loop vô hạn.
  }, [isAuthenticated, currentRide, handleGeolocationSuccess, handleGeolocationError]); // Thêm currentRide nếu bạn dùng nó làm điều kiện

  return null; // Component này không render UI
};

export default LocationTracker;