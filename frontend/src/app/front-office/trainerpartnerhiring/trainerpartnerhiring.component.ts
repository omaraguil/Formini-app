import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { PartnerService } from '../services/partner.service';
import { TrainerService } from '../services/trainer.service';
import { TrainerStatus } from '../models/trainer.model';
import { City, LegalForm, PartnershipType, PartnerHiring } from '../models/partner.model';
import { Technology } from '../models/trainer.model';

@Component({
  selector: 'app-trainer-partner-hiring',
  templateUrl: './trainerpartnerhiring.component.html',
  styleUrls: ['./trainerpartnerhiring.component.scss']
})
export class TrainerPartnerHiringComponent implements OnInit {
  partnerForm!: FormGroup;
  trainerForm!: FormGroup;
  isSubmitting = false;
  showForm = false;
  showTrainerForm = false;
  errorMessage = '';
  successMessage = '';
  showSuccessPopup = false;
  successPopupTitle = '';
  successPopupMessage = '';

  cities = Object.values(City);
  legalForms = Object.values(LegalForm);
  partnershipTypes = Object.values(PartnershipType);

  businessFile: File | null = null;
  profileFile: File | null = null;
  logoFile: File | null = null;
  logoPreview: string | null = null;

  // Trainer variables
  cvFile: File | null = null;
  pictureFile: File | null = null;
  picturePreview: string | null = null;
  acceptedPartners: PartnerHiring[] = [];
  technologies = Object.values(Technology);

  // Multi-step form logic
  currentStep = 1;
  currentTrainerStep = 1;

  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_FILE_TYPE = 'application/pdf';
  private readonly ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

  constructor(
    private fb: FormBuilder,
    private partnerService: PartnerService,
    private trainerService: TrainerService
  ) { }

  ngOnInit(): void {
    this.initPartnerForm();
    this.initTrainerForm();
    this.loadAcceptedPartners();
  }

  // Step Navigation
  nextStep(): void {
    if (this.isStepValid()) {
      this.currentStep++;
      this.scrollToFormTop('partner-form-section');
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.scrollToFormTop('partner-form-section');
    }
  }

  nextTrainerStep(): void {
    if (this.isTrainerStepValid()) {
      this.currentTrainerStep++;
      this.scrollToFormTop('trainer-form-section');
    }
  }

  prevTrainerStep(): void {
    if (this.currentTrainerStep > 1) {
      this.currentTrainerStep--;
      this.scrollToFormTop('trainer-form-section');
    }
  }

