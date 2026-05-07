// File: components/AccommodationComponent/RadiusFilter.js

import * as tt from '@tomtom-international/web-sdk-maps';
import { useEffect, useMemo, useRef } from "react";
import { FaFilter, FaMapMarkerAlt, FaSearchLocation, FaTimes } from "react-icons/fa";
import "../../styles/Accommodation/RadiusFilter.scss";

// Fixed university locations
export const UNIVERSITY_LOCATIONS = [
  {
    id: 'duy_tan_1',
    name: 'ĐH Duy Tân - Cơ sở 1',
    lat: 16.060287617709196,
    lng: 108.21553643749075,
    address: '254 Nguyễn Văn Linh, Thanh Khê, Đà Nẵng'
  },
  {
    id: 'duy_tan_2', 
    name: 'ĐH Duy Tân - Cơ sở 2',
    lat: 16.0755013473569,
    lng: 108.22251495132832,
    address: '182 Nguyễn Văn Linh, Hải Châu, Đà Nẵng'
  },
  {
    id: 'duy_tan_3',
    name: 'ĐH Duy Tân - Cơ sở 3', 
    lat: 16.04922972059177,
    lng: 108.16007513783538,
    address: '03 Quang Trung, Hải Châu, Đà Nẵng'
  }
];

// Import hàm haversineDistance từ AllAccommodationPosts hoặc định nghĩa lại
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

// Hàm tạo circle GeoJSON
const createCircleGeoJSON = (center, radiusKm, points = 64) => {
  const [lng, lat] = center;
  const kmPerDegree = 111.32;
  const radiusDeg = radiusKm / kmPerDegree;
  
  const coordinates = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dx = radiusDeg * Math.cos(angle);
    const dy = radiusDeg * Math.sin(angle) / Math.cos(lat * Math.PI / 180);
    coordinates.push([lng + dx, lat + dy]);
  }
  coordinates.push(coordinates[0]); // Close the circle
  
  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [coordinates]
    },
    properties: {}
  };
};

