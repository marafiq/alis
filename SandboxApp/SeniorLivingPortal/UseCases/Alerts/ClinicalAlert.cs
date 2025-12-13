namespace SeniorLivingPortal.UseCases.Alerts;

public enum AlertSeverity
{
    Info = 0,
    Warning = 1,
    Critical = 2
}

public enum AlertKind
{
    Unknown = 0,
    Admission = 1,
    Transfer = 2,
    Vitals = 3,
    Medication = 4
}

/// <summary>
/// Lightweight alert record used by use cases to capture "what needs attention".
/// Intentionally simple (in-memory, demo-friendly) so we can discover workflows via code.
/// </summary>
public sealed class ClinicalAlert
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public int ResidentId { get; init; }
    public AlertKind Kind { get; init; } = AlertKind.Unknown;
    public AlertSeverity Severity { get; init; } = AlertSeverity.Info;

    public string Title { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
    public string? Source { get; init; }

    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;

    public bool IsActive { get; private set; } = true;
    public DateTime? ResolvedAt { get; private set; }
    public string? ResolvedBy { get; private set; }
    public string? ResolutionNotes { get; private set; }

    public void Resolve(string resolvedBy, string? resolutionNotes = null)
    {
        if (!IsActive) return;
        IsActive = false;
        ResolvedAt = DateTime.UtcNow;
        ResolvedBy = resolvedBy;
        ResolutionNotes = resolutionNotes;
    }
}

