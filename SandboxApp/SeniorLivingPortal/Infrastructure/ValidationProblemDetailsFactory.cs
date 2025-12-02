using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Mvc;

namespace SeniorLivingPortal.Infrastructure;

/// <summary>
/// Extension methods for converting FluentValidation results to RFC 7807 ProblemDetails.
/// This format is compatible with ALIS validation display.
/// </summary>
public static class ValidationExtensions
{
    /// <summary>
    /// Converts FluentValidation result to ProblemDetails for ALIS consumption.
    /// </summary>
    public static ValidationProblemDetails ToProblemDetails(this ValidationResult result, string title = "Validation failed")
    {
        var errors = result.Errors
            .GroupBy(e => e.PropertyName)
            .ToDictionary(
                g => g.Key,
                g => g.Select(e => e.ErrorMessage).ToArray()
            );

        return new ValidationProblemDetails(errors)
        {
            Type = "https://tools.ietf.org/html/rfc7807",
            Title = title,
            Status = StatusCodes.Status400BadRequest
        };
    }

    /// <summary>
    /// Validates an object and returns ProblemDetails if invalid, null if valid.
    /// </summary>
    public static async Task<ValidationProblemDetails?> ValidateAndGetProblemsAsync<T>(
        this IValidator<T> validator, 
        T instance,
        string? title = null)
    {
        var result = await validator.ValidateAsync(instance);
        if (result.IsValid)
            return null;

        return result.ToProblemDetails(title ?? "Please fix the errors below");
    }
}

/// <summary>
/// Result wrapper for controller actions that may return validation errors.
/// </summary>
public class ValidationResult<T>
{
    public bool IsValid { get; }
    public T? Value { get; }
    public ValidationProblemDetails? Problems { get; }

    private ValidationResult(bool isValid, T? value, ValidationProblemDetails? problems)
    {
        IsValid = isValid;
        Value = value;
        Problems = problems;
    }

    public static ValidationResult<T> Success(T value) => new(true, value, null);
    public static ValidationResult<T> Failure(ValidationProblemDetails problems) => new(false, default, problems);
}

