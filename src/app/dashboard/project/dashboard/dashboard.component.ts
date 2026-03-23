import { Component, DestroyRef, inject, input, OnInit, output, effect, viewChild } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { ManagementService } from '../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProjectDetailsComponent } from './project-details/project-details.component';
import { ProjectPromotorsComponent } from "./project-promotors/project-promotors.component";
import { ProjectFinancingComponent } from "./project-financing/project-financing.component";
import { InvestedProjectComponent } from "./invested-project/invested-project.component";
import { ProjectTrackingMilestonesComponent } from "./project-tracking-milestones/project-tracking-milestones.component";
import { BarChart04Component } from "../../../widgets/bar-chart-04/bar-chart-04.component";
import { BarChart05Component } from "../../../widgets/bar-chart-05/bar-chart-05.component";
import { BarChart06Component } from "../../../widgets/bar-chart-06/bar-chart-06.component";
import { ProjectGeolocationComponent } from "../../project-geolocation/project-geolocation.component";

@Component({
  selector: 'dashboard',
  imports: [ClarityModule, CdsModule, ProjectDetailsComponent, ProjectPromotorsComponent, ProjectFinancingComponent, InvestedProjectComponent, ProjectTrackingMilestonesComponent, BarChart04Component, BarChart05Component, BarChart06Component, ProjectGeolocationComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  // inputs
  projet = input<any>();

  souscriptions = input<any>();

  // outputs
  financementsChange = output<any>();

  // projetInvestiComponent = viewChild.required<InvestedProjectComponent>("projetInvestiComponent");
  // projetTrackingChartComponent = viewChild.required<BarChart04Component>("projetTrackingChartComponent");
  // trackingBarChartComponent = viewChild.required<BarChart05Component>("trackingBarChartComponent");

  // DEPENDENCIES
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);

  // PROPERTIES
  financements: any[] = [];

  // LIFECYCLE
  ngOnInit(): void {
    this.loadFinancement(this.projet());
  }

  // EFFECTS
  readonly projetEffect = effect(() => {
    if (this.projet() && this.souscriptions()) {
      this.loadFinancement(this.projet());
      // this.projetInvestiComponent()?.setData(this.souscriptions());
      // this.projetTrackingChartComponent()?.setData(this.souscriptions());
      // this.trackingBarChartComponent()?.setData(this.souscriptions());
    }
  });

  // FINANCEMENT
  loadFinancement(data: any) {
    this.managementService
      .findFinancementByProjectId(data?.projet.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          data?.reverse();
          this.financements = data;
          this.financementsChange.emit(this.financements);
        },
        error: (error: any) => {
          console.error(error);
        }
      })
  }

  refreshData(data: any) {
    // this.projetInvestiComponent()?.setData(data);
    // this.projetTrackingChartComponent()?.setData(data);
    // this.trackingBarChartComponent()?.setData(data);
  }

}
