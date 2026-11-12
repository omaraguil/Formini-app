import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PlanningService } from '../../services/planning.service';
import { LocationService } from '../../services/location.service';
import { Planning, PlanningMode, PlanningModeLabels, PlanningModeIcons, PlanningModeDescriptions } from '../../models/planning';
import { Location, LocationType, LocationTypeLabels, LocationTypeIcons, LocationTypeColors } from '../../models/location';

@Component({
  selector: 'app-planning-form',
  templateUrl: './planning-form.component.html',
  styleUrls: ['./planning-form.component.scss']
})
export class PlanningFormComponent implements OnInit {
  @Input() sessionId?: number;
  
  planningForm!: FormGroup;
  isEditMode: boolean = false;
  planningId: number | null = null;
  isSubmitting: boolean = false;
  statusMessage: string = '';
  statusType: 'success' | 'error' = 'success';
  loading: boolean = false;
  
  // Locations
  locations: Location[] = [];
  filteredLocations: Location[] = [];
  selectedLocation: Location | null = null;
  locationsLoading: boolean = false;
  
  // URL for online/hybrid
  platformUrl: string = '';
  
  // Propriétés pour l'affichage conditionnel
  showLocation: boolean = false;
  
  // Constantes
  planningModes = [
    { 
      value: PlanningMode.ONSITE, 
      label: PlanningModeLabels[PlanningMode.ONSITE], 
      icon: PlanningModeIcons[PlanningMode.ONSITE],
      description: PlanningModeDescriptions[PlanningMode.ONSITE]
    },
    { 
      value: PlanningMode.ONLINE, 
      label: PlanningModeLabels[PlanningMode.ONLINE], 
      icon: PlanningModeIcons[PlanningMode.ONLINE],
      description: PlanningModeDescriptions[PlanningMode.ONLINE]
    },
    { 
      value: PlanningMode.HYBRID, 
      label: PlanningModeLabels[PlanningMode.HYBRID], 
      icon: PlanningModeIcons[PlanningMode.HYBRID],
      description: PlanningModeDescriptions[PlanningMode.HYBRID]
    }
  ];

  locationTypes = [
    { value: LocationType.ROOM, label: LocationTypeLabels[LocationType.ROOM], icon: LocationTypeIcons[LocationType.ROOM] },
    { value: LocationType.BUILDING, label: LocationTypeLabels[LocationType.BUILDING], icon: LocationTypeIcons[LocationType.BUILDING] },
    { value: LocationType.CAMPUS, label: LocationTypeLabels[LocationType.CAMPUS], icon: LocationTypeIcons[LocationType.CAMPUS] },
    { value: LocationType.ONLINE, label: LocationTypeLabels[LocationType.ONLINE], icon: LocationTypeIcons[LocationType.ONLINE] }
  ];

  constructor(
    private fb: FormBuilder,
    private planningService: PlanningService,
    private locationService: LocationService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    console.log('PlanningFormComponent constructor');
  }

  ngOnInit(): void {
    console.log('PlanningFormComponent ngOnInit');
    
    // Récupérer les queryParams (pour le mode création)
    this.route.queryParams.subscribe(params => {
      console.log('Query params:', params);
      if (params['sessionId']) {
        this.sessionId = +params['sessionId'];
        console.log('Session ID from query params:', this.sessionId);
      }
    });

    // Récupérer les params de route (pour le mode édition)
    this.route.params.subscribe(params => {
      console.log('Route params:', params);
      if (params['id']) {
        this.isEditMode = true;
        this.planningId = +params['id'];
        console.log('Planning ID from route params:', this.planningId);
      }
    });

    this.initForm();
    this.loadLocations();
    
    // Si on est en mode édition, charger les données
    if (this.isEditMode && this.planningId) {
      this.loadPlanningData(this.planningId);
    } else if (this.sessionId) {
      // Mode création avec sessionId
      console.log('Setting sessionId in form:', this.sessionId);
      this.planningForm.patchValue({ sessionId: this.sessionId });
    }

    // Observer les changements de mode
    this.planningForm.get('mode')?.valueChanges.subscribe(mode => {
      this.showLocation = true;
      this.updateFormControls(mode);
      
      if (mode === PlanningMode.ONSITE || mode === PlanningMode.HYBRID) {
        this.filterLocationsByType();
      } else {
        this.clearSelectedLocation();
      }
    });

    // Initialiser selon le mode actuel
    const currentMode = this.planningForm.get('mode')?.value;
    if (currentMode) {
      this.showLocation = true;
      this.updateFormControls(currentMode);
    }
  }

  initForm(): void {
    this.planningForm = this.fb.group({
      mode: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      totalHours: ['', [Validators.required, Validators.min(1)]],
      sessionId: [this.sessionId || null]
    });

    this.planningForm.get('startDate')?.valueChanges.subscribe(() => this.validateDates());
    this.planningForm.get('endDate')?.valueChanges.subscribe(() => this.validateDates());
  }

