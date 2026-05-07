import { useEffect, useState } from "react";
import { FaFile, FaSave, FaTimes, FaTrash, FaUpload } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { updateStudyMaterial } from "../../stores/action/studyMaterialAction";
import "../../styles/Material/UpdateStudyMaterialModal.scss";

const UpdateStudyMaterialModal = ({ isOpen, onClose, material }) => {
  const dispatch = useDispatch();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    semester: "",
    faculty: ""
  });
  
  const [files, setFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Các lựa chọn cho dropdown
const facultyOptions = [
    "Trường Công nghệ & Kỹ thuật (SET)",
    "Trường Y Dược (Med–Pharm)",
    "Trường Kinh tế (School of Economics)",
    "Trường Kiến trúc & Xây dựng (SAC)",
    "Trường Ngoại ngữ - Xã hội Nhân văn",
    "Khoa Du lịch",
    "Khoa Luật",
    "Khác"
  ];

  const semesterOptions = [
    "Học kỳ 1",
    "Học kỳ 2",
    "Học kỳ Hè",
    "Năm 1",
    "Năm 2",
    "Năm 3",
    "Năm 4"
  ];

  // === DANH SÁCH MÔN HỌC THEO CHUYÊN NGÀNH (Đại học Duy Tân) ===
  const subjectsByFaculty = {
    "Trường Công nghệ & Kỹ thuật (SET)": [
      "Lập trình C/C++",
      "Cấu trúc dữ liệu và giải thuật",
      "Cơ sở dữ liệu",
      "Mạng máy tính",
      "Lập trình Java",
      "Phát triển ứng dụng Web",
      "Trí tuệ nhân tạo",
      "An toàn thông tin",
      "Hệ điều hành",
      "Kỹ thuật phần mềm"
    ],
    "Trường Y Dược (Med–Pharm)": [
      "Giải phẫu học",
      "Sinh lý học",
      "Hóa sinh y học",
      "Dược lý học",
      "Bệnh học",
      "Vi sinh y học",
      "Kỹ năng lâm sàng",
      "Dược lâm sàng",
      "Hóa dược",
      "Quản lý nhà thuốc"
    ],
    "Trường Kinh tế (School of Economics)": [
      "Kinh tế vi mô",
      "Kinh tế vĩ mô",
      "Kế toán tài chính",
      "Quản trị kinh doanh",
      "Marketing căn bản",
      "Tài chính doanh nghiệp",
      "Luật kinh tế",
      "Quản trị nhân lực",
      "Kinh doanh quốc tế",
      "Thống kê kinh tế"
    ],
    "Trường Kiến trúc & Xây dựng (SAC)": [
      "Vẽ kỹ thuật",
      "Cơ học kết cấu",
      "Kiến trúc dân dụng",
      "Thiết kế nội thất",
      "Kỹ thuật xây dựng",
      "Quy hoạch đô thị",
      "Vật liệu xây dựng",
      "Kết cấu thép",
      "Đồ án kiến trúc",
      "AutoCAD & Revit"
    ],
    "Trường Ngoại ngữ - Xã hội Nhân văn": [
      "Tiếng Anh chuyên ngành",
      "Ngữ âm - Ngữ pháp",
      "Kỹ năng nghe nói",
      "Văn học Anh - Mỹ",
      "Biên phiên dịch",
      "Tiếng Nhật cơ bản",
      "Tiếng Hàn cơ bản",
      "Văn hóa phương Tây",
      "Tâm lý học đại cương",
      "Truyền thông đại chúng"
    ],
    "Khoa Du lịch": [
      "Quản trị khách sạn",
      "Tổ chức sự kiện",
      "Du lịch bền vững",
      "Hướng dẫn du lịch",
      "Marketing du lịch",
      "Tiếng Anh du lịch",
      "Văn hóa du lịch Việt Nam",
      "Ẩm thực du lịch",
      "Quản trị lữ hành",
      "Địa lý du lịch"
    ],
    "Khoa Luật": [
      "Luật dân sự",
      "Luật hình sự",
      "Luật hiến pháp",
      "Luật thương mại",
      "Luật hành chính",
      "Luật quốc tế",
      "Kỹ năng tranh tụng",
      "Luật lao động",
      "Luật đất đai",
      "Tư pháp quốc tế"
    ],
    "Khác": [
      "Toán cao cấp",
      "Vật lý đại cương",
      "Triết học Mác-Lênin",
      "Tư tưởng Hồ Chí Minh",
      "Giáo dục thể chất",
      "Giáo dục quốc phòng",
      "Kỹ năng mềm",
      "Khởi nghiệp",
      "Tiếng Anh học thuật",
      "Tin học đại cương"
    ]
  };

  // Load material data when modal opens
  useEffect(() => {
    if (material && isOpen) {
      setFormData({
        title: material.title?.replace(/"/g, '') || '',
        description: material.description?.replace(/"/g, '') || '',
        subject: material.subject?.replace(/"/g, '') || '',
        semester: material.semester?.replace(/"/g, '') || '',
        faculty: material.faculty?.replace(/"/g, '') || ''
      });
      
      // Set existing files
      if (material.fileUrls && material.fileUrls.length > 0) {
        setExistingFiles(material.fileUrls);
      } else {
        setExistingFiles([]);
      }
      
      setFiles([]);
      setErrors({});
    }
  }, [material, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Validate file types and size
    const validFiles = selectedFiles.filter(file => {
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed'
      ];
      
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          files: `File type ${file.type} không được hỗ trợ`
        }));
        return false;
      }
      
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        setErrors(prev => ({
          ...prev,
          files: `File ${file.name} vượt quá 50MB`
        }));
        return false;
      }
      
      return true;
    });
    
    setFiles(prev => [...prev, ...validFiles]);
    
    if (validFiles.length > 0 && errors.files) {
      setErrors(prev => ({
        ...prev,
        files: ""
      }));
    }
  };

  const removeNewFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingFile = (index) => {
    setExistingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = "Tiêu đề là bắt buộc";
    } else if (formData.title.length > 255) {
      newErrors.title = "Tiêu đề không được vượt quá 255 ký tự";
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = "Môn học là bắt buộc";
    } else if (formData.subject.length > 100) {
      newErrors.subject = "Môn học không được vượt quá 100 ký tự";
    }
    
    if (!formData.faculty.trim()) {
      newErrors.faculty = "Khoa là bắt buộc";
    } else if (formData.faculty.length > 100) {
      newErrors.faculty = "Khoa không được vượt quá 100 ký tự";
    }
    
    if (formData.semester && formData.semester.length > 50) {
      newErrors.semester = "Học kỳ không được vượt quá 50 ký tự";
    }
    
    // QUAN TRỌNG: Kiểm tra xem có file nào không (cả cũ và mới)
    if (existingFiles.length === 0 && files.length === 0) {
      newErrors.files = "Ít nhất một file là bắt buộc";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  setLoading(true);

  try {
    // Lấy danh sách URL file cũ còn lại
    const existingFileUrls = existingFiles
      .filter(Boolean)
      .map(file => (typeof file === "string" ? file : file.url || file));

    // TẠO FormData – ĐỔI TÊN BIẾN ĐỂ KHÔNG TRÙNG với state formData
    const payload = new FormData(); // ← Đổi tên thành payload hoặc requestData

    payload.append("Id", material.id);
    payload.append("Title", formData.title.trim());           // ← Dùng state formData
    payload.append("Description", (formData.description || "").trim());
    payload.append("Subject", formData.subject.trim());
    payload.append("Semester", (formData.semester || "").trim());
    payload.append("Faculty", formData.faculty.trim());

    // File mới
    files.forEach(file => payload.append("FileUrls", file));

    // File cũ cần giữ lại
    existingFileUrls.forEach(url => payload.append("ExistingFileUrls", url));

    // Nếu xóa hết file cũ → ép gửi mảng rỗng để BE biết
    if (existingFileUrls.length === 0) {
      payload.append("ExistingFileUrls", ""); // hoặc không cần, tùy BE
    }

    // Debug
    console.log("Đang gửi cập nhật tài liệu...");
    for (let [key, value] of payload.entries()) {
      console.log(key, value);
    }

    await dispatch(updateStudyMaterial(payload)).unwrap();

    toast.success("Cập nhật tài liệu thành công!");
    onClose();
  } catch (error) {
    console.error("Lỗi cập nhật:", error);
    toast.error("Cập nhật thất bại. Vui lòng thử lại!");
  } finally {
    setLoading(false);
  }
};

  const handleClose = () => {
    setFormData({
      title: "",
      description: "",
      subject: "",
      semester: "",
      faculty: ""
    });
    setFiles([]);
    setExistingFiles([]);
    setErrors({});
    onClose();
  };

  // Hàm lấy tên file từ URL
  const getFileNameFromUrl = (fileUrl) => {
    if (!fileUrl) return 'File đính kèm';
    return fileUrl.split('/').pop() || 'File đính kèm';
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Cập Nhật Tài Liệu</h2>
          <button className="close-button" onClick={handleClose}>
            <FaTimes />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="update-material-form">
          {/* Tiêu đề */}
          <div className="form-group">
            <label className="form-label">
              Tiêu đề <span className="required">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={`form-input ${errors.title ? 'error' : ''}`}
              placeholder="Nhập tiêu đề tài liệu..."
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>

          {/* Mô tả */}
          <div className="form-group">
            <label className="form-label">Mô tả</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="form-textarea"
              rows="3"
              placeholder="Mô tả về tài liệu..."
            />
          </div>

          <div className="form-row">
            {/* Môn học */}
            <div className="form-group">
              <label className="form-label">
                Môn học <span className="required">*</span>
              </label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className={`form-select ${errors.subject ? 'error' : ''}`}
              >
                <option value="">Chọn môn học</option>
                {(subjectsByFaculty[formData.faculty] || subjectsByFaculty["Khác"]).map((subject, idx) => (
                  <option key={idx} value={subject}>{subject}</option>
                ))}
              </select>
              {errors.subject && <span className="error-message">{errors.subject}</span>}
            </div>

            {/* Khoa */}
            <div className="form-group">
              <label className="form-label">
                Chuyên Ngành <span className="required">*</span>
              </label>
              <select
                name="faculty"
                value={formData.faculty}
                onChange={handleInputChange}
                className={`form-select ${errors.faculty ? 'error' : ''}`}
              >
                <option value="">Chọn chuyên ngành</option>
                {facultyOptions.map(faculty => (
                  <option key={faculty} value={faculty}>{faculty}</option>
                ))}
              </select>
              {errors.faculty && <span className="error-message">{errors.faculty}</span>}
            </div>
          </div>

          {/* Học kỳ */}
          <div className="form-group">
            <label className="form-label">Học kỳ</label>
            <select
              name="semester"
              value={formData.semester}
              onChange={handleInputChange}
              className="form-select"
            >
              <option value="">Chọn học kỳ</option>
              {semesterOptions.map(semester => (
                <option key={semester} value={semester}>{semester}</option>
              ))}
            </select>
          </div>

          {/* File Section - QUAN TRỌNG: Hiển thị cả file cũ và mới */}
          <div className="form-group">
            <label className="form-label">
              File đính kèm <span className="required">*</span>
            </label>
            
            {/* Existing Files */}
            {existingFiles.length > 0 && (
              <div className="existing-files-section">
                <h4 className="files-section-title">File hiện tại</h4>
                <div className="file-list">
                  {existingFiles.map((fileUrl, index) => (
                    <div key={index} className="file-item existing">
                      <FaFile className="file-icon" />
                      <span className="file-name">
                        {getFileNameFromUrl(fileUrl)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeExistingFile(index)}
                        className="remove-file-btn"
                        title="Xóa file"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
                <small className="file-note">
                  * File hiện tại sẽ được giữ lại nếu không xóa
                </small>
              </div>
            )}

            {/* New File Upload */}
            <div className="file-upload-area">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="file-input"
                id="file-upload-update"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.zip,.rar,.7z"
              />
              <label htmlFor="file-upload-update" className="file-upload-label">
                <FaUpload className="upload-icon" />
                <span>Thêm file mới (tùy chọn)</span>
                <small>Hỗ trợ: PDF, Word, Excel, Image, Archive (Tối đa 50MB/file)</small>
              </label>
            </div>
            
            {errors.files && <span className="error-message">{errors.files}</span>}

            {/* New File List */}
            {files.length > 0 && (
              <div className="new-files-section">
                <h4 className="files-section-title">File mới ({files.length})</h4>
                <div className="file-list">
                  {files.map((file, index) => (
                    <div key={index} className="file-item new">
                      <FaFile className="file-icon" />
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">
                        ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                      <button
                        type="button"
                        onClick={() => removeNewFile(index)}
                        className="remove-file-btn"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total Files Count */}
            <div className="files-summary">
              <strong>Tổng số file: {existingFiles.length + files.length}</strong>
              {existingFiles.length + files.length === 0 && (
                <span className="error-message" style={{display: 'block', marginTop: '4px'}}>
                  Cần ít nhất một file
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button
              type="button"
              onClick={handleClose}
              className="cancel-button"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={loading || (existingFiles.length === 0 && files.length === 0)}
            >
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <FaSave />
                  Cập nhật
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateStudyMaterialModal;