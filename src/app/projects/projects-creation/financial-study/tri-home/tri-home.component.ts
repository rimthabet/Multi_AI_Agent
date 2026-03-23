import { Component, DestroyRef, inject, input } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { FinancingSwitchComponent } from "../../../../tools/financing-switch/financing-switch.component";
import { ManagementService } from '../../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { InternalRateOfReturnComponent } from "./internal-rate-of-return/internal-rate-of-return.component";

@Component({
  selector: 'tri-home',
  imports: [ClarityModule, CdsModule, FinancingSwitchComponent, DatePipe, InternalRateOfReturnComponent],
  templateUrl: './tri-home.component.html',
  styleUrl: './tri-home.component.scss'
})
export class TriHomeComponent {

  prospection = input<any>();

  // ===== DEPENDENCIES =====
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);

  selectedFinancement: any | undefined;
  loading: boolean = false;
  valorisation_action: any | undefined;
  participations: any[] = [];
  selectedTab: number = 0;

  // Load valorisation
  loadValorisation() {
    // We need to have the stock value
    this.managementService
      .findValorisationAction(this.selectedFinancement?.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.valorisation_action = data;
        },
        error: (error) => {
          console.error(error);
        }
      })
  }

  // Load funds participations
  loadFundsParticipations() {
    // Loading per-fund participation
    this.managementService
      .findStructureCapitalByFinancementV0(this.selectedFinancement?.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.participations = [];

          data.forEach((record: any) => {
            let participation = {
              fonds: record.f,
              montantCCA: 0,
              montantOCA: 0,
              montantActions: 0,
              actions: record?.actions,
              participations: data?.participations,
              part: record?.part,
            };
            record.participations.forEach((p: any) => {
              participation.montantActions += p.montantActions;
              participation.montantOCA += p.montantOCA;
              participation.montantCCA += p.montantCCA;
            });
            this.participations.push(participation);
          });
        },
        error: (error) => {
          console.error(error);
        }
      })
  }


  // Financement Changed
  financementChanged($event: any) {
    this.selectedFinancement = $event;
    this.loadValorisation();
    this.loadFundsParticipations();
  }

  // Find fund participation
  findFundParticipation(fund: any) {
    return this.participations?.filter((p: any) => p.fonds.id == fund.id)[0];
  }
}
