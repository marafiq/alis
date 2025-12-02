using Microsoft.AspNetCore.Mvc;
using SeniorLivingPortal.Services;

namespace SeniorLivingPortal.Controllers;

/// <summary>
/// Facility controller for cascading dropdown ALIS demo.
/// Demonstrates Building -> Floor -> Wing selection pattern.
/// </summary>
public class FacilityController : Controller
{
    private readonly IFacilityService _facilityService;

    public FacilityController(IFacilityService facilityService)
    {
        _facilityService = facilityService;
    }

    /// <summary>
    /// ALIS endpoint: Get floors for a building
    /// Returns HTML options for select element
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Floors(int buildingId)
    {
        var floors = await _facilityService.GetFloorDropdownAsync(buildingId);
        return PartialView("_SelectOptions", floors);
    }

    /// <summary>
    /// ALIS endpoint: Get wings for a floor
    /// Returns HTML options for select element
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Wings(int floorId)
    {
        var wings = await _facilityService.GetWingDropdownAsync(floorId);
        return PartialView("_SelectOptions", wings);
    }

    /// <summary>
    /// ALIS endpoint: Get all buildings
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Buildings()
    {
        var buildings = await _facilityService.GetBuildingDropdownAsync();
        return PartialView("_SelectOptions", buildings);
    }
}

