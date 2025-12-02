using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using SeniorLivingPortal.Infrastructure;
using SeniorLivingPortal.Models;
using SeniorLivingPortal.Services;

namespace SeniorLivingPortal.Controllers;

/// <summary>
/// Vitals controller demonstrating ALIS features:
/// - Real-time dashboard updates
/// - Form validation for clinical ranges
/// - Status indicators and alerts
/// - Historical data display
/// </summary>
public class VitalsController : Controller
{
    private readonly IVitalsService _vitalsService;
    private readonly IResidentService _residentService;
    private readonly IValidator<VitalsFormViewModel> _validator;

    public VitalsController(
        IVitalsService vitalsService,
        IResidentService residentService,
        IValidator<VitalsFormViewModel> validator)
    {
        _vitalsService = vitalsService;
        _residentService = residentService;
        _validator = validator;
    }

    /// <summary>
    /// Vitals dashboard - shows all residents with latest vitals
    /// </summary>
    public async Task<IActionResult> Index()
    {
        var summaries = await _vitalsService.GetAllLatestAsync();
        return View(summaries);
    }

    /// <summary>
    /// ALIS endpoint: Get vitals dashboard content for refresh
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Dashboard()
    {
        var summaries = await _vitalsService.GetAllLatestAsync();
        return PartialView("_VitalsDashboard", summaries);
    }

    /// <summary>
    /// ALIS endpoint: Get alerts only
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Alerts()
    {
        var alerts = await _vitalsService.GetAlertsAsync();
        return PartialView("_VitalsAlerts", alerts);
    }

    /// <summary>
    /// ALIS endpoint: Get vitals recording form for a resident
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Record(int residentId)
    {
        var resident = await _residentService.GetByIdAsync(residentId);
        if (resident == null)
            return NotFound();

        ViewBag.Resident = resident;
        return PartialView("_VitalsForm", new VitalsFormViewModel { ResidentId = residentId });
    }

    /// <summary>
    /// ALIS endpoint: Record new vitals
    /// Returns ProblemDetails on validation failure
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Record([FromForm] VitalsFormViewModel model)
    {
        var problems = await _validator.ValidateAndGetProblemsAsync(model);
        if (problems != null)
            return BadRequest(problems);

        var vitals = model.ToVitals("Current User"); // In real app, get from auth
        await _vitalsService.RecordAsync(vitals);

        return Ok(new { success = true, message = "Vitals recorded successfully" });
    }

    /// <summary>
    /// ALIS endpoint: Get vitals history for a resident
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> History(int residentId, int? days = 7)
    {
        var resident = await _residentService.GetByIdAsync(residentId);
        if (resident == null)
            return NotFound();

        var from = DateTime.Today.AddDays(-(days ?? 7));
        var vitals = await _vitalsService.GetHistoryAsync(residentId, from, DateTime.Now);

        ViewBag.Resident = resident;
        ViewBag.Days = days;
        return PartialView("_VitalsHistory", vitals);
    }

    /// <summary>
    /// ALIS endpoint: Get latest vitals for a specific resident
    /// Used for real-time updates
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Latest(int residentId)
    {
        var vitals = await _vitalsService.GetLatestByResidentAsync(residentId);
        if (vitals == null)
            return PartialView("_VitalsCard", null);

        var resident = await _residentService.GetByIdAsync(residentId);
        vitals.Resident = resident;
        
        return PartialView("_VitalsCard", vitals);
    }
}

