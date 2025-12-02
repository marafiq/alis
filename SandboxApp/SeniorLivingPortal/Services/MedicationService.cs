using SeniorLivingPortal.Models;

namespace SeniorLivingPortal.Services;

public class MedicationService : IMedicationService
{
    private readonly List<Medication> _medications;
    private readonly List<MedicationSchedule> _schedules;
    private readonly List<MedicationAdministration> _administrations;
    private readonly IResidentService _residentService;
    private int _nextAdminId = 1;
    private readonly object _lock = new();

    public MedicationService(IResidentService residentService)
    {
        _residentService = residentService;
        _medications = GenerateMedications();
        _schedules = GenerateSchedules();
        _administrations = [];
    }

    public async Task<IEnumerable<MedicationSchedule>> GetSchedulesByResidentAsync(int residentId)
    {
        var resident = await _residentService.GetByIdAsync(residentId);
        
        lock (_lock)
        {
            var schedules = _schedules
                .Where(s => s.ResidentId == residentId && s.IsActive)
                .ToList();

            foreach (var schedule in schedules)
            {
                schedule.Resident = resident;
                schedule.Medication = _medications.FirstOrDefault(m => m.Id == schedule.MedicationId);
            }

            return schedules;
        }
    }

    public async Task<IEnumerable<MedicationAdministrationViewModel>> GetPendingAdministrationsAsync(int? residentId = null)
    {
        var residents = await _residentService.GetAllAsync();
        var now = TimeOnly.FromDateTime(DateTime.Now);
        var today = DateTime.Today;

        lock (_lock)
        {
            var query = _schedules.Where(s => s.IsActive);
            
            if (residentId.HasValue)
                query = query.Where(s => s.ResidentId == residentId.Value);

            var pending = new List<MedicationAdministrationViewModel>();

            foreach (var schedule in query)
            {
                // Check if already administered today
                var alreadyGiven = _administrations.Any(a => 
                    a.ScheduleId == schedule.Id && 
                    a.AdministeredAt.Date == today);

                if (alreadyGiven)
                    continue;

                // Only show if within 2 hours of scheduled time
                var scheduledMinutes = schedule.ScheduledTime.Hour * 60 + schedule.ScheduledTime.Minute;
                var nowMinutes = now.Hour * 60 + now.Minute;
                var diff = Math.Abs(scheduledMinutes - nowMinutes);

                if (diff <= 120) // Within 2 hours
                {
                    var resident = residents.FirstOrDefault(r => r.Id == schedule.ResidentId);
                    var medication = _medications.FirstOrDefault(m => m.Id == schedule.MedicationId);

                    if (resident != null && medication != null)
                    {
                        pending.Add(new MedicationAdministrationViewModel
                        {
                            ScheduleId = schedule.Id,
                            ResidentId = resident.Id,
                            ResidentName = resident.FullName,
                            MedicationName = medication.Name,
                            Dosage = medication.Dosage,
                            ScheduledTime = schedule.ScheduledTime
                        });
                    }
                }
            }

            return pending.OrderBy(p => p.ScheduledTime).ThenBy(p => p.ResidentName);
        }
    }

    public Task<MedicationAdministration> RecordAdministrationAsync(
        int scheduleId, 
        AdministrationStatus status, 
        string administeredBy, 
        string? notes)
    {
        lock (_lock)
        {
            var admin = new MedicationAdministration
            {
                Id = _nextAdminId++,
                ScheduleId = scheduleId,
                AdministeredAt = DateTime.Now,
                AdministeredBy = administeredBy,
                Status = status,
                Notes = notes
            };

            _administrations.Add(admin);
            return Task.FromResult(admin);
        }
    }

    private static List<Medication> GenerateMedications()
    {
        return
        [
            new Medication { Id = 1, Name = "Metformin", Dosage = "500mg", Frequency = "Twice daily", Route = "Oral" },
            new Medication { Id = 2, Name = "Lisinopril", Dosage = "10mg", Frequency = "Once daily", Route = "Oral" },
            new Medication { Id = 3, Name = "Atorvastatin", Dosage = "20mg", Frequency = "Once daily", Route = "Oral" },
            new Medication { Id = 4, Name = "Amlodipine", Dosage = "5mg", Frequency = "Once daily", Route = "Oral" },
            new Medication { Id = 5, Name = "Omeprazole", Dosage = "20mg", Frequency = "Once daily", Route = "Oral" },
            new Medication { Id = 6, Name = "Donepezil", Dosage = "10mg", Frequency = "Once daily", Route = "Oral", Instructions = "Give at bedtime" },
            new Medication { Id = 7, Name = "Furosemide", Dosage = "40mg", Frequency = "Twice daily", Route = "Oral", Instructions = "Monitor fluid intake" },
            new Medication { Id = 8, Name = "Warfarin", Dosage = "5mg", Frequency = "Once daily", Route = "Oral", Instructions = "Check INR weekly" }
        ];
    }

    private List<MedicationSchedule> GenerateSchedules()
    {
        var schedules = new List<MedicationSchedule>();
        var id = 1;

        // Resident 1 - Eleanor (Diabetic)
        schedules.Add(new MedicationSchedule { Id = id++, ResidentId = 1, MedicationId = 1, ScheduledTime = new TimeOnly(8, 0), StartDate = DateTime.Today.AddMonths(-6) });
        schedules.Add(new MedicationSchedule { Id = id++, ResidentId = 1, MedicationId = 1, ScheduledTime = new TimeOnly(20, 0), StartDate = DateTime.Today.AddMonths(-6) });
        schedules.Add(new MedicationSchedule { Id = id++, ResidentId = 1, MedicationId = 2, ScheduledTime = new TimeOnly(8, 0), StartDate = DateTime.Today.AddMonths(-3) });

        // Resident 2 - Robert (Memory Care)
        schedules.Add(new MedicationSchedule { Id = id++, ResidentId = 2, MedicationId = 6, ScheduledTime = new TimeOnly(21, 0), StartDate = DateTime.Today.AddYears(-1) });
        schedules.Add(new MedicationSchedule { Id = id++, ResidentId = 2, MedicationId = 5, ScheduledTime = new TimeOnly(8, 0), StartDate = DateTime.Today.AddMonths(-4) });

        // Resident 4 - William (Skilled Nursing)
        schedules.Add(new MedicationSchedule { Id = id++, ResidentId = 4, MedicationId = 7, ScheduledTime = new TimeOnly(8, 0), StartDate = DateTime.Today.AddMonths(-1) });
        schedules.Add(new MedicationSchedule { Id = id++, ResidentId = 4, MedicationId = 7, ScheduledTime = new TimeOnly(16, 0), StartDate = DateTime.Today.AddMonths(-1) });
        schedules.Add(new MedicationSchedule { Id = id++, ResidentId = 4, MedicationId = 8, ScheduledTime = new TimeOnly(18, 0), StartDate = DateTime.Today.AddMonths(-1) });

        // Resident 5 - Dorothy (Hypertension)
        schedules.Add(new MedicationSchedule { Id = id++, ResidentId = 5, MedicationId = 2, ScheduledTime = new TimeOnly(8, 0), StartDate = DateTime.Today.AddMonths(-8) });
        schedules.Add(new MedicationSchedule { Id = id++, ResidentId = 5, MedicationId = 4, ScheduledTime = new TimeOnly(8, 0), StartDate = DateTime.Today.AddMonths(-8) });
        schedules.Add(new MedicationSchedule { Id = id++, ResidentId = 5, MedicationId = 3, ScheduledTime = new TimeOnly(20, 0), StartDate = DateTime.Today.AddMonths(-8) });

        return schedules;
    }
}

