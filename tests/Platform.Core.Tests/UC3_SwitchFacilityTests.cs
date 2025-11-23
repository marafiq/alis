using FluentAssertions;
using Microsoft.AspNetCore.Http;
using NSubstitute;
using Platform.Core.Abstractions;
using Platform.Core.Implementation;
using Platform.Core.Models;
using Platform.Core.Repositories;
using Platform.Core.Tests.TestHelpers;

namespace Platform.Core.Tests;

[Trait("Module", "PlatformCore")]
[Trait("Category", "Unit")]
public class UC3_SwitchFacilityTests
{
    [Fact]
    public async Task SwitchFacility_ValidFacility_ShouldUpdateContext()
    {
        // Arrange
        var companyId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var facilityAId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        var facilityBId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        var facilities = new List<Facility>
        {
            new Facility { Id = facilityAId, CompanyId = companyId, Name = "Building A" },
            new Facility { Id = facilityBId, CompanyId = companyId, Name = "Building B" }
        };

        var company = new Company
        {
            Id = companyId,
            Name = "Acme",
            Subdomain = "acme",
            Tier = SubscriptionTier.Enterprise
        };

        CompanyContext.SetContext(company);
        FacilityContext.SetContext(facilities, facilityAId);

        var httpContextAccessor = Substitute.For<IHttpContextAccessor>();
        var facilityRepo = Substitute.For<IFacilityRepository>();
        var companyContext = new CompanyContext();

        var facilityContext = new FacilityContext(httpContextAccessor, facilityRepo, companyContext);

        // Act
        await facilityContext.SwitchFacilityAsync(facilityBId);

        // Assert
        facilityContext.ActiveFacilityId.Should().Be(facilityBId);
        facilityContext.ActiveFacilityName.Should().Be("Building B");

        // Cleanup
        CompanyContext.Clear();
        FacilityContext.Clear();
    }

    [Fact]
    public async Task SwitchFacility_UnauthorizedFacility_ShouldThrowException()
    {
        // Arrange
        var companyId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var facilityAId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        var unauthorizedFacilityId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

        var facilities = new List<Facility>
        {
            new Facility { Id = facilityAId, CompanyId = companyId, Name = "Building A" }
        };

        var company = new Company
        {
            Id = companyId,
            Name = "Acme",
            Subdomain = "acme",
            Tier = SubscriptionTier.Enterprise
        };

        CompanyContext.SetContext(company);
        FacilityContext.SetContext(facilities, facilityAId);

        var httpContextAccessor = Substitute.For<IHttpContextAccessor>();
        var facilityRepo = Substitute.For<IFacilityRepository>();
        var companyContext = new CompanyContext();

        var facilityContext = new FacilityContext(httpContextAccessor, facilityRepo, companyContext);

        // Act
        var act = async () => await facilityContext.SwitchFacilityAsync(unauthorizedFacilityId);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*does not have access*");

        // Cleanup
        CompanyContext.Clear();
        FacilityContext.Clear();
    }

    [Fact]
    public async Task SwitchToAllFacilities_ShouldSetActiveFacilityToNull()
    {
        // Arrange
        var companyId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var facilityAId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        var facilities = new List<Facility>
        {
            new Facility { Id = facilityAId, CompanyId = companyId, Name = "Building A" }
        };

        var company = new Company
        {
            Id = companyId,
            Name = "Acme",
            Subdomain = "acme",
            Tier = SubscriptionTier.Enterprise
        };

        CompanyContext.SetContext(company);
        FacilityContext.SetContext(facilities, facilityAId);

        var httpContextAccessor = Substitute.For<IHttpContextAccessor>();
        var facilityRepo = Substitute.For<IFacilityRepository>();
        var companyContext = new CompanyContext();

        var facilityContext = new FacilityContext(httpContextAccessor, facilityRepo, companyContext);

        // Act
        await facilityContext.SwitchToAllFacilitiesAsync();

        // Assert
        facilityContext.ActiveFacilityId.Should().BeNull();
        facilityContext.ActiveFacilityName.Should().BeNull();
        facilityContext.AccessibleFacilities.Should().HaveCount(1);

        // Cleanup
        CompanyContext.Clear();
        FacilityContext.Clear();
    }
}
