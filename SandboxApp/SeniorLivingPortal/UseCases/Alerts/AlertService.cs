namespace SeniorLivingPortal.UseCases.Alerts;

/// <summary>
/// In-memory alert store to support "code-first" use case discovery.
/// </summary>
public sealed class AlertService : IAlertService
{
    private readonly List<ClinicalAlert> _alerts = [];
    private readonly object _lock = new();

    public Task<ClinicalAlert> CreateAsync(ClinicalAlert alert)
    {
        lock (_lock)
        {
            _alerts.Add(alert);
            return Task.FromResult(alert);
        }
    }

    public Task<IReadOnlyList<ClinicalAlert>> GetActiveAsync(int? residentId = null)
    {
        lock (_lock)
        {
            IEnumerable<ClinicalAlert> query = _alerts.Where(a => a.IsActive);
            if (residentId.HasValue)
                query = query.Where(a => a.ResidentId == residentId.Value);

            // Return newest-first for dashboards.
            return Task.FromResult<IReadOnlyList<ClinicalAlert>>(query
                .OrderByDescending(a => a.Severity)
                .ThenByDescending(a => a.CreatedAt)
                .ToList());
        }
    }

    public Task<ClinicalAlert?> GetByIdAsync(Guid id)
    {
        lock (_lock)
        {
            return Task.FromResult(_alerts.FirstOrDefault(a => a.Id == id));
        }
    }

    public Task<bool> ResolveAsync(Guid id, string resolvedBy, string? resolutionNotes = null)
    {
        lock (_lock)
        {
            var alert = _alerts.FirstOrDefault(a => a.Id == id);
            if (alert == null) return Task.FromResult(false);

            alert.Resolve(resolvedBy, resolutionNotes);
            return Task.FromResult(true);
        }
    }

    public Task<int> ResolveAllForResidentAsync(int residentId, string resolvedBy, string? resolutionNotes = null)
    {
        lock (_lock)
        {
            var count = 0;
            foreach (var alert in _alerts.Where(a => a.IsActive && a.ResidentId == residentId))
            {
                alert.Resolve(resolvedBy, resolutionNotes);
                count++;
            }

            return Task.FromResult(count);
        }
    }
}

