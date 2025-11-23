using Platform.Core.Abstractions;
using System.Text.RegularExpressions;

namespace Platform.Core.Implementation;

/// <summary>
/// Provides tenant-safe storage path and URL generation.
/// </summary>
public class StorageContext : IStorageContext
{
    private readonly ICompanyContext _companyContext;
    private readonly IFacilityContext _facilityContext;
    private static readonly Regex InvalidPathChars = new Regex(@"[<>:""\|?*\\/]|\.\.", RegexOptions.Compiled);

    public StorageContext(ICompanyContext companyContext, IFacilityContext facilityContext)
    {
        _companyContext = companyContext;
        _facilityContext = facilityContext;
    }

    /// <inheritdoc />
    public string GetBlobPath(string fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName))
            throw new ArgumentException("File name cannot be empty.", nameof(fileName));

        var sanitizedFileName = SanitizePath(fileName);
        var companyName = SanitizePath(_companyContext.CompanyName);
        var facilityName = _facilityContext.ActiveFacilityName != null
            ? SanitizePath(_facilityContext.ActiveFacilityName)
            : "company-wide";

        return $"{companyName}/{facilityName}/{sanitizedFileName}";
    }

    /// <inheritdoc />
    public string GetSasUrl(string blobPath, TimeSpan expiry)
    {
        if (string.IsNullOrWhiteSpace(blobPath))
            throw new ArgumentException("Blob path cannot be empty.", nameof(blobPath));

        // In a real implementation, this would generate an actual SAS URL
        // For now, return a placeholder
        var expiryTime = DateTime.UtcNow.Add(expiry);
        return $"https://storage.example.com/{ContainerName}/{blobPath}?expires={expiryTime:O}";
    }

    /// <inheritdoc />
    public string ContainerName => "documents";

    private string SanitizePath(string path)
    {
        if (string.IsNullOrWhiteSpace(path))
            throw new ArgumentException("Path cannot be empty.", nameof(path));

        // Check for path traversal attempts
        if (path.Contains("..") || path.Contains("./") || path.Contains(".\\"))
            throw new ArgumentException("Path contains invalid characters or path traversal attempts.", nameof(path));

        // Remove or replace invalid characters
        var sanitized = InvalidPathChars.Replace(path, "-");

        // Trim and ensure not empty
        sanitized = sanitized.Trim();
        if (string.IsNullOrWhiteSpace(sanitized))
            throw new ArgumentException("Path becomes empty after sanitization.", nameof(path));

        return sanitized;
    }
}
