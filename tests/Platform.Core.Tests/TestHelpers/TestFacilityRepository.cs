using Platform.Core.Models;
using Platform.Core.Repositories;

namespace Platform.Core.Tests.TestHelpers;

/// <summary>
/// In-memory implementation of IFacilityRepository for testing.
/// </summary>
public class TestFacilityRepository : IFacilityRepository
{
    private readonly List<Facility> _facilities = new();
    private readonly Dictionary<Guid, List<Guid>> _userFacilityAccess = new();

    public TestFacilityRepository()
    {
        // Seed with test data
        var acmeCompanyId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        _facilities.Add(new Facility
        {
            Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            CompanyId = acmeCompanyId,
            Name = "Building A",
            Code = "BLD-A",
            IsActive = true
        });

        _facilities.Add(new Facility
        {
            Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            CompanyId = acmeCompanyId,
            Name = "Building B",
            Code = "BLD-B",
            IsActive = true
        });

        _facilities.Add(new Facility
        {
            Id = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            CompanyId = acmeCompanyId,
            Name = "Building C",
            Code = "BLD-C",
            IsActive = true
        });

        // Setup user access
        var testUserId = Guid.Parse("99999999-9999-9999-9999-999999999999");
        _userFacilityAccess[testUserId] = new List<Guid>
        {
            Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), // Building A
            Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")  // Building B
        };
    }

    public Task<Facility?> GetByIdAsync(Guid facilityId)
    {
        var facility = _facilities.FirstOrDefault(f => f.Id == facilityId);
        return Task.FromResult(facility);
    }

    public Task<IReadOnlyList<Facility>> GetAccessibleFacilitiesAsync(Guid companyId, Guid userId)
    {
        if (!_userFacilityAccess.TryGetValue(userId, out var accessibleIds))
        {
            return Task.FromResult<IReadOnlyList<Facility>>(Array.Empty<Facility>());
        }

        var facilities = _facilities
            .Where(f => f.CompanyId == companyId && accessibleIds.Contains(f.Id))
            .ToList();

        return Task.FromResult<IReadOnlyList<Facility>>(facilities);
    }

    public void AddFacility(Facility facility)
    {
        _facilities.Add(facility);
    }

    public void GrantUserAccess(Guid userId, Guid facilityId)
    {
        if (!_userFacilityAccess.ContainsKey(userId))
        {
            _userFacilityAccess[userId] = new List<Guid>();
        }

        if (!_userFacilityAccess[userId].Contains(facilityId))
        {
            _userFacilityAccess[userId].Add(facilityId);
        }
    }
}
