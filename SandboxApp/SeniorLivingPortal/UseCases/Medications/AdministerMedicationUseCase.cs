using SeniorLivingPortal.Models;
using SeniorLivingPortal.Services;
using SeniorLivingPortal.UseCases.Alerts;

namespace SeniorLivingPortal.UseCases.Medications;

public sealed record AdministerMedicationCommand(
    int ScheduleId,
    AdministrationStatus Status,
    string AdministeredBy,
    string? Notes,
    int? ResidentId
);

public sealed record AdministerMedicationResult(
    MedicationAdministration Administration,
    IReadOnlyList<ClinicalAlert> AlertsCreated
);

/// <summary>
/// Use case: record a medication administration event and raise alerts on exceptions.
/// </summary>
public sealed class AdministerMedicationUseCase
{
    private readonly IMedicationService _medicationService;
    private readonly IResidentService _residentService;
    private readonly IAlertService _alertService;

    public AdministerMedicationUseCase(IMedicationService medicationService, IResidentService residentService, IAlertService alertService)
    {
        _medicationService = medicationService;
        _residentService = residentService;
        _alertService = alertService;
    }

    public async Task<UseCaseOutcome<AdministerMedicationResult>> ExecuteAsync(AdministerMedicationCommand cmd)
    {
        var errors = Validate(cmd);
        if (errors.Count > 0)
            return UseCaseOutcome<AdministerMedicationResult>.Fail(errors);

        Resident? resident = null;
        if (cmd.ResidentId.HasValue)
        {
            resident = await _residentService.GetByIdAsync(cmd.ResidentId.Value);
            if (resident == null || !resident.IsActive)
                return UseCaseOutcome<AdministerMedicationResult>.Fail("Resident not found.");
        }

        var admin = await _medicationService.RecordAdministrationAsync(
            cmd.ScheduleId,
            cmd.Status,
            cmd.AdministeredBy.Trim(),
            cmd.Notes?.Trim());

        var alerts = new List<ClinicalAlert>();

        if (cmd.Status != AdministrationStatus.Given)
        {
            var who = resident != null ? $"{resident.FullName} ({resident.RoomNumber})" : "Resident";

            alerts.Add(await _alertService.CreateAsync(new ClinicalAlert
            {
                ResidentId = resident?.Id ?? 0,
                Kind = AlertKind.Medication,
                Severity = cmd.Status == AdministrationStatus.Refused ? AlertSeverity.Critical : AlertSeverity.Warning,
                Title = $"Medication {cmd.Status}",
                Message = $"{who} medication administration exception: {cmd.Status}. ScheduleId={cmd.ScheduleId}.",
                Source = nameof(AdministerMedicationUseCase)
            }));
        }

        return UseCaseOutcome<AdministerMedicationResult>.Ok(new AdministerMedicationResult(admin, alerts));
    }

    private static List<string> Validate(AdministerMedicationCommand cmd)
    {
        var errors = new List<string>();

        if (cmd.ScheduleId <= 0)
            errors.Add("ScheduleId must be > 0.");
        if (string.IsNullOrWhiteSpace(cmd.AdministeredBy))
            errors.Add("AdministeredBy is required.");

        return errors;
    }
}

