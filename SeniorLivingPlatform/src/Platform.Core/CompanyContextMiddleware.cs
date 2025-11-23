using Microsoft.AspNetCore.Http;

namespace Platform.Core;

/// <summary>
/// Middleware for resolving company context from subdomain or JWT claims.
/// Must be registered early in the pipeline (before MVC).
/// </summary>
/// <remarks>
/// Resolution order:
/// 1. Check if authenticated user has companyId claim (for API requests)
/// 2. Extract subdomain from request host (for web requests)
/// 3. Look up company in repository
/// 4. Validate company is active
/// 5. Set company context for downstream middleware and handlers
/// </remarks>
public class CompanyContextMiddleware : IMiddleware
{
    private readonly ICompanyRepository _companyRepository;

    public CompanyContextMiddleware(ICompanyRepository companyRepository)
    {
        _companyRepository = companyRepository ?? throw new ArgumentNullException(nameof(companyRepository));
    }

    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        try
        {
            Company? company = null;
            bool usedClaims = false;

            // Try to resolve from JWT claims first (for API requests)
            if (context.User.Identity?.IsAuthenticated == true)
            {
                var companyIdClaim = context.User.FindFirst("companyId")?.Value;

                if (!string.IsNullOrEmpty(companyIdClaim))
                {
                    // Validate GUID format
                    if (!Guid.TryParse(companyIdClaim, out var companyId))
                    {
                        context.Response.StatusCode = 400; // Bad Request - invalid GUID
                        return;
                    }

                    company = await _companyRepository.GetByIdAsync(companyId);
                    usedClaims = true;

                    // If claims were provided but company not found, return 403
                    if (company == null)
                    {
                        context.Response.StatusCode = 403; // Forbidden - company doesn't exist
                        return;
                    }
                }
                else
                {
                    // Authenticated user but no companyId claim - invalid token
                    context.Response.StatusCode = 401; // Unauthorized - missing required claim
                    return;
                }
            }

            // If not authenticated or no claims, try subdomain resolution (for web requests)
            if (company == null && !usedClaims)
            {
                var subdomain = ExtractSubdomain(context.Request.Host);

                if (string.IsNullOrEmpty(subdomain))
                {
                    context.Response.StatusCode = 400; // Bad Request - missing subdomain
                    return;
                }

                company = await _companyRepository.GetBySubdomainAsync(subdomain);

                // For subdomain resolution, not found returns 404
                if (company == null)
                {
                    context.Response.StatusCode = 404; // Not Found
                    return;
                }
            }

            // Validate company is active
            if (company != null && !company.IsActive)
            {
                context.Response.StatusCode = 403; // Forbidden - company disabled
                return;
            }

            // Set company context
            if (company != null)
            {
                CompanyContext.SetContext(company);
                context.Items["CompanyContext"] = new CompanyContext();
            }

            // Continue pipeline
            await next(context);
        }
        finally
        {
            // Clean up context after request completes
            CompanyContext.ClearContext();
        }
    }

    /// <summary>
    /// Extracts subdomain from the request host.
    /// </summary>
    /// <param name="host">The request host (e.g., "acme.platform.com")</param>
    /// <returns>The subdomain (e.g., "acme"), or null if not a subdomain request</returns>
    private string? ExtractSubdomain(HostString host)
    {
        var hostValue = host.Host;

        // Split by dots
        var parts = hostValue.Split('.');

        // Need at least 3 parts for subdomain (e.g., acme.platform.com)
        if (parts.Length < 3)
        {
            return null;
        }

        // First part is the subdomain
        return parts[0];
    }
}
