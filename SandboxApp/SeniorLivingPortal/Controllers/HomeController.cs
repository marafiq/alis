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

    // === Text Input Controls ===

    [HttpGet]
    public IActionResult TestSearch(string? query, string? textboxValue)
    {
        var value = query ?? textboxValue ?? "(empty)";
        return Content($"Searched: {value}", "text/html");
    }

    [HttpGet]
    public IActionResult TestNumericChange(decimal? numericValue)
    {
        return Content($"Numeric: {numericValue?.ToString("C2") ?? "(empty)"}", "text/html");
    }

    [HttpGet]
    public IActionResult TestMaskedChange(string? maskedValue)
    {
        return Content($"Phone: {maskedValue ?? "(empty)"}", "text/html");
    }

    // === Selection Controls ===

    [HttpGet]
    public IActionResult TestDropdownChange(string? buildingId, string? dropdownValue)
    {
        var value = buildingId ?? dropdownValue ?? "(none)";
        return Content($"Selected: {value}", "text/html");
    }

    [HttpGet]
    public IActionResult TestComboChange(string? comboboxValue)
    {
        return Content($"Combo: {comboboxValue ?? "(empty)"}", "text/html");
    }

    [HttpGet]
    public IActionResult TestAutocomplete(string? autocompleteValue)
    {
        return Content($"Autocomplete: {autocompleteValue ?? "(empty)"}", "text/html");
    }

    [HttpGet]
    public IActionResult TestMultiselect(string? multiselectValue)
    {
        return Content($"Multi: {multiselectValue ?? "(empty)"}", "text/html");
    }

    [HttpGet]
    public IActionResult TestListbox(string? listboxValue)
    {
        return Content($"List: {listboxValue ?? "(empty)"}", "text/html");
    }

    // === Date/Time Controls ===

    [HttpGet]
    public IActionResult TestDateChange(string? datepickerValue)
    {
        return Content($"Date: {datepickerValue ?? "(empty)"}", "text/html");
    }

    [HttpGet]
    public IActionResult TestTimeChange(string? timepickerValue)
    {
        return Content($"Time: {timepickerValue ?? "(empty)"}", "text/html");
    }

    [HttpGet]
    public IActionResult TestDateTimeChange(string? datetimepickerValue)
    {
        return Content($"DateTime: {datetimepickerValue ?? "(empty)"}", "text/html");
    }

    [HttpGet]
    public IActionResult TestDateRangeChange(string? daterangepickerValue)
    {
        return Content($"Range: {daterangepickerValue ?? "(empty)"}", "text/html");
    }

    // === Toggle/Boolean Controls ===

    [HttpGet]
    public IActionResult TestCheckboxChange(string? checkboxValue)
    {
        return Content($"Checkbox: {checkboxValue ?? "false"}", "text/html");
    }

    [HttpGet]
    public IActionResult TestSwitchChange(string? switchValue)
    {
        return Content($"Switch: {switchValue ?? "false"}", "text/html");
    }

    [HttpGet]
    public IActionResult TestRadioChange(string? radioValue)
    {
        return Content($"Radio: {radioValue ?? "(none)"}", "text/html");
    }

    // === Range/Slider Controls ===

    [HttpGet]
    public IActionResult TestSliderChange(string? sliderValue)
    {
        return Content($"Slider: {sliderValue ?? "0"}", "text/html");
    }

    [HttpGet]
    public IActionResult TestRangeSliderChange(string? rangeSliderValue)
    {
        return Content($"Range Slider: {rangeSliderValue ?? "0-0"}", "text/html");
    }

    // === Color/Special Controls ===

    [HttpGet]
    public IActionResult TestColorChange(string? colorpickerValue)
    {
        return Content($"Color: {colorpickerValue ?? "#000000"}", "text/html");
    }

    [HttpGet]
    public async Task<IActionResult> TestButtonClick()
    {
        await Task.Delay(300);
        return Content($"Loaded at {DateTime.Now:HH:mm:ss}", "text/html");
    }

    [HttpPost]
    public IActionResult TestUpload()
    {
        return Json(new { success = true });
    }

    [HttpPost]
    public IActionResult TestRemove()
    {
        return Json(new { success = true });
    }

    [HttpPost]
    public IActionResult TestRichtextSubmit(string? richtextValue)
    {
        return Content($"Rich text received: {(richtextValue?.Length ?? 0)} chars", "text/html");
    }

    // === Cascading Dropdowns ===

    [HttpGet]
    public IActionResult GetStates(string? country)
    {
        var states = country switch
        {
            "usa" => new[] {
                new { Text = "California", Value = "ca" },
                new { Text = "Texas", Value = "tx" },
                new { Text = "New York", Value = "ny" }
            },
            "canada" => new[] {
                new { Text = "Ontario", Value = "on" },
                new { Text = "Quebec", Value = "qc" },
                new { Text = "British Columbia", Value = "bc" }
            },
            "uk" => new[] {
                new { Text = "England", Value = "eng" },
                new { Text = "Scotland", Value = "sco" },
                new { Text = "Wales", Value = "wal" }
            },
            _ => Array.Empty<object>()
        };
        return Json(states);
    }

    [HttpGet]
    public IActionResult GetCities(string? state)
    {
        var cities = state switch
        {
            "ca" => new[] {
                new { Text = "Los Angeles", Value = "la" },
                new { Text = "San Francisco", Value = "sf" }
            },
            "tx" => new[] {
                new { Text = "Houston", Value = "hou" },
                new { Text = "Austin", Value = "aus" }
            },
            "ny" => new[] {
                new { Text = "New York City", Value = "nyc" },
                new { Text = "Buffalo", Value = "buf" }
            },
            _ => Array.Empty<object>()
        };
        return Json(cities);
    }

    // === Form Validation ===

    [HttpPost]
    public IActionResult TestFormSubmit([FromForm] TestFormModel model)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(new ValidationProblemDetails(ModelState)
            {
                Type = "https://tools.ietf.org/html/rfc7807",
                Title = "Validation failed",
                Status = 400
            });
        }

        return Content($"Form submitted: {model.FirstName}, {model.Email}", "text/html");
    }

    /// <summary>
    /// Complex form submission - tests collecting multiple Syncfusion controls
    /// </summary>
    [HttpPost]
    public IActionResult SubmitResidentForm([FromForm] ResidentFormModel model)
    {
        var result = new
        {
            success = true,
            data = new
            {
                name = $"{model.FirstName} {model.LastName}",
                email = model.Email,
                phone = model.Phone,
                birthDate = model.BirthDate?.ToString("yyyy-MM-dd"),
                moveInDate = model.MoveInDate?.ToString("yyyy-MM-dd"),
                careLevel = model.CareLevel,
                roomType = model.RoomType,
                dietaryNeeds = model.DietaryNeeds,
                emergencyContact = model.EmergencyContact,
                medications = model.Medications,
                monthlyBudget = model.MonthlyBudget,
                mobilityScore = model.MobilityScore,
                requiresAssistance = model.RequiresAssistance,
                hasInsurance = model.HasInsurance,
                preferredColor = model.PreferredColor,
                notes = model.Notes
            }
        };
        return Json(result);
    }

    /// <summary>
    /// Dynamic field update based on care level
    /// </summary>
    [HttpGet]
    public IActionResult GetCareLevelDetails(string careLevel)
    {
        var details = careLevel switch
        {
            "independent" => new {
                description = "Independent Living - Minimal assistance",
                services = new[] { "Meals", "Housekeeping" },
                priceRange = "$2,000 - $3,500/month"
            },
            "assisted" => new {
                description = "Assisted Living - Daily assistance available",
                services = new[] { "Meals", "Housekeeping", "Medication Management", "Personal Care" },
                priceRange = "$3,500 - $5,500/month"
            },
            "memory" => new {
                description = "Memory Care - Specialized dementia care",
                services = new[] { "24/7 Supervision", "Meals", "Medication", "Therapy", "Security" },
                priceRange = "$5,500 - $8,000/month"
            },
            "skilled" => new {
                description = "Skilled Nursing - Medical care required",
                services = new[] { "Nursing Care", "Physical Therapy", "Medical Monitoring" },
                priceRange = "$7,000 - $12,000/month"
            },
            _ => new { description = "Select a care level", services = Array.Empty<string>(), priceRange = "" }
        };

        return PartialView("_CareLevelDetails", details);
    }

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
    public string? Name { get; set; }
    public string? Email { get; set; }
    public int? Age { get; set; }
    public string? Category { get; set; }
    public DateTime? BirthDate { get; set; }
    public DateTime? Date { get; set; }
    public bool Agree { get; set; }
}

/// <summary>
/// Complex resident form model - tests multiple Syncfusion control types
/// </summary>
public class ResidentFormModel
{
    // TextBox
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Email { get; set; }

    // MaskedTextBox
    public string? Phone { get; set; }

    // DatePicker
    public DateTime? BirthDate { get; set; }
    public DateTime? MoveInDate { get; set; }

    // DropDownList
    public string? CareLevel { get; set; }
    public string? RoomType { get; set; }

    // MultiSelect
    public string? DietaryNeeds { get; set; }
    public string? Medications { get; set; }

    // NumericTextBox
    public decimal? MonthlyBudget { get; set; }

    // Slider
    public int? MobilityScore { get; set; }

    // Checkbox/Switch
    public bool RequiresAssistance { get; set; }
    public bool HasInsurance { get; set; }

    // ColorPicker
    public string? PreferredColor { get; set; }

    // TextArea/RichText
    public string? Notes { get; set; }

    // Contact info
    public string? EmergencyContact { get; set; }
}
