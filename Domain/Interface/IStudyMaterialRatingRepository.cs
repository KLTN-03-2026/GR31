using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Interface
{
   public interface IStudyMaterialRatingRepository : IBaseRepository<StudyMaterialRating>
    {
        Task<List<StudyMaterialRating>> GetAllStudyMaterialRatingAsync(Guid? lastStudyMaterialRatingId, int pageSize, Guid StudyMaterialId);
        Task<StudyMaterialRating?> GetByMaterialAndUserAsync(Guid materialId, Guid userId);
    }
}