const RadiusFilter = ({
  posts,
  searchTerm,
  selectedSchool,
  setSelectedSchool,
  selectedRadius,
  setSelectedRadius,
  mapInstance,
  onFilterChange,
  variant = "compact" // "compact" or "full"
}) => {
  const radiusOptions = [1, 3, 5, 10]; // km
  const circleIdsRef = useRef(new Set()); // Theo dõi tất cả các ID đã tạo

  // Filter posts by radius around selected school
  const radiusFilteredPosts = useMemo(() => {
    if (!selectedSchool || !selectedRadius) return posts;

    return posts.filter(post => {
      if (!post.latitude || !post.longitude) return false;
      const distance = haversineDistance(
        selectedSchool.lat,
        selectedSchool.lng,
        post.latitude,
        post.longitude
      );
      return distance <= selectedRadius;
    });
  }, [posts, selectedSchool, selectedRadius]);

  // Combine with search filter
  const finalFilteredPosts = useMemo(() => {
    let filtered = radiusFilteredPosts.filter(post => 
      post.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return filtered;
  }, [radiusFilteredPosts, searchTerm]);

  useEffect(() => {
    onFilterChange(finalFilteredPosts);
  }, [finalFilteredPosts, onFilterChange]);

  // Remove all existing circle layers and sources
  const removeAllCircles = () => {
    if (!mapInstance) return;
    // Xóa tất cả các layer và source đã tạo
    circleIdsRef.current.forEach(id => {
      if (mapInstance.getLayer(id)) {
        mapInstance.removeLayer(id);
      }
      if (mapInstance.getSource(id)) {
        mapInstance.removeSource(id);
      }
    });
    
    circleIdsRef.current.clear();
  };

  // Add circle to map
  const addCircle = (center, radiusKm) => {
    if (!mapInstance) return;
    
    // Xóa tất cả circle cũ trước khi thêm mới
    removeAllCircles();
    
    // Create circle with radius + 0.5km for better visibility
    const displayRadius = radiusKm + 0.5;
    const circleGeoJSON = createCircleGeoJSON(center, displayRadius);
    
    // Tạo ID duy nhất cho mỗi lần thêm circle
    const timestamp = Date.now();
    const displaySourceId = `radius-display-source-${timestamp}`;
    const displayLayerId = `radius-display-layer-${timestamp}`;
    const fillLayerId = `radius-fill-layer-${timestamp}`;
    const filterSourceId = `radius-filter-source-${timestamp}`;
    const filterLayerId = `radius-filter-layer-${timestamp}`;
    
    // Lưu các ID vào ref để quản lý
    const newIds = [displaySourceId, displayLayerId, fillLayerId, filterSourceId, filterLayerId];
    newIds.forEach(id => circleIdsRef.current.add(id));
    
    try {
      // Add source for display area
      mapInstance.addSource(displaySourceId, {
        type: 'geojson',
        data: circleGeoJSON
      });
      
      // Add layer for display area (dashed)
      mapInstance.addLayer({
        id: displayLayerId,
        type: 'line',
        source: displaySourceId,
        paint: {
          'line-color': '#1976d2',
          'line-width': 2,
          'line-dasharray': [2, 2],
          'line-opacity': 0.6
        }
      });
      
      // Add fill layer for display area
      mapInstance.addLayer({
        id: fillLayerId,
        type: 'fill',
        source: displaySourceId,
        paint: {
          'fill-color': '#1976d2',
          'fill-opacity': 0.1
        }
      });
      
      // Add inner circle for actual filter radius (solid)
      const filterCircleGeoJSON = createCircleGeoJSON(center, radiusKm);
      mapInstance.addSource(filterSourceId, {
        type: 'geojson',
        data: filterCircleGeoJSON
      });
      
      mapInstance.addLayer({
        id: filterLayerId,
        type: 'line',
        source: filterSourceId,
        paint: {
          'line-color': '#e53935',
          'line-width': 3,
          'line-opacity': 0.8
        }
      });
      
    } catch (error) {
      console.error('Error adding circle to map:', error);
      // Nếu có lỗi, xóa tất cả các layer/source đã tạo
      removeAllCircles();
    }
  };

  // Fit map to radius bounds when filter changes
  useEffect(() => {
    if (mapInstance && selectedSchool && selectedRadius) {
      const { lat: centerLat, lng: centerLng } = selectedSchool;
      const center = [centerLng, centerLat];
      
      // Calculate display radius (filter radius + 0.5km)
      const displayRadius = selectedRadius + 0.5;
      const radiusDeg = displayRadius / 111; // Approximate degrees per km
      const latOffset = radiusDeg;
      const lngOffset = radiusDeg / Math.cos(centerLat * Math.PI / 180);

      const southWest = [centerLng - lngOffset, centerLat - latOffset];
      const northEast = [centerLng + lngOffset, centerLat + latOffset];

      const bounds = new tt.LngLatBounds(southWest, northEast);
      
      // Fit map to display bounds
      mapInstance.fitBounds(bounds, { padding: 50, duration: 1000 });
      
      // Add circle to visualize the area
      addCircle(center, selectedRadius);
      
    } else {
      // Remove circle when no filter is active
      removeAllCircles();
    }

    return () => {
      removeAllCircles();
    };
  }, [selectedSchool, selectedRadius, mapInstance]);

  const handleSchoolChange = (e) => {
    const schoolId = e.target.value;
    const school = UNIVERSITY_LOCATIONS.find(s => s.id === schoolId);
    setSelectedSchool(school || null);
    if (!school) {
      setSelectedRadius(null);
    }
  };

  const handleRadiusChange = (e) => {
    setSelectedRadius(e.target.value ? parseInt(e.target.value) : null);
  };

  const clearFilter = () => {
    setSelectedSchool(null);
    setSelectedRadius(null);
    removeAllCircles();
  };

  // Compact version for header
  if (variant === "compact") {
    return (
      <div className="radius-filter-compact">
        <div className="filter-group">
          <label>
            <FaMapMarkerAlt style={{ marginRight: '4px', fontSize: '12px' }} />
            Trường:
          </label>
          <select
            value={selectedSchool?.id || ''}
            onChange={handleSchoolChange}
            className="filter-select"
          >
            <option value="">-- Tất cả --</option>
            {UNIVERSITY_LOCATIONS.map(school => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
        </div>

        {selectedSchool && (
          <div className="filter-group">
            <label>
              <FaSearchLocation style={{ marginRight: '4px', fontSize: '12px' }} />
              Bán kính:
            </label>
            <select
              value={selectedRadius || ''}
              onChange={handleRadiusChange}
              className="filter-select"
            >
              <option value="">-- Chọn --</option>
              {radiusOptions.map(r => (
                <option key={r} value={r}>
                  {r} km
                </option>
              ))}
            </select>
          </div>
        )}

        {(selectedSchool || selectedRadius) && (
          <>
            <div className="filter-results">
              {finalFilteredPosts.length} kết quả
            </div>
            <button className="clear-filter-btn" onClick={clearFilter} title="Xóa bộ lọc">
              <FaTimes />
            </button>
          </>
        )}
      </div>
    );
  }

  // Full version (original design)
  return (
    <div className="radius-filter-container">
      <div className="filter-header">
        <div className="filter-title">
          <FaFilter />
          Bộ lọc khu vực
        </div>
        {(selectedSchool || selectedRadius) && (
          <button className="clear-filter-btn" onClick={clearFilter}>
            Xóa
          </button>
        )}
      </div>

      <div className="filter-content">
        <div className="filter-row">
          <FaMapMarkerAlt className="filter-icon" />
          <select
            value={selectedSchool?.id || ''}
            onChange={handleSchoolChange}
            className="filter-select"
          >
            <option value="">-- Chọn trường --</option>
            {UNIVERSITY_LOCATIONS.map(school => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
        </div>

        {selectedSchool && (
          <>
            <div className="filter-row">
              <FaSearchLocation className="filter-icon" />
              <select
                value={selectedRadius || ''}
                onChange={handleRadiusChange}
                className="filter-select"
              >
                <option value="">-- Chọn bán kính --</option>
                {radiusOptions.map(r => (
                  <option key={r} value={r}>
                    {r} km
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-info">
              🔍 Tìm trong vòng <strong>{selectedRadius} km</strong> quanh {selectedSchool.name}<br />
              🗺️ Bản đồ hiển thị vùng <strong>{selectedRadius + 0.5} km</strong> để dễ quan sát
            </div>
          </>
        )}
      </div>

      <div className="filter-results">
        {finalFilteredPosts.length} kết quả phù hợp
      </div>
    </div>
  );
};

export default RadiusFilter;