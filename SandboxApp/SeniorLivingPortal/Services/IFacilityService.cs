using SeniorLivingPortal.Models;

namespace SeniorLivingPortal.Services;

public interface IFacilityService
{
    Task<IEnumerable<Building>> GetBuildingsAsync();
    Task<IEnumerable<Floor>> GetFloorsByBuildingAsync(int buildingId);
    Task<IEnumerable<Wing>> GetWingsByFloorAsync(int floorId);
    Task<IEnumerable<DropdownItem>> GetBuildingDropdownAsync();
    Task<IEnumerable<DropdownItem>> GetFloorDropdownAsync(int buildingId);
    Task<IEnumerable<DropdownItem>> GetWingDropdownAsync(int floorId);
}