  updateFormControls(mode: string): void {
    // Remove existing controls
    if (this.planningForm.contains('locationId')) {
      this.planningForm.removeControl('locationId');
    }
    if (this.planningForm.contains('platformUrl')) {
      this.planningForm.removeControl('platformUrl');
    }

    // Add controls based on mode
    switch (mode) {
      case PlanningMode.ONSITE:
        this.planningForm.addControl('locationId', new FormControl(null, Validators.required));
        break;
        
      case PlanningMode.ONLINE:
        this.planningForm.addControl('platformUrl', new FormControl('', [
          Validators.required,
          Validators.pattern('^(http|https)://.*$')
        ]));
        this.selectedLocation = null;
        break;
        
      case PlanningMode.HYBRID:
        this.planningForm.addControl('locationId', new FormControl(null, Validators.required));
        this.planningForm.addControl('platformUrl', new FormControl('', [
          Validators.required,
          Validators.pattern('^(http|https)://.*$')
        ]));
        break;
    }
  }

  // Getter pour le contrôle platformUrl
  get platformUrlControl(): FormControl | null {
    return this.planningForm.get('platformUrl') as FormControl;
  }

  // Getter pour le contrôle locationId
  get locationIdControl(): FormControl | null {
    return this.planningForm.get('locationId') as FormControl;
  }

  // Mode checks
  get isOnsiteMode(): boolean {
    return this.planningForm.get('mode')?.value === PlanningMode.ONSITE;
  }

  get isOnlineMode(): boolean {
    return this.planningForm.get('mode')?.value === PlanningMode.ONLINE;
  }

  get isHybridMode(): boolean {
    return this.planningForm.get('mode')?.value === PlanningMode.HYBRID;
  }

  // Section titles and descriptions
  getLocationSectionTitle(): string {
    if (this.isOnlineMode) return 'Platform URL';
    if (this.isHybridMode) return 'Location & Platform';
    return 'Training Location';
  }

  getLocationSectionDescription(): string {
    if (this.isOnlineMode) return 'Enter the platform URL for online training';
    if (this.isHybridMode) return 'Select a physical location and enter the online platform URL';
    return 'Select a physical location for on-site training';
  }

  loadLocations(): void {
    this.locationsLoading = true;
    this.locationService.getAllLocations().subscribe({
      next: (data) => {
        this.locations = data;
        this.filterLocationsByType();
        this.locationsLoading = false;
      },
      error: (error) => {
        console.error('Error loading locations:', error);
        this.showStatus('Failed to load locations', 'error');
        this.locationsLoading = false;
      }
    });
  }

  filterLocationsByType(): void {
    const currentMode = this.planningForm.get('mode')?.value;
    
    if (!currentMode || currentMode === PlanningMode.ONLINE) {
      this.filteredLocations = [];
      return;
    }
    
    this.filteredLocations = this.locations;
  }

  selectLocation(location: Location): void {
    this.selectedLocation = location;
    this.planningForm.patchValue({ locationId: location.id });
    console.log('Location selected:', location.name, 'ID:', location.id);
  }

  clearSelectedLocation(): void {
    this.selectedLocation = null;
    this.planningForm.patchValue({ locationId: null });
  }

  createNewLocation(): void {
    this.router.navigate(['/locations/new'], { 
      queryParams: { returnUrl: this.router.url }
    });
  }

  // Méthodes pour les couleurs et icônes des locations
  getLocationTypeColor(type: LocationType): string {
    return LocationTypeColors[type] || '#6366f1';
  }

  getLocationTypeIcon(type: LocationType): string {
    return LocationTypeIcons[type] || '📍';
  }

  getLocationTypeLabel(type: LocationType): string {
    return LocationTypeLabels[type] || type;
  }

