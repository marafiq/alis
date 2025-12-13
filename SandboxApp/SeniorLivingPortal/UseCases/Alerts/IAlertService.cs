namespace SeniorLivingPortal.UseCases.Alerts;

public interface IAlertService
{
    Task<ClinicalAlert> CreateAsync(ClinicalAlert alert);
    Task<IReadOnlyList<ClinicalAlert>> GetActiveAsync(int? residentId = null);
    Task<ClinicalAlert?> GetByIdAsync(Guid id);
    Task<bool> ResolveAsync(Guid id, string resolvedBy, string? resolutionNotes = null);
    Task<int> ResolveAllForResidentAsync(int residentId, string resolvedBy, string? resolutionNotes = null);
}

