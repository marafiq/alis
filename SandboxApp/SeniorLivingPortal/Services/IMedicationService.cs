using SeniorLivingPortal.Models;

namespace SeniorLivingPortal.Services;

public interface IMedicationService
{
    Task<IEnumerable<MedicationSchedule>> GetSchedulesByResidentAsync(int residentId);
    Task<IEnumerable<MedicationAdministrationViewModel>> GetPendingAdministrationsAsync(int? residentId = null);
    Task<MedicationAdministration> RecordAdministrationAsync(int scheduleId, AdministrationStatus status, string administeredBy, string? notes);
}

