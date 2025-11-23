using Platform.Core.Models;

namespace Platform.Core.Abstractions;

/// <summary>
/// Provides context information about the current facility for the user.
/// </summary>
public interface IFacilityContext
{
    /// <summary>
    /// Gets the unique identifier of the active facility, or null if "All Facilities" mode is active.
    /// </summary>
    Guid? ActiveFacilityId { get; }

    /// <summary>
    /// Gets the name of the active facility, or null if "All Facilities" mode is active.
    /// </summary>
    string? ActiveFacilityName { get; }

    /// <summary>
    /// Gets the list of facilities the current user has access to.
    /// </summary>
    IReadOnlyList<Facility> AccessibleFacilities { get; }

    /// <summary>
    /// Switches the active facility for the current user.
    /// </summary>
    /// <param name="facilityId">The identifier of the facility to switch to.</param>
    /// <exception cref="UnauthorizedAccessException">Thrown when the user doesn't have access to the specified facility.</exception>
    /// <exception cref="ArgumentException">Thrown when the facility doesn't exist or belongs to a different company.</exception>
    Task SwitchFacilityAsync(Guid facilityId);

    /// <summary>
    /// Switches to "All Facilities" mode, allowing the user to view data across all accessible facilities.
    /// </summary>
    Task SwitchToAllFacilitiesAsync();

    /// <summary>
    /// Gets a value indicating whether facility context is available.
    /// </summary>
    bool IsAvailable { get; }
}