  private scrollToFormTop(id: string): void {
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  isStepValid(): boolean {
    if (this.currentStep === 1) {
      return this.partnerForm.get('organizationName')!.valid &&
        this.partnerForm.get('legalForm')!.valid &&
        this.partnerForm.get('email')!.valid &&
        this.partnerForm.get('phone')!.valid;
    }
    if (this.currentStep === 2) {
      return this.partnerForm.get('website')!.valid &&
        this.partnerForm.get('city')!.valid &&
        this.partnerForm.get('address')!.valid &&
        this.partnerForm.get('partnershipType')!.valid;
    }
    return true; // Step 3 is validated by submit
  }

  isTrainerStepValid(): boolean {
    if (this.currentTrainerStep === 1) {
      return this.trainerForm.get('name')!.valid &&
        this.trainerForm.get('forename')!.valid &&
        this.trainerForm.get('email')!.valid &&
        this.trainerForm.get('phone')!.valid &&
        this.trainerForm.get('location')!.valid;
    }
    if (this.currentTrainerStep === 2) {
      return this.trainerForm.get('yearsOfExperience')!.valid &&
        this.trainerForm.get('technology')!.valid &&
        this.trainerForm.get('partnerId')!.valid &&
        this.trainerForm.get('motivationLetter')!.valid;
    }
    return true;
  }

  initPartnerForm(): void {
    this.partnerForm = this.fb.group({
      organizationName: ['', [Validators.required, Validators.minLength(3)]],
      legalForm: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern('^[2579][0-9]{7}$')]],
      website: ['', [Validators.required, Validators.pattern('^https://.*')]],
      city: ['', Validators.required],
      address: ['', [Validators.required, Validators.minLength(5)]],
      partnershipType: ['', Validators.required],
      businessRegistration: [null, Validators.required],
      companyProfile: [null, Validators.required],
      logo: [null]
    }, { validators: this.domainValidator() });
  }

  domainValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const email = control.get('email')?.value;
      const website = control.get('website')?.value;

      if (email && website) {
        const parts = email.split('@');
        if (parts.length >= 2) {
          const domain = parts[1].toLowerCase();
          if (!website.toLowerCase().includes(domain)) {
            return { domainMismatch: true };
          }
        }
      }
      return null;
    };
  }

  onFileChange(event: any, field: string): void {
    const file = event.target.files[0];
    this.errorMessage = '';

    if (file) {
      if (field === 'logo') {
        if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
          this.errorMessage = 'Only JPG and PNG images are allowed for the logo.';
          this.resetFileField(field);
          return;
        }
      } else if (file.type !== this.ALLOWED_FILE_TYPE) {
        this.errorMessage = 'Only PDF files are allowed.';
        this.resetFileField(field);
        return;
      }

      if (file.size > this.MAX_FILE_SIZE) {
        this.errorMessage = 'File size exceeds 5MB limit.';
        this.resetFileField(field);
        return;
      }

      if (field === 'businessRegistration') {
        this.businessFile = file;
      } else if (field === 'companyProfile') {
        this.profileFile = file;
      } else if (field === 'logo') {
        this.logoFile = file;
        const reader = new FileReader();
        reader.onload = () => this.logoPreview = reader.result as string;
        reader.readAsDataURL(file);
      }
      this.partnerForm.patchValue({ [field]: file });
      this.partnerForm.get(field)?.updateValueAndValidity();
    }
  }

  public resetFileField(field: string): void {
    if (field === 'businessRegistration') {
      this.businessFile = null;
    } else if (field === 'companyProfile') {
      this.profileFile = null;
    } else if (field === 'logo') {
      this.logoFile = null;
      this.logoPreview = null;
    }
    this.partnerForm.patchValue({ [field]: null });
    this.partnerForm.get(field)?.markAsTouched();
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (this.showForm) {
      setTimeout(() => {
        document.getElementById('partner-form-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }

  initTrainerForm(): void {
    this.trainerForm = this.fb.group({
      name: ['', Validators.required],
      forename: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern('^[2579][0-9]{7}$')]],
      location: ['', Validators.required],
      partnerId: ['', Validators.required],
      motivationLetter: ['', Validators.required],
      cv: [null, Validators.required],
      picture: [null, Validators.required],
      yearsOfExperience: ['', [Validators.required, Validators.min(0), Validators.max(50), Validators.pattern('^[0-9]*$')]],
      technology: ['', Validators.required]
    }, { validators: this.trainerEmailDomainValidator() });
  }

  trainerEmailDomainValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const email = control.get('email')?.value;
      const partnerId = control.get('partnerId')?.value;

      if (email && partnerId) {
        const selectedPartner = this.acceptedPartners.find(p => p.id === partnerId);
        if (selectedPartner) {
          const orgName = selectedPartner.organizationName.toLowerCase().replace(/\s+/g, '');
          const emailDomain = email.split('@')[1]?.toLowerCase() || '';
          if (!emailDomain.includes(orgName)) {
            return { trainerEmailDomainMismatch: true };
          }
        }
      }
      return null;
    };
  }

  loadAcceptedPartners(): void {
    this.partnerService.getAllPartners(0, 100, 'ACCEPTED').subscribe({
      next: (response) => {
        this.acceptedPartners = response.content || [];
        console.log('Loaded partners:', this.acceptedPartners);
      },
      error: (err) => console.error('Failed to load partners', err)
    });
  }

  toggleTrainerForm(): void {
    this.showTrainerForm = !this.showTrainerForm;
    if (this.showTrainerForm) {
      setTimeout(() => {
        document.getElementById('trainer-form-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }

  onTrainerFileChange(event: any): void {
    const file = event.target.files[0];
    this.errorMessage = '';

    if (file) {
      if (file.type !== this.ALLOWED_FILE_TYPE) {
        this.errorMessage = 'Only PDF files are allowed for CV.';
        this.cvFile = null;
        this.trainerForm.patchValue({ cv: null });
        return;
      }

      if (file.size > this.MAX_FILE_SIZE) {
        this.errorMessage = 'File size exceeds 5MB limit.';
        this.cvFile = null;
        this.trainerForm.patchValue({ cv: null });
        return;
      }

      this.cvFile = file;
      this.trainerForm.patchValue({ cv: file });
      this.trainerForm.get('cv')?.updateValueAndValidity();
    }
  }

  onPictureChange(event: any): void {
    const file = event.target.files[0];
    this.errorMessage = '';

    if (file) {
      if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
        this.errorMessage = 'Only JPG and PNG images are allowed.';
        this.pictureFile = null;
        this.picturePreview = null;
        this.trainerForm.patchValue({ picture: null });
        return;
      }

      if (file.size > this.MAX_FILE_SIZE) {
        this.errorMessage = 'File size exceeds 5MB limit.';
        this.pictureFile = null;
        this.picturePreview = null;
        this.trainerForm.patchValue({ picture: null });
        return;
      }

      this.pictureFile = file;
      this.trainerForm.patchValue({ picture: file });
      this.trainerForm.get('picture')?.updateValueAndValidity();

      const reader = new FileReader();
      reader.onload = () => this.picturePreview = reader.result as string;
      reader.readAsDataURL(file);
    }
  }

  resetPicture(): void {
    this.pictureFile = null;
    this.picturePreview = null;
    this.trainerForm.patchValue({ picture: null });
    this.trainerForm.get('picture')?.markAsTouched();
  }

  onTrainerSubmit(): void {
    if (this.trainerForm.valid && this.cvFile && this.pictureFile) {
      this.isSubmitting = true;
      this.errorMessage = '';
      this.successMessage = '';

      const trainerData = { ...this.trainerForm.value };
      delete trainerData.cv;
      delete trainerData.picture;

      this.trainerService.createTrainer(trainerData, this.cvFile, this.pictureFile || undefined)
        .subscribe({
          next: (response) => {
            console.log('Trainer application submitted', response);
            this.successMessage = 'Your application has been submitted successfully!';
            this.isSubmitting = false;
            this.showSuccessPopup = true;
            this.successPopupTitle = 'Application Received!';
            this.successPopupMessage = 'Thank you for your interest in becoming a trainer. We will review your application and get back to you.';

            this.trainerForm.reset();
            this.cvFile = null;
            this.pictureFile = null;
            this.picturePreview = null;

            setTimeout(() => {
              this.showTrainerForm = false;
              this.successMessage = '';
            }, 5000);
          },
          error: (err) => {
            console.error('Error submitting trainer application', err);
            this.errorMessage = err.error?.message || 'An error occurred. Please try again.';
            this.isSubmitting = false;
          }
        });
    } else {
      this.markFormGroupTouched(this.trainerForm);
    }
  }

  onSubmit(): void {
    if (this.partnerForm.valid && this.businessFile && this.profileFile) {
      this.isSubmitting = true;
      this.errorMessage = '';
      this.successMessage = '';

      const partnerData = { ...this.partnerForm.value };
      delete partnerData.businessRegistration;
      delete partnerData.companyProfile;
      delete partnerData.logo;

      this.partnerService.createPartner(partnerData, this.businessFile, this.profileFile, this.logoFile || undefined)
        .subscribe({
          next: (response) => {
            console.log('Partner created successfully', response);
            this.successMessage = 'Your application has been submitted successfully! We will contact you soon.';
            this.isSubmitting = false;
            this.showSuccessPopup = true;
            this.successPopupTitle = 'Application Received!';
            this.successPopupMessage = 'Thank you for your interest in joining Formini. Your application has been submitted successfully. Our team will review your details and get back to you shortly.';
            this.partnerForm.reset();
            this.businessFile = null;
            this.profileFile = null;
            this.logoFile = null;
            this.logoPreview = null;
            // Scroll to the top of the form or success message
            document.getElementById('partner-form-section')?.scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => this.showForm = false, 5000);
          },
          error: (err) => {
            console.error('Error creating partner', err);
            this.errorMessage = err.error?.message || 'An error occurred while submitting your application. Please try again.';
            this.isSubmitting = false;
            document.getElementById('partner-form-section')?.scrollIntoView({ behavior: 'smooth' });
          }
        });
    } else {
      this.markFormGroupTouched(this.partnerForm);
      if (this.partnerForm.errors?.['domainMismatch']) {
        this.errorMessage = 'Website must contain the domain name from the business email.';
      }
    }
  }

  closePopup(): void {
    this.showSuccessPopup = false;
    this.showForm = false;
    this.showTrainerForm = false;
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }
}
