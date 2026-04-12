using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Interface
{
    public interface IAccommodationReviewRepository : IBaseRepository<AccommodationReview>
    {
        Task<AccommodationReview?> GetByPostAndUserAsync(Guid accommodationPostId, Guid userId);
        Task<List<AccommodationReview>> GetReviewsByAccommodationPostIdAsync(Guid accommodationPostId, Guid? lastAccommodationReviewId, int pageSize);
        //Lấy danh sách rating cho một accommodation post
        Task<List<int>?> GetRatingsByAccommodationPostIdAsync(Guid accommodationPostId);
    }
}
