using Platform.Core.Models;

namespace Platform.Core.Repositories;

/// <summary>
/// Repository for accessing company data.
/// </summary>
public interface ICompanyRepository
{
    /// <summary>
    /// Gets a company by its subdomain.
    /// </summary>
    /// <param name="subdomain">The subdomain identifier.</param>
    /// <returns>The company if found; otherwise, null.</returns>
    Task<Company?> GetBySubdomainAsync(string subdomain);

    /// <summary>
    /// Gets a company by its unique identifier.
    /// </summary>
    /// <param name="companyId">The company identifier.</param>
    /// <returns>The company if found; otherwise, null.</returns>
    Task<Company?> GetByIdAsync(Guid companyId);
}
