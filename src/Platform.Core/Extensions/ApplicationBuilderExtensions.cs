using Microsoft.AspNetCore.Builder;
using Platform.Core.Middleware;

namespace Platform.Core.Extensions;

/// <summary>
/// Extension methods for configuring the Platform.Core middleware pipeline.
/// </summary>
public static class ApplicationBuilderExtensions
{
    /// <summary>
    /// Adds Platform.Core middleware to the application pipeline.
    /// IMPORTANT: Call this early in the pipeline, before MVC and other middleware that needs tenant context.
    /// </summary>
    /// <param name="app">The application builder.</param>
    /// <returns>The application builder for chaining.</returns>
    public static IApplicationBuilder UsePlatformCore(this IApplicationBuilder app)
    {
        // Session must be configured before company/facility middleware
        app.UseSession();

        // Company context must be set before facility context
        app.UseMiddleware<CompanyContextMiddleware>();
        app.UseMiddleware<FacilityContextMiddleware>();

        return app;
    }
}
