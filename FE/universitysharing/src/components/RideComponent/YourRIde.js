import { TbMoodEmptyFilled } from "react-icons/tb";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { cancelRide, rateDriver } from "../../stores/action/ridePostAction";
import RatingModal from "../RatingModal";

import { AnimatePresence, motion } from "framer-motion";

import L from "leaflet";
import { useEffect, useRef, useState } from "react";
import { confirmAlert } from "react-confirm-alert";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
} from "react-leaflet";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../../contexts/AuthContext";
import axiosInstance from "../../Service/axiosClient";

// Icons
import { FaCar, FaLocationArrow } from "react-icons/fa6";
import {
  FiAlertTriangle,
  FiArchive,
  FiArrowRight,
  FiBell,
  FiCalendar,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiMapPin,
  FiNavigation,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiUser
} from "react-icons/fi";

// Leaflet assets

// Styles
import "leaflet/dist/leaflet.css";
import "react-confirm-alert/src/react-confirm-alert.css"; // Import css cho confirm alert nếu cần
import "react-toastify/dist/ReactToastify.css";
import "../../styles/YourRide.scss";

// Redux actions
import {
  fetchLocation,
  fetchRidesByUserId,
} from "../../stores/action/ridePostAction";

// --- Custom Markers ---
const startIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const endIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const movingCarIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const otherUserIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const YourRide = () => {
  // --- STATE & HOOKS ---
  const [showHistory, setShowHistory] = useState(true);
  const [routePaths, setRoutePaths] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [lastSentPosition, setLastSentPosition] = useState(null);
  const [lastNotifiedPosition, setLastNotifiedPosition] = useState(null);
  const [expandedRide, setExpandedRide] = useState(null);
  const [userId, setUserId] = useState(null);
  const [smoothedProgress, setSmoothedProgress] = useState(0);
  const [isFollowing, setIsFollowing] = useState(true);
  const [mapBounds, setMapBounds] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedRide, setSelectedRide] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [otherUserPosition, setOtherUserPosition] = useState(null);

  const mapRef = useRef(null);
  const intervalRef = useRef(null);
  const watchIdRef = useRef(null);
  const positionRef = useRef(currentPosition);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { driverRides, passengerRides, locations, loading, error } =
    useSelector((state) => state.rides);
  const { userId: authUserId, isAuthenticated, isLoading } = useAuth();
  const currentUserLocation = useSelector(
    (state) => state.rides.currentUserLocation
  );

  // Update position ref
  useEffect(() => {
    positionRef.current = currentPosition;
  }, [currentPosition]);

  // --- LOGIC EFFECTS (GIỮ NGUYÊN) ---

  // 1. Update other user location
  useEffect(() => {
    const currentRide = getCurrentRide();
    if (locations && locations.length > 0 && userId && currentRide) {
      const otherUserLocation = locations
        .filter((loc) => loc.userId !== userId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

      if (
        otherUserLocation &&
        !isNaN(otherUserLocation.latitude) &&
        !isNaN(otherUserLocation.longitude)
      ) {
        setOtherUserPosition({
          lat: otherUserLocation.latitude,
          lon: otherUserLocation.longitude,
          isDriver: otherUserLocation.isDriver,
          timestamp: otherUserLocation.timestamp,
        });
      }
    }
  }, [locations, userId, driverRides, passengerRides]);

  // 2. Fetch location periodically
  useEffect(() => {
    const currentRide = getCurrentRide();
    if (currentRide && currentRide.rideId) {
      dispatch(fetchLocation(currentRide.rideId));
      const fetchInterval = setInterval(() => {
        dispatch(fetchLocation(currentRide.rideId));
      }, 20000);
      return () => clearInterval(fetchInterval);
    }
  }, [dispatch, driverRides, passengerRides]);

  // 3. Check Permissions
  const checkLocationPermission = (callback) => {
    if (!navigator.geolocation) {
      toast.error("Thiết bị không hỗ trợ định vị!");
      return callback(false);
    }
    navigator.permissions
      .query({ name: "geolocation" })
      .then((result) => {
        if (result.state === "denied") {
          toast.error("Vui lòng bật tính năng định vị!");
          return callback(false);
        } else if (result.state === "prompt") {
          navigator.geolocation.getCurrentPosition(
            () => callback(true),
            (err) => callback(false)
          );
        } else {
          callback(true);
        }
      })
      .catch((err) => {
        console.error(err);
        callback(false);
      });
  };

  useEffect(() => {
    checkLocationPermission((has) =>
      console.log(has ? "Quyền đã cấp" : "Chưa có quyền")
    );
  }, []);

  // 4. Auth & User ID
  useEffect(() => {
    if (isAuthenticated && authUserId) {
      setUserId(authUserId);
      dispatch(fetchRidesByUserId());
    } else if (!isLoading && !isAuthenticated) {
      setUserId(null);
    }
  }, [isAuthenticated, authUserId, isLoading, dispatch]);

  // 5. Map Ready
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.invalidateSize();
      setMapReady(true);
    }
  }, [mapRef.current]);

  // 6. Notifications
  useEffect(() => {
    if (locations && locations.length > 0) {
      const newNotifications = locations.map((loc, idx) => ({
        id: loc.id || `location-${idx}-${Date.now()}`,
        message: `${
          loc.userId === userId ? "Bạn" : loc.isDriver ? "Tài xế" : "Hành khách"
        } đã cập nhật vị trí tại: ${
          loc.location || `${loc.latitude}, ${loc.longitude}`
        }`,
        timestamp: loc.timestamp,
        isNew: false,
      }));
      setNotifications(newNotifications);
    }
  }, [locations, userId]);

  // 7. Map Bounds
  useEffect(() => {
    const currentRide = getCurrentRide();
    if (currentRide && mapReady) {
      const start = parseLatLon(currentRide.latLonStart);
      const end = parseLatLon(currentRide.latLonEnd);
      if (start && end) {
        const points = [start, end];
        if (currentPosition)
          points.push([currentPosition.lat, currentPosition.lon]);
        if (otherUserPosition)
          points.push([otherUserPosition.lat, otherUserPosition.lon]);

        const validPoints = points.filter(
          (p) => p && !isNaN(p[0]) && !isNaN(p[1])
        );
        if (validPoints.length > 0) {
          const bounds = L.latLngBounds(validPoints).pad(0.2);
          setMapBounds(bounds);
          if (mapRef.current) {
            mapRef.current.flyToBounds(bounds, { maxZoom: 16, duration: 1 });
          }
        }
      }
    }
  }, [currentPosition, otherUserPosition, mapReady]);

  // 8. Auto Follow
  useEffect(() => {
    if (isFollowing && mapRef.current && currentPosition && mapReady) {
      const currentZoom = mapRef.current.getZoom() || 14;
      mapRef.current.flyTo(
        [currentPosition.lat, currentPosition.lon],
        currentZoom >= 12 && currentZoom <= 16 ? currentZoom : 14,
        { duration: 0.5 }
      );
    }
  }, [currentPosition, isFollowing]);

  // --- HELPER FUNCTIONS ---
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    return (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * R) / 1000;
  };

  const getAddressFromCoordinates = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
      );
      const data = await response.json();
      return data.display_name || `${lat}, ${lon}`;
    } catch {
      return `${lat}, ${lon}`;
    }
  };

  useEffect(() => {
    const rideCompleted = localStorage.getItem("rideCompleted");
    if (rideCompleted === "true") {
      toast.success("Chuyến đi đã hoàn thành!");
      localStorage.removeItem("rideCompleted");
    }
  }, []);

  const sendLocationToServer = async (
    rideId,
    latitude,
    longitude,
    isNearDestination
  ) => {
    try {
      const location = await getAddressFromCoordinates(latitude, longitude);
      const cleanLocation = location.split(", ").slice(0, -2).join(", ");
      const token = localStorage.getItem("token");

      const payload = {
        rideId,
        latitude,
        longitude,
        isNearDestination,
        location: cleanLocation,
      };

      const response = await axiosInstance.post(
        "/api/updatelocation/update",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setLastSentPosition({ lat: latitude, lon: longitude });
      setNotifications((prev) => [
        ...prev,
        {
          id: `location-${Date.now()}`,
          message: `Bạn đã cập nhật vị trí tại: ${cleanLocation}`,
          timestamp: new Date().toISOString(),
          isNew: true,
        },
      ]);

      if (response.data?.data?.rideStatus === "Completed") {
        localStorage.setItem("rideCompleted", "true");
        window.location.reload();
      }
    } catch (error) {
      console.error("Error sending location:", error);
    }
  };

  // Tracking Geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      ({ coords: { latitude, longitude } }) => {
        const newPosition = { lat: latitude, lon: longitude };
        setCurrentPosition((prev) => {
          if (
            !prev ||
            calculateDistance(prev.lat, prev.lon, latitude, longitude) > 0.01
          ) {
            return newPosition;
          }
          return prev;
        });
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
    return () => {
      if (watchIdRef.current)
        navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  // Interval Sending
  useEffect(() => {
    const currentRide = getCurrentRide();
    if (!currentRide || !userId) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    const rideId = currentRide.rideId;
    const endLatLon = parseLatLon(currentRide.latLonEnd);

    intervalRef.current = setInterval(() => {
      const pos = positionRef.current;
      if (!pos) return;

      const { lat, lon } = pos;
      const distanceToEnd = endLatLon
        ? calculateDistance(lat, lon, endLatLon[0], endLatLon[1])
        : Infinity;
      const isNearDestination = distanceToEnd <= 1;
      sendLocationToServer(rideId, lat, lon, isNearDestination);
    }, 20000);

    return () => clearInterval(intervalRef.current);
  }, [driverRides, passengerRides, userId]);

  // Routing
  const fetchRoute = async (rideId, startLatLon, endLatLon) => {
    const apiKey = process.env.REACT_APP_GRAPHHOPPER_API_KEY;
    const url = `https://graphhopper.com/api/1/route?point=${startLatLon.join(
      ","
    )}&point=${endLatLon.join(
      ","
    )}&vehicle=car&locale=vi&key=${apiKey}&points_encoded=false`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.paths?.[0]?.points?.coordinates) {
        const coords = data.paths[0].points.coordinates.map(([lon, lat]) => [
          lat,
          lon,
        ]);
        setRoutePaths((prev) => ({ ...prev, [rideId]: coords }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const parseLatLon = (str) =>
    !str || str === "0" ? null : str.split(",").map(Number);

  useEffect(() => {
    const currentRide = getCurrentRide();
    if (currentRide) {
      const start = parseLatLon(currentRide.latLonStart);
      const end = parseLatLon(currentRide.latLonEnd);
      if (start && end && !routePaths[currentRide.rideId]) {
        fetchRoute(currentRide.rideId, start, end);
      }
    }
  }, [driverRides, passengerRides, routePaths]);

  // Calculations
  const calculatePolylineLength = (coords) => {
    let total = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      total += calculateDistance(
        coords[i][0],
        coords[i][1],
        coords[i + 1][0],
        coords[i + 1][1]
      );
    }
    return total;
  };

  const findNearestPoint = (point, coords) => {
    let nearest = null;
    let minDst = Infinity;
    let segIdx = -1;
    let frac = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const A = point[0] - p1[0];
      const B = point[1] - p1[1];
      const C = p2[0] - p1[0];
      const D = p2[1] - p1[1];
      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      let t = lenSq !== 0 ? dot / lenSq : -1;
      let closest =
        t < 0 ? p1 : t > 1 ? p2 : [p1[0] + t * C, p1[1] + t * D];
      const dist = calculateDistance(point[0], point[1], closest[0], closest[1]);
      if (dist < minDst) {
        minDst = dist;
        nearest = closest;
        segIdx = i;
        frac = t < 0 ? 0 : t > 1 ? 1 : t;
      }
    }
    return { nearest, segIdx, frac };
  };

  const calculateTraveled = (currPos, paths, rideId) => {
    if (!paths[rideId] || !currPos) return 0;
    const poly = paths[rideId];
    if (poly.length < 2) return 0;
    const { nearest, segIdx, frac } = findNearestPoint(
      [currPos.lat, currPos.lon],
      poly
    );
    if (!nearest || segIdx === -1) return 0;
    let traveled = 0;
    for (let i = 0; i < segIdx; i++) {
      traveled += calculateDistance(
        poly[i][0],
        poly[i][1],
        poly[i + 1][0],
        poly[i + 1][1]
      );
    }
    traveled +=
      calculateDistance(
        poly[segIdx][0],
        poly[segIdx][1],
        nearest[0],
        nearest[1]
      ) * frac;
    return traveled;
  };

  const calculateProgress = (ride, currPos, paths) => {
    if (!ride || !currPos || !paths || !paths[ride.rideId]) return 0;
    const total = calculatePolylineLength(paths[ride.rideId]);
    const traveled = calculateTraveled(currPos, paths, ride.rideId);
    return total === 0 ? 0 : Math.min((traveled / total) * 100, 100);
  };

  const calculateRemaining = (ride, currPos, paths) => {
    if (!ride || !currPos || !paths || !paths[ride.rideId]) return 0;
    const total = calculatePolylineLength(paths[ride.rideId]);
    const traveled = calculateTraveled(currPos, paths, ride.rideId);
    return Math.max(total - traveled, 0);
  };

  const getCurrentRide = () =>
    (Array.isArray(driverRides)
      ? driverRides.find((ride) => ride.status === "Accepted")
      : null) ||
    (Array.isArray(passengerRides)
      ? passengerRides.find((ride) => ride.status === "Accepted")
      : null);

  const currentRide = getCurrentRide();
  const progress =
    currentRide && currentRide.rideId && routePaths[currentRide.rideId]
      ? calculateProgress(currentRide, currentPosition, routePaths)
      : 0;

  useEffect(() => {
    const timer = setTimeout(() => setSmoothedProgress(progress), 500);
    return () => clearTimeout(timer);
  }, [progress]);

  // Actions
  const handleCancelRide = (rideId) => {
    toast.info("Đang hủy chuyến đi...");
    setTimeout(() => {
      dispatch(cancelRide(rideId))
        .unwrap()
        .then(() => dispatch(fetchRidesByUserId()))
        .catch((e) => toast.error(`Lỗi: ${e}`));
    }, 3000);
  };

  const confirmCancelRide = (rideId) => {
    confirmAlert({
      title: "Xác nhận hủy",
      message: "Bạn có chắc chắn muốn hủy chuyến đi này?",
      buttons: [
        { label: "Có", onClick: () => handleCancelRide(rideId) },
        { label: "Không" },
      ],
    });
  };

  const handleRateDriver = (rideId, driverId, rating, comment) => {
    dispatch(rateDriver({ rideId, driverId, rating, comment }))
      .unwrap()
      .then(() => {
        dispatch(fetchRidesByUserId());
        toast.success("Đánh giá thành công!");
      })
      .catch(() => toast.error("Lỗi khi gửi đánh giá!"));
  };

  // Render Variables
  if (loading) return <div className="loading">Đang tải dữ liệu...</div>;
  if (error) return <div className="error">Lỗi: {error.message || error}</div>;

  const isDriver = currentRide && currentRide.driverId === userId;
  const remainingDistance =
    currentRide && currentRide.rideId && routePaths[currentRide.rideId]
      ? calculateRemaining(currentRide, currentPosition, routePaths)
      : 0;
  const completedRides = [
    ...(driverRides || []),
    ...(passengerRides || []),
  ].filter((ride) => ride.status === "Completed");

  const cityBounds = L.latLngBounds(
    L.latLng(15.9, 107.9),
    L.latLng(16.2, 108.4)
  );

  return (
    <div className="rides-app">
      <div className="container">
        {/* HEADER */}
        <header className="rides-header">
          <h2>
            <FiNavigation className="header-icon" /> Chuyến đi của bạn
          </h2>
          <div className="header-subtitle">
            Theo dõi hành trình và lịch sử di chuyển
          </div>
        </header>

        {/* ACTIVE RIDE SECTION */}
        <section className="active-ride-container">
          <AnimatePresence mode="wait">
            {currentRide ? (
              <motion.div
                key="active-ride"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`ride-card ${
                  isDriver ? "driver-mode" : "passenger-mode"
                }`}
              >
                {/* 1. Summary Header (Click to Toggle) */}
                <div
                  className="ride-summary"
                  onClick={() =>
                    setExpandedRide(
                      expandedRide === currentRide.rideId
                        ? null
                        : currentRide.rideId
                    )
                  }
                >
                  {/* Role Icon */}
                  <div
                    className={`role-badge ${isDriver ? "driver" : "passenger"}`}
                  >
                    {isDriver ? <FaCar /> : <FiUser />}
                    <span>{isDriver ? "Tài xế" : "Khách"}</span>
                  </div>

                  {/* Route & Progress */}
                  <div className="route-info">
                    <div className="locations-flow">
                      <span className="loc">{currentRide.startLocation}</span>
                      <FiArrowRight className="arrow" />
                      <span className="loc">{currentRide.endLocation}</span>
                    </div>

                    <div className="progress-wrapper">
                      <div className="progress-track">
                        <motion.div
                          className="progress-bar"
                          initial={{ width: 0 }}
                          animate={{ width: `${smoothedProgress}%` }}
                          transition={{ duration: 1 }}
                        >
                          <div className="car-indicator">
                            <FaCar />
                          </div>
                        </motion.div>
                      </div>
                      <span className="progress-text">
                        Đã đi {Math.round(smoothedProgress)}% • Còn{" "}
                        {remainingDistance.toFixed(1)} km
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="action-area">
                    <div className="status-pill">
                      <div className="dot"></div> Đang di chuyển
                    </div>
                    <button
                      className="btn-cancel"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmCancelRide(currentRide.rideId);
                      }}
                    >
                      Hủy chuyến
                    </button>
                    {expandedRide === currentRide.rideId ? (
                      <FiChevronUp size={20} color="#94a3b8" />
                    ) : (
                      <FiChevronDown size={20} color="#94a3b8" />
                    )}
                  </div>
                </div>

                {/* 2. Expanded Details & Map */}
                <AnimatePresence>
                  {expandedRide === currentRide.rideId && (
                    <motion.div
                      className="ride-details-panel"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      <div className="panel-content">
                        {/* Info Stats */}
                        <div className="info-grid">
                          <div className="info-card">
                            <label>
                              <FiClock /> Thời gian bắt đầu
                            </label>
                            <span>
                              {currentRide.startTime
                                ? new Date(
                                    currentRide.startTime
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "--:--"}
                            </span>
                          </div>
                          <div className="info-card">
                            <label>
                              <FiCalendar /> Dự kiến đến
                            </label>
                            <span>
                              {currentRide.estimatedDuration} phút nữa
                            </span>
                          </div>
                          <div className="info-card">
                            <label>
                              <FiShield /> Trạng thái an toàn
                            </label>
                            <span
                              className={
                                currentRide.isSafetyTrackingEnabled
                                  ? "badge-safe"
                                  : "badge-warn"
                              }
                            >
                              {currentRide.isSafetyTrackingEnabled ? (
                                <>
                                  <FiCheckCircle /> Được bảo vệ
                                </>
                              ) : (
                                <>
                                  <FiAlertTriangle /> Cảnh báo
                                </>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Map & Notifications Layout */}
                        <div className="map-notify-split">
                          {/* Left: Map */}
                          <div className="map-box">
                            {parseLatLon(currentRide.latLonStart) && (
                              <MapContainer
                                ref={mapRef}
                                center={[16.06778, 108.22346]}
                                zoom={14}
                                bounds={mapBounds}
                                minZoom={12}
                                maxBounds={cityBounds}
                                whenCreated={(map) => {
                                  mapRef.current = map;
                                  map.on("zoomstart", () =>
                                    setIsFollowing(false)
                                  );
                                  map.on("dragstart", () =>
                                    setIsFollowing(false)
                                  );
                                }}
                              >
                                <TileLayer
                                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                />
                                <Marker
                                  position={parseLatLon(
                                    currentRide.latLonStart
                                  )}
                                  icon={startIcon}
                                >
                                  <Popup>Điểm đón</Popup>
                                </Marker>
                                <Marker
                                  position={parseLatLon(currentRide.latLonEnd)}
                                  icon={endIcon}
                                >
                                  <Popup>Điểm đến</Popup>
                                </Marker>
                                {currentPosition && (
                                  <Marker
                                    position={[
                                      currentPosition.lat,
                                      currentPosition.lon,
                                    ]}
                                    icon={movingCarIcon}
                                  >
                                    <Popup>Vị trí của bạn</Popup>
                                  </Marker>
                                )}
                                {otherUserPosition &&
                                  !isNaN(otherUserPosition.lat) && (
                                    <Marker
                                      position={[
                                        otherUserPosition.lat,
                                        otherUserPosition.lon,
                                      ]}
                                      icon={otherUserIcon}
                                    >
                                      <Popup>
                                        {otherUserPosition.isDriver
                                          ? "Tài xế"
                                          : "Khách"}
                                      </Popup>
                                    </Marker>
                                  )}
                                {routePaths[currentRide.rideId] && (
                                  <Polyline
                                    positions={routePaths[currentRide.rideId]}
                                    color={isDriver ? "#3b82f6" : "#10b981"}
                                    weight={5}
                                  />
                                )}
                              </MapContainer>
                            )}
                            <div className="map-overlay-ctrl">
                              <button
                                onClick={() => {
                                  checkLocationPermission((has) => {
                                    if (has && currentPosition) {
                                      setIsFollowing(true);
                                      mapRef.current.flyTo(
                                        [currentPosition.lat, currentPosition.lon],
                                        15
                                      );
                                    }
                                  });
                                }}
                                className={isFollowing ? "active" : ""}
                                title="Theo dõi tôi"
                              >
                                <FaLocationArrow />
                              </button>
                            </div>
                          </div>

                          {/* Right: Notifications */}
                          <div className="notify-box">
                            <div className="notify-header">
                              <h4>
                                <FiBell /> Thông báo
                              </h4>
                              <button
                                className="btn-refresh"
                                onClick={() => {
                                  setNotifications([]);
                                  dispatch(fetchLocation(currentRide.rideId));
                                }}
                                title="Làm mới"
                              >
                                <FiRefreshCw />
                              </button>
                            </div>
                            <div className="notify-list">
                              {notifications.length > 0 ? (
                                notifications.map((notif, idx) => (
                                  <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="notify-item"
                                  >
                                    <FiMapPin className="icon" />
                                    <div className="content">
                                      <p>{notif.message}</p>
                                      <span className="time">
                                        {new Date(
                                          notif.timestamp
                                        ).toLocaleTimeString()}
                                      </span>
                                    </div>
                                  </motion.div>
                                ))
                              ) : (
                                <div className="empty-state">
                                  Chưa có cập nhật mới
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              // EMPTY STATE
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="empty-ride-placeholder"
              >
                <TbMoodEmptyFilled className="icon-placeholder" />
                <h3>Chưa có chuyến đi nào</h3>
                <p>Hãy bắt đầu hành trình mới của bạn ngay bây giờ!</p>
                <button
                  className="btn-find"
                  onClick={() => navigate("/sharing-ride")}
                >
                  <FiSearch /> Tìm chuyến đi
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* HISTORY SECTION */}
        <section className="history-section">
          <div className="history-header">
            <h3>
              <FiArchive /> Lịch sử chuyến đi
            </h3>
            <button
              className="btn-toggle"
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? "Ẩn danh sách" : "Xem tất cả"}
              {showHistory ? <FiChevronUp /> : <FiChevronDown />}
            </button>
          </div>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                className="history-list"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                {completedRides.length > 0 ? (
                  completedRides.map((ride) => {
                    const isMyDriverRide = ride.driverId === userId;
                    const isRated = ride.isRating;
                    return (
                      <div key={ride.rideId} className="history-item">
                        <div
                          className={`icon-box ${
                            isMyDriverRide ? "driver" : "passenger"
                          }`}
                        >
                          {isMyDriverRide ? <FaCar /> : <FiUser />}
                        </div>
                        <div className="info">
                          <div className="route">
                            {ride.startLocation}{" "}
                            <FiArrowRight className="arr" /> {ride.endLocation}
                          </div>
                          <div className="meta">
                            <span>
                              {new Date(ride.startTime).toLocaleDateString()}
                            </span>
                            <span>• {ride.estimatedDuration} phút</span>
                            {ride.isSafetyTrackingEnabled && (
                              <span style={{ color: "#10b981" }}>
                                • An toàn
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="actions">
                          <span className="status-badge">Hoàn thành</span>
                          {!isMyDriverRide && !isRated ? (
                            <button
                              className="btn-rate"
                              onClick={() => {
                                setSelectedRide(ride);
                                setShowRatingModal(true);
                              }}
                            >
                              Đánh giá
                            </button>
                          ) : (
                            isRated && (
                              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                                <FiCheckCircle /> Đã đánh giá
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: "center", color: "#94a3b8" }}>
                    Chưa có lịch sử chuyến đi.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* MODAL */}
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          ride={selectedRide}
          onSubmit={handleRateDriver}
        />
      </div>
    </div>
  );
};

export default YourRide;