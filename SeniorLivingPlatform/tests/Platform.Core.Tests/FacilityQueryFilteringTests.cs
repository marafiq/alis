using FluentAssertions;
using Xunit;

namespace Platform.Core.Tests;

/// <summary>
/// Tests for UC1.4: All Facilities Mode - Query Filtering
/// Demonstrates how services use IFacilityContext for query filtering
/// Following TDD: RED → GREEN → REFACTOR
/// </summary>
[Trait("Module", "PlatformCore")]
[Trait("Category", "Unit")]
public class FacilityQueryFilteringTests
{
    private readonly Guid _companyId = Guid.NewGuid();
    private readonly Guid _facilityA = Guid.NewGuid();
    private readonly Guid _facilityB = Guid.NewGuid();
    private readonly Guid _facilityC = Guid.NewGuid();
    private readonly Guid _facilityD = Guid.NewGuid(); // User doesn't have access
    private readonly Guid _facilityE = Guid.NewGuid(); // User doesn't have access

    [Fact]
    public void GetFacilityFilter_SingleFacilityMode_ReturnsOnlyActiveFacility()
    {
        // Arrange - User has access to A, B, C
        var accessibleFacilities = CreateAccessibleFacilities();
        var context = new FacilityContext(accessibleFacilities);

        // Set to facility A
        context.SwitchFacilityAsync(_facilityA).Wait();

        var allResidents = CreateTestResidents();

        // Act - Filter residents by facility context
        var filtered = allResidents.Where(r => context.FiltersByFacility(r.FacilityId)).ToList();

        // Assert - Should only get residents from Facility A
        filtered.Should().HaveCount(2);
        filtered.Should().AllSatisfy(r => r.FacilityId.Should().Be(_facilityA));
    }

    [Fact]
    public void GetFacilityFilter_AllFacilitiesMode_ReturnsOnlyAccessible()
    {
        // Arrange - User has access to A, B, C (but NOT D, E)
        var accessibleFacilities = CreateAccessibleFacilities();
        var context = new FacilityContext(accessibleFacilities);

        // Context is in "All Facilities" mode by default (ActiveFacilityId == null)
        context.ActiveFacilityId.Should().BeNull();

        var allResidents = CreateTestResidents();

        // Act - Filter residents by facility context
        var filtered = allResidents.Where(r => context.FiltersByFacility(r.FacilityId)).ToList();

        // Assert - Should get residents from A, B, C only (not D, E)
        filtered.Should().HaveCount(6); // 2 from A + 2 from B + 2 from C
        filtered.Should().NotContain(r => r.FacilityId == _facilityD || r.FacilityId == _facilityE);
    }

    [Fact]
    public void GetFacilityFilter_AllFacilitiesMode_GroupedByFacility()
    {
        // Arrange
        var accessibleFacilities = CreateAccessibleFacilities();
        var context = new FacilityContext(accessibleFacilities);

        var allResidents = CreateTestResidents();

        // Act - Group by facility
        var grouped = allResidents
            .Where(r => context.FiltersByFacility(r.FacilityId))
            .GroupBy(r => r.FacilityId)
            .Select(g => new { FacilityId = g.Key, Count = g.Count() })
            .ToList();

        // Assert - Should have 3 groups (A, B, C)
        grouped.Should().HaveCount(3);
        grouped.Should().Contain(g => g.FacilityId == _facilityA && g.Count == 2);
        grouped.Should().Contain(g => g.FacilityId == _facilityB && g.Count == 2);
        grouped.Should().Contain(g => g.FacilityId == _facilityC && g.Count == 2);
    }

