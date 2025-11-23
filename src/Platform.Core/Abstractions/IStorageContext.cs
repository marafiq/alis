namespace Platform.Core.Abstractions;

/// <summary>
/// Provides tenant-safe storage path and URL generation for blob storage.
/// </summary>
public interface IStorageContext
{
    /// <summary>
    /// Gets the tenant-prefixed path for a blob file.
    /// Format: {company}/{facility}/{fileName}
    /// </summary>
    /// <param name="fileName">The file name to store.</param>
    /// <returns>The tenant-prefixed blob path.</returns>
    /// <exception cref="ArgumentException">Thrown when fileName contains invalid characters or path traversal attempts.</exception>
    string GetBlobPath(string fileName);

    /// <summary>
    /// Generates a SAS URL for downloading a blob with the specified expiry.
    /// </summary>
    /// <param name="blobPath">The full blob path.</param>
    /// <param name="expiry">The expiry duration for the SAS URL.</param>
    /// <returns>A SAS URL for accessing the blob.</returns>
    string GetSasUrl(string blobPath, TimeSpan expiry);

    /// <summary>
    /// Gets the container name for the current tenant's files.
    /// </summary>
    string ContainerName { get; }
}
