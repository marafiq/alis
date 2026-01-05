using SeniorLivingPortal.Models;
using SeniorLivingPortal.Services;
using SeniorLivingPortal.UseCases.Alerts;

namespace SeniorLivingPortal.UseCases.Vitals;

public sealed record RecordVitalsCommand(
    int ResidentId,
    int BloodPressureSystolic,
    int BloodPressureDiastolic,
    int HeartRate,
    decimal Temperature,
    int OxygenSaturation,
    int? RespiratoryRate,
    int? PainLevel,
    decimal? Weight,
    string RecordedBy,
    string? Notes
);

public sealed record RecordVitalsResult(
    Models.Vitals Vitals,
    IReadOnlyList<ClinicalAlert> AlertsCreated
);

/// <summary>
/// Use case: record vitals and generate alerts for abnormal findings.
/// This is intentionally "thin domain" to keep discovery fast: vitals thresholds live on the model.
/// </summary>
public sealed class RecordVitalsUseCase
{
    private readonly IVitalsService _vitalsService;
    private readonly IResidentService _residentService;
    private readonly IAlertService _alertService;

    public RecordVitalsUseCase(IVitalsService vitalsService, IResidentService residentService, IAlertService alertService)
    {
        _vitalsService = vitalsService;
        _residentService = residentService;
        _alertService = alertService;
    }

    public async Task<UseCaseOutcome<RecordVitalsResult>> ExecuteAsync(RecordVitalsCommand cmd)
    {
        var errors = Validate(cmd);
        if (errors.Count > 0)
            return UseCaseOutcome<RecordVitalsResult>.Fail(errors);

        var resident = await _residentService.GetByIdAsync(cmd.ResidentId);
        if (resident == null || !resident.IsActive)
            return UseCaseOutcome<RecordVitalsResult>.Fail("Resident not found.");

        var vitals = new Models.Vitals
        {
            ResidentId = cmd.ResidentId,
            BloodPressureSystolic = cmd.BloodPressureSystolic,
            BloodPressureDiastolic = cmd.BloodPressureDiastolic,
            HeartRate = cmd.HeartRate,
            Temperature = cmd.Temperature,
            OxygenSaturation = cmd.OxygenSaturation,
            RespiratoryRate = cmd.RespiratoryRate,
            PainLevel = cmd.PainLevel,
            Weight = cmd.Weight,
            Notes = cmd.Notes,
            RecordedBy = cmd.RecordedBy.Trim(),
            RecordedAt = DateTime.Now
        };

        vitals = await _vitalsService.RecordAsync(vitals);

        var alerts = new List<ClinicalAlert>();

        await AddVitalAlertIfNeeded(alerts, resident, vitals, "Blood Pressure", vitals.BloodPressureDisplay, vitals.BloodPressureStatus);
        await AddVitalAlertIfNeeded(alerts, resident, vitals, "Heart Rate", $"{vitals.HeartRate} bpm", vitals.HeartRateStatus);
        await AddVitalAlertIfNeeded(alerts, resident, vitals, "Temperature", $"{vitals.Temperature}°F", vitals.TemperatureStatus);
        await AddVitalAlertIfNeeded(alerts, resident, vitals, "Oxygen Saturation", $"{vitals.OxygenSaturation}%", vitals.OxygenStatus);

        return UseCaseOutcome<RecordVitalsResult>.Ok(new RecordVitalsResult(vitals, alerts));
    }

    private async Task AddVitalAlertIfNeeded(
        List<ClinicalAlert> alerts,
        Resident resident,
        Models.Vitals vitals,
        string metric,
        string displayValue,
        VitalStatus status)
    {
        if (status == VitalStatus.Normal)
            return;

        var severity = status == VitalStatus.Critical ? AlertSeverity.Critical : AlertSeverity.Warning;
        var title = status == VitalStatus.Critical ? $"Critical {metric}" : $"{metric} out of range";

        alerts.Add(await _alertService.CreateAsync(new ClinicalAlert
        {
            ResidentId = resident.Id,
            Kind = AlertKind.Vitals,
            Severity = severity,
            Title = title,
            Message = $"{resident.FullName} ({resident.RoomNumber}) {metric}: {displayValue} ({status}). Recorded by {vitals.RecordedBy}.",
            Source = nameof(RecordVitalsUseCase)
        }));
    }

    private static List<string> Validate(RecordVitalsCommand cmd)
    {
        var errors = new List<string>();

        if (cmd.ResidentId <= 0)
            errors.Add("ResidentId must be > 0.");
        if (cmd.BloodPressureSystolic <= 0)
            errors.Add("BloodPressureSystolic must be > 0.");
        if (cmd.BloodPressureDiastolic <= 0)
            errors.Add("BloodPressureDiastolic must be > 0.");
        if (cmd.HeartRate <= 0)
            errors.Add("HeartRate must be > 0.");
        if (cmd.Temperature <= 0)
            errors.Add("Temperature must be > 0.");
        if (cmd.OxygenSaturation <= 0)
            errors.Add("OxygenSaturation must be > 0.");
        if (string.IsNullOrWhiteSpace(cmd.RecordedBy))
            errors.Add("RecordedBy is required.");

        return errors;
    }
}

