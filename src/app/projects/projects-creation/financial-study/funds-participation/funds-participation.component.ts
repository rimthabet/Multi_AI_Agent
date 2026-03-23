import { Component, DestroyRef, inject, input } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { FinancingSwitchComponent } from "../../../../tools/financing-switch/financing-switch.component";
import { ManagementService } from '../../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FundsParticipationFormComponent } from "./funds-participation-form/funds-participation-form.component";

@Component({
  selector: 'funds-participation',
 
  imports: [ClarityModule, CdsModule, FinancingSwitchComponent, FundsParticipationFormComponent],
  templateUrl: './funds-participation.component.html',
  styleUrl: './funds-participation.component.scss'
})
export class FundsParticipationComponent {
  // Input
  prospection = input<any>();

  // Injects
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);

  // Properties
  participations: any[] = [];
  valorisation_action: any | [];

  loading: boolean = false;

  selectedFinancement: any | undefined;
  totalCCA: number = 0;
  totalOCA: number = 0;
  totalActions: number = 0;
  valeurAction: number = 0;
  primeEmission: number = 0;

  // load participations
  loadParticipations(id: any) {
    this.loading = true;
    this.managementService
      .findParticipationFondsByFinancement(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.participations = data;

          this.totalCCA = 0;
          this.totalOCA = 0;
          this.totalActions = 0;

        data.forEach((p: any) => {
          this.totalActions += p.montantActions;
          this.totalOCA += p.montantOCA;
          this.totalCCA += p.montantCCA;
        });

      },
      complete: () => {
        this.loading = false;
      }
    })

  }

  // financementChanged
  financementChanged($event: any) {
    if ($event != '') {
      this.selectedFinancement = $event;
      this.managementService
        .findValorisationAction(this.selectedFinancement?.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.valorisation_action = data;
            this.valeurAction = data?.nominalApPart;
            this.primeEmission = data?.primeEmissionApPart;
          },
          complete: () => this.loadParticipations($event?.id),
        })

    }
  }

}
