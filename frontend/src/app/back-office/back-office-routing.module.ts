import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BackLayoutComponent } from './back-layout/back-layout.component';
import { StatisticsComponent } from './statistics/statistics.component';
import { ForumAdminComponent } from './forum/forum-admin.component';
import { ParticipantsAdminComponent } from './events/participants-admin.component';
import { LocationListComponent } from './SessionPlanning/location/location-list/location-list.component';
import { LocationFormComponent } from './SessionPlanning/location/location-form/location-form.component';
import { DashboardComponent } from './SessionPlanning/dashboard/dashboard.component';
import { AdminEvaluationComponent } from './evaluation/admin-evaluation/admin-evaluation.component';

const routes: Routes = [
  {
    path: '',
    component: BackLayoutComponent,
    children: [
      { path: '', component: StatisticsComponent, data: { title: 'Tableau de bord' } },
      { path: 'statistiques', component: StatisticsComponent, data: { title: 'Tableau de bord' } },
      { path: 'evaluations', component: AdminEvaluationComponent },
      { path: 'locations', component: LocationListComponent },
      { path: 'locations/new', component: LocationFormComponent },
      { path: 'locations/edit/:id', component: LocationFormComponent },
      { path: 'dashboardSession', component: DashboardComponent },
      { path: 'forum', component: ForumAdminComponent, data: { title: 'Gestion de Forum' } },
      { path: 'events/participants', component: ParticipantsAdminComponent, data: { title: 'Participants' } },
      {
        path: 'partners',
        loadComponent: () => import('./partners/partners.component').then(m => m.PartnersComponent),
        data: { title: 'Partners Management' },
      },
      {
        path: 'trainers',
        loadComponent: () => import('./trainers/trainers.component').then(m => m.TrainersComponent),
        data: { title: 'Trainers Management' },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BackOfficeRoutingModule { }
