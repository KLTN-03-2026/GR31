using Application.CQRS.Commands.StudyMaterialReviews;
using Application.CQRS.Queries.StudyMaterials;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DuyTanSharingSystem.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class StudyMaterialReviewController : Controller
    {
        private readonly IMediator _mediator;
        public StudyMaterialReviewController(IMediator mediator)
        {
            _mediator = mediator;
        }
        [HttpGet("{Id}")]
        public async Task<IActionResult> GetAllReviews([FromRoute] Guid id)
        {
            var query = new GetAllReviewQuery { StudyMaterialId = id };
            var result = await _mediator.Send(query);
            return Ok(result);
        }
        [HttpPost]
        public async Task<IActionResult> CreateReview([FromBody] CreateStudyMaterialReviewCommand command)
        {
            var result = await _mediator.Send(command);
            return Ok(result);
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteReview(Guid id)
        {
            var command = new DeleteStudyMaterialReviewCommand { Id = id };
            var result = await _mediator.Send(command);
            return Ok(result);
        }
        [HttpPut]
        public async Task<IActionResult> UpdateReview([FromBody] UpdateStudyMaterialReviewCommand command)
        {
            var result = await _mediator.Send(command);
            return Ok(result);
        }
    }
}
