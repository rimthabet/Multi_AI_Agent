import { Component, DestroyRef, inject, input, OnInit, output } from '@angular/core';
import { CdsModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { CurrencyPipe } from '@angular/common';
import { DatePipe } from '@angular/common';
import { KpiBadge01Component } from "../../../../../widgets/kpi-badge-01/kpi-badge-01.component";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../../../services/management.service';
import { effect } from '@angular/core';

@Component({
  selector: 'app-financing-plan',
  imports: [ClarityModule, CdsModule, CurrencyPipe, DatePipe, KpiBadge01Component],
  templateUrl: './financing-plan.component.html',
  styleUrl: './financing-plan.component.scss'
})
export class FinancingPlanComponent implements OnInit {
  // inputs
  financingPlan = input<any>();
  // outputs
  editEvent = output<any>();
  deleteEvent = output<any>();

  // injects
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly toastr = inject(ToastrService);

  ///INITIALIZE
  ngOnInit(): void {
    this.total_actif = this.financingPlan()?.montant;
    this.total_investi_actions = this.financingPlan()?.financementActions;
    this.total_investi_oca = this.financingPlan()?.financementOCA;
    this.total_investi_cca = this.financingPlan()?.financementCCA;
  }

  total_actif: any = 0;
  total_investi_actions: any = 0;
  total_investi_oca: any = 0;
  total_investi_cca: any = 0;

  // EFFECT
  totalInvestiEffect = effect(() => {
    this.total_actif = this.financingPlan()?.montant;
    this.total_investi_actions = this.financingPlan()?.financementActions;
    this.total_investi_oca = this.financingPlan()?.financementOCA;
    this.total_investi_cca = this.financingPlan()?.financementCCA;
  });

  // EDIT FINANCEMENT
  editFinancement() {
    this.editEvent.emit(this.financingPlan());
  }

  // DELETE FINANCEMENT
  deleteFinancement() {
    if (confirm('Veuillez confirmer cette suppression !')) {
      this.managementService
        .deleteFinancement(
          this.financingPlan()?.id
        )
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.toastr.success('', 'Financement supprimé avec succès!');
            this.deleteEvent.emit(this.financingPlan())
          },
          error: (data: any) => {
            this.toastr.error(
              "Veuillez vérifier que le plan n'est référencé par aucune entité ci-dessous \n  \
                Comité d'investissement | \
                Structure de capital | \
                Valorisation action | \
                Souscription action au niveau investissement | \
                Souscription CCA au niveau investissement | \
                Souscription OCA au niveau investissement | \
                Règlement CCA A au niveau investissement | \
                Actionnaire | \
                Convertion CCA | \
                Convertion OCA | \
                Comité interne | \
                Comité d'investissement | \
                Participation de fonds | \
                Document de financement | \
                Schéma d'investissement et financement",
              'Echec de suppression du plan de financement'
            );
          },
        })
    }
  }

}
