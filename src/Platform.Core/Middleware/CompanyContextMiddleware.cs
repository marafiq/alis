using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Platform.Core.Implementation;
using Platform.Core.Repositories;
using System.Security.Claims;

namespace Platform.Core.Middleware;

/// <summary>
/// Middleware that resolves and sets the company context for the current request.
/// Resolution order: 1) JWT claims, 2) Subdomain
/// </summary>
public class CompanyContextMiddleware : IMiddleware
{
    private readonly ICompanyRepository _companyRepository;
    private readonly ILogger<CompanyContextMiddleware> _logger;

    public CompanyContextMiddleware(
        ICompanyRepository companyRepository,
        ILogger<CompanyContextMiddleware> logger)
    {
        _companyRepository = companyRepository;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        try
        {
            Models.Company? company = null;

            // Try to resolve from JWT claims first (for API requests)
            if (context.User.Identity?.IsAuthenticated == true)
            {
                company = await ResolveFromClaimsAsync(context.User);
            }

            // Fallback to subdomain resolution (for web requests)
            if (company == null)
            {
                company = await ResolveFromSubdomainAsync(context.Request.Host);
            }

            if (company == null)
            {
                _logger.LogWarning("Could not resolve company from request. Host: {Host}", context.Request.Host);
                context.Response.StatusCode = StatusCodes.Status404NotFound;
                await context.Response.WriteAsync("Company not found.");
                return;
            }

            if (!company.IsActive)
            {
                _logger.LogWarning("Company {CompanyId} is not active.", company.Id);
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsync("Company is not active.");
                return;
            }

            // Set company context for this request
            CompanyContext.SetContext(company);
            _logger.LogDebug("Company context set: {CompanyId} - {CompanyName}", company.Id, company.Name);

            await next(context);
        }
        finally
        {
            // Clear context after request completes
            CompanyContext.Clear();
        }
    }

    private async Task<Models.Company?> ResolveFromClaimsAsync(ClaimsPrincipal user)
    {
        var companyIdClaim = user.FindFirst("companyId")?.Value
                          ?? user.FindFirst(ClaimTypes.GroupSid)?.Value;

        if (string.IsNullOrWhiteSpace(companyIdClaim))
            return null;

        if (!Guid.TryParse(companyIdClaim, out var companyId))
        {
            _logger.LogWarning("Invalid company ID in claims: {CompanyIdClaim}", companyIdClaim);
            return null;
        }

        return await _companyRepository.GetByIdAsync(companyId);
    }

    private async Task<Models.Company?> ResolveFromSubdomainAsync(HostString host)
    {
        var subdomain = ExtractSubdomain(host.Host);
        if (string.IsNullOrWhiteSpace(subdomain))
            return null;

        return await _companyRepository.GetBySubdomainAsync(subdomain);
    }

    private string? ExtractSubdomain(string host)
    {
        if (string.IsNullOrWhiteSpace(host))
            return null;

        // Remove port if present
        var hostWithoutPort = host.Split(':')[0];

        // Split by dots
        var parts = hostWithoutPort.Split('.');

        // Need at least 3 parts for subdomain (subdomain.domain.tld)
        if (parts.Length < 3)
            return null;

        // First part is the subdomain
        return parts[0].ToLowerInvariant();
    }
}
