using SeniorLivingPortal.Models;

namespace SeniorLivingPortal.Services;

public interface IVitalsService
{
    Task<IEnumerable<Vitals>> GetByResidentAsync(int residentId, int? limit = null);
    Task<Vitals?> GetLatestByResidentAsync(int residentId);
    Task<IEnumerable<VitalsSummary>> GetAllLatestAsync();
    Task<IEnumerable<VitalsSummary>> GetAlertsAsync();
    Task<Vitals> RecordAsync(Vitals vitals);
    Task<IEnumerable<Vitals>> GetHistoryAsync(int residentId, DateTime from, DateTime to);
}

