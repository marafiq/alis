using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using SeniorLivingPortal.Infrastructure;
using SeniorLivingPortal.Models;
using SeniorLivingPortal.Services;

namespace SeniorLivingPortal.Controllers;

/// <summary>
/// Medications controller demonstrating ALL ALIS features:
/// - GET/POST operations with data-alis-{method}
/// - Target element updates with data-alis-target
/// - Trigger events with delay/throttle (data-alis-trigger)
/// - Data collection patterns (data-alis-collect)
/// - Loading indicators (data-alis-indicator)
/// - Swap strategies (data-alis-swap: innerHTML, outerHTML, none)
/// - Confirmation dialogs (data-alis-confirm)
/// - Retry configuration (data-alis-retry)
/// - Before/After hooks (data-alis-on-before, data-alis-on-after)
/// - Client validation (data-alis-validate)
/// - Duplicate request handling (data-alis-duplicate-request)
/// </summary>
public class MedicationsController : Controller
{
    private readonly IMedicationService _medicationService;
    private readonly IResidentService _residentService;

    public MedicationsController(
        IMedicationService medicationService,
        IResidentService residentService)
    {
        _medicationService = medicationService;
        _residentService = residentService;
    }

    /// <summary>
    /// Main medications page - container for ALIS islands
    /// </summary>
    public async Task<IActionResult> Index()
    {
        var pending = await _medicationService.GetPendingAdministrationsAsync();
        var residents = await _residentService.GetAllAsync();
        ViewBag.Residents = residents;
        return View(pending);
    }

    /// <summary>
    /// ALIS endpoint: Get pending administrations dashboard
    /// Used with data-alis-get and polling via data-alis-trigger="load delay:30000ms"
    /// Demonstrates: auto-refresh, retry on failure
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Dashboard(int? residentId = null)
    {
        var pending = await _medicationService.GetPendingAdministrationsAsync(residentId);
        return PartialView("_MedicationsDashboard", pending);
    }

    /// <summary>
    /// ALIS endpoint: Search medications
    /// Demonstrates: data-alis-trigger="input delay:300ms", debounced search
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Search(string? query, int? residentId)
    {
        var pending = await _medicationService.GetPendingAdministrationsAsync(residentId);

        if (!string.IsNullOrWhiteSpace(query))
        {
            var lowerQuery = query.ToLowerInvariant();
            pending = pending.Where(p =>
                p.ResidentName.Contains(lowerQuery, StringComparison.OrdinalIgnoreCase) ||
                p.MedicationName.Contains(lowerQuery, StringComparison.OrdinalIgnoreCase));
        }

        return PartialView("_MedicationsList", pending);
    }

    /// <summary>
    /// ALIS endpoint: Get medication schedules for a resident
    /// Demonstrates: data-alis-collect="self", cascading data
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> ByResident(int residentId)
    {
        var schedules = await _medicationService.GetSchedulesByResidentAsync(residentId);
        var resident = await _residentService.GetByIdAsync(residentId);
        ViewBag.Resident = resident;
        return PartialView("_ResidentMedications", schedules);
    }

    /// <summary>
    /// ALIS endpoint: Get administration form
    /// Demonstrates: modal loading with data-alis-on-after="showModal"
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Administer(int scheduleId)
    {
        var pending = await _medicationService.GetPendingAdministrationsAsync();
        var med = pending.FirstOrDefault(p => p.ScheduleId == scheduleId);

        if (med == null)
            return NotFound();

        return PartialView("_AdministerForm", med);
    }

    /// <summary>
    /// ALIS endpoint: Record medication administration
    /// Demonstrates:
    /// - data-alis-post with form collection
    /// - data-alis-confirm="administerConfirm" for critical action
    /// - data-alis-validate="true" for client-side validation
    /// - data-alis-swap="none" for JSON response
    /// - data-alis-duplicate-request="abort" to prevent double-submit
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Administer([FromForm] MedicationAdministrationFormModel model)
    {
        // Validate
        if (!Enum.TryParse<AdministrationStatus>(model.Status, out var status))
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Validation Error",
                Status = 400,
                Extensions = { ["errors"] = new Dictionary<string, string[]>
                {
                    { "Status", new[] { "Please select a valid status" } }
                }}
            });
        }

        // Record administration
        var admin = await _medicationService.RecordAdministrationAsync(
            model.ScheduleId,
            status,
            model.AdministeredBy ?? "Current User",
            model.Notes);

        return Ok(new { success = true, message = "Medication administered successfully", id = admin.Id });
    }

    /// <summary>
    /// ALIS endpoint: Get medication history for a resident
    /// Demonstrates: data-alis-target with outerHTML swap
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> History(int residentId, int days = 7)
    {
        var schedules = await _medicationService.GetSchedulesByResidentAsync(residentId);
        var resident = await _residentService.GetByIdAsync(residentId);
        ViewBag.Resident = resident;
        ViewBag.Days = days;
        return PartialView("_MedicationHistory", schedules);
    }

    /// <summary>
    /// ALIS endpoint: Quick actions - mark as given without form
    /// Demonstrates: inline action with data-alis-confirm-message
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> QuickGive([FromForm] int scheduleId)
    {
        await _medicationService.RecordAdministrationAsync(
            scheduleId,
            AdministrationStatus.Given,
            "Current User",
            "Quick administration");

        // Return updated dashboard
        var pending = await _medicationService.GetPendingAdministrationsAsync();
        return PartialView("_MedicationsDashboard", pending);
    }

    /// <summary>
    /// ALIS endpoint: Bulk mark medications
    /// Demonstrates: data-alis-collect="closest form" for multiple selections
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> BulkAdminister([FromForm] BulkAdministerModel model)
    {
        if (model.ScheduleIds == null || model.ScheduleIds.Length == 0)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Validation Error",
                Status = 400,
                Extensions = { ["errors"] = new Dictionary<string, string[]>
                {
                    { "ScheduleIds", new[] { "Please select at least one medication" } }
                }}
            });
        }

        foreach (var scheduleId in model.ScheduleIds)
        {
            await _medicationService.RecordAdministrationAsync(
                scheduleId,
                model.Status,
                model.AdministeredBy ?? "Current User",
                model.Notes);
        }

        return Ok(new { success = true, message = $"{model.ScheduleIds.Length} medications recorded" });
    }

    /// <summary>
    /// ALIS endpoint: Get alert count badge
    /// Demonstrates: polling with data-alis-trigger="load delay:60000ms" for badge updates
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> AlertCount()
    {
        var pending = await _medicationService.GetPendingAdministrationsAsync();
        var count = pending.Count();
        return Content(count > 0 ? $"<span class=\"badge bg-danger\">{count}</span>" : "", "text/html");
    }
}

/// <summary>
/// Form model for medication administration
/// </summary>
public class MedicationAdministrationFormModel
{
    public int ScheduleId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? AdministeredBy { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Form model for bulk administration
/// </summary>
public class BulkAdministerModel
{
    public int[]? ScheduleIds { get; set; }
    public AdministrationStatus Status { get; set; } = AdministrationStatus.Given;
    public string? AdministeredBy { get; set; }
    public string? Notes { get; set; }
}
