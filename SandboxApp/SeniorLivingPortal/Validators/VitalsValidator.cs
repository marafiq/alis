using FluentValidation;
using SeniorLivingPortal.Models;

namespace SeniorLivingPortal.Validators;

/// <summary>
/// Server-side FluentValidation for Vitals.
/// Includes clinical range validation with meaningful error messages.
/// </summary>
public class VitalsFormValidator : AbstractValidator<VitalsFormViewModel>
{
    public VitalsFormValidator()
    {
        RuleFor(x => x.ResidentId)
            .NotNull().WithMessage("Resident is required")
            .GreaterThan(0).WithMessage("Please select a resident");

        RuleFor(x => x.BloodPressureSystolic)
            .NotNull().WithMessage("Systolic blood pressure is required")
            .InclusiveBetween(60, 250).WithMessage("Systolic must be between 60 and 250 mmHg");

        RuleFor(x => x.BloodPressureDiastolic)
            .NotNull().WithMessage("Diastolic blood pressure is required")
            .InclusiveBetween(40, 150).WithMessage("Diastolic must be between 40 and 150 mmHg");

        // Cross-field validation: systolic should be greater than diastolic
        RuleFor(x => x)
            .Must(x => x.BloodPressureSystolic > x.BloodPressureDiastolic)
            .When(x => x.BloodPressureSystolic.HasValue && x.BloodPressureDiastolic.HasValue)
            .WithMessage("Systolic pressure must be greater than diastolic pressure")
            .WithName("BloodPressureSystolic");

        RuleFor(x => x.HeartRate)
            .NotNull().WithMessage("Heart rate is required")
            .InclusiveBetween(30, 220).WithMessage("Heart rate must be between 30 and 220 bpm");

        RuleFor(x => x.Temperature)
            .NotNull().WithMessage("Temperature is required")
            .InclusiveBetween(95.0m, 108.0m).WithMessage("Temperature must be between 95.0 and 108.0 °F");

        RuleFor(x => x.OxygenSaturation)
            .NotNull().WithMessage("Oxygen saturation is required")
            .InclusiveBetween(70, 100).WithMessage("Oxygen saturation must be between 70 and 100%");

        RuleFor(x => x.RespiratoryRate)
            .InclusiveBetween(8, 40)
            .When(x => x.RespiratoryRate.HasValue)
            .WithMessage("Respiratory rate must be between 8 and 40 breaths/min");

        RuleFor(x => x.PainLevel)
            .InclusiveBetween(0, 10)
            .When(x => x.PainLevel.HasValue)
            .WithMessage("Pain level must be between 0 and 10");

        RuleFor(x => x.Weight)
            .InclusiveBetween(50m, 500m)
            .When(x => x.Weight.HasValue)
            .WithMessage("Weight must be between 50 and 500 lbs");

        RuleFor(x => x.Notes)
            .MaximumLength(500)
            .WithMessage("Notes cannot exceed 500 characters");
    }
}

