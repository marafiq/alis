using Platform.Core.Abstractions;
using Platform.Core.Models;

namespace Platform.Core.Implementation;

/// <summary>
/// Provides company context information for the current request using AsyncLocal for thread-safe propagation.
/// </summary>
public class CompanyContext : ICompanyContext
{
    private static readonly AsyncLocal<CompanyContextData?> _context = new();

    /// <inheritdoc />
    public Guid CompanyId => GetContextData().CompanyId;

    /// <inheritdoc />
    public string CompanyName => GetContextData().CompanyName;

    /// <inheritdoc />
    public string Subdomain => GetContextData().Subdomain;

    /// <inheritdoc />
    public SubscriptionTier Tier => GetContextData().Tier;

    /// <inheritdoc />
    public string DatabaseMapping => GetContextData().DatabaseMapping;

    /// <inheritdoc />
    public bool IsAvailable => _context.Value != null;

    /// <summary>
    /// Sets the company context for the current async flow.
    /// </summary>
    /// <param name="company">The company to set as the current context.</param>
    public static void SetContext(Company company)
    {
        if (company == null)
            throw new ArgumentNullException(nameof(company));

        _context.Value = new CompanyContextData
        {
            CompanyId = company.Id,
            CompanyName = company.Name,
            Subdomain = company.Subdomain,
            Tier = company.Tier,
            DatabaseMapping = company.DatabaseMapping
        };
    }

    /// <summary>
    /// Sets the company context for the current async flow.
    /// </summary>
    /// <param name="companyId">The company identifier.</param>
    public static void SetContext(Guid companyId)
    {
        _context.Value = new CompanyContextData
        {
            CompanyId = companyId,
            CompanyName = string.Empty,
            Subdomain = string.Empty,
            Tier = SubscriptionTier.Basic,
            DatabaseMapping = "TenantDb"
        };
    }

    /// <summary>
    /// Clears the company context for the current async flow.
    /// </summary>
    public static void Clear()
    {
        _context.Value = null;
    }

    private CompanyContextData GetContextData()
    {
        var context = _context.Value;
        if (context == null)
        {
            throw new InvalidOperationException(
                "Company context is not available. Ensure CompanyContextMiddleware is properly configured.");
        }
        return context;
    }

    private class CompanyContextData
    {
        public Guid CompanyId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string Subdomain { get; set; } = string.Empty;
        public SubscriptionTier Tier { get; set; }
        public string DatabaseMapping { get; set; } = string.Empty;
    }
}
