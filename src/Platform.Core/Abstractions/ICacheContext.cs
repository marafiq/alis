namespace Platform.Core.Abstractions;

/// <summary>
/// Provides tenant-safe cache key generation to prevent cross-tenant cache pollution.
/// </summary>
public interface ICacheContext
{
    /// <summary>
    /// Gets the tenant-prefixed cache key for a logical key.
    /// Format: {companyId}:{facilityId}:{logicalKey}
    /// </summary>
    /// <param name="logicalKey">The logical cache key (without tenant prefix).</param>
    /// <returns>The tenant-prefixed cache key.</returns>
    /// <exception cref="ArgumentException">Thrown when logicalKey contains invalid characters (colons).</exception>
    string GetCacheKey(string logicalKey);

    /// <summary>
    /// Gets the cache key prefix for bulk invalidation operations.
    /// </summary>
    /// <returns>The tenant-specific cache prefix.</returns>
    string GetInvalidationPrefix();
}
