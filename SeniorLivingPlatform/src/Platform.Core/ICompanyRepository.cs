namespace Platform.Core;

/// <summary>
/// Repository interface for company lookup operations.
/// Used by middleware to resolve tenant from subdomain or claims.
/// </summary>
public interface ICompanyRepository
{
    /// <summary>
    /// Retrieves a company by its subdomain.
    /// </summary>
    /// <param name="subdomain">The subdomain to look up (e.g., "acme" from acme.platform.com)</param>
    /// <returns>The company if found; otherwise null</returns>
    Task<Company?> GetBySubdomainAsync(string subdomain);

    /// <summary>
    /// Retrieves a company by its unique identifier.
    /// </summary>
    /// <param name="companyId">The company ID</param>
    /// <returns>The company if found; otherwise null</returns>
    Task<Company?> GetByIdAsync(Guid companyId);
}
