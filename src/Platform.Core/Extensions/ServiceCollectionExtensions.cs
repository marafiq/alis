using Microsoft.Extensions.DependencyInjection;
using Platform.Core.Abstractions;
using Platform.Core.Implementation;
using Platform.Core.Middleware;

namespace Platform.Core.Extensions;

/// <summary>
/// Extension methods for registering Platform.Core services in the DI container.
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Adds all Platform.Core context abstractions and middleware to the service collection.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <returns>The service collection for chaining.</returns>
    public static IServiceCollection AddPlatformCore(this IServiceCollection services)
    {
        // Register context implementations as scoped (per-request lifetime)
        services.AddScoped<ICompanyContext, CompanyContext>();
        services.AddScoped<IFacilityContext, FacilityContext>();
        services.AddScoped<IDatabaseContext, DatabaseContext>();
        services.AddScoped<IStorageContext, StorageContext>();
        services.AddScoped<ICacheContext, CacheContext>();
        services.AddScoped<IMessagingContext, MessagingContext>();
        services.AddScoped<IObservabilityContext, ObservabilityContext>();

        // Register middleware
        services.AddScoped<CompanyContextMiddleware>();
        services.AddScoped<FacilityContextMiddleware>();

        // Add HTTP context accessor (required for some contexts)
        services.AddHttpContextAccessor();

        // Add session support (required for facility context)
        services.AddDistributedMemoryCache();
        services.AddSession(options =>
        {
            options.IdleTimeout = TimeSpan.FromHours(8);
            options.Cookie.HttpOnly = true;
            options.Cookie.IsEssential = true;
        });

        return services;
    }
}
