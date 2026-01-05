using SeniorLivingPortal.Models;
using SeniorLivingPortal.Services;
using SeniorLivingPortal.UseCases.Alerts;

namespace SeniorLivingPortal.UseCases.Residents;

public sealed record AdmitResidentCommand(
    string FirstName,
    string LastName,
    DateTime DateOfBirth,
    string RoomNumber,
    CareLevel CareLevel,
    int BuildingId,
    int FloorId,
    int WingId,
    string EmergencyContactName,
    string? EmergencyContactPhone,
    string? EmergencyContactEmail,
    string? MedicalNotes,
    List<string>? DietaryRestrictions
);

public sealed record AdmitResidentResult(
    Resident Resident,
    IReadOnlyList<ClinicalAlert> AlertsCreated
);

/// <summary>
/// Use case: admit a new resident into the facility.
/// </summary>
public sealed class AdmitResidentUseCase
{
    private readonly IResidentService _residentService;
    private readonly IAlertService _alertService;

    public AdmitResidentUseCase(IResidentService residentService, IAlertService alertService)
    {
        _residentService = residentService;
        _alertService = alertService;
    }

    public async Task<UseCaseOutcome<AdmitResidentResult>> ExecuteAsync(AdmitResidentCommand cmd)
    {
        var errors = Validate(cmd);
        if (errors.Count > 0)
            return UseCaseOutcome<AdmitResidentResult>.Fail(errors);

        var resident = new Resident
        {
            FirstName = cmd.FirstName.Trim(),
            LastName = cmd.LastName.Trim(),
            DateOfBirth = cmd.DateOfBirth.Date,
            RoomNumber = cmd.RoomNumber.Trim(),
            CareLevel = cmd.CareLevel,
            BuildingId = cmd.BuildingId,
            FloorId = cmd.FloorId,
            WingId = cmd.WingId,
            EmergencyContactName = cmd.EmergencyContactName.Trim(),
            EmergencyContactPhone = cmd.EmergencyContactPhone?.Trim(),
            EmergencyContactEmail = cmd.EmergencyContactEmail?.Trim(),
            MedicalNotes = cmd.MedicalNotes?.Trim(),
            DietaryRestrictions = cmd.DietaryRestrictions?.Where(s => !string.IsNullOrWhiteSpace(s)).Select(s => s.Trim()).ToList() ?? [],
            IsActive = true
        };

        resident = await _residentService.CreateAsync(resident);

        var alerts = new List<ClinicalAlert>();

        alerts.Add(await _alertService.CreateAsync(new ClinicalAlert
        {
            ResidentId = resident.Id,
            Kind = AlertKind.Admission,
            Severity = AlertSeverity.Info,
            Title = "New admission",
            Message = $"{resident.FullName} admitted to room {resident.RoomNumber} ({resident.CareLevel}).",
            Source = nameof(AdmitResidentUseCase)
        }));

        if (!string.IsNullOrWhiteSpace(resident.MedicalNotes))
        {
            alerts.Add(await _alertService.CreateAsync(new ClinicalAlert
            {
                ResidentId = resident.Id,
                Kind = AlertKind.Admission,
                Severity = AlertSeverity.Warning,
                Title = "Review medical notes",
                Message = "Admission includes medical notes that may require follow-up (review chart).",
                Source = nameof(AdmitResidentUseCase)
            }));
        }

        return UseCaseOutcome<AdmitResidentResult>.Ok(new AdmitResidentResult(resident, alerts));
    }

    private static List<string> Validate(AdmitResidentCommand cmd)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(cmd.FirstName))
            errors.Add("FirstName is required.");
        if (string.IsNullOrWhiteSpace(cmd.LastName))
            errors.Add("LastName is required.");
        if (cmd.DateOfBirth.Date >= DateTime.Today)
            errors.Add("DateOfBirth must be in the past.");
        if (string.IsNullOrWhiteSpace(cmd.RoomNumber))
            errors.Add("RoomNumber is required.");
        if (cmd.BuildingId <= 0)
            errors.Add("BuildingId must be > 0.");
        if (cmd.FloorId <= 0)
            errors.Add("FloorId must be > 0.");
        if (cmd.WingId <= 0)
            errors.Add("WingId must be > 0.");
        if (string.IsNullOrWhiteSpace(cmd.EmergencyContactName))
            errors.Add("EmergencyContactName is required.");

        return errors;
    }
}

