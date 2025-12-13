using SeniorLivingPortal.Models;
using SeniorLivingPortal.Services;
using SeniorLivingPortal.UseCases.Alerts;

namespace SeniorLivingPortal.UseCases.Medications;

public sealed record MedicationRoundCommand(
    int? ResidentId,
    string RequestedBy
);

public sealed record MedicationRoundResult(
    IReadOnlyList<MedicationAdministrationViewModel> Pending,
    IReadOnlyList<ClinicalAlert> AlertsCreated
);

/// <summary>
/// Use case: get pending medication administrations ("med pass") and surface near-overdue items as alerts.
/// </summary>
public sealed class MedicationRoundUseCase
{
    private readonly IMedicationService _medicationService;
    private readonly IAlertService _alertService;

    public MedicationRoundUseCase(IMedicationService medicationService, IAlertService alertService)
    {
        _medicationService = medicationService;
        _alertService = alertService;
    }

    public async Task<UseCaseOutcome<MedicationRoundResult>> ExecuteAsync(MedicationRoundCommand cmd)
    {
        if (string.IsNullOrWhiteSpace(cmd.RequestedBy))
            return UseCaseOutcome<MedicationRoundResult>.Fail("RequestedBy is required.");

        var pending = (await _medicationService.GetPendingAdministrationsAsync(cmd.ResidentId)).ToList();
        var alerts = new List<ClinicalAlert>();

        // Discovery rule: if a dose is > 60 minutes past its scheduled time, raise a warning.
        // (This rule is intentionally simple and can be revised in planning.)
        var now = TimeOnly.FromDateTime(DateTime.Now);
        var nowMinutes = now.Hour * 60 + now.Minute;

        foreach (var p in pending)
        {
            var scheduledMinutes = p.ScheduledTime.Hour * 60 + p.ScheduledTime.Minute;
            var minutesLate = nowMinutes - scheduledMinutes;
            if (minutesLate <= 60) continue;

            alerts.Add(await _alertService.CreateAsync(new ClinicalAlert
            {
                ResidentId = p.ResidentId,
                Kind = AlertKind.Medication,
                Severity = AlertSeverity.Warning,
                Title = "Medication overdue",
                Message = $"{p.ResidentName} scheduled dose at {p.ScheduledTime:hh\\:mm} is ~{minutesLate} minutes overdue.",
                Source = nameof(MedicationRoundUseCase)
            }));
        }

        return UseCaseOutcome<MedicationRoundResult>.Ok(new MedicationRoundResult(pending, alerts));
    }
}

