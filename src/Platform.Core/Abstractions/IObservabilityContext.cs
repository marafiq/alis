namespace Platform.Core.Abstractions;

/// <summary>
/// Provides tenant context enrichment for observability (logging, tracing, metrics).
/// </summary>
public interface IObservabilityContext
{
    /// <summary>
    /// Gets the structured log fields to enrich log entries with tenant information.
    /// </summary>
    IDictionary<string, object> GetLogFields();

    /// <summary>
    /// Gets the trace tags to enrich distributed traces with tenant information.
    /// </summary>
    IDictionary<string, string> GetTraceTags();

    /// <summary>
    /// Gets the metric dimensions for tenant-specific metrics.
    /// </summary>
    IDictionary<string, string> GetMetricDimensions();
}
