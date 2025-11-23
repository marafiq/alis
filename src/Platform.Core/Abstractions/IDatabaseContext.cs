namespace Platform.Core.Abstractions;

/// <summary>
/// Provides database connection information for the current company.
/// </summary>
public interface IDatabaseContext
{
    /// <summary>
    /// Gets the connection string for the tenant database (company-specific data).
    /// </summary>
    string TenantConnectionString { get; }

    /// <summary>
    /// Gets the connection string for the admin database (cross-company data).
    /// </summary>
    string AdminConnectionString { get; }

    /// <summary>
    /// Gets the connection string for the families database (cross-company family relationships).
    /// </summary>
    string FamiliesConnectionString { get; }

    /// <summary>
    /// Gets the connection string for read-only queries (read replica).
    /// </summary>
    string ReadReplicaConnectionString { get; }

    /// <summary>
    /// Gets the Cosmos DB endpoint for event sourcing and analytics.
    /// </summary>
    string CosmosDbEndpoint { get; }
}
