import { useEffect, useRef, useState } from "react";
import { confirmAlert } from "react-confirm-alert";
import { FaEdit, FaEllipsisV, FaTrash } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { deleteStudyMaterial } from "../../stores/action/studyMaterialAction";
import "../../styles/Material/StudyMaterialMenu.scss";

const StudyMaterialMenu = ({ material, onEdit, isOwner }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const dispatch = useDispatch();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleDelete = () => {
    confirmAlert({
      title: "Xác nhận xóa",
      message: "Bạn có chắc chắn muốn xóa tài liệu này không?",
      buttons: [
        {
          label: "Có",
          onClick: () => {
            toast.info("Đang xóa tài liệu, vui lòng chờ...", { autoClose: 3000 });
            setTimeout(() => {
              dispatch(deleteStudyMaterial(material.id))
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
    setShowMenu(false);
  };

  const handleEdit = () => {
    onEdit(material);
    setShowMenu(false);
  };

  if (!isOwner) return null;

  return (
    <div className="study-material-menu" ref={menuRef}>
      <button 
        className="menu-toggle"
        onClick={() => setShowMenu(!showMenu)}
      >
        <FaEllipsisV />
      </button>

      {showMenu && (
        <div className="menu-dropdown">
          <div className="menu-item" onClick={handleEdit}>
            <FaEdit className="menu-icon" />
            <span>Cập nhật</span>
          </div>
          <div className="menu-item delete" onClick={handleDelete}>
            <FaTrash className="menu-icon" />
            <span>Xóa tài liệu</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyMaterialMenu;