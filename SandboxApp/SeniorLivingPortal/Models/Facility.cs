namespace SeniorLivingPortal.Models;

/// <summary>
/// Represents facility hierarchy for cascading dropdowns demo.
/// Building -> Floor -> Wing pattern.
/// </summary>
public class Building
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public List<Floor> Floors { get; set; } = [];
}

public class Floor
{
    public int Id { get; set; }
    public int BuildingId { get; set; }
    public int Number { get; set; }
    public string Name { get; set; } = string.Empty;
    public List<Wing> Wings { get; set; } = [];
}

public class Wing
{
    public int Id { get; set; }
    public int FloorId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public int CurrentOccupancy { get; set; }
}

/// <summary>
/// Dropdown item for cascading select responses
/// </summary>
public class DropdownItem
{
    public int Value { get; set; }
    public string Text { get; set; } = string.Empty;
}
