using FluentAssertions;
using Microsoft.Extensions.Options;
using Platform.Core.Implementation;
using Platform.Core.Models;

namespace Platform.Core.Tests;

/// <summary>
/// Tests for UC1.4 (All Facilities Mode), UC1.5 (Storage), and UC1.6 (Cache)
/// </summary>
[Trait("Module", "PlatformCore")]
[Trait("Category", "Unit")]
public class UC4_5_6_ContextTests
{
    #region UC1.4: All Facilities Mode

    [Fact]
    public void AllFacilitiesMode_WithMultipleFacilities_ShouldIncludeAllAccessible()
    {
        // Arrange
        var companyId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var facilities = new List<Models.Facility>
        {
            new() { Id = Guid.NewGuid(), CompanyId = companyId, Name = "Building A" },
            new() { Id = Guid.NewGuid(), CompanyId = companyId, Name = "Building B" },
            new() { Id = Guid.NewGuid(), CompanyId = companyId, Name = "Building C" }
        };

        // Act
        FacilityContext.SetContext(facilities, null); // null = All Facilities mode
        var context = new FacilityContext(null!, null!, null!);

        // Assert
        context.ActiveFacilityId.Should().BeNull();
        context.ActiveFacilityName.Should().BeNull();
        context.AccessibleFacilities.Should().HaveCount(3);

        // Cleanup
        FacilityContext.Clear();
    }

    #endregion

    #region UC1.5: Storage Path Prefixing

    [Fact]
    public void StorageContext_GetBlobPath_ShouldReturnTenantPrefixedPath()
    {
        // Arrange
        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Acme Corporation",
            Subdomain = "acme",
            Tier = SubscriptionTier.Enterprise
        };

        var facility = new Models.Facility
        {
            Id = Guid.NewGuid(),
            CompanyId = company.Id,
            Name = "Building A"
        };

        CompanyContext.SetContext(company);
        FacilityContext.SetContext(new[] { facility }, facility.Id);

        var companyContext = new CompanyContext();
        var facilityContext = new FacilityContext(null!, null!, companyContext);
        var storageContext = new StorageContext(companyContext, facilityContext);

        // Act
        var path = storageContext.GetBlobPath("resident-photo.jpg");

        // Assert
        path.Should().Contain("Acme Corporation");
        path.Should().Contain("Building A");
        path.Should().EndWith("resident-photo.jpg");

        // Cleanup
        CompanyContext.Clear();
        FacilityContext.Clear();
    }

    [Fact]
    public void StorageContext_PathTraversalAttempt_ShouldThrowException()
    {
        // Arrange
        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Acme",
            Subdomain = "acme",
            Tier = SubscriptionTier.Enterprise
        };

        CompanyContext.SetContext(company);
        FacilityContext.SetContext(Array.Empty<Models.Facility>(), null);

        var companyContext = new CompanyContext();
        var facilityContext = new FacilityContext(null!, null!, companyContext);
        var storageContext = new StorageContext(companyContext, facilityContext);

        // Act
        var act = () => storageContext.GetBlobPath("../../../etc/passwd");

        // Assert
        act.Should().Throw<ArgumentException>()
            .WithMessage("*path traversal*");

        // Cleanup
        CompanyContext.Clear();
        FacilityContext.Clear();
    }

    [Fact]
    public void StorageContext_GetSasUrl_ShouldReturnUrlWithExpiry()
    {
        // Arrange
        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Acme",
            Subdomain = "acme",
            Tier = SubscriptionTier.Enterprise
        };

        CompanyContext.SetContext(company);
        FacilityContext.SetContext(Array.Empty<Models.Facility>(), null);

        var companyContext = new CompanyContext();
        var facilityContext = new FacilityContext(null!, null!, companyContext);
        var storageContext = new StorageContext(companyContext, facilityContext);

        // Act
        var url = storageContext.GetSasUrl("acme/building-a/file.pdf", TimeSpan.FromHours(1));

        // Assert
        url.Should().NotBeNullOrEmpty();
        url.Should().Contain("expires=");

        // Cleanup
        CompanyContext.Clear();
        FacilityContext.Clear();
    }

    #endregion

    #region UC1.6: Cache Key Prefixing

    [Fact]
    public void CacheContext_GetCacheKey_ShouldReturnTenantPrefixedKey()
    {
        // Arrange
        var companyId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var facilityId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        var company = new Company
        {
            Id = companyId,
            Name = "Acme",
            Subdomain = "acme",
            Tier = SubscriptionTier.Enterprise
        };

        var facility = new Models.Facility
        {
            Id = facilityId,
            CompanyId = companyId,
            Name = "Building A"
        };

        CompanyContext.SetContext(company);
        FacilityContext.SetContext(new[] { facility }, facilityId);

        var companyContext = new CompanyContext();
        var facilityContext = new FacilityContext(null!, null!, companyContext);
        var cacheContext = new CacheContext(companyContext, facilityContext);

        // Act
        var key = cacheContext.GetCacheKey("residents:active");

        // Assert
        key.Should().Be($"{companyId}:{facilityId}:residents:active");

        // Cleanup
        CompanyContext.Clear();
        FacilityContext.Clear();
    }

    [Fact]
    public void CacheContext_LogicalKeyWithColons_ShouldThrowException()
    {
        // Arrange
        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Acme",
            Subdomain = "acme",
            Tier = SubscriptionTier.Enterprise
        };

        CompanyContext.SetContext(company);
        FacilityContext.SetContext(Array.Empty<Models.Facility>(), null);

        var companyContext = new CompanyContext();
        var facilityContext = new FacilityContext(null!, null!, companyContext);
        var cacheContext = new CacheContext(companyContext, facilityContext);

        // Act
        var act = () => cacheContext.GetCacheKey("invalid:key:with:colons");

        // Assert
        act.Should().Throw<ArgumentException>()
            .WithMessage("*cannot contain colons*");

        // Cleanup
        CompanyContext.Clear();
        FacilityContext.Clear();
    }

    [Fact]
    public void CacheContext_GetInvalidationPrefix_ShouldReturnCorrectPrefix()
    {
        // Arrange
        var companyId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var facilityId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        var company = new Company
        {
            Id = companyId,
            Name = "Acme",
            Subdomain = "acme",
            Tier = SubscriptionTier.Enterprise
        };

        var facility = new Models.Facility
        {
            Id = facilityId,
            CompanyId = companyId,
            Name = "Building A"
        };

        CompanyContext.SetContext(company);
        FacilityContext.SetContext(new[] { facility }, facilityId);

        var companyContext = new CompanyContext();
        var facilityContext = new FacilityContext(null!, null!, companyContext);
        var cacheContext = new CacheContext(companyContext, facilityContext);

        // Act
        var prefix = cacheContext.GetInvalidationPrefix();

        // Assert
        prefix.Should().Be($"{companyId}:{facilityId}:");

        // Cleanup
        CompanyContext.Clear();
        FacilityContext.Clear();
    }

    #endregion
}
