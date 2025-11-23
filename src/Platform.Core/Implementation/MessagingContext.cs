using Platform.Core.Abstractions;

namespace Platform.Core.Implementation;

/// <summary>
/// Provides messaging envelope creation and context restoration.
/// </summary>
public class MessagingContext : IMessagingContext
{
    private readonly ICompanyContext _companyContext;
    private readonly IFacilityContext _facilityContext;

    public MessagingContext(ICompanyContext companyContext, IFacilityContext facilityContext)
    {
        _companyContext = companyContext;
        _facilityContext = facilityContext;
    }

    /// <inheritdoc />
    public MessageEnvelope<T> CreateEnvelope<T>(T payload)
    {
        return new MessageEnvelope<T>
        {
            CompanyId = _companyContext.CompanyId,
            FacilityId = _facilityContext.ActiveFacilityId,
            CorrelationId = Guid.NewGuid(),
            Timestamp = DateTime.UtcNow,
            Payload = payload
        };
    }

    /// <inheritdoc />
    public void RestoreContext<T>(MessageEnvelope<T> envelope)
    {
        if (envelope == null)
            throw new ArgumentNullException(nameof(envelope));

        // Restore company context
        Implementation.CompanyContext.SetContext(envelope.CompanyId);

        // Restore facility context
        Implementation.FacilityContext.SetContext(envelope.FacilityId);
    }
}
