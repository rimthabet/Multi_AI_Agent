import { Component, DestroyRef, inject, OnInit, viewChild } from '@angular/core';
import { CdsModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ManagementService } from '../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProspectionCreateFormComponent } from './prospection/prospection-create-form/prospection-create-form.component';
import { ProspectionComponent } from "./prospection/prospection.component";
import { PreselectionComponent } from "./preselection/preselection.component";
import { FinancialStudyComponent } from "./financial-study/financial-study.component";
import { ComiteInterneComponent } from "./comite-interne/comite-interne.component";
import { ComiteInvestmentComponent } from "./comite-investment/comite-investment.component";
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-creation-project',
  imports: [ClarityModule, CdsModule, ProspectionComponent, PreselectionComponent, FinancialStudyComponent, ComiteInterneComponent, ComiteInvestmentComponent],
  templateUrl: './projects-creation.component.html',
  styleUrl: './projects-creation.component.scss'
})
export class ProjectsCreationComponent implements OnInit {

  prospectionForm = viewChild.required<ProspectionCreateFormComponent>("prospection_form");

  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);

  prospection: any | undefined;

  ngOnInit(): void {
    this.loadProject();

    setInterval(() => console.log("Prospection", this.prospection), 1000)
  }


  // load project
  loadProject() {
    this.managementService.findProjetById(407).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.prospection = data;
        },
        error: (error: any) => {
          this.toastr.error('Erreur de chargement!', 'Projet non chargé!');
        },
        complete: () => {
          console.log('Project loaded');
        }
      });
  }

  // project saved
  projectSaved($event: any) {
    this.prospection = $event;
  }

  // Navigate to fiche
  goToFiche(): void {
    const p = this.prospection;
    if (p?.id) {
      this.router.navigateByUrl('/dashboard/projects/' + p.id);
    }
  }
}
