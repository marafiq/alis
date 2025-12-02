using SeniorLivingPortal.Models;

namespace SeniorLivingPortal.Services;

public class VitalsService : IVitalsService
{
    private readonly List<Vitals> _vitals;
    private readonly IResidentService _residentService;
    private int _nextId = 1;
    private readonly object _lock = new();

    public VitalsService(IResidentService residentService)
    {
        _residentService = residentService;
        _vitals = GenerateSampleVitals();
        _nextId = _vitals.Max(v => v.Id) + 1;
    }

    public Task<IEnumerable<Vitals>> GetByResidentAsync(int residentId, int? limit = null)
    {
        lock (_lock)
        {
            var query = _vitals
                .Where(v => v.ResidentId == residentId)
                .OrderByDescending(v => v.RecordedAt)
                .AsEnumerable();

            if (limit.HasValue)
                query = query.Take(limit.Value);

            return Task.FromResult(query.ToList().AsEnumerable());
        }
    }

    public Task<Vitals?> GetLatestByResidentAsync(int residentId)
    {
        lock (_lock)
        {
            return Task.FromResult(
                _vitals
                    .Where(v => v.ResidentId == residentId)
                    .OrderByDescending(v => v.RecordedAt)
                    .FirstOrDefault());
        }
    }

    public async Task<IEnumerable<VitalsSummary>> GetAllLatestAsync()
    {
        var residents = await _residentService.GetAllAsync();
        var summaries = new List<VitalsSummary>();

        foreach (var resident in residents)
        {
            var latest = await GetLatestByResidentAsync(resident.Id);
            summaries.Add(new VitalsSummary
            {
                ResidentId = resident.Id,
                ResidentName = resident.FullName,
                RoomNumber = resident.RoomNumber,
                LatestVitals = latest,
                HasCriticalAlerts = latest != null && (
                    latest.BloodPressureStatus == VitalStatus.Critical ||
                    latest.HeartRateStatus == VitalStatus.Critical ||
                    latest.TemperatureStatus == VitalStatus.Critical ||
                    latest.OxygenStatus == VitalStatus.Critical),
                HasWarningAlerts = latest != null && (
                    latest.BloodPressureStatus == VitalStatus.Warning ||
                    latest.HeartRateStatus == VitalStatus.Warning ||
                    latest.TemperatureStatus == VitalStatus.Warning ||
                    latest.OxygenStatus == VitalStatus.Warning),
                LastRecorded = latest?.RecordedAt
            });
        }

        return summaries.OrderByDescending(s => s.HasCriticalAlerts)
            .ThenByDescending(s => s.HasWarningAlerts)
            .ThenBy(s => s.ResidentName);
    }

    public async Task<IEnumerable<VitalsSummary>> GetAlertsAsync()
    {
        var all = await GetAllLatestAsync();
        return all.Where(s => s.HasCriticalAlerts || s.HasWarningAlerts);
    }

    public Task<Vitals> RecordAsync(Vitals vitals)
    {
        lock (_lock)
        {
            vitals.Id = _nextId++;
            vitals.RecordedAt = DateTime.Now;
            _vitals.Add(vitals);
            return Task.FromResult(vitals);
        }
    }

    public Task<IEnumerable<Vitals>> GetHistoryAsync(int residentId, DateTime from, DateTime to)
    {
        lock (_lock)
        {
            return Task.FromResult<IEnumerable<Vitals>>(
                _vitals
                    .Where(v => v.ResidentId == residentId && 
                                v.RecordedAt >= from && 
                                v.RecordedAt <= to)
                    .OrderByDescending(v => v.RecordedAt)
                    .ToList());
        }
    }

    private List<Vitals> GenerateSampleVitals()
    {
        var random = new Random(42);
        var vitals = new List<Vitals>();
        var id = 1;

        // Generate vitals for each resident over the past week
        for (var residentId = 1; residentId <= 8; residentId++)
        {
            for (var daysAgo = 7; daysAgo >= 0; daysAgo--)
            {
                // 2-3 readings per day
                var readingsPerDay = random.Next(2, 4);
                for (var reading = 0; reading < readingsPerDay; reading++)
                {
                    var recordedAt = DateTime.Today.AddDays(-daysAgo)
                        .AddHours(6 + reading * 6 + random.Next(0, 2));

                    vitals.Add(new Vitals
                    {
                        Id = id++,
                        ResidentId = residentId,
                        BloodPressureSystolic = random.Next(110, 160),
                        BloodPressureDiastolic = random.Next(65, 95),
                        HeartRate = random.Next(55, 100),
                        Temperature = Math.Round(97.5m + (decimal)(random.NextDouble() * 2), 1),
                        OxygenSaturation = random.Next(92, 100),
                        RespiratoryRate = random.Next(12, 22),
                        RecordedAt = recordedAt,
                        RecordedBy = GetRandomNurse(random)
                    });
                }
            }
        }

        // Add some critical readings for demo
        vitals.Add(new Vitals
        {
            Id = id++,
            ResidentId = 4, // William Johnson - skilled nursing
            BloodPressureSystolic = 185,
            BloodPressureDiastolic = 125,
            HeartRate = 110,
            Temperature = 101.2m,
            OxygenSaturation = 88,
            RespiratoryRate = 28,
            RecordedAt = DateTime.Now.AddHours(-1),
            RecordedBy = "Nurse Smith",
            Notes = "Patient showing signs of distress. Physician notified."
        });

        return vitals;
    }

    private static string GetRandomNurse(Random random)
    {
        var nurses = new[] { "Nurse Smith", "Nurse Johnson", "Nurse Williams", "Nurse Brown", "Nurse Davis" };
        return nurses[random.Next(nurses.Length)];
    }
}

