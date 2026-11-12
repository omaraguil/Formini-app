import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EvaluationService } from '../../services/evaluation.service';

interface ExamQuestion {
  id: number;
  question: string;
  points: number;
}

interface Exam {
  id: number;
  title: string;
  duration: number;
  questions: ExamQuestion[];
}

interface StudentAnswer {
  questionId: number;
  answer: string;
}

type AccessStatus = 'WAITING' | 'AUTHORIZED' | 'EXPIRED' | 'LOADING';

@Component({
  selector: 'app-exam-taking',
  templateUrl: './exam-taking.component.html',
  styleUrl: './exam-taking.component.scss',
})
export class ExamTakingComponent implements OnInit, OnDestroy {
  // Données de l'examen
  exam: Exam | null = null;
  examId: string | null = null;
  currentIndex: number = 0;
  studentAnswers: StudentAnswer[] = [];

  // Timer Examen en cours
  remainingTime: number = 0;
  timerInterval: any;
  timePercentage: number = 100;

  // Gestion des accès et temps d'attente
  accessStatus: AccessStatus = 'LOADING';
  startTime: Date | null = null;
  timeUntilStart: number = 0; // en secondes
  waitingInterval: any;

  // Loading state
  isLoading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private evaluationService: EvaluationService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit() {
    this.examId = this.route.snapshot.paramMap.get('id');
    if (this.examId) {
      this.loadExam(this.examId);
    }
  }

  ngOnDestroy() {
    this.clearTimer();
    if (this.waitingInterval) clearInterval(this.waitingInterval);
  }

  loadExam(id: string) {
    this.isLoading = true;
    this.accessStatus = 'LOADING';

    this.evaluationService.getEvaluationById(id).subscribe({
      next: (data) => {
        const now = new Date();
        this.startTime = new Date(data.date);
        const endTime = new Date(
          this.startTime.getTime() + data.duration * 60000,
        );

        // 1. Cas : Trop tôt
        if (now < this.startTime) {
          this.accessStatus = 'WAITING';
          this.timeUntilStart = Math.floor(
            (this.startTime.getTime() - now.getTime()) / 1000,
          );
          this.startWaitingTimer();
          this.isLoading = false;
          return;
        }

        // 2. Cas : Trop tard
        if (now > endTime) {
          this.accessStatus = 'EXPIRED';
          this.isLoading = false;
          return;
        }

        // 3. Cas : Autorisé
        this.accessStatus = 'AUTHORIZED';
        this.exam = {
          id: data.id,
          title: data.title,
          duration: data.duration,
          questions: data.examQuestions || [],
        };

        if (this.exam && this.exam.questions.length > 0) {
          // Calcul du temps restant réel (si l'étudiant est en retard)
          const totalSessionSeconds = data.duration * 60;
          const secondsSinceStart = Math.floor(
            (now.getTime() - this.startTime.getTime()) / 1000,
          );
          this.remainingTime = totalSessionSeconds - secondsSinceStart;

          if (this.remainingTime <= 0) {
            this.accessStatus = 'EXPIRED';
            this.isLoading = false;
            return;
          }

          this.loadSavedAnswers();
          this.startTimer();
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur API:', err);
        this.isLoading = false;
        this.accessStatus = 'EXPIRED';
      },
    });
  }

  startWaitingTimer() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.waitingInterval) clearInterval(this.waitingInterval);

    this.waitingInterval = setInterval(() => {
      if (this.timeUntilStart > 0) {
        this.timeUntilStart--;
      } else {
        clearInterval(this.waitingInterval);
        this.loadExam(this.examId!); // On rafraîchit pour débloquer l'accès
      }
    }, 1000);
  }

  loadSavedAnswers() {
    if (isPlatformBrowser(this.platformId) && this.exam && this.examId) {
      const saved = localStorage.getItem(`exam_${this.examId}_answers`);
      if (saved) {
        this.studentAnswers = JSON.parse(saved);
      } else {
        this.studentAnswers = this.exam.questions.map((q) => ({
          questionId: q.id,
          answer: '',
        }));
      }
    }
  }

  saveAnswers() {
    if (isPlatformBrowser(this.platformId) && this.examId) {
      localStorage.setItem(
        `exam_${this.examId}_answers`,
        JSON.stringify(this.studentAnswers),
      );
    }
  }

  startTimer() {
    if (!isPlatformBrowser(this.platformId) || !this.exam) return;
    this.timerInterval = setInterval(() => {
      if (this.remainingTime > 0) {
        this.remainingTime--;
        this.timePercentage =
          (this.remainingTime / (this.exam!.duration * 60)) * 100;
      } else {
        this.submitExam();
      }
    }, 1000);
  }

  clearTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  getCurrentAnswer(): string {
    if (!this.exam) return '';
    const currentQuestion = this.exam.questions[this.currentIndex];
    return (
      this.studentAnswers.find((a) => a.questionId === currentQuestion.id)
        ?.answer || ''
    );
  }

  updateAnswer(event: Event) {
    if (!this.exam) return;
    const value = (event.target as HTMLTextAreaElement).value;
    const currentQuestion = this.exam.questions[this.currentIndex];
    const answerObj = this.studentAnswers.find(
      (a) => a.questionId === currentQuestion.id,
    );

    if (answerObj) {
      answerObj.answer = value;
      this.saveAnswers();
    }
  }

  isQuestionAnswered(questionId: number): boolean {
    const answer = this.studentAnswers.find((a) => a.questionId === questionId);
    return !!answer && answer.answer.trim().length > 0;
  }

  getAnsweredCount(): number {
    return this.studentAnswers.filter((a) => a.answer.trim().length > 0).length;
  }

  goToQuestion(index: number) {
    this.currentIndex = index;
  }

  previousQuestion() {
    if (this.currentIndex > 0) this.currentIndex--;
  }

  nextQuestion() {
    if (this.currentIndex < (this.exam?.questions.length || 0) - 1) {
      this.currentIndex++;
    } else {
      this.confirmSubmit();
    }
  }

  confirmSubmit() {
    if (
      isPlatformBrowser(this.platformId) &&
      window.confirm("Voulez-vous vraiment terminer l'examen ?")
    ) {
      this.submitExam();
    }
  }

  submitExam() {
    this.clearTimer();
    if (!this.examId || !this.exam) return;
    this.isLoading = true;

    const answersToSubmit = this.studentAnswers.map((ans) => ({
      learnerId: 1,
      answerOfLearner: ans.answer,
      question: { id: ans.questionId },
      responseDate: new Date().toISOString(),
    }));

    this.evaluationService.saveExamAnswers(answersToSubmit).subscribe({
      next: (response) => {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.removeItem(`exam_${this.examId}_answers`);
        }
        this.router.navigate(['/evaluation-result'], {
          state: { result: response },
        });
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Erreur lors de la soumission', err);
        alert("Une erreur est survenue lors de l'envoi.");
      },
    });
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  getTimerColor(): string {
    return this.timePercentage > 20 ? 'normal' : 'danger';
  }

  isLastQuestion(): boolean {
    return !!this.exam && this.currentIndex === this.exam.questions.length - 1;
  }
}
