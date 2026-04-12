using static Domain.Common.Enums;

namespace Domain.Entities
{
    public class Roommate
    {
        public Guid Id { get; private set; }
        public Guid UserId { get; private set; } // Khóa ngoại tới Users (Người tìm bạn)
        public Guid? AccommodationPostId { get; private set; } // Phòng đã có (Optional)

        public string? TargetArea { get; private set; } // Khu vực mong muốn tìm
        public decimal? MaxPrice { get; private set; }
        public string? Description { get; private set; } // Mô tả bản thân/yêu cầu (Gemini so khớp)
        public bool IsActive { get; private set; } = true; // Còn đang tìm hay không
        public string? GenderPreference { get; private set; } // Nam/Nữ/Khác

        public DateTime CreatedAt { get; private set; }
        public bool IsDelete { get; private set; } = false;

        // Navigation Properties
        public User? User { get; private set; }
        public AccommodationPost? AccommodationPost { get; private set; }

        // Constructor for Entity Framework
        private Roommate() { }

        // Constructor chính
        public Roommate(Guid userId, string? targetArea, decimal? maxPrice, string? description, Guid? accommodationPostId, string? genderPreference)
        {
            Id = Guid.NewGuid();
            UserId = userId;
            TargetArea = targetArea;
            MaxPrice = maxPrice;
            Description = description;
            AccommodationPostId = accommodationPostId;
            GenderPreference = genderPreference;
            CreatedAt = DateTime.UtcNow;
        }

        // Methods
        public void DeactivateSearch()
        {
            IsActive = false;
        }

        public void UpdateSearch(string? targetArea, decimal? maxPrice, string? description, string? genderPreference)
        {
            TargetArea = targetArea;
            MaxPrice = maxPrice;
            Description = description;
            GenderPreference = genderPreference;
        }
    }
}