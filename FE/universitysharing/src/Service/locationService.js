import { toast } from "react-toastify";
import { getAccessToken } from "../Service/authService";
import axiosInstance from "../Service/axiosClient";
import store from "../stores/stores"; // Hàm tính khoảng cách Haversine (tái sử dụng từ YourRide.js)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c) / 1000; // Trả về khoảng cách tính bằng km
};

// Hàm lấy địa chỉ từ tọa độ
const getAddressFromCoordinates = async (lat, lon) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
    );
    const data = await response.json();
    return data.display_name || `${lat}, ${lon}`;
  } catch (error) {
    console.error("Error fetching address:", error);
    return `${lat}, ${lon}`;
  }
};

// Hàm gửi vị trí lên server
const sendLocationToServer = async (
  rideId,
  latitude,
  longitude,
  isNearDestination
) => {
  try {
    const location = await getAddressFromCoordinates(latitude, longitude);
    const cleanLocation = location.split(", ").slice(0, -2).join(", ");

    const payload = {
      rideId,
      latitude,
      longitude,
      isNearDestination,
      location: cleanLocation,
      userId: store.getState().auth.userId, // Lấy userId từ auth slice
    };

    const response = await axiosInstance.post(
      "/api/updatelocation/update",
      payload
    );

    console.log(
      `[LocationService] Đã gửi vị trí: ${latitude}, ${longitude} - Địa chỉ: ${cleanLocation}`
    );

    // Kiểm tra trạng thái chuyến đi
    const { rideStatus } = response.data?.data || {};
    if (rideStatus === "Completed") {
      localStorage.setItem("rideCompleted", "true");
      toast.success("Chuyến đi đã hoàn thành!");
      store.dispatch({ type: "rides/fetchRidesByUserId/pending" });
    }

    return { lat: latitude, lon: longitude };
  } catch (error) {
    console.error("[LocationService] Lỗi khi gửi vị trí:", error);
    toast.error("Không thể gửi vị trí lên server!", { toastId: "send-location-error" });
    return null;
  }
};

// Hàm parse tọa độ từ chuỗi
const parseLatLon = (latLonString) => {
  if (!latLonString || latLonString === "0") return null;
  return latLonString.split(",").map(Number);
};

// Service theo dõi vị trí
class LocationService {
  constructor() {
    this.watchId = null;
    this.intervalId = null;
    this.lastSentPosition = null;
    this.currentPosition = null;
    // Dừng theo dõi khi đóng ứng dụng
    window.addEventListener("beforeunload", () => {
      this.stopTracking();
    });
    // Lắng nghe thay đổi trạng thái xác thực
    store.subscribe(() => {
      const state = store.getState();
      const { isAuthenticated, userId } = state.auth || {}; // Giả sử có auth slice
        console.log("[LocationService] Auth state changed - isAuthenticated:", isAuthenticated, "userId:", userId); // Thêm log này

      if (!isAuthenticated || !userId || !getAccessToken()) {
        this.stopTracking();
      } else {
        this.startTracking();
      }
    });
  }

  // Kiểm tra quyền truy cập vị trí
  checkLocationPermission(callback) {
    if (!navigator.geolocation) {
      toast.error("Thiết bị không hỗ trợ định vị!", {
        toastId: "location-error",
      });
      return callback(false);
    }

    navigator.permissions
      .query({ name: "geolocation" })
      .then((result) => {
        if (result.state === "denied") {
          toast.error(
            "Vui lòng bật tính năng định vị trong trình duyệt!",
            { toastId: "location-denied" }
          );
          callback(false);
        } else if (result.state === "prompt") {
          toast.info("Vui lòng cho phép truy cập vị trí khi được yêu cầu!", {
            toastId: "location-prompt",
          });
          navigator.geolocation.getCurrentPosition(
            () => callback(true),
            (err) => {
              if (err.code !== err.PERMISSION_DENIED) {
                toast.error(
                  `Không thể truy cập vị trí: ${err.message}. Vui lòng bật định vị!`,
                  { toastId: "location-error" }
                );
              }
              callback(false);
            }
          );
        } else {
          callback(true);
        }
      })
      .catch((err) => {
        console.error("Lỗi kiểm tra quyền định vị:", err);
        toast.error("Không thể kiểm tra quyền định vị!", {
          toastId: "location-error",
        });
        callback(false);
      });
  }

  // Bắt đầu theo dõi vị trí
startTracking() {
  this.checkLocationPermission((hasPermission) => {
    if (!hasPermission) {
      console.error("[LocationService] Không có quyền truy cập vị trí");
      toast.error("Vui lòng cấp quyền truy cập vị trí!", { toastId: "permission-error" });
      return;
    }

    // Kiểm tra lại quyền trước khi bắt đầu watchPosition
    this.watchId = navigator.geolocation.watchPosition(
      ({ coords: { latitude, longitude } }) => {
        this.currentPosition = { lat: latitude, lon: longitude };
        console.log(`[LocationService] Nhận vị trí mới: ${latitude}, ${longitude}`);
      },
      (err) => {
        console.error(`[LocationService] Lỗi định vị: ${err.message}`);
        toast.error(`Lỗi lấy vị trí: ${err.message}`, { toastId: "geolocation-error" });
        this.stopTracking(); // Dừng nếu có lỗi nghiêm trọng
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    // Gửi vị trí định kỳ
    this.intervalId = setInterval(() => {
      const state = store.getState();
      const { driverRides, passengerRides, userId } = state.rides;
      const { isAuthenticated } = state.auth || {};

      if (!isAuthenticated || !userId) {
        console.warn("[LocationService] Người dùng chưa xác thực, dừng gửi vị trí");
        this.stopTracking();
        return;
      }

      const currentRide =
        (Array.isArray(driverRides) &&
          driverRides.find((ride) => ride.status === "Accepted")) ||
        (Array.isArray(passengerRides) &&
          passengerRides.find((ride) => ride.status === "Accepted"));

      if (!currentRide || !this.currentPosition) {
        console.warn(
          `[LocationService] Không gửi vị trí: ${!currentRide ? "Không có chuyến đi" : "Không có vị trí"}`
        );
        return;
      }

      const { lat, lon } = this.currentPosition;
      const isDriver = currentRide.driverId === userId;
      const endLatLon = parseLatLon(currentRide.latLonEnd);

      if (
        this.lastSentPosition &&
        calculateDistance(
          this.lastSentPosition.lat,
          this.lastSentPosition.lon,
          lat,
          lon
        ) < 0.05
      ) {
        console.log("[LocationService] Vị trí không thay đổi (< 50m), bỏ qua...");
        return;
      }

      const distanceToEnd = endLatLon
        ? calculateDistance(lat, lon, endLatLon[0], endLatLon[1])
        : Infinity;
      const isNearDestination = distanceToEnd <= 1;

      if (isDriver || currentRide.isSafetyTrackingEnabled) {
        sendLocationToServer(
          currentRide.rideId,
          lat,
          lon,
          isNearDestination
        ).then((position) => {
          if (position) this.lastSentPosition = position;
        });
      }
    }, 10000); // Gửi mỗi 10 giây để tăng tần suất
  });
}

  // Dừng theo dõi vị trí
  stopTracking() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.currentPosition = null;
    this.lastSentPosition = null;
  }
}

export const locationService = new LocationService();