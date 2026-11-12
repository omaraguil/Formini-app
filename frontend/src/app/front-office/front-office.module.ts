import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { FrontOfficeRoutingModule } from './front-office-routing.module';
import { FrontLayoutComponent } from './front-layout/front-layout.component';
import { HomeComponent } from './home/home.component';
import { AboutComponent } from './about/about.component';
import { FooterComponent } from './footer/footer.component';
import { NavbarComponent } from './navbar/navbar.component';
import { EvaluationConfigComponent } from './evaluation/evaluation-config/evaluation-config.component';
import { ExamCreateComponent } from './evaluation/exam-create/exam-create.component';
import { QuizCreateComponent } from './evaluation/quiz-create/quiz-create.component';
import { EvaluationDashboardComponent } from './evaluation/evaluation-dashboard/evaluation-dashboard.component';
import { ExamTakingComponent } from './evaluation/exam-taking/exam-taking.component';
import { SessionFormComponent } from './SessionPlanning/Sessions/session-form/session-form.component';

import { TrainerCourseCreateComponent } from './course/trainer-course-create/trainer-course-create.component';
import { TrainerCourseListComponent } from './course/trainer-course-list/trainer-course-list.component';
import { LearnerCourseDetailComponent } from './learner/learner-course-detail/learner-course-detail.component';
import { LearnerCourseListComponent } from './learner/learner-course-list/learner-course-list.component';
import { LearnerEnrollmentComponent } from './learner/learner-enrollment/learner-enrollment.component';
import { SafePipe } from './learner/learner-enrollment/safe.pipe';
import { FormationComponent } from './learner/formation/formation.component';
import { SafeUrlPipe } from './learner/formation/safe-url.pipe';
import { SessionListComponent } from './SessionPlanning/Sessions/session-list/session-list.component';
import { PlanningFormComponent } from './SessionPlanning/Planning/planning-form/planning-form.component';
import { PlanningListComponent } from './SessionPlanning/Planning/planning-list/planning-list.component';
import { PlanningDetailsComponent } from './SessionPlanning/Planning/planning-details/planning-details.component';
import { SessionDetailsComponent } from './SessionPlanning/Sessions/session-details/session-details.component';
import { QuizTakingComponent } from './evaluation/quiz-taking/quiz-taking.component';
import { EvaluationResultComponent } from './evaluation/evaluation-result/evaluation-result.component';

@NgModule({
  declarations: [
    FrontLayoutComponent,
    HomeComponent,
    AboutComponent,
    FooterComponent,
    NavbarComponent,
    EvaluationConfigComponent,
    ExamCreateComponent,
    QuizCreateComponent,
    QuizTakingComponent,

    EvaluationDashboardComponent,
    ExamTakingComponent,
    SessionFormComponent,

    TrainerCourseCreateComponent,
    TrainerCourseListComponent,
    LearnerCourseListComponent,
    LearnerCourseDetailComponent,
    LearnerEnrollmentComponent,
    SafePipe,
    FormationComponent,
    SafeUrlPipe,
    SessionListComponent,
    PlanningFormComponent,
    PlanningListComponent,
    PlanningDetailsComponent,
    SessionDetailsComponent,
    EvaluationResultComponent,
  ],
  imports: [
    FormsModule,
    CommonModule,
    FrontOfficeRoutingModule,
    ReactiveFormsModule,
  ],
})
export class FrontOfficeModule {}
