import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { BackOfficeRoutingModule } from './back-office-routing.module';
import { BackLayoutComponent } from './back-layout/back-layout.component';
import { SideBarComponent } from './side-bar/side-bar.component';
import { StatisticsComponent } from './statistics/statistics.component';
import { LocationListComponent } from './SessionPlanning/location/location-list/location-list.component';
import { LocationFormComponent } from './SessionPlanning/location/location-form/location-form.component';
import { DashboardComponent } from './SessionPlanning/dashboard/dashboard.component';
import { AdminEvaluationComponent } from './evaluation/admin-evaluation/admin-evaluation.component';

@NgModule({
  declarations: [
    BackLayoutComponent,
    StatisticsComponent,
    LocationListComponent,
    LocationFormComponent,
    DashboardComponent,
    AdminEvaluationComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BackOfficeRoutingModule,
    SideBarComponent,
  ],
})
export class BackOfficeModule { }
