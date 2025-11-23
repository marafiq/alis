namespace Platform.Core.Models;

/// <summary>
/// Represents a tenant company in the multi-tenant system.
/// </summary>
public class Company
{
    /// <summary>
    /// Gets or sets the unique identifier for the company.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Gets or sets the company name.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the subdomain used to access this company's portal.
    /// Example: "acme" for acme.platform.com
    /// </summary>
    public string Subdomain { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the subscription tier for this company.
    /// </summary>
    public SubscriptionTier Tier { get; set; }

    /// <summary>
    /// Gets or sets the database mapping identifier for this company.
    /// </summary>
    public string DatabaseMapping { get; set; } = "TenantDb";

    /// <summary>
    /// Gets or sets a value indicating whether the company is active.
    /// </summary>
    public bool IsActive { get; set; } = true;
}

/// <summary>
/// Represents the subscription tier for a company.
/// </summary>
public enum SubscriptionTier
{
    /// <summary>
    /// Free tier with limited features.
    /// </summary>
    Free = 0,

    /// <summary>
    /// Basic tier with standard features.
    /// </summary>
    Basic = 1,

    /// <summary>
    /// Professional tier with advanced features.
    /// </summary>
    Professional = 2,

    /// <summary>
    /// Enterprise tier with all features.
    /// </summary>
    Enterprise = 3
}
