namespace SeniorLivingPortal.Models;

/// <summary>
/// Represents vital signs recording for a resident.
/// Clean domain model - validation handled by FluentValidation on server.
/// </summary>
public class Vitals
{
    public int Id { get; set; }
    public int ResidentId { get; set; }
    public int BloodPressureSystolic { get; set; }
    public int BloodPressureDiastolic { get; set; }
    public int HeartRate { get; set; }
    public decimal Temperature { get; set; }
    public int OxygenSaturation { get; set; }
    public int? RespiratoryRate { get; set; }
    public int? PainLevel { get; set; }
    public decimal? Weight { get; set; }
    public DateTime RecordedAt { get; set; } = DateTime.Now;
    public string RecordedBy { get; set; } = string.Empty;
    public string? Notes { get; set; }

    // Navigation property
    public Resident? Resident { get; set; }

    // Computed properties for alerts
    public VitalStatus BloodPressureStatus => GetBloodPressureStatus();
    public VitalStatus HeartRateStatus => GetHeartRateStatus();
    public VitalStatus TemperatureStatus => GetTemperatureStatus();
    public VitalStatus OxygenStatus => GetOxygenStatus();

    public string BloodPressureDisplay => $"{BloodPressureSystolic}/{BloodPressureDiastolic}";

    private VitalStatus GetBloodPressureStatus()
    {
        if (BloodPressureSystolic >= 180 || BloodPressureDiastolic >= 120)
            return VitalStatus.Critical;
        if (BloodPressureSystolic >= 140 || BloodPressureDiastolic >= 90)
            return VitalStatus.Warning;
        if (BloodPressureSystolic < 90 || BloodPressureDiastolic < 60)
            return VitalStatus.Warning;
        return VitalStatus.Normal;
    }

    private VitalStatus GetHeartRateStatus()
    {
        if (HeartRate < 40 || HeartRate > 150)
            return VitalStatus.Critical;
        if (HeartRate < 60 || HeartRate > 100)
            return VitalStatus.Warning;
        return VitalStatus.Normal;
    }

    private VitalStatus GetTemperatureStatus()
    {
        if (Temperature >= 103 || Temperature < 96)
            return VitalStatus.Critical;
        if (Temperature >= 100.4m || Temperature < 97)
            return VitalStatus.Warning;
        return VitalStatus.Normal;
    }

    private VitalStatus GetOxygenStatus()
    {
        if (OxygenSaturation < 90)
            return VitalStatus.Critical;
        if (OxygenSaturation < 95)
            return VitalStatus.Warning;
        return VitalStatus.Normal;
    }
}

public enum VitalStatus
{
    Normal,
    Warning,
    Critical
}

/// <summary>
/// ViewModel for vitals form with client-side validation metadata
/// </summary>
public class VitalsFormViewModel
{
    public int Id { get; set; }
    public int? ResidentId { get; set; }
    public int? BloodPressureSystolic { get; set; }
    public int? BloodPressureDiastolic { get; set; }
    public int? HeartRate { get; set; }
    public decimal? Temperature { get; set; }
    public int? OxygenSaturation { get; set; }
    public int? RespiratoryRate { get; set; }
    public int? PainLevel { get; set; }
    public decimal? Weight { get; set; }
    public string? Notes { get; set; }

    public Vitals ToVitals(string recordedBy) => new()
    {
        Id = Id,
        ResidentId = ResidentId ?? 0,
        BloodPressureSystolic = BloodPressureSystolic ?? 0,
        BloodPressureDiastolic = BloodPressureDiastolic ?? 0,
        HeartRate = HeartRate ?? 0,
        Temperature = Temperature ?? 0,
        OxygenSaturation = OxygenSaturation ?? 0,
        RespiratoryRate = RespiratoryRate,
        PainLevel = PainLevel,
        Weight = Weight,
        Notes = Notes,
        RecordedAt = DateTime.Now,
        RecordedBy = recordedBy
    };
}

/// <summary>
/// DTO for vitals summary on dashboard
/// </summary>
public class VitalsSummary
{
    public int ResidentId { get; set; }
    public string ResidentName { get; set; } = string.Empty;
    public string RoomNumber { get; set; } = string.Empty;
    public Vitals? LatestVitals { get; set; }
    public bool HasCriticalAlerts { get; set; }
    public bool HasWarningAlerts { get; set; }
    public DateTime? LastRecorded { get; set; }
}