    [Fact]
    public void GetFacilityFilter_SwitchFromSingleToAll_UpdatesResults()
    {
        // Arrange
        var accessibleFacilities = CreateAccessibleFacilities();
        var context = new FacilityContext(accessibleFacilities);

        var allResidents = CreateTestResidents();

        // Start with facility A
        context.SwitchFacilityAsync(_facilityA).Wait();
        var filteredA = allResidents.Where(r => context.FiltersByFacility(r.FacilityId)).ToList();
        filteredA.Should().HaveCount(2); // Only facility A

        // Act - Switch to "All Facilities"
        context.SwitchToAllFacilities();
        var filteredAll = allResidents.Where(r => context.FiltersByFacility(r.FacilityId)).ToList();

        // Assert - Should now get all accessible facilities
        filteredAll.Should().HaveCount(6); // A + B + C
    }

    [Fact]
    public void GetFacilityFilter_NoAccessToAnyFacility_ReturnsEmpty()
    {
        // Arrange - User has no accessible facilities
        var emptyFacilities = new List<Facility>();
        var context = new FacilityContext(emptyFacilities);

        var allResidents = CreateTestResidents();

        // Act
        var filtered = allResidents.Where(r => context.FiltersByFacility(r.FacilityId)).ToList();

        // Assert - Should get no results
        filtered.Should().BeEmpty();
    }

    private List<Facility> CreateAccessibleFacilities()
    {
        return new List<Facility>
        {
            new Facility { Id = _facilityA, CompanyId = _companyId, Name = "Facility A", IsActive = true },
            new Facility { Id = _facilityB, CompanyId = _companyId, Name = "Facility B", IsActive = true },
            new Facility { Id = _facilityC, CompanyId = _companyId, Name = "Facility C", IsActive = true }
            // Facility D and E are NOT in accessible list
        };
    }

    private List<TestResident> CreateTestResidents()
    {
        return new List<TestResident>
        {
            new TestResident { Id = Guid.NewGuid(), Name = "Resident A1", FacilityId = _facilityA },
            new TestResident { Id = Guid.NewGuid(), Name = "Resident A2", FacilityId = _facilityA },
            new TestResident { Id = Guid.NewGuid(), Name = "Resident B1", FacilityId = _facilityB },
            new TestResident { Id = Guid.NewGuid(), Name = "Resident B2", FacilityId = _facilityB },
            new TestResident { Id = Guid.NewGuid(), Name = "Resident C1", FacilityId = _facilityC },
            new TestResident { Id = Guid.NewGuid(), Name = "Resident C2", FacilityId = _facilityC },
            new TestResident { Id = Guid.NewGuid(), Name = "Resident D1", FacilityId = _facilityD }, // Inaccessible
            new TestResident { Id = Guid.NewGuid(), Name = "Resident E1", FacilityId = _facilityE }  // Inaccessible
        };
    }

    // Simple test entity
    private class TestResident
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public Guid FacilityId { get; set; }
    }
}

/// <summary>
/// Extension methods for facility-based filtering.
/// This demonstrates the pattern services should use.
/// </summary>
public static class FacilityContextExtensions
{
    /// <summary>
    /// Determines if a facility ID should be included in query results
    /// based on the current facility context.
    /// </summary>
    /// <param name="context">The facility context</param>
    /// <param name="facilityId">The facility ID to check</param>
    /// <returns>True if the facility should be included in results</returns>
    public static bool FiltersByFacility(this IFacilityContext context, Guid facilityId)
    {
        // If specific facility is active, only include that facility
        if (context.ActiveFacilityId.HasValue)
        {
            return facilityId == context.ActiveFacilityId.Value;
        }

        // In "All Facilities" mode, include all accessible facilities
        return context.AccessibleFacilities.Any(f => f.Id == facilityId);
    }

    /// <summary>
    /// Gets the list of facility IDs that should be included in queries.
    /// </summary>
    /// <param name="context">The facility context</param>
    /// <returns>List of facility IDs to filter by</returns>
    public static IEnumerable<Guid> GetFacilityFilter(this IFacilityContext context)
    {
        if (context.ActiveFacilityId.HasValue)
        {
            return new[] { context.ActiveFacilityId.Value };
        }

        return context.AccessibleFacilities.Select(f => f.Id);
    }
}
