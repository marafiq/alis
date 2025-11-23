using Platform.Core.Models;

namespace Platform.Core.Abstractions;

/// <summary>
/// Provides context information about the current company (tenant) for the request.
/// </summary>
public interface ICompanyContext
{
    /// <summary>
    /// Gets the unique identifier of the current company.
    /// </summary>
    /// <exception cref="InvalidOperationException">Thrown when company context is not available.</exception>
    Guid CompanyId { get; }

    /// <summary>
    /// Gets the name of the current company.
    /// </summary>
    /// <exception cref="InvalidOperationException">Thrown when company context is not available.</exception>
    string CompanyName { get; }

    /// <summary>
    /// Gets the subdomain of the current company.
    /// </summary>
    /// <exception cref="InvalidOperationException">Thrown when company context is not available.</exception>
    string Subdomain { get; }

    /// <summary>
    /// Gets the subscription tier of the current company.
    /// </summary>
    /// <exception cref="InvalidOperationException">Thrown when company context is not available.</exception>
    SubscriptionTier Tier { get; }

    /// <summary>
    /// Gets the database mapping identifier for the current company.
    /// </summary>
    /// <exception cref="InvalidOperationException">Thrown when company context is not available.</exception>
    string DatabaseMapping { get; }

    /// <summary>
    /// Gets a value indicating whether company context is available.
    /// </summary>
    bool IsAvailable { get; }
}
