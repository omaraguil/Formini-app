import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EvaluationService } from '../../services/evaluation.service';

export enum EvaluationType {
  QUIZ = 'QUIZ',
  EXAM = 'EXAM',
}

export interface EvaluationConfig {
  id?: string;
  title: string;
  duration: number;
  date: Date;
  type: EvaluationType;
  minSuccessScore: number;
  createdAt?: Date;
}

@Component({
  selector: 'app-evaluation-dashboard',
  templateUrl: './evaluation-dashboard.component.html',
  styleUrl: './evaluation-dashboard.component.scss',
})
export class EvaluationDashboardComponent implements OnInit {
  evaluations: EvaluationConfig[] = [];
  filteredEvaluations: EvaluationConfig[] = [];
  searchTerm: string = '';
  selectedType: string = 'all';
  activeMenuId: string | null = null;

  // Pour l'affichage de l'enum dans le template
  EvaluationType = EvaluationType;

  constructor(
    private router: Router,
    private evaluationService: EvaluationService
  ) { }

  ngOnInit() {
    this.evaluationService.clear();
    this.loadEvaluations();
  }

  // Créez une interface locale pour gérer l'édition
  editingDateId: string | null = null;

  // Méthode pour activer l'édition
  startEditingDate(evaluationId: string) {
    this.editingDateId = evaluationId;
  }

  // Méthode pour sauvegarder
  saveNewDate(evaluation: EvaluationConfig) {
    const dateStr = evaluation.date.toString();

    this.evaluationService.updateDate(evaluation.id!, dateStr).subscribe({
      next: () => {
        this.activeMenuId = null;
        evaluation.date = new Date(dateStr);
      },
      error: (err) => alert('Erreur lors de la mise à jour'),
    });
  }

  loadEvaluations() {
    this.evaluationService.getEvaluationsByTrainer().subscribe({
      next: (data) => {
        this.evaluations = data.map((e: any) => ({
          ...e,
          type: e.typeAssessment as EvaluationType,
        }));
        this.applyFilter();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des évaluations', err);
      },
    });
  }

  applyFilter() {
    let filtered = [...this.evaluations];
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter((e) => e.title.toLowerCase().includes(term));
    }
    if (this.selectedType !== 'all') {
      filtered = filtered.filter(
        (e) => e.type && e.type.toString() === this.selectedType
      );
    }
    this.filteredEvaluations = filtered;
  }

  toggleMenu(evaluationId: string, event: MouseEvent) {
    event.stopPropagation();
    this.activeMenuId =
      this.activeMenuId === evaluationId ? null : evaluationId;
  }

  closeMenu() {
    this.activeMenuId = null;
  }

  viewEvaluation(evaluation: EvaluationConfig) {
    const basePath =
      evaluation.type === EvaluationType.QUIZ ? '/quizPlayer' : '/examPlayer';
    this.router.navigate([basePath, evaluation.id]);
    this.closeMenu();
  }

  editEvaluation(evaluation: EvaluationConfig) {
    this.evaluationService.setEvaluation(evaluation, evaluation.id);
    this.router.navigate(['/evaluation/edit', evaluation.id]);
    this.closeMenu();
  }

  deleteEvaluation(evaluation: EvaluationConfig) {
    const confirmDelete = window.confirm(
      `Êtes-vous sûr de vouloir supprimer l'évaluation "${evaluation.title}" ainsi que toutes ses questions ?`
    );
    if (confirmDelete && evaluation.id) {
      this.evaluationService.deleteEvaluation(evaluation.id).subscribe({
        next: () => {
          this.evaluations = this.evaluations.filter(
            (e) => e.id !== evaluation.id
          );
          this.applyFilter();
          this.closeMenu();
          console.log('Suppression réussie');
        },
        error: (err) => {
          console.error('Erreur lors de la suppression:', err);
          alert('Erreur serveur : Impossible de supprimer l évaluation.');
        },
      });
    }
  }

  createNewEvaluation() {
    this.router.navigate(['/evaluation']);
  }

  formatDate(date: any): string {
    if (!date) return 'Non défini';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  getFileIcon(type: EvaluationType): string {
    return type === EvaluationType.QUIZ ? '📋' : '📄';
  }

  getTypeLabel(type: EvaluationType): string {
    return type === EvaluationType.QUIZ ? 'Quiz' : 'Examen';
  }

  getTypeColor(type: EvaluationType): string {
    return type === EvaluationType.QUIZ ? '#8b5cf6' : '#3b82f6';
  }

  viewStats(evaluation: any) {
    this.activeMenuId = null; // Ferme le menu
    this.router.navigate(['/evaluations/stats', evaluation.id]);
  }
}
