namespace SeniorLivingPortal.UseCases;

/// <summary>
/// Simple, explicit outcome envelope for "code-first" use cases.
/// Keeps failures non-exceptional for business/validation errors.
/// </summary>
public sealed record UseCaseOutcome<T>(bool Success, T? Data, IReadOnlyList<string> Errors)
{
    public static UseCaseOutcome<T> Ok(T data) => new(true, data, Array.Empty<string>());
    public static UseCaseOutcome<T> Fail(params string[] errors) => new(false, default, errors);
    public static UseCaseOutcome<T> Fail(IEnumerable<string> errors) => new(false, default, errors.ToArray());
}

