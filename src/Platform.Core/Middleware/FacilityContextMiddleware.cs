using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Platform.Core.Abstractions;
using Platform.Core.Implementation;
using Platform.Core.Repositories;
using System.Security.Claims;

namespace Platform.Core.Middleware;

/// <summary>
/// Middleware that resolves and sets the facility context for the current user.
/// </summary>
public class FacilityContextMiddleware : IMiddleware
{
    private readonly IFacilityRepository _facilityRepository;
    private readonly ICompanyContext _companyContext;
    private readonly ILogger<FacilityContextMiddleware> _logger;

    public FacilityContextMiddleware(
        IFacilityRepository facilityRepository,
        ICompanyContext companyContext,
        ILogger<FacilityContextMiddleware> logger)
    {
        _facilityRepository = facilityRepository;
        _companyContext = companyContext;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        try
        {
            if (!_companyContext.IsAvailable)
            {
                _logger.LogWarning("Company context is not available. Skipping facility context resolution.");
                await next(context);
                return;
            }

            // Get user ID from claims
            var userId = GetUserId(context.User);
            if (userId == Guid.Empty)
            {
                _logger.LogDebug("No authenticated user. Skipping facility context.");
                await next(context);
                return;
            }

            // Get accessible facilities for user
            var accessibleFacilities = await _facilityRepository.GetAccessibleFacilitiesAsync(
                _companyContext.CompanyId, userId);

            // Try to get active facility from session or claims
            Guid? activeFacilityId = null;
            var sessionFacilityId = context.Session.GetString("ActiveFacilityId");
            if (!string.IsNullOrEmpty(sessionFacilityId) && Guid.TryParse(sessionFacilityId, out var facilityId))
            {
                // Verify user still has access to this facility
                if (accessibleFacilities.Any(f => f.Id == facilityId))
                {
                    activeFacilityId = facilityId;
                }
            }

            // If no active facility and user has access to facilities, use the first one
            if (!activeFacilityId.HasValue && accessibleFacilities.Any())
            {
                activeFacilityId = accessibleFacilities.First().Id;
            }

            // Set facility context
            FacilityContext.SetContext(accessibleFacilities, activeFacilityId);
            _logger.LogDebug("Facility context set. Active: {ActiveFacilityId}, Accessible: {Count}",
                activeFacilityId, accessibleFacilities.Count);

            await next(context);
        }
        finally
        {
            // Clear context after request completes
            FacilityContext.Clear();
        }
    }

    private Guid GetUserId(ClaimsPrincipal user)
    {
        if (user?.Identity?.IsAuthenticated != true)
            return Guid.Empty;

        var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                       ?? user.FindFirst("sub")?.Value
                       ?? user.FindFirst("userId")?.Value;

        if (string.IsNullOrWhiteSpace(userIdClaim))
            return Guid.Empty;

        return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
    }
}
