// File: components/Materials/StudyMaterial.js

import { useEffect, useMemo, useState } from "react";
import { confirmAlert } from "react-confirm-alert";
import { FaDownload, FaEye, FaFile, FaFileArchive, FaFileExcel, FaFileImage, FaFilePdf, FaFileWord, FaPlus, FaSearch } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { countMaterialDownloads, deleteStudyMaterial, fetchStudyMaterials } from "../../stores/action/studyMaterialAction";
import "../../styles/Material/StudyMaterial.scss";
import getUserIdFromToken from '../../utils/JwtDecode';
import CreateStudyMaterialModal from "./CreateStudyMaterialModal";
import StudyMaterialDetailModal from "./StudyMaterialDetail";
import StudyMaterialMenu from "./StudyMaterialMenu";
import UpdateStudyMaterialModal from "./UpdateStudyMaterialModal";

// File type mapping for icons
const FILE_TYPE_ICONS = {
  pdf: <FaFilePdf className="file-icon pdf" />,
  doc: <FaFileWord className="file-icon word" />,
  docx: <FaFileWord className="file-icon word" />,
  xls: <FaFileExcel className="file-icon excel" />,
  xlsx: <FaFileExcel className="file-icon excel" />,
  jpg: <FaFileImage className="file-icon image" />,
  jpeg: <FaFileImage className="file-icon image" />,
  png: <FaFileImage className="file-icon image" />,
  gif: <FaFileImage className="file-icon image" />,
  zip: <FaFileArchive className="file-icon archive" />,
  rar: <FaFileArchive className="file-icon archive" />,
  '7z': <FaFileArchive className="file-icon archive" />,
};

const STATUS_CONFIG = {
  Pending: { color: '#FFA500', label: 'Đang chờ duyệt' },
  Approved: { color: '#4CAF50', label: 'Đã duyệt' },
  Rejected: { color: '#F44336', label: 'Đã từ chối' },
};

// Hàm format kích thước file
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

