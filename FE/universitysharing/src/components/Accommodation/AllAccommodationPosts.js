// File: components/AccommodationComponent/AllAccommodationPosts.js

import * as tt from '@tomtom-international/web-sdk-maps';
import '@tomtom-international/web-sdk-maps/dist/maps.css';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { confirmAlert } from "react-confirm-alert";
import { FaEdit, FaPlus, FaRegStar, FaSave, FaStar, FaStarHalfAlt, FaTimes } from "react-icons/fa";
import { MdMoreVert } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  createAccommodationPost,
  deleteAccommodationPost,
  fetchAccommodationPostDetail,
  fetchAccommodationPosts,
  updateAccommodationPost
} from "../../stores/action/accommodationPostAction";
import "../../styles/Accommodation/AllAccommodationPosts.scss";
import getUserIdFromToken from '../../utils/JwtDecode';
import AccommodationReviews from "./AccommodationReviews";
import RadiusFilter, { UNIVERSITY_LOCATIONS } from "./RadiusFilter";
import SearchAI from "./SearchAI";
import SearchAccommodation from "./SearchAccommodation";
// Status colors and icons
const STATUS_CONFIG = {
  Available: { color: '#4CAF50', emoji: '🟢' },
  Rented: { color: '#FF9800', emoji: '🟠' },
  Hidden: { color: '#9E9E9E', emoji: '⚫' },
  0: { color: '#9E9E9E', emoji: '⚫' },
};
  const baseUrl = process.env.REACT_APP_BASE_URL;
// Common amenities for selection
const COMMON_AMENITIES = [
  'Wifi', 'Điều hòa', 'Máy giặt', 'Tủ lạnh', 'Bếp', 'Chỗ để xe',
  'Camera an ninh', 'Bảo vệ', 'Thang máy', 'Hồ bơi', 'Phòng gym',
  'Giặt ủi', 'Dọn phòng', 'Internet', 'Truyền hình cáp'
];

// Room types
const ROOM_TYPES = [
  'Phòng trọ',
  'Chung cư mini',
  'Nhà nguyên căn',
  'Chung cư',
  'Homestay',
  'Ký túc xá'
];
// Thêm ngay sau các import
const SCHOOL_ICON = `
<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#1565C0"/>
  <g fill="white" transform="translate(0, -1)">
    <path d="M11.7 2.805a.75.75 0 0 1 .6 0A60.65 60.65 0 0 1 22.83 8.72a.75.75 0 0 1-.231 1.337 49.948 49.948 0 0 0-9.902 3.912l-.003.002c-.114.06-.227.119-.34.18a.75.75 0 0 1-.707 0A50.88 50.88 0 0 0 7.5 12.173v-.224c0-.131.067-.248.172-.311a54.615 54.615 0 0 1 4.653-2.52.75.75 0 0 0-.65-1.352 56.123 56.123 0 0 0-4.78 2.589 1.858 1.858 0 0 0-.859 1.228 49.803 49.803 0 0 0-4.634-1.527.75.75 0 0 1-.231-1.337A60.653 60.653 0 0 1 11.7 2.805Z" />
    <path d="M13.06 15.473a48.45 48.45 0 0 1 7.666-3.282c.134 1.414.22 2.843.255 4.284a.75.75 0 0 1-.46.711 47.87 47.87 0 0 0-8.105 4.342.75.75 0 0 1-.832 0 47.87 47.87 0 0 0-8.104-4.342.75.75 0 0 1-.461-.71c.035-1.442.121-2.87.255-4.286.921.304 1.83.634 2.726.99v1.27a1.5 1.5 0 0 0-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.66a6.727 6.727 0 0 0 .551-1.607 1.5 1.5 0 0 0 .14-2.67v-.645a48.549 48.549 0 0 1 3.44 1.667 2.25 2.25 0 0 0 2.12 0Z" />
    <path d="M4.462 19.462c.42-.419.753-.89 1-1.395.453.214.902.435 1.347.662a6.742 6.742 0 0 1-1.286 1.794.75.75 0 0 1-1.06-1.06Z" />
  </g>
</svg>`;
const OWNER_ICON = `
<svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#FBC02D"/>
  <g fill="#0D47A1" transform="translate(0, -1)">
    <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clip-rule="evenodd" />
  </g>
</svg>`;

