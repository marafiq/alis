using Platform.Core.Abstractions;

namespace Platform.Core.Implementation;

/// <summary>
/// Provides tenant context enrichment for observability.
/// </summary>
public class ObservabilityContext : IObservabilityContext
{
    private readonly ICompanyContext _companyContext;
    private readonly IFacilityContext _facilityContext;

    public ObservabilityContext(ICompanyContext companyContext, IFacilityContext facilityContext)
    {
        _companyContext = companyContext;
        _facilityContext = facilityContext;
    }

    /// <inheritdoc />
    public IDictionary<string, object> GetLogFields()
    {
        var fields = new Dictionary<string, object>();

        if (_companyContext.IsAvailable)
        {
            fields["CompanyId"] = _companyContext.CompanyId;
            fields["CompanyName"] = _companyContext.CompanyName;
            fields["Tier"] = _companyContext.Tier.ToString();
        }

        if (_facilityContext.IsAvailable && _facilityContext.ActiveFacilityId.HasValue)
        {
            fields["FacilityId"] = _facilityContext.ActiveFacilityId.Value;
            if (_facilityContext.ActiveFacilityName != null)
            {
                fields["FacilityName"] = _facilityContext.ActiveFacilityName;
            }
        }

        return fields;
    }

    /// <inheritdoc />
    public IDictionary<string, string> GetTraceTags()
    {
        var tags = new Dictionary<string, string>();

        if (_companyContext.IsAvailable)
        {
            tags["tenant.company"] = _companyContext.CompanyId.ToString();
            tags["tenant.company.name"] = _companyContext.CompanyName;
            tags["tenant.tier"] = _companyContext.Tier.ToString();
        }

        if (_facilityContext.IsAvailable && _facilityContext.ActiveFacilityId.HasValue)
        {
            tags["tenant.facility"] = _facilityContext.ActiveFacilityId.Value.ToString();
            if (_facilityContext.ActiveFacilityName != null)
            {
                tags["tenant.facility.name"] = _facilityContext.ActiveFacilityName;
            }
        }

        return tags;
    }

    /// <inheritdoc />
    public IDictionary<string, string> GetMetricDimensions()
    {
        var dimensions = new Dictionary<string, string>();

        if (_companyContext.IsAvailable)
        {
            dimensions["company"] = _companyContext.Subdomain;
            dimensions["tier"] = _companyContext.Tier.ToString().ToLowerInvariant();
        }

        if (_facilityContext.IsAvailable && _facilityContext.ActiveFacilityId.HasValue)
        {
            dimensions["facility"] = _facilityContext.ActiveFacilityId.Value.ToString();
        }

        return dimensions;
    }
}
