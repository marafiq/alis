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

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
