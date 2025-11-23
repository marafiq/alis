using FluentAssertions;
using Platform.Core.Abstractions;
using Platform.Core.Implementation;
using Platform.Core.Models;

namespace Platform.Core.Tests;

/// <summary>
/// Tests for UC1.7 (Messaging) and UC1.8 (Observability)
/// </summary>
[Trait("Module", "PlatformCore")]
[Trait("Category", "Unit")]
public class UC7_8_MessagingAndObservabilityTests
{
    #region UC1.7: Message Tenant Tagging

    [Fact]
    public void MessagingContext_CreateEnvelope_ShouldIncludeTenantContext()
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

        var facility = new Facility
        {
            Id = facilityId,
            CompanyId = companyId,
            Name = "Building A"
        };

        CompanyContext.SetContext(company);
        FacilityContext.SetContext(new[] { facility }, facilityId);

        var companyContext = new CompanyContext();
        var facilityContext = new FacilityContext(null!, null!, companyContext);
        var messagingContext = new MessagingContext(companyContext, facilityContext);

        var payload = new { ResidentId = Guid.NewGuid(), Name = "John Doe" };

        // Act
        var envelope = messagingContext.CreateEnvelope(payload);

        // Assert
        envelope.CompanyId.Should().Be(companyId);
        envelope.FacilityId.Should().Be(facilityId);
        envelope.CorrelationId.Should().NotBeEmpty();
        envelope.Timestamp.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        envelope.Payload.Should().BeEquivalentTo(payload);

        // Cleanup
        CompanyContext.Clear();
        FacilityContext.Clear();
    }

    [Fact]
    public void MessagingContext_RestoreContext_ShouldSetTenantContext()
    {
        // Arrange
        var companyId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var facilityId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        var envelope = new MessageEnvelope<string>
        {
            CompanyId = companyId,
            FacilityId = facilityId,
            CorrelationId = Guid.NewGuid(),
            Timestamp = DateTime.UtcNow,
            Payload = "Test Message"
        };

        var companyContext = new CompanyContext();
        var facilityContext = new FacilityContext(null!, null!, companyContext);
        var messagingContext = new MessagingContext(companyContext, facilityContext);

        // Act
        messagingContext.RestoreContext(envelope);

        // Assert
        companyContext.CompanyId.Should().Be(companyId);
        facilityContext.ActiveFacilityId.Should().Be(facilityId);

        // Cleanup
        CompanyContext.Clear();
        FacilityContext.Clear();
    }

    [Fact]
    public void MessagingContext_CreateEnvelope_AllFacilitiesMode_ShouldHaveNullFacilityId()
    {
        // Arrange
        var companyId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        var company = new Company
        {
            Id = companyId,
            Name = "Acme",
            Subdomain = "acme",
            Tier = SubscriptionTier.Enterprise
        };

        CompanyContext.SetContext(company);
        FacilityContext.SetContext(Array.Empty<Facility>(), null); // All Facilities mode

        var companyContext = new CompanyContext();
        var facilityContext = new FacilityContext(null!, null!, companyContext);
        var messagingContext = new MessagingContext(companyContext, facilityContext);

        var payload = "Company-wide message";

        // Act
        var envelope = messagingContext.CreateEnvelope(payload);

        // Assert
        envelope.CompanyId.Should().Be(companyId);
        envelope.FacilityId.Should().BeNull();

        // Cleanup
        CompanyContext.Clear();
        FacilityContext.Clear();
    }

    #endregion

    #region UC1.8: Observability Enrichment

    [Fact]
    public void ObservabilityContext_GetLogFields_ShouldIncludeTenantInfo()
    {
        // Arrange
        var companyId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var facilityId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        var company = new Company
        {
            Id = companyId,
            Name = "Acme Corporation",
            Subdomain = "acme",
            Tier = SubscriptionTier.Enterprise
        };

        var facility = new Facility
        {
            Id = facilityId,
            CompanyId = companyId,
            Name = "Building A"
        };

        CompanyContext.SetContext(company);
        FacilityContext.SetContext(new[] { facility }, facilityId);

        var companyContext = new CompanyContext();
        var facilityContext = new FacilityContext(null!, null!, companyContext);
        var observabilityContext = new ObservabilityContext(companyContext, facilityContext);

        // Act
        var logFields = observabilityContext.GetLogFields();

        // Assert
        logFields.Should().ContainKey("CompanyId").WhoseValue.Should().Be(companyId);
        logFields.Should().ContainKey("CompanyName").WhoseValue.Should().Be("Acme Corporation");
        logFields.Should().ContainKey("Tier").WhoseValue.Should().Be("Enterprise");
        logFields.Should().ContainKey("FacilityId").WhoseValue.Should().Be(facilityId);
        logFields.Should().ContainKey("FacilityName").WhoseValue.Should().Be("Building A");

        // Cleanup
        CompanyContext.Clear();
        FacilityContext.Clear();
    }

    [Fact]
    public void ObservabilityContext_GetTraceTags_ShouldIncludeTenantInfo()
    {
        // Arrange
        var companyId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        var company = new Company
        {
            Id = companyId,
            Name = "Acme Corporation",
            Subdomain = "acme",
            Tier = SubscriptionTier.Professional
        };

        CompanyContext.SetContext(company);
        FacilityContext.SetContext(Array.Empty<Facility>(), null);

        var companyContext = new CompanyContext();
        var facilityContext = new FacilityContext(null!, null!, companyContext);
        var observabilityContext = new ObservabilityContext(companyContext, facilityContext);

        // Act
        var traceTags = observabilityContext.GetTraceTags();

        // Assert
        traceTags.Should().ContainKey("tenant.company").WhoseValue.Should().Be(companyId.ToString());
        traceTags.Should().ContainKey("tenant.company.name").WhoseValue.Should().Be("Acme Corporation");
        traceTags.Should().ContainKey("tenant.tier").WhoseValue.Should().Be("Professional");

        // Cleanup
        CompanyContext.Clear();
        FacilityContext.Clear();
    }

    [Fact]
    public void ObservabilityContext_GetMetricDimensions_ShouldIncludeTenantInfo()
    {
        // Arrange
        var companyId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var facilityId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        var company = new Company
        {
            Id = companyId,
            Name = "Acme",
            Subdomain = "acme",
            Tier = SubscriptionTier.Basic
        };

        var facility = new Facility
        {
            Id = facilityId,
            CompanyId = companyId,
            Name = "Building A"
        };

        CompanyContext.SetContext(company);
        FacilityContext.SetContext(new[] { facility }, facilityId);

        var companyContext = new CompanyContext();
        var facilityContext = new FacilityContext(null!, null!, companyContext);
        var observabilityContext = new ObservabilityContext(companyContext, facilityContext);

        // Act
        var dimensions = observabilityContext.GetMetricDimensions();

        // Assert
        dimensions.Should().ContainKey("company").WhoseValue.Should().Be("acme");
        dimensions.Should().ContainKey("tier").WhoseValue.Should().Be("basic");
        dimensions.Should().ContainKey("facility").WhoseValue.Should().Be(facilityId.ToString());

        // Cleanup
        CompanyContext.Clear();
        FacilityContext.Clear();
    }

    #endregion
}
