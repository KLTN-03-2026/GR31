using static Domain.Common.Enums;
using System.ComponentModel.DataAnnotations.Schema; // Cần cho Column

namespace Domain.Entities
{
    public class AccommodationPost
    {
        public Guid Id { get; private set; }
        public Guid UserId { get; private set; } // Khóa ngoại tới Users (Người đăng)
        public string Title { get; private set; } = string.Empty;
        public string? Content { get; private set; }
        public string Address { get; private set; } = string.Empty;

        // Cần cho tính toán khoảng cách
        public double Latitude { get; private set; }
        public double Longitude { get; private set; }

        public decimal Price { get; private set; }

public decimal? Area { get; private set; } // m²

public string? RoomType { get; private set; } // Phòng trọ, Chung cư mini,...

public string? Amenities { get; private set; } // JSON / text (AI xử lý)

public int? MaxPeople { get; private set; }

public int? CurrentPeople { get; private set; }

public StatusAccommodationEnum Status { get; private set; } 
    = StatusAccommodationEnum.Available;

public bool IsVerified { get; private set; } = false;

public bool IsDeleted { get; private set; } = false;

public DateTime CreatedAt { get; private set; } 
    = DateTime.UtcNow;

public DateTime? UpdatedAt { get; private set; }

        // Navigation Properties
        public User? User { get; private set; }
        public ICollection<AccommodationReview>? Reviews { get; private set; } = new List<AccommodationReview>();
        public ICollection<Roommate>? Roommates { get; private set; } = new List<Roommate>(); // Danh sách người tìm trọ ghép trong phòng này

        // Constructor for Entity Framework
        private AccommodationPost() { }

        // Constructor chính
        public AccommodationPost(Guid userId, string title, string address,
            double latitude, double longitude, decimal price, decimal? area,
            string? roomType, string? content, string? amenities, int? maxPeople, int? currentPeople)
        {
            Id = Guid.NewGuid();
            UserId = userId;
            Title = title;
            Content = content;
            Address = address;
            Latitude = latitude;
            Longitude = longitude;
            Price = price;
            Area = area;
            RoomType = roomType;
            Amenities = amenities;
            CreatedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
            MaxPeople = maxPeople;
            CurrentPeople = currentPeople;
        }

        // Methods
        public void UpdatePost(string title, string? content, decimal price,
            decimal? area, string? roomType, string? amenities, string address,
            double latitude, double longitude, int? maxPeople, int? currentPeople)
        {
            Title = title;
            Content = content;
            Price = price;
            Area = area;
            RoomType = roomType;
            Amenities = amenities;
            Address = address;
            Latitude = latitude;
            Longitude = longitude;
            MaxPeople = maxPeople;
            CurrentPeople = currentPeople;
            UpdatedAt = DateTime.UtcNow;
        }

       public void Verify()
        {
            IsVerified = true;
            Touch();
        }

        public void Unverify()
        {
            IsVerified = false;
            Touch();
        }

public void SoftDelete()
{
    IsDelete = true;
    Touch();
}
    }

}