const StudyMaterial = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Sửa selector để truy cập đúng cấu trúc store
  const studyMaterialState = useSelector((state) => state.studyMaterials || {});
  const { materials, loading, error, nextCursor } = studyMaterialState;  // Thêm nextCursor
  
  console.log("Redux state:", studyMaterialState.studyMaterial); // Debug
  console.log("Materials data:", materials); // Debug
  const currentUserId = getUserIdFromToken();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  // Thêm states cho update modal
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState(null);
    const materialsList = materials || []; 
  // Extract unique filter options from materials
  const filterOptions = useMemo(() => {
  console.log("Materials list for filters:", materialsList); // Debug
  
  const faculties = [...new Set(materialsList.map(item => item.faculty?.replace(/"/g, '') || '').filter(Boolean))];
  const subjects = [...new Set(materialsList.map(item => item.subject?.replace(/"/g, '') || '').filter(Boolean))];
  const semesters = [...new Set(materialsList.map(item => item.semester?.replace(/"/g, '') || '').filter(Boolean))];
  
  return { faculties, subjects, semesters };
}, [materialsList]);

  // Filtered materials
  const filteredMaterials = useMemo(() => {
  console.log("Filtering materials:", materialsList); // Debug
  
  return materialsList.filter(material => {
    const matchesSearch = material.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFaculty = !selectedFaculty || material.faculty?.replace(/"/g, '') === selectedFaculty;
    const matchesSubject = !selectedSubject || material.subject?.replace(/"/g, '') === selectedSubject;
    const matchesSemester = !selectedSemester || material.semester?.replace(/"/g, '') === selectedSemester;
    const matchesStatus = !selectedStatus || material.approvalStatus === selectedStatus;

    return matchesSearch && matchesFaculty && matchesSubject && matchesSemester && matchesStatus;
  });
}, [materialsList, searchTerm, selectedFaculty, selectedSubject, selectedSemester, selectedStatus]);
  console.log("Filtered materials:", filteredMaterials); // Debug
  
  // Tính tổng dung lượng của người dùng hiện tại
  const totalUsedSize = useMemo(() => {
    if (!materials || !currentUserId) return 0;
    
    return materials
      .filter(m => m.userId === currentUserId) // Chỉ tính tài liệu của mình
      .reduce((sum, m) => sum + (m.totalFileSize || 0), 0);
  }, [materials, currentUserId]);

  // Get file icon based on extension
  const getFileIcon = (fileUrl) => {
    if (!fileUrl) return <FaFile className="file-icon default" />;
    
    const extension = fileUrl.split('.').pop()?.toLowerCase();
    return FILE_TYPE_ICONS[extension] || <FaFile className="file-icon default" />;
  };

  // Get file name from URL
  const getFileName = (fileUrl) => {
    if (!fileUrl) return 'Không có tên file';
    return fileUrl.split('/').pop() || 'File đính kèm';
  };

  // Handle edit material
  const handleEditMaterial = (material) => {
    setSelectedMaterial(material);
    setIsUpdateModalOpen(true);
  };

  // Handle delete material
  const handleDeleteMaterial = (materialId) => {
    confirmAlert({
      title: "Xác nhận xóa",
      message: "Bạn có chắc chắn muốn xóa tài liệu này không?",
      buttons: [
        {
          label: "Có",
          onClick: () => {
            toast.info("Đang xóa tài liệu, vui lòng chờ...", { autoClose: 3000 });
            setTimeout(() => {
              dispatch(deleteStudyMaterial(materialId))
                .unwrap()
                .then(() => {
                  toast.success("Xóa tài liệu thành công!");
                })
                .catch((err) => {
                  toast.error(`Lỗi khi xóa tài liệu: ${err}`);
                });
            }, 3000);
          }
        },
        { label: "Không" },
      ],
    });
  };

  // Check if current user is owner
  const isOwner = (material) => {
    return material.userId === currentUserId;
  };

  // Handle download file
 const handleDownload = async (fileUrl, materialId) => {
  try {
    console.log('Downloading file:', fileUrl);
    
    // Đếm lượt tải trước khi download
    await dispatch(countMaterialDownloads(materialId));
    
    const link = document.createElement('a');
    link.href = fileUrl;
    link.setAttribute('download', '');
    link.setAttribute('target', '_blank');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Đang tải file xuống...');
  } catch (error) {
    console.error('Download error:', error);
    toast.error('Lỗi khi tải file');
  }
};

  // Sửa hàm handleViewDetail
const handleViewDetail = (materialId) => {
    setSelectedMaterialId(materialId);
    setIsDetailModalOpen(true);
  };

  // Handle user profile navigation
  const navigateUser = (userId) => {
    const currentUserId = localStorage.getItem('userId');
    if (userId === currentUserId) {
      navigate("/ProfileUserView");
    } else {
      navigate(`/profile/${userId}`);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedFaculty("");
    setSelectedSubject("");
    setSelectedSemester("");
    setSelectedStatus("");
  };

  // Fetch materials on component mount
  useEffect(() => {
    console.log("Dispatching fetchStudyMaterials...");
    dispatch(fetchStudyMaterials({ LastStudyMaterialId: null, pageSize: 50 }));
  }, [dispatch]);

  // Kiểm tra loading state
const isLoading = loading && materials.length === 0;

  if (error) {
    return (
      <div className="study-material-container">
        <div className="error-message">
          Lỗi khi tải tài liệu: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="study-material-container">
      {/* Header */}
      <div className="study-material-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">Tài Liệu Học Tập</h1>
            <p className="page-subtitle">Khám phá và tải xuống tài liệu học tập từ cộng đồng</p>
          </div>
          <button 
            className="create-material-btn"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <FaPlus />
            Đăng tài liệu
          </button>
        </div>
      </div>

      {/* Thanh dung lượng - HIỆN Ở TRÊN CÙNG, CHỈ CHO NGƯỜI DÙNG ĐANG ĐĂNG NHẬP */}
      {currentUserId && (
        <div className="storage-usage-section">
          <div className="storage-header">
            <div className="storage-text">
              <strong>Dung lượng đã dùng:</strong>{' '}
              <span className="usage-value">
                {formatFileSize(totalUsedSize)}
              </span>{' '}
              / 100 MB
            </div>
            {totalUsedSize > 90 * 1024 * 1024 && (
              <div className="storage-warning">
                ⚠️ Gần hết dung lượng!
              </div>
            )}
          </div>
          
          <div className="progress-container">
            <div 
              className="progress-bar"
              style={{ 
                width: `${Math.min(100, (totalUsedSize / (100 * 1024 * 1024)) * 100)}%` 
              }}
            />
          </div>

          <div className="storage-footer">
            <small>
              {totalUsedSize > 90 * 1024 * 1024 
                ? "⚠️ Bạn nên xóa bớt tài liệu cũ để tiếp tục đăng mới."
                : `💾 Còn trống: ${formatFileSize(100 * 1024 * 1024 - totalUsedSize)}`
              }
            </small>
          </div>
        </div>
      )}
        
      {/* Search and Filters */}
      <div className="filters-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề, mô tả, môn học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-grid">
          <select 
            value={selectedFaculty} 
            onChange={(e) => setSelectedFaculty(e.target.value)}
            className="filter-select"
          >
            <option value="">Tất cả khoa</option>
            {filterOptions.faculties.map(faculty => (
              <option key={faculty} value={faculty}>{faculty}</option>
            ))}
          </select>

          <select 
            value={selectedSubject} 
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="filter-select"
          >
            <option value="">Tất cả môn học</option>
            {filterOptions.subjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>

          <select 
            value={selectedSemester} 
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="filter-select"
          >
            <option value="">Tất cả học kỳ</option>
            {filterOptions.semesters.map(semester => (
              <option key={semester} value={semester}>{semester}</option>
            ))}
          </select>

          <select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="filter-select"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Pending">Đang chờ duyệt</option>
            <option value="Approved">Đã duyệt</option>
            <option value="Rejected">Đã từ chối</option>
          </select>

          <button 
            onClick={clearFilters}
            className="clear-filters-btn"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Materials Grid */}
      <div className="materials-grid">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Đang tải tài liệu...</p>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="empty-state">
            <FaFile className="empty-icon" />
            <h3>Không tìm thấy tài liệu nào</h3>
            <p>Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            {/* Debug info */}
            <div style={{ marginTop: '16px', fontSize: '12px', color: '#999' }}>
            Total materials in store: {materials?.length || 0}
            </div>
          </div>
        ) : (
          filteredMaterials.map((material) => (
            <div key={material.id} className="material-card">
                {/* Status Badge và Menu */}
              <div className="card-header">
                {/* <div 
                  className="status-badge"
                  style={{ backgroundColor: STATUS_CONFIG[material.approvalStatus]?.color || '#666' }}
                >
                  {STATUS_CONFIG[material.approvalStatus]?.label || material.approvalStatus}
                </div> */}
                
                {/* Menu cho chủ sở hữu */}
                <StudyMaterialMenu 
                  material={material}
                  onEdit={handleEditMaterial}
                  onDelete={handleDeleteMaterial}
                  isOwner={isOwner(material)}
                />
              </div>

              {/* User Info */}
              <div className="user-info">
                <img 
                  src={`${process.env.REACT_APP_BASE_URL || ''}${material.profilePicture || '/default-avatar.png'}`} 
                  alt="Avatar" 
                  className="user-avatar"
                  onClick={() => navigateUser(material.userId)}
                  onError={(e) => {
                    e.target.src = '/default-avatar.png';
                  }}
                />
                <div className="user-details">
                  <span 
                    className="user-name"
                    onClick={() => navigateUser(material.userId)}
                  >
                    {material.userName || 'Người dùng'}
                  </span>
                  <span className="trust-score">Điểm tin cậy: {material.trustScore || 0}</span>
                </div>
              </div>

              {/* Material Content */}
              <div className="material-content">
                <h3 className="material-title">
                  {material.title?.replace(/"/g, '') || 'Không có tiêu đề'}
                </h3>
                <p className="material-description">
                  {material.description?.replace(/"/g, '') || 'Không có mô tả'}
                </p>
                
                <div className="material-meta">
                  <span className="meta-item">
                    <strong>Môn:</strong> {material.subject?.replace(/"/g, '') || 'N/A'}
                  </span>
                  <span className="meta-item">
                    <strong>Khoa:</strong> {material.faculty?.replace(/"/g, '') || 'N/A'}
                  </span>
                  <span className="meta-item">
                    <strong>Học kỳ:</strong> {material.semester?.replace(/"/g, '') || 'N/A'}
                  </span>
                  {/* Hiển thị kích thước file cho tất cả bài viết */}
                  <span className="meta-item">
                    <strong>Kích thước:</strong> {formatFileSize(material.totalFileSize)}
                  </span>
                </div>

                {/* File Attachments */}
                <div className="file-attachments">
                  {material.fileUrls?.map((fileUrl, index) => (
                    <div key={index} className="file-item">
                      {getFileIcon(fileUrl)}
                      <span className="file-name">{getFileName(fileUrl)}</span>
                      <button 
                        onClick={() => handleDownload(fileUrl, material.id)}
                        className="download-btn"
                        title="Tải xuống"
                      >
                        <FaDownload />
                      </button>
                    </div>
                  ))}
                  {(!material.fileUrls || material.fileUrls.length === 0) && (
                    <div className="file-item no-file">
                      <FaFile className="file-icon default" />
                      <span className="file-name">Không có file đính kèm</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="material-stats">
                  <span className="stat">
                    <FaDownload /> {material.downloadCount || 0}
                  </span>
                  <span className="stat">
                    <FaEye /> {material.viewCount || 0}
                  </span>
                  <span className="stat">
                    📅 {formatDate(material.createdAt)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="material-actions">
                <button 
                  onClick={() => handleViewDetail(material.id)}
                  className="view-detail-btn"
                >
                  <FaEye /> Xem chi tiết
                </button>

                {material.fileUrls?.length > 0 && (
                  <button 
                    onClick={() => handleDownload(material.fileUrls[0], material.id)}
                    className="download-main-btn"
                  >
                    <FaDownload /> Tải xuống
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More */}
      {nextCursor && (  // Sửa: nextCursor thay vì materials?.data?.nextCursor
        <div className="load-more-section">
            <button 
            onClick={() => dispatch(fetchStudyMaterials({ 
                LastStudyMaterialId: nextCursor,  // Sửa: nextCursor
                pageSize: 20 
            }))}
            className="load-more-btn"
            disabled={loading}
            >
            {loading ? 'Đang tải...' : 'Tải thêm'}
            </button>
        </div>
        )}
        
        <CreateStudyMaterialModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      <UpdateStudyMaterialModal 
        isOpen={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false);
          setSelectedMaterial(null);
        }}
        material={selectedMaterial}
      />
      {/* Modal để bên ngoài button */}
                <StudyMaterialDetailModal 
                  isOpen={isDetailModalOpen}
                  onClose={() => {
                    setIsDetailModalOpen(false);
                    setSelectedMaterialId(null);
                  }}
                  materialId={selectedMaterialId}
                />
                
    </div>
    
  );
};

export default StudyMaterial;