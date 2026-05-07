import * as tt from '@tomtom-international/web-sdk-maps';
import '@tomtom-international/web-sdk-maps/dist/maps.css';
import { useCallback, useEffect, useRef, useState } from "react";
import { FaClock, FaPaperPlane, FaSearchLocation, FaTimes } from "react-icons/fa";
import { MdMyLocation } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import avatarDefault from "../../assets/AvatarDefault.png";
import { createPost } from "../../stores/action/ridePostAction";
import { resetPostState } from "../../stores/reducers/ridePostReducer";
import "../../styles/CreateRideModal.scss";

// Giới hạn Đà Nẵng
const DA_NANG_BOUNDS = {
  southWest: { lat: 15.975, lng: 108.05 },
  northEast: { lat: 16.15, lng: 108.35 }
};

const CreateRidePost = ({ onClose, usersProfile }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const startMarkerRef = useRef(null);
  const endMarkerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const startSearchRef = useRef(null);
  const endSearchRef = useRef(null);

  const [selectedTime, setSelectedTime] = useState("");
  const [startLocation, setStartLocation] = useState(null);
  const [endLocation, setEndLocation] = useState(null);
  const [startLabel, setStartLabel] = useState("");
  const [endLabel, setEndLabel] = useState("");
  const [content, setContent] = useState("");
  const [minDateTime, setMinDateTime] = useState("");
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [endSuggestions, setEndSuggestions] = useState([]);
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [showEndSuggestions, setShowEndSuggestions] = useState(false);
  const [isSearchingStart, setIsSearchingStart] = useState(false);
  const [isSearchingEnd, setIsSearchingEnd] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const dispatch = useDispatch();
  const { loading, error, success } = useSelector((state) => state.rides);

  const API_KEY = process.env.REACT_APP_TOMTOM_API_KEY;

  // === 1. Khởi tạo bản đồ - Sửa lỗi fetch ===
  // === 1. Khởi tạo bản đồ - Sửa lỗi fetch ===
const initializeMap = useCallback(() => {
  if (!API_KEY) {
    toast.error("Thiếu TomTom API Key");
    return;
  }
  
  if (mapInstanceRef.current) {
    return;
  }

  try {
    // Thay đổi: Sử dụng style chính thức của TomTom từ docs mới nhất
    const map = tt.map({
      key: API_KEY,
      container: mapContainerRef.current,
      center: [108.2022, 16.0544],
      zoom: 12,
      style: `https://api.tomtom.com/map/1/style/20.0.0-8/basic_main.json?key=${API_KEY}`,
      maxBounds: [
        [DA_NANG_BOUNDS.southWest.lng, DA_NANG_BOUNDS.southWest.lat],
        [DA_NANG_BOUNDS.northEast.lng, DA_NANG_BOUNDS.northEast.lat]
      ]
    });

    mapInstanceRef.current = map;

    map.on('load', () => {
      console.log('TomTom Map loaded successfully');
      setMapLoaded(true);
      
      // Fit bounds sau khi map load
      map.fitBounds([
        [DA_NANG_BOUNDS.southWest.lng, DA_NANG_BOUNDS.southWest.lat],
        [DA_NANG_BOUNDS.northEast.lng, DA_NANG_BOUNDS.northEast.lat]
      ], { padding: 20, duration: 0 });
    });

    map.on('error', (e) => {
      console.error('Map loading error:', e);
      toast.error("Lỗi tải bản đồ. Vui lòng thử lại.");
    });

    // Xóa: map.on('sourcedata'...) vì không cần thiết với style chính thức

    map.addControl(new tt.NavigationControl());
    map.setMinZoom(11);
    map.setMaxZoom(18);

  } catch (error) {
    console.error('Map initialization error:', error);
    toast.error("Không thể khởi tạo bản đồ");
  }

  // Cleanup function
  return () => {
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (err) {
        console.warn('Map removal error:', err);
      }
      mapInstanceRef.current = null;
      setMapLoaded(false);
    }
  };
}, [API_KEY]);

  // === 2. Tìm kiếm địa chỉ với gợi ý ===
  const searchLocation = async (query, type) => {
    if (!query.trim()) {
      if (type === 'start') {
        setStartSuggestions([]);
        setShowStartSuggestions(false);
      } else {
        setEndSuggestions([]);
        setShowEndSuggestions(false);
      }
      return;
    }

    try {
      if (type === 'start') {
        setIsSearchingStart(true);
      } else {
        setIsSearchingEnd(true);
      }

      const response = await fetch(
        `https://api.tomtom.com/search/2/search/${encodeURIComponent(query)}.json?key=${API_KEY}&limit=5&countrySet=VN&lat=16.0544&lon=108.2022&radius=20000&language=vi-VN`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const results = data.results?.map(r => ({
        label: r.address.freeformAddress,
        lngLat: [r.position.lon, r.position.lat],
        fullAddress: r.address
      })) || [];

      if (type === 'start') {
        setStartSuggestions(results);
        setShowStartSuggestions(true);
        setIsSearchingStart(false);
      } else {
        setEndSuggestions(results);
        setShowEndSuggestions(true);
        setIsSearchingEnd(false);
      }
    } catch (err) {
      console.error("Search error:", err);
      if (type === 'start') {
        setIsSearchingStart(false);
        setStartSuggestions([]);
      } else {
        setIsSearchingEnd(false);
        setEndSuggestions([]);
      }
      // toast.error("Lỗi kết nối khi tìm kiếm địa chỉ");
    }
  };

  // === 3. Cập nhật điểm đi ===
  const updateStartLocation = async (lngLat, addressLabel = null) => {
    if (!mapLoaded) {
      toast.warning("Bản đồ đang tải, vui lòng chờ...");
      return;
    }

    setStartLocation(lngLat);
    
    let label = addressLabel;
    if (!label) {
      label = await reverseGeocode(lngLat[0], lngLat[1]);
    }
    
    setStartLabel(label || `${lngLat[1].toFixed(6)}, ${lngLat[0].toFixed(6)}`);
    updateMarker(startMarkerRef, lngLat, 'start', 'Điểm đi');
    setShowStartSuggestions(false);
    
    if (endLocation) {
      calculateRoute();
    } else {
      mapInstanceRef.current.flyTo({
        center: lngLat,
        zoom: 14,
        duration: 1000
      });
    }
  };

  // === 4. Cập nhật điểm đến ===
  const updateEndLocation = async (lngLat, addressLabel = null) => {
    if (!mapLoaded) {
      toast.warning("Bản đồ đang tải, vui lòng chờ...");
      return;
    }

    setEndLocation(lngLat);
    
    let label = addressLabel;
    if (!label) {
      label = await reverseGeocode(lngLat[0], lngLat[1]);
    }
    
    setEndLabel(label || `${lngLat[1].toFixed(6)}, ${lngLat[0].toFixed(6)}`);
    updateMarker(endMarkerRef, lngLat, 'end', 'Điểm đến');
    setShowEndSuggestions(false);
    
    if (startLocation) {
      calculateRoute();
    } else {
      mapInstanceRef.current.flyTo({
        center: lngLat,
        zoom: 14,
        duration: 1000
      });
    }
  };

  // === 5. Cập nhật marker ===
  const updateMarker = (markerRef, lngLat, type, text) => {
    if (!mapInstanceRef.current || !mapLoaded) {
      console.warn('Map not ready for markers');
      return;
    }

    try {
      // Remove existing marker
      if (markerRef.current) {
        markerRef.current.remove();
      }

      const el = document.createElement('div');
      el.className = `ride-marker ${type}`;
      el.innerHTML = `
        <div class="marker-pin ${type}"></div>
        <div class="marker-text">${text}</div>
      `;

      markerRef.current = new tt.Marker({ 
        element: el,
        anchor: 'bottom'
      })
        .setLngLat(lngLat)
        .addTo(mapInstanceRef.current);
    } catch (err) {
      console.error('Error updating marker:', err);
    }
  };

  // === 6. Reverse Geocode ===
  const reverseGeocode = async (lng, lat) => {
    try {
      const response = await fetch(
        `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lng}.json?key=${API_KEY}&language=vi-VN`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.addresses?.[0]?.address?.freeformAddress || null;
    } catch (err) {
      console.error("Reverse geocode error:", err);
      return null;
    }
  };

  // === 7. Tính tuyến đường - Sửa lỗi fetch ===
  const calculateRoute = async () => {
    if (!startLocation || !endLocation || !mapLoaded) {
      return;
    }

    // Remove existing route
    if (routeLayerRef.current) {
      try {
        if (mapInstanceRef.current.getLayer('route')) {
          mapInstanceRef.current.removeLayer('route');
        }
        if (mapInstanceRef.current.getSource('route')) {
          mapInstanceRef.current.removeSource('route');
        }
      } catch (err) {
        console.warn('Error removing route:', err);
      }
    }

    try {
      const response = await fetch(
        `https://api.tomtom.com/routing/1/calculateRoute/${startLocation[1]},${startLocation[0]}:${endLocation[1]},${endLocation[0]}/json?key=${API_KEY}&routeType=fastest`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.routes?.[0]?.legs?.[0]?.points) {
        const points = data.routes[0].legs[0].points.map(p => [p.longitude, p.latitude]);
        
        // Create GeoJSON for the route
        const routeGeoJSON = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: points
          },
          properties: {}
        };

        // Add route source and layer
        mapInstanceRef.current.addSource('route', {
          type: 'geojson',
          data: routeGeoJSON
        });

        mapInstanceRef.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#1976d2',
            'line-width': 4,
            'line-opacity': 0.8
          }
        });

        routeLayerRef.current = true;

        // Fit map to show route
        const bounds = new tt.LngLatBounds();
        bounds.extend(startLocation);
        bounds.extend(endLocation);
        
        mapInstanceRef.current.fitBounds(bounds, { 
          padding: 50,
          duration: 1000 
        });
      }
    } catch (err) {
      console.error("Route calculation error:", err);
      toast.warning("Không thể tính tuyến đường. Vui lòng kiểm tra kết nối.");
    }
  };

  // === 8. Lấy vị trí hiện tại ===
  const getCurrentLocation = (type) => {
    if (!navigator.geolocation) {
      toast.error("Trình duyệt không hỗ trợ định vị");
      return;
    }

    if (type === 'start') {
      setIsSearchingStart(true);
    } else {
      setIsSearchingEnd(true);
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lng = pos.coords.longitude;
        const lat = pos.coords.latitude;

        // Kiểm tra giới hạn Đà Nẵng
        if (
          lat < DA_NANG_BOUNDS.southWest.lat || lat > DA_NANG_BOUNDS.northEast.lat ||
          lng < DA_NANG_BOUNDS.southWest.lng || lng > DA_NANG_BOUNDS.northEast.lng
        ) {
          toast.warning("Vị trí ngoài khu vực Đà Nẵng!");
          if (type === 'start') {
            setIsSearchingStart(false);
          } else {
            setIsSearchingEnd(false);
          }
          return;
        }

        const location = [lng, lat];
        
        if (type === 'start') {
          await updateStartLocation(location);
          setIsSearchingStart(false);
        } else {
          await updateEndLocation(location);
          setIsSearchingEnd(false);
        }
        
        toast.success(`Đã lấy vị trí ${type === 'start' ? 'điểm đi' : 'điểm đến'}!`);
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMessage = "Không thể lấy vị trí";
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = "Truy cập vị trí bị từ chối. Vui lòng cấp quyền vị trí.";
        } else if (error.code === error.TIMEOUT) {
          errorMessage = "Hết thời gian lấy vị trí";
        }
        toast.error(errorMessage);
        
        if (type === 'start') {
          setIsSearchingStart(false);
        } else {
          setIsSearchingEnd(false);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000
      }
    );
  };

  // === 9. Xử lý chọn gợi ý ===
  const handleSuggestionSelect = (suggestion, type) => {
    if (type === 'start') {
      updateStartLocation(suggestion.lngLat, suggestion.label);
    } else {
      updateEndLocation(suggestion.lngLat, suggestion.label);
    }
  };

  // === 10. Xử lý thời gian ===
  useEffect(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    setMinDateTime(now.toISOString().slice(0, 16));

    const interval = setInterval(() => {
      const n = new Date();
      n.setMinutes(n.getMinutes() + 1);
      setMinDateTime(n.toISOString().slice(0, 16));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedTime && new Date(selectedTime) < new Date(minDateTime)) {
      setSelectedTime(minDateTime);
      toast.warning("Thời gian phải trong tương lai");
    }
  }, [minDateTime, selectedTime]);

  // === 11. Tạo bài đăng ===
  const handleCreatePost = () => {
    if (!startLocation || !endLocation || !selectedTime) {
      toast.error("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    const postData = {
      content: content || null,
      startLocation: `${startLocation[1]},${startLocation[0]}`,
      endLocation: `${endLocation[1]},${endLocation[0]}`,
      startTime: selectedTime,
      postType: 0,
    };

    dispatch(createPost(postData));
  };

  // === 12. Xử lý success/error ===
  useEffect(() => {
    if (success) {
      toast.success("Đăng bài thành công!");
      setTimeout(() => {
        dispatch(resetPostState());
        onClose();
      }, 1500);
    } else if (error) {
      toast.error(error);
    }
  }, [success, error, dispatch, onClose]);

  // === 13. Khởi tạo map ===
  useEffect(() => {
    const cleanup = initializeMap();
    return cleanup;
  }, [initializeMap]);

  // === 14. Click ngoài để ẩn gợi ý ===
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (startSearchRef.current && !startSearchRef.current.contains(e.target)) {
        setShowStartSuggestions(false);
      }
      if (endSearchRef.current && !endSearchRef.current.contains(e.target)) {
        setShowEndSuggestions(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <>
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal-container" style={{ maxWidth: '900px', width: '95%' }}>
        <div className="modal-header">
          <div className="header-content">
            <h2>Chia sẻ chuyến đi</h2>
            <p>Tìm người đi chung dễ dàng</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="user-section">
          <div className="user-avatar">
            <img src={usersProfile.profilePicture || avatarDefault} alt="Avatar" />
          </div>
          <div className="user-info">
            <span className="user-name">{usersProfile.fullName || "Người dùng"}</span>
            <span className="post-time">Bây giờ</span>
          </div>
        </div>

        <div className="form-content">
          <div className="form-group">
            <div className="floating-textarea">
              <textarea
                rows="3"
                maxLength="200"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="input-field"
                placeholder=" "
              />
              <label>Nội dung (tùy chọn)</label>
              <span className="char-counter">{content.length}/200</span>
            </div>
          </div>

          {/* ĐIỂM ĐI */}
          <div className="form-group" ref={startSearchRef}>
            <div className="floating-input with-icon">
              <input
                type="text"
                value={startLabel}
                onChange={(e) => {
                  setStartLabel(e.target.value);
                  searchLocation(e.target.value, 'start');
                }}
                onFocus={() => startLabel && setShowStartSuggestions(true)}
                placeholder=" "
                className="input-field"
              />
              <label>Điểm đi</label>
              <button
                className="input-action"
                onClick={() => getCurrentLocation('start')}
                disabled={isSearchingStart}
                title="Vị trí hiện tại"
              >
                {isSearchingStart ? (
                  <div className="loading-spinner"></div>
                ) : (
                  <MdMyLocation />
                )}
              </button>
              
              {showStartSuggestions && (
                <div className="suggestions-dropdown">
                  {isSearchingStart ? (
                    <div className="suggestion-loading">
                      <div className="loading-spinner"></div>
                      <span>Đang tìm kiếm...</span>
                    </div>
                  ) : startSuggestions.length > 0 ? (
                    startSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="suggestion-item"
                        onClick={() => handleSuggestionSelect(suggestion, 'start')}
                      >
                        <FaSearchLocation className="icon" />
                        <div className="suggestion-text">
                          <span className="suggestion-label">{suggestion.label}</span>
                          {suggestion.fullAddress?.municipality && (
                            <span className="suggestion-detail">
                              {suggestion.fullAddress.municipality}
                              {suggestion.fullAddress?.countrySubdivision && 
                                `, ${suggestion.fullAddress.countrySubdivision}`
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : startLabel.trim() ? (
                    <div className="no-suggestions">
                      Không tìm thấy địa điểm phù hợp
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* ĐIỂM ĐẾN */}
          <div className="form-group" ref={endSearchRef}>
            <div className="floating-input with-icon">
              <input
                type="text"
                value={endLabel}
                onChange={(e) => {
                  setEndLabel(e.target.value);
                  searchLocation(e.target.value, 'end');
                }}
                onFocus={() => endLabel && setShowEndSuggestions(true)}
                placeholder=" "
                className="input-field"
              />
              <label>Điểm đến</label>
              <button
                className="input-action"
                onClick={() => getCurrentLocation('end')}
                disabled={isSearchingEnd}
                title="Vị trí hiện tại"
              >
                {isSearchingEnd ? (
                  <div className="loading-spinner"></div>
                ) : (
                  <MdMyLocation />
                )}
              </button>
              
              {showEndSuggestions && (
                <div className="suggestions-dropdown">
                  {isSearchingEnd ? (
                    <div className="suggestion-loading">
                      <div className="loading-spinner"></div>
                      <span>Đang tìm kiếm...</span>
                    </div>
                  ) : endSuggestions.length > 0 ? (
                    endSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="suggestion-item"
                        onClick={() => handleSuggestionSelect(suggestion, 'end')}
                      >
                        <FaSearchLocation className="icon" />
                        <div className="suggestion-text">
                          <span className="suggestion-label">{suggestion.label}</span>
                          {suggestion.fullAddress?.municipality && (
                            <span className="suggestion-detail">
                              {suggestion.fullAddress.municipality}
                              {suggestion.fullAddress?.countrySubdivision && 
                                `, ${suggestion.fullAddress.countrySubdivision}`
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : endLabel.trim() ? (
                    <div className="no-suggestions">
                      Không tìm thấy địa điểm phù hợp
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* THỜI GIAN */}
          <div className="form-group">
            <div className="floating-input">
              <input
                type="datetime-local"
                min={minDateTime}
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="input-field"
              />
              <label>
                <FaClock className="icon" /> Thời gian khởi hành
              </label>
            </div>
          </div>
        </div>

        {/* BẢN ĐỒ */}
        <div className="map-preview" style={{ height: '300px', margin: '16px 0', borderRadius: '12px', overflow: 'hidden' }}>
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
          {!mapLoaded && (
            <div className="map-loading-overlay">
              <div className="loading-spinner"></div>
              <span>Đang tải bản đồ...</span>
            </div>
          )}
        </div>

        <button
          className="submit-btn"
          onClick={handleCreatePost}
          disabled={loading || !startLocation || !endLocation || !selectedTime || !mapLoaded}
        >
          {loading ? (
            <>Đang đăng...</>
          ) : (
            <>
              <FaPaperPlane className="icon" /> Đăng bài
            </>
          )}
        </button>
      </div>
    </>
  );
};

export default CreateRidePost;