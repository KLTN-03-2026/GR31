import { useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import ImageDefault from "../../assets/ImgDefault.png";
import "../../styles/PostDetail/ImagePost.scss";

const ImagePost = ({ post }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Memoize mảng media để không tạo lại mỗi lần render
  const mediaArray = useMemo(() => [
    ...(post.imageUrl ? [{ type: "image", url: post.imageUrl }] : []),
    ...(post.videoUrl ? [{ type: "video", url: post.videoUrl }] : []),
  ], [post.imageUrl, post.videoUrl]);

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % mediaArray.length);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + mediaArray.length) % mediaArray.length);
  };

  if (!mediaArray.length) {
    return (
      <div className="image-post-container">
        <img className="media-content" src={ImageDefault} alt="Default" />
      </div>
    );
  }

  const currentMedia = mediaArray[currentIndex];

  return (
    <div className="image-post-container">
      {mediaArray.length > 1 && (
        <>
          <button className="nav-btn prev" onClick={handlePrev}><FiChevronLeft size={30} /></button>
          <button className="nav-btn next" onClick={handleNext}><FiChevronRight size={30} /></button>
        </>
      )}

      {currentMedia.type === "video" ? (
        <video className="media-content" controls autoPlay src={currentMedia.url}>
          <source src={currentMedia.url} type="video/mp4" />
        </video>
      ) : (
        <img className="media-content" src={currentMedia.url} alt="Post content" />
      )}
    </div>
  );
};

export default ImagePost;