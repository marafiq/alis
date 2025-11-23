namespace Platform.Core.Abstractions;

/// <summary>
/// Provides messaging envelope creation with tenant context for reliable message routing.
/// </summary>
public interface IMessagingContext
{
    /// <summary>
    /// Creates a message envelope with tenant context information.
    /// </summary>
    /// <typeparam name="T">The type of the message payload.</typeparam>
    /// <param name="payload">The message payload.</param>
    /// <returns>A message envelope containing tenant context and the payload.</returns>
    MessageEnvelope<T> CreateEnvelope<T>(T payload);

    /// <summary>
    /// Restores tenant context from a message envelope.
    /// </summary>
    /// <typeparam name="T">The type of the message payload.</typeparam>
    /// <param name="envelope">The message envelope.</param>
    void RestoreContext<T>(MessageEnvelope<T> envelope);
}

/// <summary>
/// Represents a message envelope with tenant context information.
/// </summary>
/// <typeparam name="T">The type of the message payload.</typeparam>
public class MessageEnvelope<T>
{
    /// <summary>
    /// Gets or sets the company identifier.
    /// </summary>
    public Guid CompanyId { get; set; }

    /// <summary>
    /// Gets or sets the facility identifier, or null for company-level messages.
    /// </summary>
    public Guid? FacilityId { get; set; }

    /// <summary>
    /// Gets or sets the correlation identifier for distributed tracing.
    /// </summary>
    public Guid CorrelationId { get; set; }

    /// <summary>
    /// Gets or sets the timestamp when the message was created.
    /// </summary>
    public DateTime Timestamp { get; set; }

    /// <summary>
    /// Gets or sets the message payload.
    /// </summary>
    public T Payload { get; set; } = default!;
}
