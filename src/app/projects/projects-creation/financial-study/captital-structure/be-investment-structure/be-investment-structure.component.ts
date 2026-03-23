import { Component, DestroyRef, inject, input, output, effect, viewChild, computed } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { ShareholdersCreateFormComponent } from "../shareholders-create-form/shareholders-create-form.component";
import { PercentPipe } from '@angular/common';
import { KpiBadge01Component } from "../../../../../widgets/kpi-badge-01/kpi-badge-01.component";

@Component({
  selector: 'be-investment-structure',

  imports: [ClarityModule, CdsModule, DecimalPipe, ShareholdersCreateFormComponent, PercentPipe, KpiBadge01Component],
  templateUrl: './be-investment-structure.component.html',
  styleUrl: './be-investment-structure.component.scss'
})
export class BeInvestmentStructureComponent {


  /// INPUTS
  financement = input<any>();
  valeurAction = input<any>();
  actionnaires = input<any>();
  loading = input<boolean>(true);

  /// OUTPUTS
  refreshEvent = output<any>();

  /// VIEWCHILD
  shareholdersCreateForm = viewChild<ShareholdersCreateFormComponent>("shareholders_create_form");


  /// DEPENDENCIES
  private readonly toastr = inject(ToastrService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);


  /// PROPERTIES
  selectedActionnaire: any | undefined;
  transactions: any[] = [];
  actionnaires_av: any[] = [];

  capitalSocial = computed(() => this.financement()?.projet?.capitalSocial);
  capSocialRatio: number = 0;
  total_nombre_action: number = 0;
  total_actionnaires: number = 0;
  montant: number | undefined;

  opened: boolean = false;

  height: string | undefined;

  shareHoldersEffect = effect(() => {

    if (!Array.isArray(this.actionnaires())) {
      console.warn("actionnaires n'est pas un tableau!");
      this.actionnaires_av = [];
      return;
    }

    const clonedData = this.actionnaires().map((a: any) => ({ ...a }));

    this.actionnaires_av = this.managementService.buildActionnairesAvpList(
      clonedData,
      this.financement()
    );

    this.calcul();
  });


  /// ADD ACTIONNAIRE
  addActionnaire() {
    this.selectedActionnaire = undefined;
    this.shareholdersCreateForm()?.resetForm();
    this.opened = true;
  }


  /// SET ACTIONNAIRES
  // This method is called by parent component to trigger recalculation
  // The actual work is done by the shareHoldersEffect
  setActionnaires(data: any) {
    // Effect already handles the recalculation when signals change
    // This method exists for compatibility but the effect does the work
  }

  calcul() {

    this.total_actionnaires = this.actionnaires_av.filter(
      (obj: any, index: number) =>
        this.actionnaires_av.findIndex(
          (item: any) => item?.libelle === obj?.libelle
        ) === index
    ).length;
    this.total_nombre_action = this.actionnaires_av.reduce(
      (a: number, b: any) => a + b.nbrActionsAvAugmentation,
      0
    );
    this.capSocialRatio =
      (this.total_nombre_action * this.valeurAction()) / this.capitalSocial();
  }


  /// EDIT ACTIONNAIRE
  editActionnaire() {

  }

  /// SUPPRIMER ACTIONNAIRE
  supprimerActionnaire() {
    if (confirm('Vuillez confirmer cette suppression ?')) {
      if (this.selectedActionnaire.id) {
        this.managementService
          .deleteActionnaire(this.selectedActionnaire.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.toastr.success('Actionnaire supprimée avec Succès!');
              this.refreshEvent.emit({});
            },
            error: () => {
              this.toastr.error('Erreur de suppression!', 'Actionnaire non supprimée!');
            }
          })

      }
    }
  }
}
