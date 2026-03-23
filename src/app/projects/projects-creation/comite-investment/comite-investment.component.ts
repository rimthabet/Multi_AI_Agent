import { Component, DestroyRef, effect, inject, input, viewChildren } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { Router } from '@angular/router';
import { ManagementService } from '../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FinancingSwitchComponent } from "../../../tools/financing-switch/financing-switch.component";
import { FundsComiteInvestmentComponent } from "./funds-comite-investment/funds-comite-investment.component";

@Component({
  selector: 'comite-investment',
  imports: [ClarityModule, CdsModule, FinancingSwitchComponent, FundsComiteInvestmentComponent],
  templateUrl: './comite-investment.component.html',
  styleUrl: './comite-investment.component.scss'
})
export class ComiteInvestmentComponent {
  // Inputs
  prospection = input<any>();

  creationForms = viewChildren<FundsComiteInvestmentComponent>("creationForm");

  // injects
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly router = inject(Router);

  //PROPERTIES
  financement: any | undefined;
  selectedFonds: any | undefined;

  participations: any[] = [];
  loading: boolean = false;
  totalCCA: number = 0;
  totalOCA: number = 0;
  totalActions: number = 0;

  // FONDS  
  selectFonds(fonds: any) {
    this.selectedFonds = fonds;
  }

  // FINANCEMENT CHANGED
  financementChanged($event: any) {
    if (!$event) {
      this.financement = undefined;
      return;
    }
    this.financement = $event;
    this.selectedFonds = this.financement.fonds[0];
    this.loadParticipations($event?.id);
  }

  // FINANCEMENT EFFECT
  readonly financementEffect = effect(() => {
    if (this.financement) {
      this.selectedFonds = this.financement.fonds[0];
      this.loadParticipations(this.financement?.id);
    }
  });

  // LOAD PARTICIPATIONS
  loadParticipations(id: any) {
    this.loading = true;

    this.managementService
      .findParticipationFondsByFinancement(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.participations = data;
          this.participations.forEach((p: any) => {
            this.creationForms()?.forEach(
              (cf: FundsComiteInvestmentComponent) => {
                if (p.fonds.id === cf.fonds()?.id) cf.setParticipation(p);
              }
            );
          });
        },
        error: (error: any) => {
          console.error(error);
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        }
      })
  }

  // GO TO FICHE
  goToFiche() {
    this.router.navigateByUrl('/dashboard/project/' + this.prospection()?.id);
  }
}