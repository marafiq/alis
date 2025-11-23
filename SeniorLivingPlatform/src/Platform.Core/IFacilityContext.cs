namespace Platform.Core;

/// <summary>
/// Provides access to the current facility context for the user.
/// Answers the question: "Which facility is the user working in?"
/// </summary>
/// <remarks>
/// This interface follows the Interface Segregation Principle (ISP)
/// by providing only facility-related context.
/// </remarks>
public interface IFacilityContext
{
    /// <summary>
    /// Gets the ID of the currently active facility for the user.
    /// Null indicates "All Facilities" mode.
    /// </summary>
    Guid? ActiveFacilityId { get; }

    /// <summary>
    /// Gets the name of the currently active facility.
    /// Null if in "All Facilities" mode.
    /// </summary>
    string? ActiveFacilityName { get; }

    /// <summary>
    /// Gets the list of facilities the current user has access to.
    /// </summary>
    IReadOnlyList<Facility> AccessibleFacilities { get; }

    /// <summary>
    /// Switches the active facility for the current user.
    /// </summary>
    /// <param name="facilityId">The ID of the facility to switch to</param>
    /// <exception cref="UnauthorizedAccessException">
    /// Thrown if the user doesn't have access to the specified facility
    /// </exception>
    /// <exception cref="ArgumentException">
    /// Thrown if the facility doesn't exist or belongs to a different company
    /// </exception>
    Task SwitchFacilityAsync(Guid facilityId);

    /// <summary>
    /// Switches to "All Facilities" mode.
    /// </summary>
    void SwitchToAllFacilities();
}
