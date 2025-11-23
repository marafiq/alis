namespace Platform.Core;

/// <summary>
/// Default implementation of <see cref="IFacilityContext"/>.
/// Stores facility context data using AsyncLocal for thread-safe propagation across async boundaries.
/// </summary>
public class FacilityContext : IFacilityContext
{
    private static readonly AsyncLocal<FacilityContextData?> _contextData = new();
    private readonly IReadOnlyList<Facility> _accessibleFacilities;

    /// <summary>
    /// Initializes a new instance of FacilityContext with accessible facilities.
    /// </summary>
    /// <param name="accessibleFacilities">List of facilities the current user has access to</param>
    public FacilityContext(IEnumerable<Facility> accessibleFacilities)
    {
        _accessibleFacilities = accessibleFacilities?.ToList().AsReadOnly()
            ?? throw new ArgumentNullException(nameof(accessibleFacilities));
    }

    /// <inheritdoc/>
    public Guid? ActiveFacilityId => _contextData.Value?.ActiveFacilityId;

    /// <inheritdoc/>
    public string? ActiveFacilityName => _contextData.Value?.ActiveFacilityName;

    /// <inheritdoc/>
    public IReadOnlyList<Facility> AccessibleFacilities => _accessibleFacilities;

    /// <inheritdoc/>
    public async Task SwitchFacilityAsync(Guid facilityId)
    {
        // Validate facility access
        var facility = _accessibleFacilities.FirstOrDefault(f => f.Id == facilityId);

        if (facility == null)
        {
            throw new UnauthorizedAccessException(
                $"User doesn't have access to facility {facilityId}");
        }

        // Set the active facility
        _contextData.Value = new FacilityContextData
        {
            ActiveFacilityId = facility.Id,
            ActiveFacilityName = facility.Name
        };

        await Task.CompletedTask;
    }

    /// <inheritdoc/>
    public void SwitchToAllFacilities()
    {
        _contextData.Value = null;
    }

    /// <summary>
    /// Sets the facility context for the current async flow.
    /// </summary>
    /// <param name="facilityId">The facility ID to set</param>
    /// <param name="facilityName">The facility name</param>
    internal static void SetContext(Guid? facilityId, string? facilityName)
    {
        if (facilityId.HasValue && string.IsNullOrEmpty(facilityName))
        {
            throw new ArgumentException("Facility name required when facility ID is specified", nameof(facilityName));
        }

        _contextData.Value = facilityId.HasValue
            ? new FacilityContextData
            {
                ActiveFacilityId = facilityId.Value,
                ActiveFacilityName = facilityName!
            }
            : null;
    }

    /// <summary>
    /// Clears the facility context for the current async flow.
    /// </summary>
    internal static void ClearContext()
    {
        _contextData.Value = null;
    }

    /// <summary>
    /// Internal data structure for storing facility context.
    /// </summary>
    private class FacilityContextData
    {
        public required Guid ActiveFacilityId { get; init; }
        public required string ActiveFacilityName { get; init; }
    }
}
