using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using SeniorLivingPortal.Infrastructure;
using SeniorLivingPortal.Models;
using SeniorLivingPortal.Services;

namespace SeniorLivingPortal.Controllers;

/// <summary>
/// Residents controller demonstrating ALIS features:
/// - Debounced search with partial view updates
/// - Form validation with ProblemDetails
/// - CRUD operations with modal workflows
/// - Cascading dropdowns for location selection
/// </summary>
public class ResidentsController : Controller
{
    private readonly IResidentService _residentService;
    private readonly IFacilityService _facilityService;
    private readonly IValidator<ResidentFormViewModel> _validator;

    public ResidentsController(
        IResidentService residentService,
        IFacilityService facilityService,
        IValidator<ResidentFormViewModel> validator)
    {
        _residentService = residentService;
        _facilityService = facilityService;
        _validator = validator;
    }

    /// <summary>
    /// Main residents list page - serves as container for ALIS islands
    /// </summary>
    public async Task<IActionResult> Index()
    {
        var residents = await _residentService.GetAllAsync();
        ViewBag.Buildings = await _facilityService.GetBuildingDropdownAsync();
        return View(residents);
    }

    /// <summary>
    /// ALIS endpoint: Search residents with debounce
    /// Called via data-alis-get with delay:300ms trigger
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Search(string? query, CareLevel? careLevel, int? buildingId)
    {
        // Simulate slight delay for demo
        await Task.Delay(100);
        
        var residents = await _residentService.SearchAsync(query, careLevel, buildingId);
        return PartialView("_ResidentsList", residents);
    }

    /// <summary>
    /// ALIS endpoint: Get resident form for create
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Create()
    {
        try
        {
            ViewBag.Buildings = await _facilityService.GetBuildingDropdownAsync();
            return PartialView("_ResidentForm", new ResidentFormViewModel());
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// ALIS endpoint: Get resident form for edit
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Edit(int id)
    {
        var resident = await _residentService.GetByIdAsync(id);
        if (resident == null)
            return NotFound();

        ViewBag.Buildings = await _facilityService.GetBuildingDropdownAsync();
        ViewBag.Floors = await _facilityService.GetFloorDropdownAsync(resident.BuildingId);
        ViewBag.Wings = await _facilityService.GetWingDropdownAsync(resident.FloorId);
        
        return PartialView("_ResidentForm", ResidentFormViewModel.FromResident(resident));
    }

    /// <summary>
    /// ALIS endpoint: Create new resident
    /// Returns ProblemDetails on validation failure, success HTML on success
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromForm] ResidentFormViewModel model)
    {
        var problems = await _validator.ValidateAndGetProblemsAsync(model);
        if (problems != null)
            return BadRequest(problems);

        var resident = model.ToResident();
        await _residentService.CreateAsync(resident);

        // Return success response for ALIS hook handling
        return Ok(new { success = true, message = "Resident created successfully", id = resident.Id });
    }

    /// <summary>
    /// ALIS endpoint: Update existing resident
    /// </summary>
    [HttpPut]
    public async Task<IActionResult> Update(int id, [FromForm] ResidentFormViewModel model)
    {
        var problems = await _validator.ValidateAndGetProblemsAsync(model);
        if (problems != null)
            return BadRequest(problems);

        model.Id = id;
        var updated = await _residentService.UpdateAsync(id, model.ToResident());
        
        if (updated == null)
            return NotFound();

        return Ok(new { success = true, message = "Resident updated successfully" });
    }

    /// <summary>
    /// ALIS endpoint: Delete resident (soft delete)
    /// Uses data-alis-confirm for confirmation
    /// </summary>
    [HttpDelete]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await _residentService.DeleteAsync(id);
        if (!success)
            return NotFound();

        // Return updated list for swap
        var residents = await _residentService.GetAllAsync();
        return PartialView("_ResidentsList", residents);
    }

    /// <summary>
    /// ALIS endpoint: Get resident details card
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Details(int id)
    {
        var resident = await _residentService.GetByIdAsync(id);
        if (resident == null)
            return NotFound();

        return PartialView("_ResidentDetails", resident);
    }
}

