using Microsoft.Extensions.Options;
using Platform.Core.Abstractions;

namespace Platform.Core.Implementation;

/// <summary>
/// Provides database connection information for the current company.
/// </summary>
public class DatabaseContext : IDatabaseContext
{
    private readonly ICompanyContext _companyContext;
    private readonly DatabaseOptions _options;

    public DatabaseContext(ICompanyContext companyContext, IOptions<DatabaseOptions> options)
    {
        _companyContext = companyContext;
        _options = options.Value;
    }

    /// <inheritdoc />
    public string TenantConnectionString => GetConnectionString(_options.TenantConnectionStringTemplate);

    /// <inheritdoc />
    public string AdminConnectionString => _options.AdminConnectionString;

    /// <inheritdoc />
    public string FamiliesConnectionString => _options.FamiliesConnectionString;

    /// <inheritdoc />
    public string ReadReplicaConnectionString => GetConnectionString(_options.ReadReplicaConnectionStringTemplate);

    /// <inheritdoc />
    public string CosmosDbEndpoint => _options.CosmosDbEndpoint;

    private string GetConnectionString(string template)
    {
        // Replace {DatabaseMapping} with the actual database name for this company
        return template.Replace("{DatabaseMapping}", _companyContext.DatabaseMapping);
    }
}

/// <summary>
/// Configuration options for database connections.
/// </summary>
public class DatabaseOptions
{
    /// <summary>
    /// Gets or sets the tenant database connection string template.
    /// Use {DatabaseMapping} as a placeholder for the company's database name.
    /// </summary>
    public string TenantConnectionStringTemplate { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the admin database connection string.
    /// </summary>
    public string AdminConnectionString { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the families database connection string.
    /// </summary>
    public string FamiliesConnectionString { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the read replica connection string template.
    /// </summary>
    public string ReadReplicaConnectionStringTemplate { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the Cosmos DB endpoint.
    /// </summary>
    public string CosmosDbEndpoint { get; set; } = string.Empty;
}
