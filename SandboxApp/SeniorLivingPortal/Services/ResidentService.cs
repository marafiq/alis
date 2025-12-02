using SeniorLivingPortal.Models;

namespace SeniorLivingPortal.Services;

/// <summary>
/// In-memory resident service for demo purposes.
/// In production, this would use Entity Framework Core or similar.
/// </summary>
public class ResidentService : IResidentService
{
    private readonly List<Resident> _residents;
    private int _nextId = 1;
    private readonly object _lock = new();

    public ResidentService()
    {
        _residents = GenerateSampleResidents();
        _nextId = _residents.Max(r => r.Id) + 1;
    }

    public Task<IEnumerable<Resident>> GetAllAsync()
    {
        lock (_lock)
        {
            return Task.FromResult<IEnumerable<Resident>>(_residents.Where(r => r.IsActive).ToList());
        }
    }

    public Task<IEnumerable<Resident>> SearchAsync(string? query, CareLevel? careLevel, int? buildingId)
    {
        lock (_lock)
        {
            var results = _residents.Where(r => r.IsActive).AsEnumerable();

            if (!string.IsNullOrWhiteSpace(query))
            {
                var lowerQuery = query.ToLowerInvariant();
                results = results.Where(r =>
                    r.FirstName.Contains(lowerQuery, StringComparison.OrdinalIgnoreCase) ||
                    r.LastName.Contains(lowerQuery, StringComparison.OrdinalIgnoreCase) ||
                    r.RoomNumber.Contains(lowerQuery, StringComparison.OrdinalIgnoreCase));
            }

            if (careLevel.HasValue)
            {
                results = results.Where(r => r.CareLevel == careLevel.Value);
            }

            if (buildingId.HasValue)
            {
                results = results.Where(r => r.BuildingId == buildingId.Value);
            }

            return Task.FromResult(results.ToList().AsEnumerable());
        }
    }

    public Task<Resident?> GetByIdAsync(int id)
    {
        lock (_lock)
        {
            return Task.FromResult(_residents.FirstOrDefault(r => r.Id == id));
        }
    }

    public Task<Resident> CreateAsync(Resident resident)
    {
        lock (_lock)
        {
            resident.Id = _nextId++;
            resident.AdmissionDate = DateTime.Today;
            _residents.Add(resident);
            return Task.FromResult(resident);
        }
    }

    public Task<Resident?> UpdateAsync(int id, Resident resident)
    {
        lock (_lock)
        {
            var existing = _residents.FirstOrDefault(r => r.Id == id);
            if (existing == null)
                return Task.FromResult<Resident?>(null);

            existing.FirstName = resident.FirstName;
            existing.LastName = resident.LastName;
            existing.DateOfBirth = resident.DateOfBirth;
            existing.RoomNumber = resident.RoomNumber;
            existing.CareLevel = resident.CareLevel;
            existing.BuildingId = resident.BuildingId;
            existing.FloorId = resident.FloorId;
            existing.WingId = resident.WingId;
            existing.EmergencyContactName = resident.EmergencyContactName;
            existing.EmergencyContactPhone = resident.EmergencyContactPhone;
            existing.EmergencyContactEmail = resident.EmergencyContactEmail;
            existing.MedicalNotes = resident.MedicalNotes;
            existing.DietaryRestrictions = resident.DietaryRestrictions;
            existing.IsActive = resident.IsActive;

            return Task.FromResult<Resident?>(existing);
        }
    }

    public Task<bool> DeleteAsync(int id)
    {
        lock (_lock)
        {
            var resident = _residents.FirstOrDefault(r => r.Id == id);
            if (resident == null)
                return Task.FromResult(false);

            // Soft delete
            resident.IsActive = false;
            return Task.FromResult(true);
        }
    }

    public Task<IEnumerable<Resident>> GetByBuildingAsync(int buildingId)
    {
        lock (_lock)
        {
            return Task.FromResult<IEnumerable<Resident>>(
                _residents.Where(r => r.IsActive && r.BuildingId == buildingId).ToList());
        }
    }

    public Task<IEnumerable<Resident>> GetByCareLevel(CareLevel careLevel)
    {
        lock (_lock)
        {
            return Task.FromResult<IEnumerable<Resident>>(
                _residents.Where(r => r.IsActive && r.CareLevel == careLevel).ToList());
        }
    }

