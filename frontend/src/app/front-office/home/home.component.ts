import { Component, OnInit } from '@angular/core';
import { PartnerService } from '../services/partner.service';
import { PartnerHiring, PartnerStatus } from '../models/partner.model';
import { TrainerService } from '../services/trainer.service';
import { TrainerHiring, TrainerStatus } from '../models/trainer.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  partners: PartnerHiring[] = [];
  trainers: TrainerHiring[] = [];
  isLoadingPartners = true;
  isLoadingTrainers = true;

  features = [
    {
      icon: '🎓',
      title: 'Certifications Professionnelles',
      description:
        'Obtenez des certifications reconnues par les entreprises pour booster votre carrière.',
    },
    {
      icon: '📚',
      title: 'Cours Spécialisés',
      description:
        "Accédez à des cours créés par des experts de l'industrie dans divers domaines.",
    },
    {
      icon: '🎯',
      title: 'Évaluations Rigoureuses',
      description:
        'Passez des examens et quiz conçus pour valider vos compétences réelles.',
    },
    {
      icon: '📈',
      title: 'Suivi de Progression',
      description:
        'Visualisez votre évolution et obtenez des recommandations personnalisées.',
    },
  ];

  certifications = [
    {
      title: 'Développement Full Stack',
      category: 'Technologie',
      duration: '6 mois',
      level: 'Avancé',
    },
    {
      title: 'Data Science & IA',
      category: 'Analyse de données',
      duration: '8 mois',
      level: 'Expert',
    },
    {
      title: 'Cybersécurité',
      category: 'Sécurité informatique',
      duration: '4 mois',
      level: 'Intermédiaire',
    },
    {
      title: 'Cloud Computing',
      category: 'Infrastructure',
      duration: '5 mois',
      level: 'Avancé',
    },
  ];

  stats = [
    { number: '10,000+', label: 'Certifications délivrées' },
    { number: '500+', label: 'Entreprises partenaires' },
    { number: '98%', label: 'Taux de satisfaction' },
    { number: '50+', label: 'Pays desservis' },
  ];

  constructor(
    private partnerService: PartnerService,
    private trainerService: TrainerService
  ) { }

  ngOnInit(): void {
    this.loadAcceptedPartners();
    this.loadAcceptedTrainers();
  }

  loadAcceptedPartners(): void {
    this.isLoadingPartners = true;
    this.partnerService.getAllPartners(0, 8, PartnerStatus.ACCEPTED).subscribe({
      next: (response: any) => {
        this.partners = response.content;
        this.isLoadingPartners = false;
      },
      error: (err) => {
        console.error('Error fetching partners for home:', err);
        this.isLoadingPartners = false;
      },
    });
  }

  getLogoUrl(partner: PartnerHiring): string {
    return this.partnerService.getDocumentUrl(partner.id!, 'LOGO');
  }

  loadAcceptedTrainers(): void {
    this.isLoadingTrainers = true;
    this.trainerService.getAllTrainers(0, 8, TrainerStatus.ACCEPTED).subscribe({
      next: (response: any) => {
        this.trainers = response.content;
        this.isLoadingTrainers = false;
      },
      error: (err) => {
        console.error('Error fetching trainers for home:', err);
        this.isLoadingTrainers = false;
      },
    });
  }

  getTrainerPictureUrl(trainer: TrainerHiring): string {
    return this.trainerService.getPictureUrl(trainer.id!);
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
