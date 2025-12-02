using SeniorLivingPortal.Models;

namespace SeniorLivingPortal.Services;

public interface IResidentService
{
    Task<IEnumerable<Resident>> GetAllAsync();
    Task<IEnumerable<Resident>> SearchAsync(string? query, CareLevel? careLevel, int? buildingId);
    Task<Resident?> GetByIdAsync(int id);
    Task<Resident> CreateAsync(Resident resident);
    Task<Resident?> UpdateAsync(int id, Resident resident);
    Task<bool> DeleteAsync(int id);
    Task<IEnumerable<Resident>> GetByBuildingAsync(int buildingId);
    Task<IEnumerable<Resident>> GetByCareLevel(CareLevel careLevel);
}