const NORMAL_ICON = `
<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#388E3C"/>
  <path d="M10 17V12H14V17H17V10L12 6L7 10V17H10Z" fill="white"/>
</svg>`;
const AllAccommodationPosts = () => {
  const dispatch = useDispatch();
  const { posts, loading, error, postDetail,detailLoading } = useSelector(
    (state) => state.accommodation || {}
  );
  const [selectedPost, setSelectedPost] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const createMarkerRef = useRef(null);
  const currentUserId = getUserIdFromToken();
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedRadius, setSelectedRadius] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [showRouteInfo, setShowRouteInfo] = useState(false);
  const [aiResults, setAiResults] = useState([]);
  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    price: '',
    area: '',
    roomType: '',
    amenities: [],
    maxPeople:'',
    currentPeople:''
  });

  // Create form state
  const [createForm, setCreateForm] = useState({
    title: '',
    content: '',
    price: '',
    area: '',
    roomType: '',
    amenities: [],
    latitude: null,
    longitude: null,
    addressString: '',
    maxPeople:'',
    currentPeople:''
  });
  const createSVGMarker = (svgString, isOwner = false) => {
  const el = document.createElement('div');
  el.innerHTML = svgString;
  el.style.width = isOwner ? '48px' : '40px';
  el.style.height = isOwner ? '48px' : '40px';
  el.style.transform = 'translate(-50%, -100%)';
  el.style.cursor = 'pointer';
  el.style.zIndex = isOwner ? '1000' : 'auto';

  return new tt.Marker({ element: el });
};
// Thêm useEffect này để xử lý click event khi tạo bài đăng
useEffect(() => {
  if (!mapInstanceRef.current) return;

  const handleMapClick = (e) => {
    if (isCreating) {
      const { lng, lat } = e.lngLat;
      
      // Update create form data
      setCreateForm(prev => ({
        ...prev,
        longitude: lng,
        latitude: lat
      }));

      // Update or create marker
      if (createMarkerRef.current) {
        createMarkerRef.current.setLngLat([lng, lat]);
      } else {
        createMarkerRef.current = new tt.Marker()
          .setLngLat([lng, lat])
          .addTo(mapInstanceRef.current);
      }

      // Reverse geocode to get address
      reverseGeocode(lng, lat);
    }
  };

  // Thêm event listener
  mapInstanceRef.current.on('click', handleMapClick);

  // Cleanup: remove event listener khi component unmount hoặc isCreating thay đổi
  return () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.off('click', handleMapClick);
    }
  };
}, [isCreating]); // Chỉ phụ thuộc vào isCreating
// Nếu bạn có button "Hủy" trong sidebar (khi isCreating), thêm onClick={handleCancel}
// useEffect(() => {
//   if (mapInstanceRef.current) {
//     setTimeout(() => mapInstanceRef.current.resize(), 350);
//   }
// }, [showDetail, isCreating]);
const handleCancel = () => {
  setIsCreating(false);  // Trigger useEffect ở trên
};
  // Callback khi tính toán đường đi
const handleRouteCalculate = (routeData) => {
  setRouteInfo(routeData);
  setShowRouteInfo(true);
};
  // Add haversineDistance function (since it's used here too, or import if possible, but for simplicity duplicate):
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
  // Debounce search
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };
  const navigateUser = (userId) => {
    if (userId === getUserIdFromToken()) {
      navigate("/ProfileUserView");
    } else {
      navigate(`/profile/${userId}`);
    }
  };
  const debouncedSetSearch = debounce(setSearchTerm, 300);
  
  // Initialize map
