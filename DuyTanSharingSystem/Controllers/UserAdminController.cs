using Application.Interface;
using Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using static Domain.Common.Enums;

namespace DuyTanSharingSystem.Controllers
{
    [Route("api/Admin")]
    [ApiController]
    [Authorize(Policy = "Admin")]
    //[Authorize(Policy = nameof(RoleEnum.Admin))]
    public class UserAdminController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IRideService _rideService;
        public UserAdminController(IUserService userService, IRideService rideService)
        {
            _userService = userService;
            _rideService = rideService;
        }
        /// <summary>
        /// Lấy danh sách tất cả người dùng
        /// </summary>
        [HttpGet("GetallUser")]
        public async Task<IActionResult> GetAllUsersAsync()
        {
            
                // Gọi service để lấy tất cả người dùng
                var users = await _userService.GetAllUsersAsync();
                // Trả về kết quả dưới dạng OkResponse với danh sách người dùng
                return Ok(users);
           
        }

        /// <summary>
        /// Lấy danh sách người dùng với bộ lọc theo trạng thái và tìm kiếm
        /// </summary>
        [HttpGet("users")]
        public async Task<IActionResult> GetUsersAsync([FromQuery] string? status, [FromQuery] string? search)
        {           
                var users = await _userService.GetUsersAsync(status, search);
                return Ok(users);           
        }
        /// <summary>
        /// Lấy chi tiết người dùng
        /// </summary>
        [HttpGet("{userId}")]
        public async Task<IActionResult> GetUserDetailsAsync(Guid userId)
        {           
                var userDetails = await _userService.GetUserDetailsAsync(userId);
                return Ok(userDetails);           
        }

        /// <summary>
        /// Block người dùng
        /// </summary>
        [HttpPost("{userId}/block")]
        public async Task<IActionResult> BlockUserAsync(Guid userId, [FromQuery] DateTime blockUntil)
        {         
             var result  =   await _userService.BlockUserAsync(userId, blockUntil);
            
            return Ok(result);
        }

        /// <summary>
        /// Suspend người dùng
        /// </summary>
        [HttpPost("{userId}/suspend")]
        public async Task<IActionResult> SuspendUserAsync(Guid userId, [FromQuery] DateTime suspendUntil)
        {           
             var result=   await _userService.SuspendUserAsync(userId, suspendUntil);
                return Ok(result);          
        }

        /// <summary>
        /// Unblock người dùng
        /// </summary>
        [HttpPost("{userId}/unblock")]
        public async Task<IActionResult> UnblockUserAsync(Guid userId)
        {
            var result = await _userService.UnblockUserAsync(userId);
            return Ok( result);
        }

        [HttpGet("rides-by-status")]
        public async Task<IActionResult> GetRidesByStatus(
            [FromQuery] string status,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            if (string.IsNullOrEmpty(status))
            {
                return BadRequest("Status is required.");
            }

            if (!Enum.TryParse<StatusRideEnum>(status, true, out var statusEnum))
            {
                return BadRequest("Invalid status value. Use 'Accepted' or 'Completed'.");
            }

            if (page < 1)
            {
                return BadRequest("Page must be greater than or equal to 1.");
            }

            if (pageSize < 1)
            {
                return BadRequest("PageSize must be greater than or equal to 1.");
            }

            var result = await _rideService.GetRidesByStatusAsync(statusEnum, page, pageSize);
            return Ok(result);
        }
        [HttpGet("ride-details/{id}")]
        public async Task<IActionResult> GetRideDetails(Guid id)
        {
            var rideDetail = await _rideService.GetRideDetailsAsync(id);

            if (rideDetail == null)
            {
                return NotFound("Ride not found.");
            }

            return Ok(rideDetail);
        }
    }
}
