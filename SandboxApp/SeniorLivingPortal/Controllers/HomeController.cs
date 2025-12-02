using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using SeniorLivingPortal.Models;
using SeniorLivingPortal.Services;

namespace SeniorLivingPortal.Controllers;

/// <summary>
/// Home controller - Dashboard and navigation hub
/// </summary>
public class HomeController : Controller
{
    private readonly IResidentService _residentService;
    private readonly IVitalsService _vitalsService;

    public HomeController(IResidentService residentService, IVitalsService vitalsService)
    {
        _residentService = residentService;
        _vitalsService = vitalsService;
    }

    public async Task<IActionResult> Index()
    {
        var residents = await _residentService.GetAllAsync();
        var alerts = await _vitalsService.GetAlertsAsync();

        ViewBag.TotalResidents = residents.Count();
        ViewBag.CriticalAlerts = alerts.Count(a => a.HasCriticalAlerts);
        ViewBag.WarningAlerts = alerts.Count(a => a.HasWarningAlerts && !a.HasCriticalAlerts);

        return View();
    }

    public IActionResult Privacy()
    {
        return View();
    }

    /// <summary>
    /// ALIS Demos index page - showcases all ALIS features
    /// </summary>
    public IActionResult Demos()
    {
        return View();
    }

    /// <summary>
    /// Syncfusion + ALIS Integration Test Page
    /// </summary>
    public IActionResult SyncfusionTest()
    {
        return View();
    }

    #region Test Endpoints for SyncfusionTest Page

    /// <summary>
    /// Test endpoint for debounced search
    /// </summary>
    [HttpGet]
    public IActionResult TestSearch(string? query)
    {
        return Content($"<div class='alert alert-success'>Search result for: <strong>{query ?? "(empty)"}</strong> at {DateTime.Now:HH:mm:ss}</div>", "text/html");
    }

    /// <summary>
    /// Test endpoint for dropdown change
    /// </summary>
    [HttpGet]
    public IActionResult TestDropdownChange(string? buildingId)
    {
        return Content($"<div class='alert alert-info'>Selected Building ID: <strong>{buildingId ?? "(none)"}</strong> at {DateTime.Now:HH:mm:ss}</div>", "text/html");
    }

    /// <summary>
    /// Test endpoint for form submit
    /// </summary>
    [HttpPost]
    public IActionResult TestFormSubmit([FromForm] TestFormModel model)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState
                .Where(x => x.Value?.Errors.Count > 0)
                .ToDictionary(
                    x => x.Key,
                    x => x.Value!.Errors.Select(e => e.ErrorMessage).ToArray()
                );
            
            return ValidationProblem(new ValidationProblemDetails(ModelState)
            {
                Type = "https://tools.ietf.org/html/rfc7807",
                Title = "Validation failed",
                Status = 400
            });
        }

        return Content($"<div class='alert alert-success'>Form submitted successfully!<br/>Name: {model.FirstName}<br/>Email: {model.Email}<br/>Age: {model.Age}<br/>Category: {model.Category}</div>", "text/html");
    }

    /// <summary>
    /// Test endpoint for button click
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> TestButtonClick()
    {
        await Task.Delay(500); // Simulate network delay
        return Content($"<div class='alert alert-primary'>Data loaded at {DateTime.Now:HH:mm:ss}</div>", "text/html");
    }

    /// <summary>
    /// Test endpoint for partial view with Syncfusion controls
    /// </summary>
    [HttpGet]
    public IActionResult TestPartialView()
    {
        return PartialView("_TestPartialView");
    }

    #endregion

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}

/// <summary>
/// Test form model for validation
/// </summary>
public class TestFormModel
{
    public string? FirstName { get; set; }
    public string? Email { get; set; }
    public int? Age { get; set; }
    public string? Category { get; set; }
    public DateTime? BirthDate { get; set; }
    public bool Agree { get; set; }
}