const initializeMap = useCallback(() => {
  const apiKey = process.env.REACT_APP_TOMTOM_API_KEY;
  if (!apiKey) {
    console.error("TomTom API key is missing");
    toast.error("Không thể tải bản đồ: Thiếu API key");
    return;
  }

  if (mapInstanceRef.current) {
    return;
  }

  try {
    const map = tt.map({
      key: apiKey,
      container: mapRef.current,
      center: [108.2022, 16.0544],
      zoom: 12,
      style: { 
        map: '2/basic_street-satellite',
        poi: '2/poi_light',
        trafficIncidents: '2/incidents_light',
        trafficFlow: '2/flow_relative-light'
      }
    });

    mapInstanceRef.current = map;

    // Sửa: Thêm school markers với marker tiêu chuẩn
    UNIVERSITY_LOCATIONS.forEach(school => {
  const el = document.createElement('div');
  el.innerHTML = SCHOOL_ICON;
  el.style.width = '40px';
  el.style.height = '40px';
  el.style.transform = 'translate(-50%, -100%)';

  const marker = new tt.Marker({ element: el })
    .setLngLat([school.lng, school.lat])
    .addTo(map);

  const popup = new tt.Popup({ offset: 20 }).setHTML(
    `<div style="font-weight:bold;color:#1976d2;">${school.name}</div><small>${school.address}</small>`
  );
  marker.setPopup(popup);
});

    map.on('load', () => {
      console.log('✅ Map loaded successfully');
    });

  } catch (err) {
    console.error('Failed to initialize map:', err);
    toast.error("Không thể khởi tạo bản đồ: " + err.message);
  }

  return () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    markersRef.current = {};
    if (createMarkerRef.current) {
      createMarkerRef.current.remove();
      createMarkerRef.current = null;
    }
  };
}, []); // QUAN TRỌNG: Loại bỏ isCreating khỏi dependencies



  //render sao
  const renderStars = (rating) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      stars.push(<FaStar key={i} className="text-yellow-400" />);
    } else if (rating >= i - 0.5) {
      stars.push(<FaStarHalfAlt key={i} className="text-yellow-400" />);
    } else {
      stars.push(<FaRegStar key={i} className="text-gray-400" />);
    }
  }
  return stars;
};

  // Reverse geocode function
  const reverseGeocode = async (lng, lat) => {
    const apiKey = process.env.REACT_APP_TOMTOM_API_KEY;
    try {
      const response = await fetch(
        `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lng}.json?key=${apiKey}`
      );
      const data = await response.json();
      
      if (data.addresses && data.addresses.length > 0) {
        const address = data.addresses[0].address;
        const addressString = `${address.streetNumber || ''} ${address.streetName || ''}, ${address.municipality || ''}, ${address.countrySubdivision || ''}`.trim();
        
        setCreateForm(prev => ({
          ...prev,
          addressString: addressString || `Vị trí: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
        }));
      }
    } catch (error) {
      console.error('Reverse geocode error:', error);
      setCreateForm(prev => ({
        ...prev,
        addressString: `Vị trí: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
      }));
    }
  };

  // Update filteredPosts useMemo:
const filteredPosts = useMemo(() => {
  let filtered = posts; // Start with all posts

  // First, apply radius filter if active
  if (selectedSchool && selectedRadius) {
    filtered = filtered.filter(post => {
      if (!post.latitude || !post.longitude) return false;
      const distance = haversineDistance(
        selectedSchool.lat,
        selectedSchool.lng,
        post.latitude,
        post.longitude
      );
      return distance <= selectedRadius;
    });
  }

  // Then apply search filter
  filtered = filtered.filter(post => 
    post.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return filtered;
}, [posts, searchTerm, selectedSchool, selectedRadius]);



  // Add/update markers based on filtered posts
const addMarkers = useCallback(() => {
  if (!mapInstanceRef.current) return;

  // Xóa marker cũ
  Object.values(markersRef.current).forEach(m => m.remove());
  markersRef.current = {};

  filteredPosts.forEach(post => {
    if (!post.latitude || !post.longitude) return;

    let marker;
    if (post.userId === currentUserId) {
      // Bài đăng của chính mình → icon OWNER đặc biệt
      marker = createSVGMarker(OWNER_ICON, true);
    } else {
      // Bài đăng bình thường
      marker = createSVGMarker(NORMAL_ICON);
    }

    marker
      .setLngLat([post.longitude, post.latitude])
      .addTo(mapInstanceRef.current);

    marker.getElement().addEventListener('click', () => handleMarkerClick(post.id));
    markersRef.current[post.id] = marker;
  });
}, [filteredPosts, currentUserId]);



  // Highlight selected marker
  const highlightMarker = useCallback((postId) => {
    if (!mapInstanceRef.current) return;

    // Vì không custom class nữa, bỏ highlight CSS, thay bằng mở popup nếu cần
    if (postId && markersRef.current[postId]) {
      const marker = markersRef.current[postId];
      //marker.setPopup(new tt.Popup().setHTML(`<b>${postDetail.title}</b><br>Status: ${postDetail.status}`)).togglePopup();
    }
  }, [postDetail]);

  const handleMarkerClick = async (postId) => {
    try {
      await dispatch(fetchAccommodationPostDetail(postId)).unwrap();
      setShowDetail(true);
      setShowMenu(false);
      setIsEditing(false);
      setIsCreating(false);
    } catch (error) {
      toast.error('Lỗi khi tải thông tin chi tiết');
    }
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedPost(null);
    setShowReviews(false);
    setShowMenu(false);
    setIsEditing(false);
    setIsCreating(false);
    
    // Clear create marker
    if (createMarkerRef.current) {
      createMarkerRef.current.remove();
      createMarkerRef.current = null;
    }
  };

  // Start creating new post
  const handleStartCreate = () => {
    setSelectedSchool(null);
    setSelectedRadius(null);
    setCreateForm({
      title: '',
      content: '',
      price: '',
      area: '',
      roomType: '',
      amenities: [],
      latitude: null,
      longitude: null,
      addressString: ''
    });
    setIsCreating(true);
    setShowDetail(true);
    setIsEditing(false);
    
    // Clear any existing create marker
    if (createMarkerRef.current) {
      createMarkerRef.current.remove();
      createMarkerRef.current = null;
    }
  };

  // Cancel creating
  // Chỉ dùng handleCancelCreate
const handleCancelCreate = () => {
  // Clear create marker
  if (createMarkerRef.current) {
    createMarkerRef.current.remove();
    createMarkerRef.current = null;
  }
  
  // Reset form
  setCreateForm({
    title: '',
    content: '',
    price: '',
    area: '',
    roomType: '',
    amenities: [],
    latitude: null,
    longitude: null,
    addressString: '',
    maxPeople: '',
    currentPeople: ''
  });
  
  // Update state - QUAN TRỌNG: chỉ set isCreating = false, KHÔNG reload map
  setIsCreating(false);
  setShowDetail(false);
};

  // Handle input changes in create form
 // Handle input changes in create form
const handleCreateChange = (field, value) => {
  let processedValue = value;
  
  // Chỉ filter ký tự không phải số cho các field numeric
  const numericFields = ['price', 'area', 'maxPeople', 'currentPeople'];
  if (numericFields.includes(field)) {
    processedValue = value.replace(/\D/g, "");
  }
  
  setCreateForm((prev) => ({
    ...prev,
    [field]: processedValue,
  }));
};

  // Handle amenity selection in create form
  const handleCreateAmenityToggle = (amenity) => {
    setCreateForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };


  // Submit create new post
  const handleSubmitCreate = async () => {
    if (!createForm.latitude || !createForm.longitude) {
      toast.error('Vui lòng chọn vị trí trên bản đồ');
      return;
    }

    if (!createForm.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề');
      return;
    }
    // 3. ✨ XÁC THỰC currentPeople <= maxPeople ✨
    // Xác thực currentPeople <= maxPeople
  const max = createForm.maxPeople ? parseInt(createForm.maxPeople) : Infinity;
  const current = createForm.currentPeople ? parseInt(createForm.currentPeople) : 0;
    if (current > max) {
      toast.error('Số người hiện ở không thể lớn hơn Số người tối đa.');
      return;
    }
    // Thêm: Xác thực theo BE (maxPeople 1-10, currentPeople 0-10)
  if (max < 1 || max > 10) {
    toast.error('Số người tối đa phải từ 1 đến 10.');
    return;
  }
  if (current < 0 || current > 10) {
    toast.error('Số người hiện ở phải từ 0 đến 10.');
    return;
  }
    // ---------------------------------------------
    try {
      const createData = {
        title: createForm.title,
        content: createForm.content,
        price: createForm.price ? parseFloat(createForm.price) : null,
        area: createForm.area ? parseFloat(createForm.area) : null,
        roomType: createForm.roomType,
        amenities: createForm.amenities.join(','),
        latitude: createForm.latitude,
        longitude: createForm.longitude,
        addressString: createForm.addressString,
        maxPeople: createForm.maxPeople ? parseInt(createForm.maxPeople) : null,
        currentPeople: createForm.currentPeople ? parseInt(createForm.currentPeople) : null

      };

      await dispatch(createAccommodationPost(createData)).unwrap();
      
      toast.success('Tạo bài đăng thành công!');
      setIsCreating(false);
      // BỔ SUNG CÁC DÒNG SAU:
  setShowDetail(false); // <-- Đóng sidebar
  if (createMarkerRef.current) { // <-- Dọn dẹp marker
    createMarkerRef.current.remove();
    createMarkerRef.current = null;
  }
      // Refresh posts list
      await dispatch(fetchAccommodationPosts({ lastPostId: null, pageSize: 50 })).unwrap();
      
    } catch (error) {
      console.error('Create error:', error);
      toast.error(`Lỗi khi tạo bài đăng: ${error.message || 'Vui lòng thử lại'}`);
    }
  };

  // Start editing
  const handleStartEdit = () => {
    if (postDetail) {
      setEditForm({
        title: postDetail.title || '',
        content: postDetail.content || '',
        price: postDetail.price || '',
        area: postDetail.area || '',
        roomType: postDetail.roomType || '',
        amenities: postDetail.amenities ? postDetail.amenities.split(',') : [],
        maxPeople: postDetail.maxPeople || '',
        currentPeople: postDetail.currentPeople || ''
      });
      setIsEditing(true);
      setIsCreating(false);
      setShowMenu(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setShowDetail(false); 
    setEditForm({
      title: '',
      content: '',
      price: '',
      area: '',
      roomType: '',
      amenities: [],
      maxPeople:'',
      currentPeople:''
    });
  };

  // Handle input changes in edit form
  const handleEditChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle amenity selection in edit form
  const handleEditAmenityToggle = (amenity) => {
    setEditForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  // Submit update
  const handleSubmitUpdate = async () => {
    if (!postDetail?.id) return;
    // 3. ✨ XÁC THỰC currentPeople <= maxPeople ✨
    const max = createForm.maxPeople ? parseInt(createForm.maxPeople) : Infinity;
    const current = createForm.currentPeople ? parseInt(createForm.currentPeople) : 0;
    
    if (current > max) {
      toast.error('Số người hiện ở không thể lớn hơn Số người tối đa.');
      return;
    }
    // ---------------------------------------------
    try {
      const updateData = {
        id: postDetail.id,
        title: editForm.title,
        content: editForm.content,
        price: editForm.price ? parseFloat(editForm.price) : null,
        area: editForm.area ? parseFloat(editForm.area) : null,
        roomType: editForm.roomType,
        amenities: editForm.amenities.join(','),
        maxPeople: editForm.maxPeople ? parseInt(editForm.maxPeople) : null,
        currentPeople: editForm.currentPeople ? parseInt(editForm.currentPeople) : null
      };

      await dispatch(updateAccommodationPost(updateData)).unwrap();
      
      toast.success('Cập nhật bài đăng thành công!');
      setIsEditing(false);
      
      // Refresh the post detail
      await dispatch(fetchAccommodationPostDetail(postDetail.id)).unwrap();
      
    } catch (error) {
      console.error('Update error:', error);
      toast.error(`Lỗi khi cập nhật: ${error.message || 'Vui lòng thử lại'}`);
    }
  };

  const handleDeletePost = (postId) => {
    confirmAlert({
      title: "Xác nhận xóa",
      message: "Bạn có chắc chắn muốn xóa bài viết này không?",
      buttons: [
        { 
          label: "Có", 
          onClick: () => {
            toast.info("Đang xóa bài viết, vui lòng chờ...", { autoClose: 3000 });
            setTimeout(() => {
              dispatch(deleteAccommodationPost(postId))
                .unwrap()
                .then(() => {
                  toast.success("Xóa bài viết thành công!");
                  handleCloseDetail();
                  dispatch(fetchAccommodationPosts({ lastPostId: null, pageSize: 50 }));
                })
                .catch((err) => {
                  toast.error(`Lỗi khi xóa bài viết: ${err}`);
                });
            }, 3000);
          }
        },
        { label: "Không" },
      ],
    });
  };

  // Fetch posts on mount
  useEffect(() => {
    dispatch(fetchAccommodationPosts({ lastPostId: null, pageSize: 50 }));
  }, [dispatch]);

  // Init map after component mount AND after initial loading is done
  useEffect(() => {
    if (loading || mapInstanceRef.current) {
      return;
    }

    // Chỉ khởi tạo map khi KHÔNG loading VÀ map chưa tồn tại
    const cleanup = initializeMap();
    return cleanup;
    
}, [loading, initializeMap]);// <-- Thêm 'loading' vào dependency

  // Add markers when filteredPosts or map changes
  useEffect(() => {
    addMarkers();
  }, [addMarkers]);

  // Highlight marker and fly to location when detail opens
  useEffect(() => {
    if (showDetail && postDetail?.id && !isCreating) {
      highlightMarker(postDetail.id);
      
      if (mapInstanceRef.current) {
        // Khớp với width của .detail-sidebar trong CSS (400px)
        const sidebarWidth = 400; 
        
        mapInstanceRef.current.flyTo({
          center: [postDetail.longitude, postDetail.latitude],
          zoom: 16, // Zoom đủ gần để thấy rõ vị trí
          
          // ✨ QUAN TRỌNG: Thêm padding để "đẩy" tâm bản đồ sang trái
          // right: 400 (sidebar) + 50 (khoảng cách thêm cho thoáng)
          padding: { 
            top: 50, 
            bottom: 50, 
            left: 50, 
            right: sidebarWidth + 50 
          },
          
          duration: 1500, // Thời gian bay (ms)
          essential: true // Bắt buộc thực hiện animation
        });
      }
    } else {
      highlightMarker(null);
      // Khi đóng sidebar, không cần flyTo đâu cả, giữ nguyên vị trí hiện tại
    }
  }, [showDetail, postDetail, highlightMarker, isCreating]);

  const isOwner = postDetail?.userId === currentUserId;

  if (error) return <div className="error-message">Lỗi: {error}</div>;
  if (loading && posts?.length === 0) return <div className="loading-posts">Đang tải bản đồ...</div>;

  return (
    <div className="accommodation-map-container">
      <div className="map-header">
        <div className="search-container">
          <SearchAccommodation 
      posts={posts || []}
      mapRef={mapInstanceRef}
      markersRef={markersRef}
      onSearch={(filteredPosts, term) => {
        // Optional: log or handle search
        console.log('Tìm thấy:', filteredPosts.length, 'kết quả với từ khóa:', term);
      }}
      onSelectPost={(post) => {
        // Mở sidebar chi tiết
        setSelectedPost(post);
        setShowDetail(true);
        dispatch(fetchAccommodationPostDetail(post.id));
      }}
    />
        </div>
        <SearchAI 
      mapInstance={mapInstanceRef.current}
      onResultsUpdate={setAiResults}
    />
        {/* Sử dụng phiên bản compact của RadiusFilter */}
        <RadiusFilter
          posts={posts}
          searchTerm={searchTerm}
          selectedSchool={selectedSchool}
          setSelectedSchool={setSelectedSchool}
          selectedRadius={selectedRadius}
          setSelectedRadius={setSelectedRadius}
          mapInstance={mapInstanceRef.current}
          onFilterChange={(filtered) => {
            // Optional: any additional logic
          }}
           selectedPost={postDetail} // Truyền post đang được chọn
          onRouteCalculate={handleRouteCalculate} // Callback nhận kết quả đường đi
          variant="compact" // Thêm prop này
        />
        
        <button className="create-button" onClick={handleStartCreate}>
          <FaPlus style={{ marginRight: '8px' }} />
          Tạo mới
        </button>
      </div>

      <div className="map-content">
        <div ref={mapRef} className="main-map" />
        {/* Radius Legend */}
        {selectedSchool && selectedRadius && (
          <div className="radius-legend">
            <div className="legend-item">
              <div className="legend-color"></div>
              <span>Vùng lọc: {selectedRadius} km quanh {selectedSchool.name}</span>
            </div>
            <div className="legend-item">
              <div style={{ 
                width: '12px', 
                height: '12px', 
                borderRadius: '50%',
                border: '2px dashed #1976d2',
                background: 'rgba(25, 118, 210, 0.05)'
              }}></div>
              <span>Vùng hiển thị: {selectedRadius + 1} km</span>
            </div>
          </div>
        )}
        <div className={`detail-sidebar ${showDetail ? 'open' : ''}`}>
          {/* Create Mode */}
          {isCreating ? (
            <>
              <div className="sidebar-header">
                <h3>Tạo bài đăng mới</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button 
                    className="create-button"
                    onClick={handleSubmitCreate}
                    style={{ marginLeft: 0, padding: '8px 16px', fontSize: '12px' }}
                  >
                    <FaSave style={{ marginRight: '4px' }} />
                    Tạo bài
                  </button>
                  <button 
                    className="cancel-button"
                    onClick={handleCancelCreate}
                  >
                    Hủy
                  </button>
                </div>
              </div>
              
              <div className="sidebar-content">
                <div className="create-instruction" style={{
                  background: '#e3f2fd',
                  border: '1px solid #1976d2',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '16px',
                  fontSize: '14px',
                  color: '#1976d2'
                }}>
                  💡 <strong>Hướng dẫn:</strong> Nhấp vào bản đồ để chọn vị trí cho bài đăng mới
                </div>

                <div className="form-group">
                  <label>Tiêu đề <span style={{color: '#e53935'}}>*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    value={createForm.title}
                    onChange={(e) => handleCreateChange('title', e.target.value)}
                    placeholder="Nhập tiêu đề bài đăng..."
                  />
                </div>

                <div className="form-group">
                  <label>Nội dung mô tả</label>
                  <textarea
                    className="form-textarea"
                    value={createForm.content}
                    onChange={(e) => handleCreateChange('content', e.target.value)}
                    placeholder="Mô tả chi tiết về chỗ ở..."
                    rows="4"
                  />
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label>Giá thuê (₫)</label>
                    <input
  type="text"
  className="form-input"
  value={createForm.price ? Number(createForm.price).toLocaleString("vi-VN") : ""}
  onChange={(e) => handleCreateChange("price", e.target.value)}
  placeholder="Nhập giá..."
/>
                  </div>

                  <div className="form-group">
                    <label>Diện tích (m²)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={createForm.area}
                      onChange={(e) => handleCreateChange('area', e.target.value)}
                      placeholder="Nhập diện tích..."
                    />
                  </div>
                </div>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label>Số người tối đa</label>
                    <input
                      type="number"
                      className="form-input"
                      value={createForm.maxPeople}
                      onChange={(e) => handleCreateChange('maxPeople', e.target.value)}
                      placeholder="Nhập số người tối đa..."
                    />
                  </div>

                  <div className="form-group">
                    <label>Số người hiện ở</label>
                    <input
                      type="number"
                      className="form-input"
                      value={createForm.currentPeople}
                      onChange={(e) => handleCreateChange('currentPeople', e.target.value)}
                      placeholder="Nhập số người hiện ở..."
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Loại phòng</label>
                  <select
                    className="form-select"
                    value={createForm.roomType}
                    onChange={(e) => handleCreateChange('roomType', e.target.value)}
                  >
                    <option value="">Chọn loại phòng</option>
                    {ROOM_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="form-section">
                  <label>Tiện nghi có sẵn</label>
                  <div className="amenities-grid">
                    {COMMON_AMENITIES.map(amenity => (
                      <div
                        key={amenity}
                        className={`amenity-item ${createForm.amenities.includes(amenity) ? 'selected' : ''}`}
                        onClick={() => handleCreateAmenityToggle(amenity)}
                      >
                        <div className="amenity-checkbox" />
                        <span className="amenity-label">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Địa chỉ</label>
                  <input
                    type="text"
                    className="form-input"
                    value={createForm.addressString}
                    onChange={(e) => handleCreateChange('addressString', e.target.value)}
                    placeholder="Địa chỉ sẽ tự động cập nhật khi chọn vị trí..."
                    readOnly
                  />
                </div>

                {createForm.latitude && createForm.longitude && (
                  <div className="location-info" style={{
                    background: '#f8f9fa',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    color: '#666'
                  }}>
                    <strong>Vị trí đã chọn:</strong><br />
                    Latitude: {createForm.latitude.toFixed(6)}<br />
                    Longitude: {createForm.longitude.toFixed(6)}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* View/Edit Mode */
            postDetail && (
              <>
                <div className="sidebar-header">
                  <h3>{isEditing ? 'Chỉnh sửa bài đăng' : 'Chi tiết phòng trọ'}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isEditing ? (
                      <>
                        <button 
                          className="create-button"
                          onClick={handleSubmitUpdate}
                          style={{ marginLeft: 0, padding: '8px 16px', fontSize: '12px' }}
                        >
                          <FaSave style={{ marginRight: '4px' }} />
                          Hoàn tất
                        </button>
                        <button 
                          className="cancel-button"
                          onClick={handleCancelEdit}
                        >
                          Hủy
                        </button>
                      </>
                    ) : (
                      <>
                        {isOwner && (
                          <button className="more-button" onClick={() => setShowMenu(!showMenu)}>
                            <MdMoreVert />
                          </button>
                        )}
                        <button className="close-button" onClick={handleCloseDetail}>
                          <FaTimes />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {showMenu && isOwner && !isEditing && (
                  <div className="more-menu">
                    <div className="menu-item" onClick={handleStartEdit}>
                      <FaEdit style={{ marginRight: '8px' }} />
                      Cập nhật
                    </div>
                    <div className="menu-item delete" onClick={() => { handleDeletePost(postDetail.id); setShowMenu(false); }}>
                      Xóa bài
                    </div>
                  </div>
                )}
                
                <div className="sidebar-content">
                  {/* ... (phần view/edit mode giữ nguyên) ... */}
                  <div className="user-profile">
                    <img 
                     src={`${baseUrl}${postDetail.profilePicture || '/default-avatar.png'}`}
                      alt="Profile" 
                      className="profile-pic" 
                      onClick={() => navigateUser(postDetail.userId)}
                      style={{ cursor: 'pointer' }}
                    />
                    <div className="user-info">
                    <div
                      className="user-name"
                      onClick={() => navigateUser(postDetail.userId)}
                      style={{ cursor: 'pointer' }}
                    >
                      {postDetail.fullName || postDetail.userName || 'Người dùng'}
                    </div>

                      <div className="phone-number">{postDetail.phoneNumber || 'N/A'}</div>
                      <div className="trust-score">Điểm tin cậy: {postDetail.trustScore || 0}</div>
                    </div>
                  </div>

                  <div className="status-badge" style={{ 
                    backgroundColor: STATUS_CONFIG[postDetail.status]?.color || STATUS_CONFIG.Available.color 
                  }}>
                    {STATUS_CONFIG[postDetail.status]?.emoji} {postDetail.status}
                  </div>
                  
                  {/* Editable Title */}
                  {isEditing ? (
                    <div className="form-group">
                      <label>Tiêu đề</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editForm.title}
                        onChange={(e) => handleEditChange('title', e.target.value)}
                        placeholder="Nhập tiêu đề..."
                      />
                    </div>
                  ) : (
                    <h3 className="post-title">{postDetail.title}</h3>
                  )}
                  
                  {/* Editable Content */}
                  {isEditing ? (
                    <div className="form-group">
                      <label>Nội dung mô tả</label>
                      <textarea
                        className="form-textarea"
                        value={editForm.content}
                        onChange={(e) => handleEditChange('content', e.target.value)}
                        placeholder="Mô tả chi tiết về chỗ ở..."
                        rows="4"
                      />
                    </div>
                  ) : (
                    postDetail.content && <p className="post-content">{postDetail.content}</p>
                  )}
                  
                  <div className="accommodation-details-grid">
                    {/* Editable Price */}
                    <div className="detail-card">
                      {isEditing ? (
                        <div className="form-group">
                          <label>Giá thuê (₫)</label>
                          <input
                            type="number"
                            className="form-input"
                            value={editForm.price}
                            onChange={(e) => handleEditChange('price', e.target.value)}
                            placeholder="Nhập giá..."
                          />
                        </div>
                      ) : (
                        <>
                          <div className="detail-label">Giá thuê</div>
                          <div className="detail-value price">
                            {postDetail.price?.toLocaleString()} ₫
                          </div>
                          
                        </>
                      )}
                    </div>

                    {/* Editable Area */}
                    <div className="detail-card">
                      {isEditing ? (
                        <div className="form-group">
                          <label>Diện tích (m²)</label>
                          <input
                            type="number"
                            className="form-input"
                            value={editForm.area}
                            onChange={(e) => handleEditChange('area', e.target.value)}
                            placeholder="Nhập diện tích..."
                          />
                        </div>
                      ) : (
                        <>
                        <div className="detail-label">Diện tích</div>
                          <div className="detail-value area">
                            {postDetail.area || 'N/A'} m²
                          </div>
                          
                        </>
                      )}
                    </div>
                    {/* Editable maxPeople */}
                    <div className="detail-card">
                      {isEditing ? (
                        <div className="form-group">
                          <label>Số người tối đa</label>
                          <input
                            type="number"
                            className="form-input"
                            min="1"
                            max="10"
                            value={editForm.maxPeople}
                            onChange={(e) => handleEditChange('maxPeople', e.target.value)}
                            placeholder="Nhập số người tối đa..."
                          />
                        </div>
                      ) : (
                        <>
                        <div className="detail-label">Số người tối đa</div>
                          <div className="detail-value area">
                            {postDetail.maxPeople || 'N/A'} người
                          </div>
                          
                          
                        </>
                      )}
                    </div>
                    {/* Editable currentPeople */}
                    <div className="detail-card">
                      {isEditing ? (
                        <div className="form-group">
                          <label>Số người đang ở</label>
                          <input
                            type="number"
                            className="form-input"
                            min="0"
                            max="10"
                            value={editForm.currentPeople}
                            onChange={(e) => handleEditChange('currentPeople', e.target.value)}
                            placeholder="Nhập số người đang ở..."
                          />
                        </div>
                      ) : (
                        <>
                        <div className="detail-label">Số người đang ở</div>
                          <div className="detail-value area">
                            {postDetail.currentPeople || 'N/A'} người
                          </div>
                          
                        </>
                      )}
                    </div>

                    {/* Editable Room Type */}
                    <div className="detail-card">
                      {isEditing ? (
                        <div className="form-group">
                          <label>Loại phòng</label>
                          <select
                            className="form-select"
                            value={editForm.roomType}
                            onChange={(e) => handleEditChange('roomType', e.target.value)}
                          >
                            <option value="">Chọn loại phòng</option>
                            {ROOM_TYPES.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <>
                        <div className="detail-label">Loại phòng</div>
                          <div className="detail-value">
                            {postDetail.roomType || 'N/A'}
                          </div>
                          
                        </>
                      )}
                    </div>

                    <div className="detail-card">
                      <div className="detail-label flex items-center gap-1">
                        <FaStar className="text-yellow-400" />
                        <span> Đánh giá</span>
                      </div>

                      <div className="detail-value rating flex items-center gap-2">
                        <div className="flex">
                          {renderStars(postDetail.averageRating || 0)}
                        </div>

                        <span>
                          {postDetail.averageRating > 0 ? postDetail.averageRating.toFixed(1) : ""}
                        </span>
                      </div>
                    </div>

                      
                    {/* <div className="detail-card">
                      <div className="detail-label">Khoảng cách</div>
                      <div className="detail-value">
                        {postDetail.distanceKm || 0} km
                      </div>
                      
                    </div> */}
                  </div>

                  {/* Editable Amenities */}
                  {isEditing && (
                    <div className="form-section">
                      <label>Tiện nghi có sẵn</label>
                      <div className="amenities-grid">
                        {COMMON_AMENITIES.map(amenity => (
                          <div
                            key={amenity}
                            className={`amenity-item ${editForm.amenities.includes(amenity) ? 'selected' : ''}`}
                            onClick={() => handleEditAmenityToggle(amenity)}
                          >
                            <div className="amenity-checkbox" />
                            <span className="amenity-label">{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="address-section">
                    <div className="address-label">Địa chỉ</div>
                    <div className="address-value">{postDetail.address}</div>
                  </div>

                  <div className="created-at-section">
                    <div className="created-label">Đăng lúc</div>
                    <div className="created-value">{postDetail.createdAt || 'N/A'}</div>
                  </div>

                  {!isEditing && (
                    console.log('Rendering Reviews - postId:', postDetail.id, 'showReviews:', showReviews),  // Log để check
                    // Replace the old reviews section with the new component
                    <AccommodationReviews 
                      postId={postDetail.id} 
                      show={showReviews} 
                      onToggle={() => setShowReviews(!showReviews)} 
                    />
                  )}
                </div>
              </>
            )
          )}
        </div>
      </div>
      {/* Sửa: overlay cho loading chung (fetch posts, create, etc.) */}
      {loading && !showDetail && (  // Thêm !showDetail để tránh che khi đang xem detail
        <div className="loading-posts">Đang tải bài đăng...</div>
      )}
      
      {/* Thêm: overlay riêng cho detail (chỉ hiện khi đang fetch detail) */}
      {detailLoading && showDetail && (
        <div className="loading-posts">Đang tải chi tiết...</div>
      )}

      {error && <div className="error-message">{error}</div>}
      {filteredPosts.length === 0 && !loading && !detailLoading && (  // Thêm !detailLoading
        <div className="no-posts">Không có bài đăng</div>
      )}
    </div>
  );
};

export default AllAccommodationPosts;