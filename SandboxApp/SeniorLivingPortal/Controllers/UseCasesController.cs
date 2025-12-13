using Microsoft.AspNetCore.Mvc;
using SeniorLivingPortal.UseCases;
using SeniorLivingPortal.UseCases.Alerts;
using SeniorLivingPortal.UseCases.Medications;
using SeniorLivingPortal.UseCases.Residents;
using SeniorLivingPortal.UseCases.Vitals;

namespace SeniorLivingPortal.Controllers;

/// <summary>
/// JSON endpoints intended for "code-first" use case discovery.
/// These endpoints are deliberately lightweight and UI-agnostic.
/// </summary>
[ApiController]
[Route("api/usecases")]
public sealed class UseCasesController : ControllerBase
{
    private readonly AdmitResidentUseCase _admitResident;
    private readonly TransferResidentUseCase _transferResident;
    private readonly RecordVitalsUseCase _recordVitals;
    private readonly MedicationRoundUseCase _medRound;
    private readonly AdministerMedicationUseCase _administerMedication;
    private readonly IAlertService _alertService;

    public UseCasesController(
        AdmitResidentUseCase admitResident,
        TransferResidentUseCase transferResident,
        RecordVitalsUseCase recordVitals,
        MedicationRoundUseCase medRound,
        AdministerMedicationUseCase administerMedication,
        IAlertService alertService)
    {
        _admitResident = admitResident;
        _transferResident = transferResident;
        _recordVitals = recordVitals;
        _medRound = medRound;
        _administerMedication = administerMedication;
        _alertService = alertService;
    }

    [HttpGet]
    public IActionResult Index()
    {
        // A small "catalog" to make discovery easy without reading code.
        return Ok(new
        {
            description = "Code-first use case endpoints for SeniorLivingPortal.",
            endpoints = new object[]
            {
                new { method = "POST", path = "/api/usecases/residents/admit", body = new AdmitResidentCommand(
                    FirstName: "Jane",
                    LastName: "Doe",
                    DateOfBirth: new DateTime(1940, 1, 1),
                    RoomNumber: "A105",
                    CareLevel: SeniorLivingPortal.Models.CareLevel.AssistedLiving,
                    BuildingId: 1,
                    FloorId: 1,
                    WingId: 1,
                    EmergencyContactName: "John Doe",
                    EmergencyContactPhone: "555-0000",
                    EmergencyContactEmail: "john.doe@email.com",
                    MedicalNotes: "Fall risk; uses walker",
                    DietaryRestrictions: new List<string> { "Low Sodium" }
                )},
                new { method = "POST", path = "/api/usecases/residents/transfer", body = new TransferResidentCommand(
                    ResidentId: 1,
                    NewRoomNumber: "A110",
                    BuildingId: 1,
                    FloorId: 1,
                    WingId: 2,
                    PerformedBy: "Charge Nurse",
                    Notes: "Moved closer to nursing station"
                )},
                new { method = "POST", path = "/api/usecases/vitals/record", body = new RecordVitalsCommand(
                    ResidentId: 4,
                    BloodPressureSystolic: 185,
                    BloodPressureDiastolic: 125,
                    HeartRate: 110,
                    Temperature: 101.2m,
                    OxygenSaturation: 88,
                    RespiratoryRate: 28,
                    PainLevel: 6,
                    Weight: null,
                    RecordedBy: "Nurse Smith",
                    Notes: "Patient showing signs of distress"
                )},
                new { method = "GET", path = "/api/usecases/medications/pending?residentId=1", body = (object?)null },
                new { method = "POST", path = "/api/usecases/medications/round", body = new MedicationRoundCommand(
                    ResidentId: null,
                    RequestedBy: "Med Tech"
                )},
                new { method = "POST", path = "/api/usecases/medications/administer", body = new AdministerMedicationCommand(
                    ScheduleId: 1,
                    Status: SeniorLivingPortal.Models.AdministrationStatus.Given,
                    AdministeredBy: "Med Tech",
                    Notes: null,
                    ResidentId: 1
                )},
                new { method = "GET", path = "/api/usecases/alerts", body = (object?)null },
                new { method = "POST", path = "/api/usecases/alerts/{id}/resolve", body = new { resolvedBy = "Charge Nurse", notes = "Handled" } }
            }
        });
    }

    [HttpPost("residents/admit")]
    public async Task<ActionResult<UseCaseOutcome<AdmitResidentResult>>> Admit([FromBody] AdmitResidentCommand cmd)
    {
        var result = await _admitResident.ExecuteAsync(cmd);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("residents/transfer")]
    public async Task<ActionResult<UseCaseOutcome<TransferResidentResult>>> Transfer([FromBody] TransferResidentCommand cmd)
    {
        var result = await _transferResident.ExecuteAsync(cmd);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("vitals/record")]
    public async Task<ActionResult<UseCaseOutcome<RecordVitalsResult>>> RecordVitals([FromBody] RecordVitalsCommand cmd)
    {
        var result = await _recordVitals.ExecuteAsync(cmd);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("medications/pending")]
    public async Task<IActionResult> PendingMedications([FromQuery] int? residentId = null)
    {
        // Convenience alias for GET-based exploration.
        // Note: this will run the medication-round workflow (and may create alerts).
        var result = await _medRound.ExecuteAsync(new MedicationRoundCommand(residentId, RequestedBy: "System"));
        return Ok(result);
    }

    [HttpPost("medications/round")]
    public async Task<ActionResult<UseCaseOutcome<MedicationRoundResult>>> MedicationRound([FromBody] MedicationRoundCommand cmd)
    {
        var result = await _medRound.ExecuteAsync(cmd);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("medications/administer")]
    public async Task<ActionResult<UseCaseOutcome<AdministerMedicationResult>>> AdministerMedication([FromBody] AdministerMedicationCommand cmd)
    {
        var result = await _administerMedication.ExecuteAsync(cmd);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("alerts")]
    public async Task<IActionResult> Alerts([FromQuery] int? residentId = null)
    {
        var active = await _alertService.GetActiveAsync(residentId);
        return Ok(active);
    }

    public sealed record ResolveAlertRequest(string ResolvedBy, string? Notes);

    [HttpPost("alerts/{id:guid}/resolve")]
    public async Task<IActionResult> ResolveAlert([FromRoute] Guid id, [FromBody] ResolveAlertRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.ResolvedBy))
            return BadRequest(new { error = "ResolvedBy is required." });

        var ok = await _alertService.ResolveAsync(id, req.ResolvedBy.Trim(), req.Notes?.Trim());
        return ok ? Ok(new { success = true }) : NotFound();
    }
}

