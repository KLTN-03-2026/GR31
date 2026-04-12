using Application.CQRS.Commands.EmailToken;
using Application.CQRS.Commands.Users;
using Application.DTOs.User;
using Application.Interface;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DuyTanSharingSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : Controller
    {
       private readonly IMediator _mediator;
        private readonly IAuthService _authService;
        public AuthController(IMediator mediator,IAuthService authService)
        {
            _mediator = mediator;
            _authService = authService;
        }
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterUserCommand command)
        {
            var response = await _mediator.Send(command);
            if (response.Success)
            {
                return Ok(response);
            }
            return BadRequest(response);
        }
        [HttpGet("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromQuery] string token)
        {
            if (string.IsNullOrEmpty(token))
            {
                return Redirect("https://duy-tan-sharing-system.vercel.app/Home");
            }

            var response = await _mediator.Send(new VerifyEmailCommand(token));
            if (response.Success)
            {
                return Redirect("https://duy-tan-sharing-system.vercel.app/AccountVerified");
            }

            // Kiểm tra thông điệp lỗi để redirect
            if (response.Message.Contains("The verification token has expired. Please request a new verification email."))
            {
                return Redirect("https://duy-tan-sharing-system.vercel.app/ResendVerification");
            }
            if (response.Message.Contains("This email verification token has already been used.") ||
                response.Message.Contains("Email already verified"))
            {
                return Redirect("https://duy-tan-sharing-system.vercel.app/404Site");
            }

            // Các trường hợp lỗi khác (ví dụ: token không hợp lệ, không tìm thấy người dùng)
            return Redirect("https://duy-tan-sharing-system.vercel.app/404Site");
        }
        [HttpPost("resend-verification-email")]
        public async Task<IActionResult> ResendVerificationEmail([FromBody] ResendVerificationEmailCommand command)
        {
            var response = await _mediator.Send(command);
            if (response.Success)
            {
                return Ok(response);
            }
            if (response.Message == "Email already verified")
            {
                return Redirect("https://duy-tan-sharing-system.vercel.app/Home");
            }
            return BadRequest(new { message = response.Message });
        }

        // Các endpoint khác (Register, ResendVerificationEmail, v.v.) giữ nguyên

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] UserLoginDto user)
        {
            var response = await _authService.LoginAsync(user);
            if (response.Success)
            {
                return Ok(response);
            }
            return BadRequest(response);
        }
        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken()
        {
            var response = await _authService.RefreshTokenAsync();
            if (response == null)
            {
                return BadRequest(new { message = "Invalid token" });
            }
            return Ok(new { accessToken = response.Data, message = response.Message });
        }

        [HttpGet("validate-token")]
        [Authorize]
        public IActionResult ValidateToken()
        {
            return Ok(new { success = true });
        }
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordCommand command)
        {
            var response = await _mediator.Send(command);
            if (response.Success)
            {
                return Ok(response);
            }
            return BadRequest(response);
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordCommand command)
        {
            var response = await _mediator.Send(command);
            if (response.Success)
            {
                return Ok(response);
            }
            return BadRequest(response);
        }

        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordCommand command)
        {
            var response = await _mediator.Send(command);
            if (response.Success)
            {
                return Ok(response);
            }
            return BadRequest(response);
        }
        [HttpGet("validate-reset-token")]
        public async Task<IActionResult> ValidateResetToken([FromQuery] string token)
        {
            if (string.IsNullOrEmpty(token))
            {
                return BadRequest(new { success = false, message = "Token is required" });
            }

            var response = await _mediator.Send(new ValidateResetTokenCommand(token));
            if (response.Success)
            {
                return Ok(response);
            }
            return BadRequest(response);
        }
    }
}
