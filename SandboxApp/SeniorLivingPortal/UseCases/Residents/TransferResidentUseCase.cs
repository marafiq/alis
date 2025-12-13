using SeniorLivingPortal.Models;
using SeniorLivingPortal.Services;
using SeniorLivingPortal.UseCases.Alerts;

namespace SeniorLivingPortal.UseCases.Residents;

public sealed record TransferResidentCommand(
    int ResidentId,
    string NewRoomNumber,
    int? BuildingId,
    int? FloorId,
    int? WingId,
    string PerformedBy,
    string? Notes
);

public sealed record TransferResidentResult(
    Resident Resident,
    IReadOnlyList<ClinicalAlert> AlertsCreated
);

/// <summary>
/// Use case: move a resident to a different room/location.
/// </summary>
public sealed class TransferResidentUseCase
{
    private readonly IResidentService _residentService;
    private readonly IAlertService _alertService;

    public TransferResidentUseCase(IResidentService residentService, IAlertService alertService)
    {
        _residentService = residentService;
        _alertService = alertService;
    }

    public async Task<UseCaseOutcome<TransferResidentResult>> ExecuteAsync(TransferResidentCommand cmd)
    {
        var errors = Validate(cmd);
        if (errors.Count > 0)
            return UseCaseOutcome<TransferResidentResult>.Fail(errors);

        var resident = await _residentService.GetByIdAsync(cmd.ResidentId);
        if (resident == null || !resident.IsActive)
            return UseCaseOutcome<TransferResidentResult>.Fail("Resident not found.");

        var oldRoom = resident.RoomNumber;

        resident.RoomNumber = cmd.NewRoomNumber.Trim();
        resident.BuildingId = cmd.BuildingId ?? resident.BuildingId;
        resident.FloorId = cmd.FloorId ?? resident.FloorId;
        resident.WingId = cmd.WingId ?? resident.WingId;

        var updated = await _residentService.UpdateAsync(resident.Id, resident);
        if (updated == null)
            return UseCaseOutcome<TransferResidentResult>.Fail("Transfer failed (update returned null).");

        var alerts = new List<ClinicalAlert>
        {
            await _alertService.CreateAsync(new ClinicalAlert
            {
                ResidentId = updated.Id,
                Kind = AlertKind.Transfer,
                Severity = AlertSeverity.Info,
                Title = "Resident transferred",
                Message = $"{updated.FullName} moved from room {oldRoom} to {updated.RoomNumber}.",
                Source = nameof(TransferResidentUseCase)
            })
        };

        if (!string.IsNullOrWhiteSpace(cmd.Notes))
        {
            alerts.Add(await _alertService.CreateAsync(new ClinicalAlert
            {
                ResidentId = updated.Id,
                Kind = AlertKind.Transfer,
                Severity = AlertSeverity.Warning,
                Title = "Transfer notes require review",
                Message = "Transfer included notes that may require follow-up.",
                Source = nameof(TransferResidentUseCase)
            }));
        }

        return UseCaseOutcome<TransferResidentResult>.Ok(new TransferResidentResult(updated, alerts));
    }

    private static List<string> Validate(TransferResidentCommand cmd)
    {
        var errors = new List<string>();

        if (cmd.ResidentId <= 0)
            errors.Add("ResidentId must be > 0.");
        if (string.IsNullOrWhiteSpace(cmd.NewRoomNumber))
            errors.Add("NewRoomNumber is required.");
        if (string.IsNullOrWhiteSpace(cmd.PerformedBy))
            errors.Add("PerformedBy is required.");

        return errors;
    }
}

