using static Domain.Common.Enums;

namespace Domain.Entities
{
    public class AccommodationReview
    {
        public Guid Id { get; private set; }
        public Guid AccommodationPostId { get; private set; } // Khóa ngoại tới AccommodationPost
        public Guid UserId { get; private set; } // Khóa ngoại tới Users (Người đánh giá)

        // Điểm rating tổng thể
        public int Rating { get; private set; } // 1-5

        public string? Comment { get; private set; } // Nội dung đánh giá (Gemini phân tích)

        // Các điểm số kết quả từ phân tích AI
        public int? SafetyScore { get; private set; } // 1-5 (Phân tích từ Comment)
        public int? PriceScore { get; private set; } // 1-5 (Phân tích từ Comment)

        public DateTime CreatedAt { get; private set; }
        public bool IsApproved { get; private set; } = false; // Đã được Admin/AI duyệt
        public bool IsDelete { get; private set; } = false; // Đánh dấu đã xóa

        // Navigation Properties
        public AccommodationPost? AccommodationPost { get; private set; }
        public User? User { get; private set; }

        // Constructor for Entity Framework
        private AccommodationReview() { }

        // Constructor chính
        public AccommodationReview(Guid accommodationPostId, Guid userId, int rating, string? comment)
        {
            Id = Guid.NewGuid();
            AccommodationPostId = accommodationPostId;
            UserId = userId;
            Rating = rating;
            Comment = comment;
            CreatedAt = DateTime.UtcNow;
            // SafetyScore và PriceScore sẽ được set sau khi API Gemini xử lý
        }

        // Methods: Cần thiết để lưu kết quả phân tích AI
        public void SetAIScores(int safetyScore, int priceScore)
        {
            SafetyScore = safetyScore;
            PriceScore = priceScore;
        }

        public void ApproveReview()
        {
            IsApproved = true;
        }
        public void UpdateReview(int rating, string? comment)
        {
            Rating = rating;
            Comment = comment;
            // Khi cập nhật đánh giá, cần reset điểm AI để phân tích lại
            SafetyScore = null;
            PriceScore = null;
        }
        public void Delete()
        {
            IsDelete = true;
        }
    }
}