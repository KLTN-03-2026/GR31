using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Gemini;

/// <summary>
/// Cấu hình chính cho Gemini API
/// </summary>
public record GeminiModel
{
    public string ApiKey { get; init; } = string.Empty;
    public string Endpoint { get; init; } = string.Empty;
}

/// <summary>
/// Cấu hình dự phòng hoặc tài khoản thứ hai cho Gemini API
/// </summary>
public record GeminiModel2
{
    public string ApiKey2 { get; init; } = string.Empty;
    public string Endpoint2 { get; init; } = string.Empty;
}
