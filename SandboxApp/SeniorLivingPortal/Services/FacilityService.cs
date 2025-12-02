using SeniorLivingPortal.Models;

namespace SeniorLivingPortal.Services;

public class FacilityService : IFacilityService
{
    private readonly List<Building> _buildings;

    public FacilityService()
    {
        _buildings = GenerateFacilityData();
    }

    public Task<IEnumerable<Building>> GetBuildingsAsync()
    {
        return Task.FromResult<IEnumerable<Building>>(_buildings);
    }

    public Task<IEnumerable<Floor>> GetFloorsByBuildingAsync(int buildingId)
    {
        var building = _buildings.FirstOrDefault(b => b.Id == buildingId);
        return Task.FromResult<IEnumerable<Floor>>(building?.Floors ?? []);
    }

    public Task<IEnumerable<Wing>> GetWingsByFloorAsync(int floorId)
    {
        var wings = _buildings
            .SelectMany(b => b.Floors)
            .FirstOrDefault(f => f.Id == floorId)?.Wings ?? [];
        return Task.FromResult<IEnumerable<Wing>>(wings);
    }

    public Task<IEnumerable<DropdownItem>> GetBuildingDropdownAsync()
    {
        var items = _buildings.Select(b => new DropdownItem
        {
            Value = b.Id,
            Text = $"{b.Name} ({b.Code})"
        });
        return Task.FromResult(items);
    }

    public Task<IEnumerable<DropdownItem>> GetFloorDropdownAsync(int buildingId)
    {
        var building = _buildings.FirstOrDefault(b => b.Id == buildingId);
        var items = building?.Floors.Select(f => new DropdownItem
        {
            Value = f.Id,
            Text = f.Name
        }) ?? [];
        return Task.FromResult(items);
    }

    public Task<IEnumerable<DropdownItem>> GetWingDropdownAsync(int floorId)
    {
        var floor = _buildings
            .SelectMany(b => b.Floors)
            .FirstOrDefault(f => f.Id == floorId);
        
        var items = floor?.Wings.Select(w => new DropdownItem
        {
            Value = w.Id,
            Text = $"{w.Name} ({w.Code}) - {w.CurrentOccupancy}/{w.Capacity}"
        }) ?? [];
        return Task.FromResult(items);
    }

    private static List<Building> GenerateFacilityData()
    {
        return
        [
            new Building
            {
                Id = 1,
                Name = "Main Building",
                Code = "MAIN",
                Floors =
                [
                    new Floor
                    {
                        Id = 1,
                        BuildingId = 1,
                        Number = 1,
                        Name = "First Floor",
                        Wings =
                        [
                            new Wing { Id = 1, FloorId = 1, Name = "East Wing", Code = "1E", Capacity = 20, CurrentOccupancy = 18 },
                            new Wing { Id = 2, FloorId = 1, Name = "West Wing", Code = "1W", Capacity = 20, CurrentOccupancy = 15 }
                        ]
                    },
                    new Floor
                    {
                        Id = 2,
                        BuildingId = 1,
                        Number = 2,
                        Name = "Second Floor",
                        Wings =
                        [
                            new Wing { Id = 3, FloorId = 2, Name = "East Wing", Code = "2E", Capacity = 24, CurrentOccupancy = 22 },
                            new Wing { Id = 4, FloorId = 2, Name = "West Wing", Code = "2W", Capacity = 24, CurrentOccupancy = 20 }
                        ]
                    },
                    new Floor
                    {
                        Id = 3,
                        BuildingId = 1,
                        Number = 3,
                        Name = "Third Floor - Memory Care",
                        Wings =
                        [
                            new Wing { Id = 5, FloorId = 3, Name = "Sunrise Unit", Code = "3S", Capacity = 16, CurrentOccupancy = 14 }
                        ]
                    }
                ]
            },
            new Building
            {
                Id = 2,
                Name = "Healthcare Center",
                Code = "HC",
                Floors =
                [
                    new Floor
                    {
                        Id = 4,
                        BuildingId = 2,
                        Number = 1,
                        Name = "Skilled Nursing",
                        Wings =
                        [
                            new Wing { Id = 6, FloorId = 4, Name = "North Wing", Code = "SN-N", Capacity = 30, CurrentOccupancy = 28 },
                            new Wing { Id = 7, FloorId = 4, Name = "South Wing", Code = "SN-S", Capacity = 30, CurrentOccupancy = 25 }
                        ]
                    },
                    new Floor
                    {
                        Id = 5,
                        BuildingId = 2,
                        Number = 2,
                        Name = "Rehabilitation & Hospice",
                        Wings =
                        [
                            new Wing { Id = 8, FloorId = 5, Name = "Rehab Unit", Code = "RH", Capacity = 20, CurrentOccupancy = 12 },
                            new Wing { Id = 9, FloorId = 5, Name = "Comfort Care", Code = "CC", Capacity = 10, CurrentOccupancy = 6 }
                        ]
                    }
                ]
            },
            new Building
            {
                Id = 3,
                Name = "Independent Living",
                Code = "IL",
                Floors =
                [
                    new Floor
                    {
                        Id = 6,
                        BuildingId = 3,
                        Number = 1,
                        Name = "Ground Floor",
                        Wings =
                        [
                            new Wing { Id = 10, FloorId = 6, Name = "Garden View", Code = "GV", Capacity = 15, CurrentOccupancy = 12 },
                            new Wing { Id = 11, FloorId = 6, Name = "Courtyard", Code = "CY", Capacity = 15, CurrentOccupancy = 14 }
                        ]
                    },
                    new Floor
                    {
                        Id = 7,
                        BuildingId = 3,
                        Number = 2,
                        Name = "Upper Floor",
                        Wings =
                        [
                            new Wing { Id = 12, FloorId = 7, Name = "Mountain View", Code = "MV", Capacity = 12, CurrentOccupancy = 10 }
                        ]
                    }
                ]
            }
        ];
    }
}

