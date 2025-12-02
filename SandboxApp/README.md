# Senior Living Portal - ALIS Sandbox Demo

A comprehensive .NET 10 MVC application demonstrating the **ALIS (AJAX-Like Intelligent System)** framework integrated with **Syncfusion Essential JS 2** controls in a real-world senior living facility management context.

## 🎯 Purpose

This sandbox serves as a reference implementation for migrating legacy ASP.NET applications to modern, interactive "island" architecture using ALIS. It demonstrates:

- **Progressive Enhancement**: Standard MVC views enhanced with ALIS for partial updates
- **FluentValidation + ProblemDetails**: Server-side validation returning RFC 7807 responses
- **ALIS Client-Side Validation**: Using `data-val-*` attributes with Syncfusion adapter
- **Cascading Dropdowns**: Building → Floor → Wing selection pattern
- **Debounced Search**: Real-time filtering with configurable delays
- **Modal Workflows**: CRUD operations in modal dialogs
- **Real-time Dashboards**: Vitals monitoring with status indicators

## 🏗️ Architecture

```
SeniorLivingPortal/
├── Controllers/           # MVC Controllers with ALIS endpoints
│   ├── HomeController.cs       # Dashboard & Demos
│   ├── ResidentsController.cs  # Resident CRUD with validation
│   ├── VitalsController.cs     # Vitals recording & monitoring
│   └── FacilityController.cs   # Cascading dropdown endpoints
├── Models/                # Domain models & ViewModels
├── Services/              # Business logic (in-memory for demo)
├── Validators/            # FluentValidation validators
├── Infrastructure/        # Tag helpers & extensions
│   ├── ALISTagHelpers.cs       # Custom tag helpers for ALIS
│   └── ValidationProblemDetailsFactory.cs
├── Views/                 # Razor views with ALIS attributes
└── wwwroot/
    ├── lib/alis/          # ALIS framework
    ├── css/site.css       # Healthcare-themed styling
    └── js/site.js         # ALIS initialization & hooks
```

## 🚀 Getting Started

### Prerequisites

- .NET 10 SDK
- Node.js (for building ALIS if needed)

### Running the Application

```bash
cd SandboxApp/SeniorLivingPortal
dotnet run
```

Navigate to `https://localhost:5001` (or the port shown in console).

## 📋 ALIS Features Demonstrated

### 1. Debounced Search
```html
<input type="text" 
       data-alis-get="/Residents/Search"
       data-alis-trigger="input delay:300ms"
       data-alis-target="#search-results"
       data-alis-indicator="is-loading, #spinner" />
```

### 2. Form Validation with ProblemDetails
```html
<form data-alis-post="/Residents/Create"
      data-alis-validate="true"
      data-alis-on-after="handleSuccess">
    <input name="FirstName" 
           data-val="true"
           data-val-required="First name is required" />
    <span data-valmsg-for="FirstName"></span>
</form>
```

Server returns:
```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Please fix the errors below",
  "status": 400,
  "errors": {
    "FirstName": ["First name is required"]
  }
}
```

### 3. Cascading Dropdowns
```html
<select data-alis-get="/Facility/Floors"
        data-alis-trigger="change"
        data-alis-target="#floorSelect"
        data-alis-collect="self"
        name="buildingId">
```

### 4. Delete with Confirmation
```html
<button data-alis-delete="/Residents/Delete/1"
        data-alis-confirm="Are you sure?"
        data-alis-target="#result">
```

### 5. Multiple Hooks
```html
<form data-alis-on-after="handleSuccess, closeModal, refreshGrid">
```

### 6. Syncfusion Integration
```html
<select id="residentDropdown" 
        name="ResidentId"
        data-val="true"
        data-val-required="Please select a resident">
</select>
<script>
    new ej.dropdowns.DropDownList({...}).appendTo('#residentDropdown');
</script>
```

## 🏥 Domain Model

### Residents
- Personal information (name, DOB, room)
- Care level classification
- Location hierarchy (Building → Floor → Wing)
- Emergency contacts
- Medical notes & dietary restrictions

### Vitals
- Blood pressure (systolic/diastolic)
- Heart rate
- Temperature
- Oxygen saturation (SpO2)
- Optional: respiratory rate, pain level, weight
- Status indicators (Normal, Warning, Critical)

### Facility
- Buildings with multiple floors
- Floors with multiple wings
- Wing capacity tracking

## 🔧 Validation Strategy

### Client-Side (ALIS)
- Uses `data-val-*` attributes for immediate feedback
- Syncfusion adapter reads values from EJ2 components
- "Angry on blur, forgiving on input" pattern

### Server-Side (FluentValidation)
- Comprehensive business rule validation
- Cross-field validation (e.g., systolic > diastolic)
- Returns RFC 7807 ProblemDetails
- ALIS automatically displays errors by field name

## 📱 Pages

| Page | Description | ALIS Features |
|------|-------------|---------------|
| `/` | Dashboard | Stats, alerts refresh |
| `/Home/Demos` | ALIS Feature Demos | All features showcased |
| `/Residents` | Resident Management | Search, CRUD, validation |
| `/Vitals` | Vitals Dashboard | Real-time monitoring |

## 🎨 Styling

The application uses a professional healthcare theme with:
- Clean, accessible color scheme
- Status-based color coding (Normal=Green, Warning=Orange, Critical=Red)
- Care level badges
- Responsive card layouts
- Smooth transitions and loading states

## 📚 Key Files

| File | Purpose |
|------|---------|
| `Infrastructure/ALISTagHelpers.cs` | Custom tag helpers for ALIS attributes |
| `Infrastructure/ValidationProblemDetailsFactory.cs` | FluentValidation → ProblemDetails |
| `Validators/*.cs` | FluentValidation validators |
| `wwwroot/js/site.js` | ALIS initialization & hooks |
| `Views/Home/Demos.cshtml` | Interactive ALIS demos |

## 🔗 Related

- [ALIS Framework Documentation](../../README.md)
- [FluentValidation](https://docs.fluentvalidation.net/)
- [Syncfusion Essential JS 2](https://ej2.syncfusion.com/)
- [RFC 7807 - Problem Details](https://tools.ietf.org/html/rfc7807)

## 📄 License

This sandbox is part of the ALIS framework demonstration and is provided for educational purposes.

