using FluentAssertions;
using Xunit;

namespace Platform.Core.Tests;

/// <summary>
/// Tests for UC1.3: Switch Facility
/// Following TDD: RED → GREEN → REFACTOR
/// </summary>
[Trait("Module", "PlatformCore")]
[Trait("Category", "Unit")]
public class FacilityContextTests
{
    private readonly Guid _facilityA = Guid.NewGuid();
    private readonly Guid _facilityB = Guid.NewGuid();
    private readonly Guid _facilityC = Guid.NewGuid();
    private readonly Guid _companyId = Guid.NewGuid();

    [Fact]
    public void FacilityContext_InitialState_IsAllFacilitiesMode()
    {
        // Arrange
        var facilities = CreateAccessibleFacilities();
        var context = new FacilityContext(facilities);

        // Assert
        context.ActiveFacilityId.Should().BeNull();
        context.ActiveFacilityName.Should().BeNull();
        context.AccessibleFacilities.Should().HaveCount(3);
    }

    [Fact]
    public async Task SwitchFacility_ToAccessibleFacility_Success()
    {
        // Arrange
        var facilities = CreateAccessibleFacilities();
        var context = new FacilityContext(facilities);

        // Act
        await context.SwitchFacilityAsync(_facilityA);

        // Assert
        context.ActiveFacilityId.Should().Be(_facilityA);
        context.ActiveFacilityName.Should().Be("Facility A");
    }

    [Fact]
    public async Task SwitchFacility_ToInaccessibleFacility_ThrowsUnauthorized()
    {
        // Arrange
        var facilities = CreateAccessibleFacilities();
        var context = new FacilityContext(facilities);
        var inaccessibleFacilityId = Guid.NewGuid();

        // Act & Assert
        var act = () => context.SwitchFacilityAsync(inaccessibleFacilityId);
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*doesn't have access*");
    }

    [Fact]
    public void SwitchToAllFacilities_FromSpecificFacility_Success()
    {
        // Arrange
        var facilities = CreateAccessibleFacilities();
        var context = new FacilityContext(facilities);

        // Set to specific facility first
        context.SwitchFacilityAsync(_facilityA).Wait();
        context.ActiveFacilityId.Should().Be(_facilityA);

        // Act
        context.SwitchToAllFacilities();

        // Assert
        context.ActiveFacilityId.Should().BeNull();
        context.ActiveFacilityName.Should().BeNull();
    }

    [Fact]
    public async Task SwitchFacility_MultipleTimes_UpdatesCorrectly()
    {
        // Arrange
        var facilities = CreateAccessibleFacilities();
        var context = new FacilityContext(facilities);

        // Act - Switch to A
        await context.SwitchFacilityAsync(_facilityA);
        context.ActiveFacilityId.Should().Be(_facilityA);

        // Act - Switch to B
        await context.SwitchFacilityAsync(_facilityB);
        context.ActiveFacilityId.Should().Be(_facilityB);
        context.ActiveFacilityName.Should().Be("Facility B");

        // Act - Switch to C
        await context.SwitchFacilityAsync(_facilityC);
        context.ActiveFacilityId.Should().Be(_facilityC);
        context.ActiveFacilityName.Should().Be("Facility C");
    }

    [Fact]
    public void AccessibleFacilities_IsReadOnly_CannotModify()
    {
        // Arrange
        var facilities = CreateAccessibleFacilities();
        var context = new FacilityContext(facilities);

        // Assert - Verify it's read-only
        context.AccessibleFacilities.Should().BeAssignableTo<IReadOnlyList<Facility>>();
    }

    [Fact]
    public async Task SwitchFacility_WithNoAccessibleFacilities_Throws()
    {
        // Arrange
        var emptyFacilities = new List<Facility>();
        var context = new FacilityContext(emptyFacilities);

        // Act & Assert
        var act = () => context.SwitchFacilityAsync(_facilityA);
        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task SwitchFacility_SameFacilityTwice_Success()
    {
        // Arrange
        var facilities = CreateAccessibleFacilities();
        var context = new FacilityContext(facilities);

        // Act
        await context.SwitchFacilityAsync(_facilityA);
        await context.SwitchFacilityAsync(_facilityA);

        // Assert - Should still be facility A
        context.ActiveFacilityId.Should().Be(_facilityA);
        context.ActiveFacilityName.Should().Be("Facility A");
    }

    private List<Facility> CreateAccessibleFacilities()
    {
        return new List<Facility>
        {
            new Facility
            {
                Id = _facilityA,
                CompanyId = _companyId,
                Name = "Facility A",
                IsActive = true
            },
            new Facility
            {
                Id = _facilityB,
                CompanyId = _companyId,
                Name = "Facility B",
                IsActive = true
            },
            new Facility
            {
                Id = _facilityC,
                CompanyId = _companyId,
                Name = "Facility C",
                IsActive = true
            }
        };
    }
}
