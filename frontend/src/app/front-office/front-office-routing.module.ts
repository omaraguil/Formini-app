import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FrontLayoutComponent } from './front-layout/front-layout.component';
import { HomeComponent } from './home/home.component';
import { AboutComponent } from './about/about.component';
import { EvaluationConfigComponent } from './evaluation/evaluation-config/evaluation-config.component';
import { ExamCreateComponent } from './evaluation/exam-create/exam-create.component';
import { QuizCreateComponent } from './evaluation/quiz-create/quiz-create.component';
import { EvaluationDashboardComponent } from './evaluation/evaluation-dashboard/evaluation-dashboard.component';
import { ExamTakingComponent } from './evaluation/exam-taking/exam-taking.component';
import { SessionFormComponent } from './SessionPlanning/Sessions/session-form/session-form.component';
import { SessionListComponent } from './SessionPlanning/Sessions/session-list/session-list.component';
import { PlanningFormComponent } from './SessionPlanning/Planning/planning-form/planning-form.component';
import { LearnerCourseListComponent } from './learner/learner-course-list/learner-course-list.component';
import { TrainerCourseListComponent } from './course/trainer-course-list/trainer-course-list.component';
import { PlanningListComponent } from './SessionPlanning/Planning/planning-list/planning-list.component';
import { PlanningDetailsComponent } from './SessionPlanning/Planning/planning-details/planning-details.component';
import { SessionDetailsComponent } from './SessionPlanning/Sessions/session-details/session-details.component';
import { QuizTakingComponent } from './evaluation/quiz-taking/quiz-taking.component';
import { EvaluationResultComponent } from './evaluation/evaluation-result/evaluation-result.component';

const routes: Routes = [
  {
    path: '',
    component: FrontLayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'about', component: AboutComponent },
      { path: 'evaluation', component: EvaluationConfigComponent },
      { path: 'evaluation/edit/:id', component: EvaluationConfigComponent },
      { path: 'exam/create', component: ExamCreateComponent },
      { path: 'exam/edit/:id', component: ExamCreateComponent },
      { path: 'quiz/create', component: QuizCreateComponent },
      { path: 'quiz/edit/:id', component: QuizCreateComponent },
      { path: 'dashboard', component: EvaluationDashboardComponent },
      { path: 'examPlayer/:id', component: ExamTakingComponent },
      { path: 'quizPlayer/:id', component: QuizTakingComponent },
      { path: 'evaluation-result', component: EvaluationResultComponent },

      { path: 'sessions', component: SessionListComponent },

      { path: 'sessions/new', component: SessionFormComponent },
      { path: 'sessions/edit/:id', component: SessionFormComponent },
      { path: 'sessions/:id', component: SessionDetailsComponent },
      {path: 'courses', component: LearnerCourseListComponent },
      {path: 'TrianerCourses', component: TrainerCourseListComponent },
      {path: 'planning', component: PlanningListComponent },
      { path: 'plannings/:id', component: PlanningDetailsComponent },
      { path: 'planning/add', component: PlanningFormComponent },
      { path: 'plannings/edit/:id', component: PlanningFormComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FrontOfficeRoutingModule {}
