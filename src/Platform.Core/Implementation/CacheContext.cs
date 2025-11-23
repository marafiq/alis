using Platform.Core.Abstractions;

namespace Platform.Core.Implementation;

/// <summary>
/// Provides tenant-safe cache key generation.
/// </summary>
public class CacheContext : ICacheContext
{
    private readonly ICompanyContext _companyContext;
    private readonly IFacilityContext _facilityContext;

    public CacheContext(ICompanyContext companyContext, IFacilityContext facilityContext)
    {
        _companyContext = companyContext;
        _facilityContext = facilityContext;
    }

    /// <inheritdoc />
    public string GetCacheKey(string logicalKey)
    {
        if (string.IsNullOrWhiteSpace(logicalKey))
            throw new ArgumentException("Logical key cannot be empty.", nameof(logicalKey));

        if (logicalKey.Contains(':'))
            throw new ArgumentException("Logical key cannot contain colons.", nameof(logicalKey));

        var companyId = _companyContext.CompanyId;
        var facilityId = _facilityContext.ActiveFacilityId ?? Guid.Empty;

        return $"{companyId}:{facilityId}:{logicalKey}";
    }

    /// <inheritdoc />
    public string GetInvalidationPrefix()
    {
        var companyId = _companyContext.CompanyId;
        var facilityId = _facilityContext.ActiveFacilityId;

        return facilityId.HasValue
            ? $"{companyId}:{facilityId.Value}:"
            : $"{companyId}:";
    }
}
