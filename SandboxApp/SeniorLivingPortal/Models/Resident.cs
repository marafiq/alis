namespace SeniorLivingPortal.Models;

/// <summary>
/// Represents a resident in the senior living facility.
/// DataAnnotations are used ONLY for client-side ALIS validation.
/// Server-side validation is handled by FluentValidation returning ProblemDetails.
/// </summary>
public class Resident
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string RoomNumber { get; set; } = string.Empty;
    public CareLevel CareLevel { get; set; }
    public int BuildingId { get; set; }
    public int FloorId { get; set; }
    public int WingId { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string EmergencyContactName { get; set; } = string.Empty;
    public string? EmergencyContactEmail { get; set; }
    public DateTime AdmissionDate { get; set; } = DateTime.Today;
    public string? MedicalNotes { get; set; }
    public List<string> DietaryRestrictions { get; set; } = [];
    public bool IsActive { get; set; } = true;
    public string? PhotoUrl { get; set; }

    // Computed properties
    public string FullName => $"{FirstName} {LastName}";
    
    public int Age => DateTime.Today.Year - DateOfBirth.Year - 
        (DateTime.Today.DayOfYear < DateOfBirth.DayOfYear ? 1 : 0);
}

public enum CareLevel
{
    IndependentLiving = 1,
    AssistedLiving = 2,
    MemoryCare = 3,
    SkilledNursing = 4,
    Hospice = 5
}

/// <summary>
/// ViewModel for resident form - contains data-val-* attributes for ALIS client-side validation.
/// This separation allows clean models while providing rich client validation metadata.
/// </summary>
public class ResidentFormViewModel
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public string RoomNumber { get; set; } = string.Empty;
    public CareLevel? CareLevel { get; set; }
    public int? BuildingId { get; set; }
    public int? FloorId { get; set; }
    public int? WingId { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string EmergencyContactName { get; set; } = string.Empty;
    public string? EmergencyContactEmail { get; set; }
    public string? MedicalNotes { get; set; }
    public List<string> DietaryRestrictions { get; set; } = [];
    public bool IsActive { get; set; } = true;

    public Resident ToResident() => new()
    {
        Id = Id,
        FirstName = FirstName,
        LastName = LastName,
        DateOfBirth = DateOfBirth ?? DateTime.Today,
        RoomNumber = RoomNumber,
        CareLevel = CareLevel ?? Models.CareLevel.IndependentLiving,
        BuildingId = BuildingId ?? 0,
        FloorId = FloorId ?? 0,
        WingId = WingId ?? 0,
        EmergencyContactPhone = EmergencyContactPhone,
        EmergencyContactName = EmergencyContactName,
        EmergencyContactEmail = EmergencyContactEmail,
        MedicalNotes = MedicalNotes,
        DietaryRestrictions = DietaryRestrictions,
        IsActive = IsActive
    };

    public static ResidentFormViewModel FromResident(Resident resident) => new()
    {
        Id = resident.Id,
        FirstName = resident.FirstName,
        LastName = resident.LastName,
        DateOfBirth = resident.DateOfBirth,
        RoomNumber = resident.RoomNumber,
        CareLevel = resident.CareLevel,
        BuildingId = resident.BuildingId,
        FloorId = resident.FloorId,
        WingId = resident.WingId,
        EmergencyContactPhone = resident.EmergencyContactPhone,
        EmergencyContactName = resident.EmergencyContactName,
        EmergencyContactEmail = resident.EmergencyContactEmail,
        MedicalNotes = resident.MedicalNotes,
        DietaryRestrictions = resident.DietaryRestrictions,
        IsActive = resident.IsActive
    };
}
