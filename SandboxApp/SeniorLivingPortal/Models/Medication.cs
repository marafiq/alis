namespace SeniorLivingPortal.Models;

/// <summary>
/// Represents medication administration records.
/// Used for medication scheduling island demo.
/// </summary>
public class Medication
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public string Route { get; set; } = string.Empty; // Oral, IV, Topical, etc.
    public string? Instructions { get; set; }
    public bool IsActive { get; set; } = true;
}

/// <summary>
/// Medication schedule for a resident
/// </summary>
public class MedicationSchedule
{
    public int Id { get; set; }
    public int ResidentId { get; set; }
    public int MedicationId { get; set; }
    public TimeOnly ScheduledTime { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public Resident? Resident { get; set; }
    public Medication? Medication { get; set; }
}

/// <summary>
/// Record of medication administration
/// </summary>
public class MedicationAdministration
{
    public int Id { get; set; }
    public int ScheduleId { get; set; }
    public DateTime AdministeredAt { get; set; }
    public string AdministeredBy { get; set; } = string.Empty;
    public AdministrationStatus Status { get; set; }
    public string? Notes { get; set; }

    public MedicationSchedule? Schedule { get; set; }
}

public enum AdministrationStatus
{
    Given,
    Refused,
    Held,
    NotAvailable
}

/// <summary>
/// ViewModel for medication administration form
/// </summary>
public class MedicationAdministrationViewModel
{
    public int ScheduleId { get; set; }
    public int ResidentId { get; set; }
    public string ResidentName { get; set; } = string.Empty;
    public string MedicationName { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public TimeOnly ScheduledTime { get; set; }
    public AdministrationStatus? Status { get; set; }
    public string? Notes { get; set; }
}