  validateDates(): void {
    const start = this.planningForm.get('startDate')?.value;
    const end = this.planningForm.get('endDate')?.value;
    
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      if (startDate > endDate) {
        this.planningForm.setErrors({ dateRange: true });
      } else {
        this.planningForm.setErrors(null);
      }
    }
  }

  get dateError(): string | null {
    if (this.planningForm.hasError('dateRange')) {
      return 'End date must be after start date';
    }
    return null;
  }

  checkEditMode(): void {
    // Cette méthode n'est plus nécessaire car nous gérons l'édition dans ngOnInit
    // Gardée pour compatibilité mais vide
  }

  loadPlanningData(id: number): void {
    this.loading = true;
    console.log('Loading planning data for ID:', id);
    
    this.planningService.getPlanningById(id).subscribe({
      next: (planning) => {
        console.log('Planning data loaded:', planning);
        
        // Patch basic info
        this.planningForm.patchValue({
          mode: planning.mode,
          startDate: planning.startDate,
          endDate: planning.endDate,
          totalHours: planning.totalHours,
          sessionId: planning.sessionId  // ← Le sessionId vient des données du planning
        });

        // Update form controls based on mode
        this.updateFormControls(planning.mode);

        // Handle location and URL based on mode
        if (planning.mode === PlanningMode.ONSITE && planning.location) {
          this.selectedLocation = planning.location;
          this.planningForm.patchValue({ locationId: planning.location.id });
        } 
        else if (planning.mode === PlanningMode.ONLINE) {
          const platformUrl = (planning as any).platformUrl || '';
          this.planningForm.patchValue({ platformUrl });
        }
        else if (planning.mode === PlanningMode.HYBRID) {
          if (planning.location) {
            this.selectedLocation = planning.location;
            this.planningForm.patchValue({ locationId: planning.location.id });
          }
          const platformUrl = (planning as any).platformUrl || '';
          this.planningForm.patchValue({ platformUrl });
        }
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading planning:', error);
        this.showStatus('Error loading planning', 'error');
        this.loading = false;
      }
    });
  }

  getModeDescription(mode: string): string {
    return PlanningModeDescriptions[mode as PlanningMode] || '';
  }

  getModeLabel(mode: string): string {
    return PlanningModeLabels[mode as PlanningMode] || mode;
  }

  hasAnyData(): boolean {
    const mode = this.planningForm.get('mode')?.value;
    
    if (mode === PlanningMode.ONSITE) {
      return !!(this.planningForm.get('mode')?.value ||
                this.planningForm.get('startDate')?.value ||
                this.planningForm.get('endDate')?.value ||
                this.planningForm.get('totalHours')?.value ||
                this.selectedLocation);
    } 
    else if (mode === PlanningMode.ONLINE) {
      return !!(this.planningForm.get('mode')?.value ||
                this.planningForm.get('startDate')?.value ||
                this.planningForm.get('endDate')?.value ||
                this.planningForm.get('totalHours')?.value ||
                this.planningForm.get('platformUrl')?.value);
    }
    else if (mode === PlanningMode.HYBRID) {
      return !!(this.planningForm.get('mode')?.value ||
                this.planningForm.get('startDate')?.value ||
                this.planningForm.get('endDate')?.value ||
                this.planningForm.get('totalHours')?.value ||
                this.selectedLocation ||
                this.planningForm.get('platformUrl')?.value);
    }
    
    return false;
  }

  onSubmit(): void {
    if (this.planningForm.invalid) {
      this.showStatus('Please fix the errors in the form', 'error');
      return;
    }

    const mode = this.planningForm.get('mode')?.value;
    
    // Validation spécifique selon le mode
    if ((mode === PlanningMode.ONSITE || mode === PlanningMode.HYBRID) && !this.selectedLocation) {
      this.showStatus('Please select a location', 'error');
      return;
    }

    this.isSubmitting = true;
    
    // Prepare data for API
    const formValue = this.planningForm.value;
    const planningData: any = {
      mode: formValue.mode,
      startDate: formValue.startDate,
      endDate: formValue.endDate,
      totalHours: formValue.totalHours
    };

    // Add platformUrl for ONLINE and HYBRID modes
    if (mode === PlanningMode.ONLINE || mode === PlanningMode.HYBRID) {
      planningData.platformUrl = formValue.platformUrl;
    }

    // Récupérer l'ID de la location sélectionnée
    const locationId = this.selectedLocation?.id;

    if (this.isEditMode && this.planningId) {
      // MODE ÉDITION - Le sessionId vient des données du planning déjà chargé (formValue.sessionId)
      const sessionId = formValue.sessionId;
      
     

      console.log('Editing planning:', {
        planningId: this.planningId,
        planningData,
        sessionId,
        locationId,
        mode,
        selectedLocation: this.selectedLocation
      });

      this.planningService.updatePlanning(this.planningId, planningData).subscribe({
        next: () => {
          this.showStatus('Planning updated successfully', 'success');
          setTimeout(() => this.goBack(), 1500);
        },
        error: (error) => {
          this.showStatus('Error updating planning', 'error');
          console.error('Error updating planning:', error);
          this.isSubmitting = false;
        }
      });
    } else {
      // MODE CRÉATION - Le sessionId vient des queryParams ou de l'input
      const sessionId = this.sessionId || formValue.sessionId;
      
      if (!sessionId) {
        this.showStatus('Session ID is required', 'error');
        this.isSubmitting = false;
        return;
      }

      console.log('Creating planning:', {
        planningData,
        sessionId,
        locationId,
        mode,
        selectedLocation: this.selectedLocation
      });

      this.planningService.createPlanning(planningData, sessionId, locationId).subscribe({
        next: () => {
          this.showStatus('Planning created successfully', 'success');
          setTimeout(() => this.goBack(), 1500);
        },
        error: (error) => {
          this.showStatus('Error creating planning', 'error');
          console.error('Error creating planning:', error);
          this.isSubmitting = false;
        }
      });
    }
  }

  showStatus(message: string, type: 'success' | 'error'): void {
    this.statusMessage = message;
    this.statusType = type;
    
    if (type === 'success') {
      setTimeout(() => {
        this.statusMessage = '';
      }, 3000);
    }
  }

  goBack(): void {
    if (this.sessionId) {
      this.router.navigate(['/sessions', this.sessionId]);
    } else if (this.planningForm.value.sessionId) {
      this.router.navigate(['/sessions', this.planningForm.value.sessionId]);
    } else {
      this.router.navigate(['/sessions']);
    }
  }
}