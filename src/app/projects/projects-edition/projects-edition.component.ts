import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { FinancialStudyComponent } from "../projects-creation/financial-study/financial-study.component";
import { PreselectionComponent } from "../projects-creation/preselection/preselection.component";
import { ProspectionComponent } from "../projects-creation/prospection/prospection.component";
import { ActivatedRoute, Router } from '@angular/router';
import { ManagementService } from '../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastrService } from 'ngx-toastr';
import { ComiteInterneComponent } from "../projects-creation/comite-interne/comite-interne.component";
import { ComiteInvestmentComponent } from "../projects-creation/comite-investment/comite-investment.component";

@Component({
  selector: 'app-projects-edition',
  imports: [
    ClarityModule,
    CdsModule,
    FinancialStudyComponent,
    PreselectionComponent,
    ProspectionComponent,
    ComiteInterneComponent,
    ComiteInvestmentComponent
  ],
  templateUrl: './projects-edition.component.html',
  styleUrl: './projects-edition.component.scss'
})
export class ProjectsEditionComponent implements OnInit {

  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly managementService = inject(ManagementService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastr = inject(ToastrService);
  private readonly router = inject(Router);

  selectedProjet: any | undefined = null;
  financements: any | undefined = null;
  loadingData: boolean = true;



  ngOnInit(): void {
    let id = this.activatedRoute.snapshot.paramMap.get('id');
    this.loadProjet(Number(id));
  }

  loadProjet(id: number): void {
    this.loadingData = true;

    this.managementService.findProjetById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (projetData: any) => {
          this.selectedProjet = projetData.projet;
          this.financements = projetData.financements;

          sessionStorage.setItem('LastVisitedProject', String(projetData.projet?.id));
        },
        complete: () => this.loadingData = false,
        error: () => {
          this.toastr.error('', 'Erreur de chargement des données!');
          this.loadingData = false;
        }
      });
  }

  // Navigate to fiche
  goToFiche(): void {
    const p = this.selectedProjet;
    if (p?.id) {
      this.router.navigateByUrl('/dashboard/projects/' + p.id);
    }
  }
}
