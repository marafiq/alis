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

            // Try to resolve from JWT claims first (for API requests)
            if (context.User.Identity?.IsAuthenticated == true)
            {
                var companyIdClaim = context.User.FindFirst("companyId")?.Value;
                if (!string.IsNullOrEmpty(companyIdClaim) && Guid.TryParse(companyIdClaim, out var companyId))
                {
                    company = await _companyRepository.GetByIdAsync(companyId);
                }
            }

            // If not found via claims, try subdomain resolution (for web requests)
            if (company == null)
            {
                var subdomain = ExtractSubdomain(context.Request.Host);

                if (string.IsNullOrEmpty(subdomain))
                {
                    context.Response.StatusCode = 400; // Bad Request - missing subdomain
                    return;
                }

                company = await _companyRepository.GetBySubdomainAsync(subdomain);
            }

            // Validate company found
            if (company == null)
            {
                context.Response.StatusCode = 404; // Not Found
                return;
            }

            // Validate company is active
            if (!company.IsActive)
            {
                context.Response.StatusCode = 403; // Forbidden
                return;
            }

            // Set company context
            CompanyContext.SetContext(company);
            context.Items["CompanyContext"] = new CompanyContext();

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