    private List<Resident> GenerateSampleResidents()
    {
        return
        [
            new Resident
            {
                Id = 1,
                FirstName = "Eleanor",
                LastName = "Thompson",
                DateOfBirth = new DateTime(1935, 3, 15),
                RoomNumber = "A101",
                CareLevel = CareLevel.AssistedLiving,
                BuildingId = 1,
                FloorId = 1,
                WingId = 1,
                EmergencyContactName = "Sarah Thompson",
                EmergencyContactPhone = "555-0101",
                EmergencyContactEmail = "sarah.t@email.com",
                MedicalNotes = "Diabetic, requires daily glucose monitoring",
                DietaryRestrictions = ["Low Sugar", "Low Sodium"],
                AdmissionDate = new DateTime(2023, 1, 15)
            },
            new Resident
            {
                Id = 2,
                FirstName = "Robert",
                LastName = "Martinez",
                DateOfBirth = new DateTime(1940, 7, 22),
                RoomNumber = "A102",
                CareLevel = CareLevel.MemoryCare,
                BuildingId = 1,
                FloorId = 1,
                WingId = 1,
                EmergencyContactName = "Michael Martinez",
                EmergencyContactPhone = "555-0102",
                EmergencyContactEmail = "m.martinez@email.com",
                MedicalNotes = "Alzheimer's diagnosis, wandering risk",
                DietaryRestrictions = ["Pureed Foods"],
                AdmissionDate = new DateTime(2022, 6, 10)
            },
            new Resident
            {
                Id = 3,
                FirstName = "Margaret",
                LastName = "Chen",
                DateOfBirth = new DateTime(1938, 11, 8),
                RoomNumber = "B201",
                CareLevel = CareLevel.IndependentLiving,
                BuildingId = 1,
                FloorId = 2,
                WingId = 3,
                EmergencyContactName = "David Chen",
                EmergencyContactPhone = "555-0103",
                EmergencyContactEmail = "d.chen@email.com",
                MedicalNotes = "Mild arthritis, uses walker",
                DietaryRestrictions = [],
                AdmissionDate = new DateTime(2024, 2, 1)
            },
            new Resident
            {
                Id = 4,
                FirstName = "William",
                LastName = "Johnson",
                DateOfBirth = new DateTime(1932, 5, 30),
                RoomNumber = "C301",
                CareLevel = CareLevel.SkilledNursing,
                BuildingId = 2,
                FloorId = 4,
                WingId = 7,
                EmergencyContactName = "Patricia Johnson",
                EmergencyContactPhone = "555-0104",
                EmergencyContactEmail = "p.johnson@email.com",
                MedicalNotes = "Post-stroke recovery, physical therapy daily",
                DietaryRestrictions = ["Thickened Liquids"],
                AdmissionDate = new DateTime(2024, 8, 20)
            },
            new Resident
            {
                Id = 5,
                FirstName = "Dorothy",
                LastName = "Williams",
                DateOfBirth = new DateTime(1942, 9, 12),
                RoomNumber = "A201",
                CareLevel = CareLevel.AssistedLiving,
                BuildingId = 1,
                FloorId = 2,
                WingId = 2,
                EmergencyContactName = "James Williams",
                EmergencyContactPhone = "555-0105",
                EmergencyContactEmail = "j.williams@email.com",
                MedicalNotes = "Hypertension, hearing impaired",
                DietaryRestrictions = ["Low Sodium"],
                AdmissionDate = new DateTime(2023, 4, 5)
            },
            new Resident
            {
                Id = 6,
                FirstName = "James",
                LastName = "Brown",
                DateOfBirth = new DateTime(1936, 12, 3),
                RoomNumber = "B101",
                CareLevel = CareLevel.MemoryCare,
                BuildingId = 1,
                FloorId = 1,
                WingId = 2,
                EmergencyContactName = "Linda Brown",
                EmergencyContactPhone = "555-0106",
                EmergencyContactEmail = "l.brown@email.com",
                MedicalNotes = "Dementia, requires 24/7 supervision",
                DietaryRestrictions = ["Finger Foods Only"],
                AdmissionDate = new DateTime(2021, 11, 15)
            },
            new Resident
            {
                Id = 7,
                FirstName = "Helen",
                LastName = "Davis",
                DateOfBirth = new DateTime(1945, 4, 18),
                RoomNumber = "C101",
                CareLevel = CareLevel.IndependentLiving,
                BuildingId = 2,
                FloorId = 4,
                WingId = 6,
                EmergencyContactName = "Mark Davis",
                EmergencyContactPhone = "555-0107",
                EmergencyContactEmail = "m.davis@email.com",
                MedicalNotes = "Healthy, active lifestyle",
                DietaryRestrictions = ["Vegetarian"],
                AdmissionDate = new DateTime(2024, 1, 10)
            },
            new Resident
            {
                Id = 8,
                FirstName = "Richard",
                LastName = "Wilson",
                DateOfBirth = new DateTime(1930, 8, 25),
                RoomNumber = "D401",
                CareLevel = CareLevel.Hospice,
                BuildingId = 2,
                FloorId = 5,
                WingId = 9,
                EmergencyContactName = "Susan Wilson",
                EmergencyContactPhone = "555-0108",
                EmergencyContactEmail = "s.wilson@email.com",
                MedicalNotes = "End-stage COPD, comfort care",
                DietaryRestrictions = ["Soft Foods"],
                AdmissionDate = new DateTime(2024, 9, 1)
            }
        ];
    }
}

