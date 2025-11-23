namespace Platform.Core;

/// <summary>
/// Represents a company (tenant) in the multi-tenant system.
/// </summary>
public class Company
{
    /// <summary>
    /// Unique identifier for the company
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Company display name
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Subdomain used for tenant resolution (e.g., "acme" for acme.platform.com)
    /// </summary>
    public string Subdomain { get; set; } = string.Empty;

    /// <summary>
    /// Subscription tier for the company
    /// </summary>
    public CompanyTier Tier { get; set; }

    /// <summary>
    /// Database name or identifier for this company's data
    /// </summary>
    public string DatabaseName { get; set; } = string.Empty;

    /// <summary>
    /// Indicates whether the company account is active
    /// </summary>
    public bool IsActive { get; set; } = true;
}
