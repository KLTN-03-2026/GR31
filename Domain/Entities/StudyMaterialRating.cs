using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class StudyMaterialRating
    {
        public Guid Id { get; private set; }
        public Guid MaterialId { get; private set; } // ID của tài liệu được đánh giá
        public Guid UserId { get; private set; }     // ID của người đánh giá
        public int RatingLevel { get; private set; } // Mức đánh giá (1-5)
        public string? Comment { get; private set; }
        public bool IsHelpful { get; private set; } // Đánh giá chất lượng (Hữu ích/Cập nhật/Dễ hiểu)
        public DateTime CreatedAt { get; private set; }
        public bool IsDeleted { get; private set; } = false; // Đánh dấu xóa mềm

        // THUỘC TÍNH ĐIỀU HƯỚNG (Navigation Property)
        public StudyMaterial Material { get; private set; } = default!;
         public User? User { get; private set; } // Giả sử có một User class

        public StudyMaterialRating(Guid materialId, Guid userId, int ratingLevel, string? comment = null, bool isHelpful = true)
        {
            if (materialId == Guid.Empty) throw new ArgumentException("MaterialId cannot be empty.");
            if (userId == Guid.Empty) throw new ArgumentException("UserId cannot be empty.");
            if (ratingLevel < 1 || ratingLevel > 5) throw new ArgumentOutOfRangeException(nameof(ratingLevel), "Rating level must be between 1 and 5.");

            Id = Guid.NewGuid();
            MaterialId = materialId;
            UserId = userId;
            RatingLevel = ratingLevel;
            Comment = comment;
            IsHelpful = isHelpful;
            CreatedAt = DateTime.UtcNow;
        }

        /// <summary>
        /// Cập nhật đánh giá.
        /// </summary>
        public void Update(int ratingLevel, string? comment = null, bool isHelpful = true)
        {
            if (ratingLevel < 1 || ratingLevel > 5) throw new ArgumentOutOfRangeException(nameof(ratingLevel), "Rating level must be between 1 and 5.");

            RatingLevel = ratingLevel;
            Comment = comment;
            IsHelpful = isHelpful;
        }
        public void SoftDelete()
        {
            IsDeleted = true;
        }
    }
}