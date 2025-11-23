using Microsoft.AspNetCore.Http;
using Platform.Core.Abstractions;
using Platform.Core.Models;
using Platform.Core.Repositories;

namespace Platform.Core.Implementation;

/// <summary>
/// Provides facility context information for the current user using session storage.
/// </summary>
public class FacilityContext : IFacilityContext
{
    private static readonly AsyncLocal<FacilityContextData?> _context = new();
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IFacilityRepository _facilityRepository;
    private readonly ICompanyContext _companyContext;

    public FacilityContext(
        IHttpContextAccessor httpContextAccessor,
        IFacilityRepository facilityRepository,
        ICompanyContext companyContext)
    {
        _httpContextAccessor = httpContextAccessor;
        _facilityRepository = facilityRepository;
        _companyContext = companyContext;
    }

    /// <inheritdoc />
    public Guid? ActiveFacilityId => GetContextData()?.ActiveFacilityId;

    /// <inheritdoc />
    public string? ActiveFacilityName => GetContextData()?.ActiveFacilityName;

    /// <inheritdoc />
    public IReadOnlyList<Facility> AccessibleFacilities => GetContextData()?.AccessibleFacilities ?? Array.Empty<Facility>();

    /// <inheritdoc />
    public bool IsAvailable => _context.Value != null;

    /// <inheritdoc />
    public Task SwitchFacilityAsync(Guid facilityId)
    {
        var contextData = GetContextData();
        if (contextData == null)
            throw new InvalidOperationException("Facility context is not available.");

        // Validate user has access to this facility
        var facility = contextData.AccessibleFacilities.FirstOrDefault(f => f.Id == facilityId);
        if (facility == null)
        {
            throw new UnauthorizedAccessException(
                $"User does not have access to facility {facilityId}.");
        }

        // Validate facility belongs to current company
        if (facility.CompanyId != _companyContext.CompanyId)
        {
            throw new ArgumentException(
                $"Facility {facilityId} does not belong to the current company.");
        }

        // Update context
        contextData.ActiveFacilityId = facilityId;
        contextData.ActiveFacilityName = facility.Name;

        // Persist to session if available
        var session = _httpContextAccessor.HttpContext?.Session;
        if (session != null)
        {
            session.SetString("ActiveFacilityId", facilityId.ToString());
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task SwitchToAllFacilitiesAsync()
    {
        var contextData = GetContextData();
        if (contextData == null)
            throw new InvalidOperationException("Facility context is not available.");

        contextData.ActiveFacilityId = null;
        contextData.ActiveFacilityName = null;

        // Clear from session if available
        var session = _httpContextAccessor.HttpContext?.Session;
        if (session != null)
        {
            session.Remove("ActiveFacilityId");
        }

        return Task.CompletedTask;
    }

    /// <summary>
    /// Sets the facility context for the current async flow.
    /// </summary>
    /// <param name="accessibleFacilities">The list of facilities the user has access to.</param>
    /// <param name="activeFacilityId">The active facility identifier, or null for "All Facilities" mode.</param>
    public static void SetContext(IReadOnlyList<Facility> accessibleFacilities, Guid? activeFacilityId = null)
    {
        if (accessibleFacilities == null)
            throw new ArgumentNullException(nameof(accessibleFacilities));

        var activeFacility = activeFacilityId.HasValue
            ? accessibleFacilities.FirstOrDefault(f => f.Id == activeFacilityId.Value)
            : null;

        _context.Value = new FacilityContextData
        {
            AccessibleFacilities = accessibleFacilities,
            ActiveFacilityId = activeFacilityId,
            ActiveFacilityName = activeFacility?.Name
        };
    }

    /// <summary>
    /// Sets the facility context for the current async flow.
    /// </summary>
    /// <param name="facilityId">The facility identifier.</param>
    public static void SetContext(Guid? facilityId)
    {
        _context.Value = new FacilityContextData
        {
            AccessibleFacilities = Array.Empty<Facility>(),
            ActiveFacilityId = facilityId,
            ActiveFacilityName = null
        };
    }

    /// <summary>
    /// Clears the facility context for the current async flow.
    /// </summary>
    public static void Clear()
    {
        _context.Value = null;
    }

    private FacilityContextData? GetContextData()
    {
        return _context.Value;
    }

    private class FacilityContextData
    {
        public Guid? ActiveFacilityId { get; set; }
        public string? ActiveFacilityName { get; set; }
        public IReadOnlyList<Facility> AccessibleFacilities { get; set; } = Array.Empty<Facility>();
    }
}
