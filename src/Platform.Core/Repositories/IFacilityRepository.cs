using Platform.Core.Models;

namespace Platform.Core.Repositories;

/// <summary>
/// Repository for accessing facility data.
/// </summary>
public interface IFacilityRepository
{
    /// <summary>
    /// Gets a facility by its unique identifier.
    /// </summary>
    /// <param name="facilityId">The facility identifier.</param>
    /// <returns>The facility if found; otherwise, null.</returns>
    Task<Facility?> GetByIdAsync(Guid facilityId);

    /// <summary>
    /// Gets all facilities accessible to a user within a company.
    /// </summary>
    /// <param name="companyId">The company identifier.</param>
    /// <param name="userId">The user identifier.</param>
    /// <returns>A list of accessible facilities.</returns>
    Task<IReadOnlyList<Facility>> GetAccessibleFacilitiesAsync(Guid companyId, Guid userId);
}
