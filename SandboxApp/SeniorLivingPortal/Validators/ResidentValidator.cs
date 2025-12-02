using FluentValidation;
using SeniorLivingPortal.Models;

namespace SeniorLivingPortal.Validators;

/// <summary>
/// Server-side FluentValidation for Resident.
/// Returns validation errors that will be converted to ProblemDetails.
/// </summary>
public class ResidentFormValidator : AbstractValidator<ResidentFormViewModel>
{
    public ResidentFormValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("First name is required")
            .Length(2, 50).WithMessage("First name must be between 2 and 50 characters");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Last name is required")
            .Length(2, 50).WithMessage("Last name must be between 2 and 50 characters");

        RuleFor(x => x.DateOfBirth)
            .NotNull().WithMessage("Date of birth is required")
            .LessThan(DateTime.Today).WithMessage("Date of birth must be in the past")
            .GreaterThan(DateTime.Today.AddYears(-120)).WithMessage("Please enter a valid date of birth");

        RuleFor(x => x.RoomNumber)
            .NotEmpty().WithMessage("Room number is required")
            .Matches(@"^[A-Z]\d{3}$").WithMessage("Room number must be in format A123 (letter followed by 3 digits)");

        RuleFor(x => x.CareLevel)
            .NotNull().WithMessage("Care level is required")
            .IsInEnum().WithMessage("Please select a valid care level");

        RuleFor(x => x.BuildingId)
            .NotNull().WithMessage("Building is required")
            .GreaterThan(0).WithMessage("Please select a building");

        RuleFor(x => x.FloorId)
            .NotNull().WithMessage("Floor is required")
            .GreaterThan(0).WithMessage("Please select a floor");

        RuleFor(x => x.WingId)
            .NotNull().WithMessage("Wing is required")
            .GreaterThan(0).WithMessage("Please select a wing");

        RuleFor(x => x.EmergencyContactName)
            .NotEmpty().WithMessage("Emergency contact name is required")
            .Length(2, 100).WithMessage("Emergency contact name must be between 2 and 100 characters");

        RuleFor(x => x.EmergencyContactPhone)
            .Matches(@"^[\d\s\-\+\(\)]+$")
            .When(x => !string.IsNullOrEmpty(x.EmergencyContactPhone))
            .WithMessage("Please enter a valid phone number");

        RuleFor(x => x.EmergencyContactEmail)
            .EmailAddress()
            .When(x => !string.IsNullOrEmpty(x.EmergencyContactEmail))
            .WithMessage("Please enter a valid email address");

        RuleFor(x => x.MedicalNotes)
            .MaximumLength(2000)
            .WithMessage("Medical notes cannot exceed 2000 characters");
    }
}

