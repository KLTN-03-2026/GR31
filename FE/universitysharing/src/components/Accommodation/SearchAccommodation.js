// File: components/Accommodation/SearchAccommodation.js
import { useEffect, useRef, useState } from 'react';
import '../../styles/Accommodation/SearchAccommodation.scss';

const SearchAccommodation = ({ 
  posts = [], 
  onSearch, 
  onSelectPost, 
  mapRef,
  markersRef 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Filter posts based on search term
  const getFilteredPosts = (term) => {
    if (!term.trim()) return [];
    
    const lowercasedTerm = term.toLowerCase();
    return posts.filter(post => 
      (post.title && post.title.toLowerCase().includes(lowercasedTerm)) ||
      (post.address && post.address.toLowerCase().includes(lowercasedTerm)) ||
      (post.description && post.description.toLowerCase().includes(lowercasedTerm))
    );
  };

  // Handle search input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.length > 1) {
      const filtered = getFilteredPosts(value);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    setIsSearching(true);
    
    const filteredPosts = getFilteredPosts(searchTerm);
    
    if (onSearch) {
      onSearch(filteredPosts, searchTerm);
    }
    
    // Highlight markers on map
    highlightMarkersOnMap(filteredPosts);
    
    setIsSearching(false);
    setShowSuggestions(false);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (post) => {
    setSearchTerm(post.title || post.address || '');
    setShowSuggestions(false);
    
    if (onSelectPost) {
      onSelectPost(post);
    }
    
    // Fly to the selected post on map
    flyToPostOnMap(post);
  };

  // Highlight markers on map
  const highlightMarkersOnMap = (filteredPosts) => {
    if (!markersRef?.current || !mapRef?.current) return;

    const postIds = filteredPosts.map(post => post.id);
    
    // Reset all markers first
    Object.values(markersRef.current).forEach(marker => {
      if (marker.getElement) {
        const element = marker.getElement();
        if (element) {
          element.classList.remove('highlighted', 'search-result');
        }
      }
    });

    // Highlight matching markers
    postIds.forEach(postId => {
      const marker = markersRef.current[postId];
      if (marker && marker.getElement) {
        const element = marker.getElement();
        if (element) {
          element.classList.add('highlighted', 'search-result');
        }
      }
    });

    // Fit map bounds to show all highlighted markers if there are results
    if (filteredPosts.length > 0) {
      fitMapToPosts(filteredPosts);
    }
  };

  // Fly to specific post on map
  const flyToPostOnMap = (post) => {
    if (!mapRef?.current || !post?.latitude || !post?.longitude) return;

    const map = mapRef.current;
    map.flyTo([post.latitude, post.longitude], 15);
    
    // Highlight the specific marker
    if (markersRef?.current && markersRef.current[post.id]) {
      const marker = markersRef.current[post.id];
      if (marker.getElement) {
        const element = marker.getElement();
        if (element) {
          // Remove highlight from all markers
          Object.values(markersRef.current).forEach(m => {
            if (m.getElement) {
              m.getElement().classList.remove('highlighted', 'selected');
            }
          });
          
          // Add highlight to selected marker
          element.classList.add('highlighted', 'selected');
        }
      }
    }
  };

  // Fit map to show all posts
  const fitMapToPosts = (postsToShow) => {
    if (!mapRef?.current || postsToShow.length === 0) return;

    const map = mapRef.current;
    const bounds = [];
    
    postsToShow.forEach(post => {
      if (post.latitude && post.longitude) {
        bounds.push([post.longitude, post.latitude]);
      }
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm('');
    setSuggestions([]);
    setShowSuggestions(false);
    
    // Reset all markers
    if (markersRef?.current) {
      Object.values(markersRef.current).forEach(marker => {
        if (marker.getElement) {
          const element = marker.getElement();
          if (element) {
            element.classList.remove('highlighted', 'search-result', 'selected');
          }
        }
      });
    }
    
    if (onSearch) {
      onSearch([], '');
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Format suggestion text
  const formatSuggestionText = (post) => {
    const title = post.title || 'Không có tiêu đề';
    const address = post.address || 'Không có địa chỉ';
    const price = post.price ? ` - ${formatPrice(post.price)}` : '';
    
    return `${title}${price} - ${address}`;
  };

  // Format price
  const formatPrice = (price) => {
    if (!price) return '';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  return (
    <div className="search-accommodation">
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-container">
          <input
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder="Tìm kiếm theo địa chỉ hoặc tiêu đề..."
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={() => searchTerm.length > 1 && setShowSuggestions(true)}
          />
          
          {searchTerm && (
            <button
              type="button"
              className="clear-search-button"
              onClick={handleClearSearch}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
          
          <button 
            type="submit" 
            className="search-button"
            disabled={isSearching}
          >
            {isSearching ? '🔍' : '🔍'}
          </button>

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div ref={suggestionsRef} className="suggestions-dropdown">
              {suggestions.slice(0, 5).map((post, index) => (
                <div
                  key={post.id || index}
                  className="suggestion-item"
                  onClick={() => handleSuggestionSelect(post)}
                >
                  <div className="suggestion-text">
                    {formatSuggestionText(post)}
                  </div>
                  <div className="suggestion-type">
                    {post.price ? 'Nhà trọ' : 'Bài đăng'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No results message */}
          {showSuggestions && searchTerm.length > 1 && suggestions.length === 0 && (
            <div ref={suggestionsRef} className="suggestions-dropdown">
              <div className="no-suggestions">
                Không tìm thấy kết quả phù hợp
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Search results info */}
      {searchTerm && (
        <div className="search-results-info">
          <span className="results-count">
            {suggestions.length} kết quả tìm thấy
          </span>
          <button 
            className="view-all-button"
            onClick={() => fitMapToPosts(suggestions)}
          >
            Xem tất cả trên bản đồ
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchAccommodation;