namespace Platform.Core;

/// <summary>
/// Provides access to the current company (tenant) context.
/// Answers the question: "Which company is this request for?"
/// </summary>
/// <remarks>
/// This interface follows the Interface Segregation Principle (ISP)
/// by providing only company-related context, not all tenant information.
/// </remarks>
public interface ICompanyContext
{
    /// <summary>
    /// Gets the unique identifier of the current company.
    /// </summary>
    /// <exception cref="InvalidOperationException">Thrown if company context is not available</exception>
    Guid CompanyId { get; }

    /// <summary>
    /// Gets the display name of the current company.
    /// </summary>
    string CompanyName { get; }

    /// <summary>
    /// Gets the subscription tier of the current company.
    /// </summary>
    CompanyTier Tier { get; }

    /// <summary>
    /// Gets the database mapping (connection string identifier) for the current company.
    /// </summary>
    string DatabaseMapping { get; }
}
