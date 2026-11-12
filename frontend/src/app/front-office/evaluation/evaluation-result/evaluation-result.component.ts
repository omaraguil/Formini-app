import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-evaluation-result',
  templateUrl: './evaluation-result.component.html',
  styleUrl: './evaluation-result.component.scss',
})
export class EvaluationResultComponent implements OnInit {
  result: any;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.result = window.history.state?.result;
      if (!this.result) {
        this.router.navigate(['/dashboard']);
      }
    }
  }

  getCirclePercentage(): number {
    return (this.result.scoreObtained / this.result.totalPossiblePoints) * 100;
  }

  getCircleColor(): string {
    return this.result.Passed ? 'var(--success)' : 'var(--danger)';
  }

  generateCertificate() {
    console.log('Génération du certificat pour :', this.result.learnerName);
    alert('Félicitations ! Votre certificat est en cours de génération...');
  }
}
