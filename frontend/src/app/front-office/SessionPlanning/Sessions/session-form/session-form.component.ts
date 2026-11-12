import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService } from '../../services/session.service';
import { UserService } from '../../../services/user.service';
import { LocationService } from '../../services/location.service';
import { Session, SessionStatus } from '../../models/session';
import { Location } from '../../models/location';

@Component({
  selector: 'app-session-form',
  templateUrl: './session-form.component.html',
  styleUrls: ['./session-form.component.scss'],
  providers: [UserService]
})
export class SessionFormComponent implements OnInit {
  sessionForm!: FormGroup;
  isEditMode: boolean = false;
  sessionId: number | null = null;
  isSubmitting: boolean = false;
  statusMessage: string = '';
  statusType: 'success' | 'error' | 'warning' = 'success';
  
  // Course and trainer
  courseId: number = 1; // À remplacer par un sélecteur de cours
  trainerId: string | null = null; // Récupéré depuis JWT
  
  // Availability checks
  checkingAvailability: boolean = false;
  isTrainerAvailable: boolean = true;
  hasConflict: boolean = false;
  isOverloaded: boolean = false;
  
  // Locations for conflict check
  locations: Location[] = [];

  constructor(
    private fb: FormBuilder,
    private sessionService: SessionService,
    private authService: UserService,
    private locationService: LocationService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadLocations();
    this.checkEditMode();
    this.getTrainerId();
  }

  initForm(): void {
    this.sessionForm = this.fb.group({
      status: ['PLANNED', Validators.required],
      maxParticipants: ['', [Validators.required, Validators.min(1)]],
      date: [new Date().toISOString().split('T')[0]], // Date pour les vérifications
      locationId: [null], // Pour vérifier les conflits
      planning: this.fb.group({
        room: [''],
        startDate: [''],
        endDate: ['']
      }),
      attendance: this.fb.group({
        registeredCount: [0, [Validators.min(0)]],
        attendedCount: [0, [Validators.min(0)]]
      })
    });

    // Watch for changes to check availability
    this.sessionForm.get('date')?.valueChanges.subscribe(() => {
      if (!this.isEditMode) {
        this.checkTrainerAvailability();
        this.checkTrainerOverload();
      }
    });

    this.sessionForm.get('locationId')?.valueChanges.subscribe(() => {
      if (!this.isEditMode) {
        this.checkSchedulingConflict();
      }
    });

    // Custom validator for dates
    this.sessionForm.get('planning')?.valueChanges.subscribe(() => {
      this.validateDates();
    });
  }

  getTrainerId(): void {
    this.trainerId = this.authService.getUser()?.id || null;
    console.log('Trainer ID from JWT:', this.trainerId);
  }

  loadLocations(): void {
    this.locationService.getAllLocations().subscribe({
      next: (data) => {
        this.locations = data;
      },
      error: (err) => console.error('Error loading locations:', err)
    });
  }

  checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.sessionId = +id;
      this.loadSessionData(this.sessionId);
    }
  }

  loadSessionData(id: number): void {
    this.sessionService.getSessionById(id).subscribe({
      next: (session) => {
        this.sessionForm.patchValue({
          status: session.status,
          maxParticipants: session.maxParticipants,
          date: session.createdAt ? new Date(session.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      
        });
      },
      error: (error) => {
        this.showStatus('Erreur lors du chargement de la session', 'error');
        console.error('Error loading session:', error);
      }
    });
  }

  checkTrainerAvailability(): void {
    const date = this.sessionForm.get('date')?.value;
    
    if (!date || !this.trainerId || this.isEditMode) {
      this.isTrainerAvailable = true;
      return;
    }
    
    this.checkingAvailability = true;
    
    this.sessionService.checkTrainerAvailability(this.trainerId, date).subscribe({
      next: (available) => {
        this.isTrainerAvailable = available;
        this.checkingAvailability = false;
        
        if (!available) {
          this.showStatus('Le formateur n\'est pas disponible à cette date', 'warning');
        }
      },
      error: (err) => {
        console.error('Error checking availability:', err);
        this.checkingAvailability = false;
      }
    });
  }

  checkSchedulingConflict(): void {
    const date = this.sessionForm.get('date')?.value;
    const locationId = this.sessionForm.get('locationId')?.value;
    
    if (!date || !locationId || !this.trainerId || this.isEditMode) {
      this.hasConflict = false;
      return;
    }
    
    this.sessionService.checkSchedulingConflict(this.trainerId, locationId, date).subscribe({
      next: (conflict) => {
        this.hasConflict = conflict;
        if (conflict) {
          this.showStatus('Conflit de planning détecté pour ce lieu', 'warning');
        }
      },
      error: (err) => console.error('Error checking conflict:', err)
    });
  }

  checkTrainerOverload(): void {
    const date = this.sessionForm.get('date')?.value;
    
    if (!date || !this.trainerId || this.isEditMode) {
      this.isOverloaded = false;
      return;
    }
    
    this.sessionService.checkTrainerOverload(this.trainerId, date).subscribe({
      next: (overloaded) => {
        this.isOverloaded = overloaded;
        if (overloaded) {
          this.showStatus('Le formateur serait surchargé à cette date', 'warning');
        }
      },
      error: (err) => console.error('Error checking overload:', err)
    });
  }

  validateDates(): void {
    const planning = this.sessionForm.get('planning');
    const startDate = planning?.get('startDate')?.value;
    const endDate = planning?.get('endDate')?.value;

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      planning?.setErrors({ dateRange: true });
    } else {
      planning?.setErrors(null);
    }
  }

  get planningErrors(): string | null {
    const planning = this.sessionForm.get('planning');
    if (planning?.hasError('dateRange')) {
      return 'La date de fin doit être postérieure à la date de début';
    }
    return null;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'PLANNED': 'status-planned',
      'IN_PROGRESS': 'status-progress',
      'COMPLETED': 'status-completed',
      'CANCELLED': 'status-cancelled'
    };
    return classes[status] || '';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'PLANNED': 'Planifiée',
      'IN_PROGRESS': 'En cours',
      'COMPLETED': 'Terminée',
      'CANCELLED': 'Annulée'
    };
    return labels[status] || status;
  }

  calculateAttendanceRate(): number {
    const registered = this.sessionForm.get('attendance')?.get('registeredCount')?.value || 0;
    const attended = this.sessionForm.get('attendance')?.get('attendedCount')?.value || 0;
    
    if (registered === 0) return 0;
    return Math.round((attended / registered) * 100);
  }

  // Cancel session (pour les sessions existantes)
  cancelSession(): void {
    if (!this.sessionId) return;
    
    if (confirm('Êtes-vous sûr de vouloir annuler cette session ?')) {
      this.sessionService.cancelSession(this.sessionId).subscribe({
        next: () => {
          this.showStatus('Session annulée avec succès', 'success');
          setTimeout(() => this.router.navigate(['/sessions']), 1500);
        },
        error: (err) => {
          this.showStatus('Erreur lors de l\'annulation', 'error');
          console.error('Error cancelling session:', err);
        }
      });
    }
  }

  onSubmit(): void {
    if (this.sessionForm.invalid) {
      this.markFormGroupTouched(this.sessionForm);
      this.showStatus('Veuillez corriger les erreurs dans le formulaire', 'error');
      return;
    }

    // Final checks before submission (only for new sessions)
    if (!this.isEditMode) {
      if (!this.isTrainerAvailable) {
        this.showStatus('Le formateur n\'est pas disponible à cette date', 'error');
        return;
      }
      
      if (this.hasConflict) {
        this.showStatus('Conflit de planning détecté', 'error');
        return;
      }
      
      if (this.isOverloaded) {
        this.showStatus('Le formateur serait surchargé', 'error');
        return;
      }
    }

    this.isSubmitting = true;
    const sessionData = this.sessionForm.value;
    
    // Add course and trainer info
    sessionData.courseId = this.courseId;
    if (!this.isEditMode && this.trainerId) {
      sessionData.trainerId = this.trainerId; // Sera utilisé par le backend via JWT
    }

    if (this.isEditMode && this.sessionId) {
      this.sessionService.updateSession(this.sessionId, sessionData).subscribe({
        next: () => {
          this.showStatus('Session mise à jour avec succès', 'success');
          setTimeout(() => this.router.navigate(['/sessions']), 1500);
        },
        error: (error) => {
          this.showStatus('Erreur lors de la mise à jour de la session', 'error');
          console.error('Error updating session:', error);
          this.isSubmitting = false;
        }
      });
    } else {
      this.sessionService.createSession(sessionData).subscribe({
        next: () => {
          this.showStatus('Session créée avec succès', 'success');
          setTimeout(() => this.router.navigate(['/sessions']), 1500);
        },
        error: (error) => {
          this.showStatus('Erreur lors de la création de la session', 'error');
          console.error('Error creating session:', error);
          this.isSubmitting = false;
        }
      });
    }
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  showStatus(message: string, type: 'success' | 'error' | 'warning'): void {
    this.statusMessage = message;
    this.statusType = type;
    
    if (type === 'success') {
      setTimeout(() => {
        this.statusMessage = '';
      }, 3000);
    }
  }

  // Ajoutez ces méthodes dans votre session-form.component.ts

getAvailabilityTooltip(): string {
  if (this.checkingAvailability) return 'Vérification en cours...';
  if (!this.isTrainerAvailable) return 'Formateur non disponible';
  if (this.hasConflict) return 'Conflit de planning détecté';
  if (this.isOverloaded) return 'Formateur surchargé';
  return 'Formateur disponible';
}

getAvailabilityStatusText(): string {
  if (this.checkingAvailability) return 'Vérification...';
  if (!this.isTrainerAvailable) return 'Non disponible';
  if (this.hasConflict) return 'Conflit détecté';
  if (this.isOverloaded) return 'Surcharge';
  return 'Disponible ✓';
}

getLocationName(locationId: number): string {
  const location = this.locations.find(l => l.id === locationId);
  return location ? location.name : 'Lieu sélectionné';
}
}