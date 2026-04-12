using Application.CQRS.Commands.StudyMaterial;
using Application.CQRS.Commands.StudyMaterials;
using Application.CQRS.Queries.StudyMaterials;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DuyTanSharingSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class StudyMaterialController : Controller
    {
        private readonly IMediator _mediator;
        public StudyMaterialController(IMediator mediator)
        {
            _mediator = mediator;
        }
        [HttpPost]
        public async Task<IActionResult> CreateStudyMaterial([FromForm] CreateStudyMaterialCommand command)
        {
            var result = await _mediator.Send(command);
            return Ok(result);
        }
        [HttpPut]
        public async Task<IActionResult> UpdateStudyMaterial( [FromForm] UpdateStudyMaterialCommand command)
        {
            var result = await _mediator.Send(command);
            return Ok(result);
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStudyMaterial(Guid id)
        {
            var command = new DeleteStudyMaterialCommand { Id = id };
            var result = await _mediator.Send(command);
            return Ok(result);
        }
        [HttpGet]
        public async Task<IActionResult> GetAllStudyMaterials([FromQuery] GetAllStudyMaterialQuery query)
        {
            var result = await _mediator.Send(query);
            return Ok(result);
        }
        [HttpPost("count-download/{id}")]
        public async Task<IActionResult> CountDownloadStudyMaterial(Guid id)
        {
            var command = new CountDowloadCommand { StudyMaterialId = id };
            var result = await _mediator.Send(command);
            return Ok(result);
        }
        [HttpGet("{id}")]
        public async Task<IActionResult> GetStudyMaterialDetail([FromRoute] Guid id)
        {
            var query = new GetDetailStudyMaterialQuery { StudyMaterialId = id };
            var result = await _mediator.Send(query);
            return Ok(result);
        }
    }
}
