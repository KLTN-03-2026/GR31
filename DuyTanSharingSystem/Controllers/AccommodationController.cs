using Application.CQRS.Commands.AccommodationPosts;
using Application.CQRS.Queries.Accommodation;
using Application.CQRS.Queries.AccommodationPosts;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DuyTanSharingSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AccommodationController : Controller
    {
        private readonly IMediator _mediator;
        public AccommodationController(IMediator mediator)
        {
            _mediator = mediator;
        }
        [HttpPost]
        public async Task<IActionResult> CreateAccommodationPost([FromBody] CreateAccommodationPostCommand command)
        {
            var result = await _mediator.Send(command);
            return Ok(result);
        }
        [HttpPatch]
        public async Task<IActionResult> UpdateAccommodationPost([FromBody] UpdateAccommodationPost command)
        {
            var result = await _mediator.Send(command);
            return Ok(result);
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAccommodationPost([FromRoute] Guid id)
        {
            var command = new DeleteAccommodationPostCommand { Id = id };
            var result = await _mediator.Send(command);
            return Ok(result);
        }
        [HttpGet]
        public async Task<IActionResult> GetAccommodationPosts([FromQuery] GetAllAccommodationPostQuery query)
        {
            var result = await _mediator.Send(query);
            return Ok(result);
        }
        [HttpGet("{id}")]
        public async Task<IActionResult> GetAccommodationPostDetail([FromRoute] Guid id)
        {
            var query = new GetAccommodationPostQuery { Id = id };
            var result = await _mediator.Send(query);
            return Ok(result);
        }
        [HttpPost("search")]
        public async Task<IActionResult> SearchAccommodationPosts([FromBody] SearchAIQuery query)
        {
            var result = await _mediator.Send(query);
            return Ok(result);
        }

    }
}
