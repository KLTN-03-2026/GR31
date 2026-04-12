using Application.CQRS.Commands.AccommodationReviews;
using Application.CQRS.Queries.AccommodationReviews;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DuyTanSharingSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AccommodationReviewController : Controller
    {
        private readonly IMediator _mediator;
        public AccommodationReviewController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpPost]
        public async Task<IActionResult> CreateAccommodationReview([FromBody] CreateAccommodationReviewCommand command)
        {
            var result = await _mediator.Send(command);
            return Ok(result);
        }
        [HttpGet("{id}")]
        public async Task<IActionResult> GetAccommodationReviews([FromRoute] Guid id)
        {
            var query = new GetAccommodationReviewsQuery { AccommodationPostId = id };
            var result = await _mediator.Send(query);
            return Ok(result);
        }
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAccommodationReview([FromRoute] Guid id, [FromBody] UpdateAccommodationReviewCommand command)
        {
            if (id != command.ReviewId)
            {
                return BadRequest("ID in URL does not match ID in body");
            }
            var result = await _mediator.Send(command);
            return Ok(result);
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAccommodationReview([FromRoute] Guid id)
        {
            var command = new DeleteAccommodationReviewCommand { Id = id };
            var result = await _mediator.Send(command);
            return Ok(result);
        }
    }
}
