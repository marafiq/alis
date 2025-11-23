namespace Platform.Core;

/// <summary>
/// Default implementation of <see cref="ICompanyContext"/>.
/// Stores company context data using AsyncLocal for thread-safe propagation across async boundaries.
/// </summary>
public class CompanyContext : ICompanyContext
{
    private static readonly AsyncLocal<CompanyContextData?> _contextData = new();

    /// <inheritdoc/>
    public Guid CompanyId
    {
        get
        {
            EnsureContextAvailable();
            return _contextData.Value!.CompanyId;
        }
    }

    /// <inheritdoc/>
    public string CompanyName
    {
        get
        {
            EnsureContextAvailable();
            return _contextData.Value!.CompanyName;
        }
    }

    /// <inheritdoc/>
    public CompanyTier Tier
    {
        get
        {
            EnsureContextAvailable();
            return _contextData.Value!.Tier;
        }
    }

    /// <inheritdoc/>
    public string DatabaseMapping
    {
        get
        {
            EnsureContextAvailable();
            return _contextData.Value!.DatabaseMapping;
        }
    }

    /// <summary>
    /// Sets the company context for the current async flow.
    /// </summary>
    /// <param name="company">The company to set as current context</param>
    internal static void SetContext(Company company)
    {
        if (company == null)
            throw new ArgumentNullException(nameof(company));

        _contextData.Value = new CompanyContextData
        {
            CompanyId = company.Id,
            CompanyName = company.Name,
            Tier = company.Tier,
            DatabaseMapping = company.DatabaseName
        };
    }

    /// <summary>
    /// Clears the company context for the current async flow.
    /// </summary>
    internal static void ClearContext()
    {
        _contextData.Value = null;
    }

    private void EnsureContextAvailable()
    {
        if (_contextData.Value == null)
        {
            throw new InvalidOperationException(
                "Company context is not available. Ensure CompanyContextMiddleware is registered in the pipeline.");
        }
    }

    /// <summary>
    /// Internal data structure for storing company context.
    /// </summary>
    private class CompanyContextData
    {
        public required Guid CompanyId { get; init; }
        public required string CompanyName { get; init; }
        public required CompanyTier Tier { get; init; }
        public required string DatabaseMapping { get; init; }
    }
}
