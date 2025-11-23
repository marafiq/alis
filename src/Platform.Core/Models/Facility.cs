namespace Platform.Core.Models;

/// <summary>
/// Represents a physical facility (location) belonging to a company.
/// </summary>
public class Facility
{
    /// <summary>
    /// Gets or sets the unique identifier for the facility.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Gets or sets the company identifier this facility belongs to.
    /// </summary>
    public Guid CompanyId { get; set; }

    /// <summary>
    /// Gets or sets the facility name.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the facility code (short identifier).
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets a value indicating whether the facility is active.
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Gets or sets the physical address of the facility.
    /// </summary>
    public string Address { get; set; } = string.Empty;
}
