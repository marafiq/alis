namespace Platform.Core;

/// <summary>
/// Represents a facility (building/location) within a company.
/// </summary>
public class Facility
{
    /// <summary>
    /// Unique identifier for the facility
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Company that owns this facility
    /// </summary>
    public Guid CompanyId { get; set; }

    /// <summary>
    /// Facility display name
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Indicates whether the facility is active
    /// </summary>
    public bool IsActive { get; set; } = true;
}
