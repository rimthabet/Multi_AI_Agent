import { Component, DestroyRef, inject, input, output, viewChild, effect, model } from '@angular/core';
import { ShareholdersCreateFormComponent } from '../shareholders-create-form/shareholders-create-form.component';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { DecimalPipe } from '@angular/common';
import { PercentPipe } from '@angular/common';
import { CurrencyPipe } from '@angular/common';
import { KpiBadge01Component } from "../../../../../widgets/kpi-badge-01/kpi-badge-01.component";

@Component({
  selector: 'af-investment-structure',
  imports: [ClarityModule, CdsModule, DecimalPipe, ShareholdersCreateFormComponent, PercentPipe, CurrencyPipe, KpiBadge01Component],
  templateUrl: './af-investment-structure.component.html',
  styleUrl: './af-investment-structure.component.scss'
})
export class AfInvestmentStructureComponent {

  /// INPUTS
  financement = input<any>();
  valeurAction = input<any>();
  actionnaires = model<any[]>([]);
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
  transactions: any[] = [];
  actionnaires_ap: any[] = [];

  totalNombreAction: number = 0;
  totalNombreApAction: number = 0;

  totalActionnaires: number = 0;
  totalApAugmentation: number = 0;
  totalAvAugmentation: number = 0;

  height: string | undefined;
  opened: boolean = false;

  shareHoldersEffect = effect(() => {

    if (!Array.isArray(this.actionnaires())) {
      console.warn("actionnaires n'est pas un tableau");
      this.actionnaires_ap = [];
      return;
    }

    const clonedData = this.actionnaires().map((a: any) => ({ ...a }));
    this.setActionnaires(clonedData);

  });

  /// SET ACTIONNAIRES
  setActionnaires(data: any) {

    let acts_index = new Map(
      data?.map((act: any) => {
        return [
          act.actionnaire.libelle,
          {
            id: null,
            isFund: false,
            offFundRaiser: false,
            fundRaisings: 0,
            libelle: act.actionnaire.libelle,
            nbrActionsAvAugmentation: 0,
            nbrActionsApAugmentation: 0,
            montantAvAugmentation: 0,
            montantApAugmentation: 0,
            financement: undefined,
          },
        ];
      })
    );

    let oldShareHolders = data.filter(
      (a: any) => {

        const d1 = a.actionnaire.financement.dateDemandeFinancement;
        const d2 = this.financement()?.dateDemandeFinancement;

        console.log('d1', d1);
        console.log('d2', d2);
        return d1 < d2;
      }
    );

    console.log('oldShareHolders', oldShareHolders);


    oldShareHolders.forEach((a: any) => {

      let refAct: any = acts_index.get(a.actionnaire.libelle);
      if (
        a.actionnaire.isFund &&
        a.actionnaire.financement.financementActions > 0
      )
        refAct.fundRaisings++;

      refAct.id = a.actionnaire.id;
      refAct.isFund = a.actionnaire.isFund;
      refAct.financement = a.actionnaire.financement;
      refAct.offFundRaiser = a.actionnaire.offFundRaiser;

      let transactions = a.transactions?.filter(
        (tr: any) => {

          const d1 = tr.financement.dateDemandeFinancement;
          const d2 = this.financement()?.dateDemandeFinancement

          return d1 < d2;
        }

      );

      console.log('transactions', transactions);

      if (transactions.length > 0) {
        refAct.nbrActionsAvAugmentation = transactions[0].nbrActions;
      } else {
        refAct.nbrActionsAvAugmentation +=
          a.actionnaire.nbrActionsApAugmentation +
          a.actionnaire.nbrActionsAvAugmentation;
      }
    });

    console.log('oldShareHolders 2', oldShareHolders);

    let currentShareHolders = data.filter(
      (a: any) => {

        const d1 = a.actionnaire.financement.dateDemandeFinancement;
        const d2 = this.financement()?.dateDemandeFinancement;

        return d1 == d2 && !a.actionnaire.offFundRaiser
      }
    );

    console.log('currentShareHolders', currentShareHolders);

    currentShareHolders.forEach((a: any) => {
      let refAct: any = acts_index.get(a.actionnaire.libelle);
      if (a.actionnaire.isFund) refAct.fundRaisings++;

      refAct.id = a.actionnaire.id;
      refAct.isFund = a.actionnaire.isFund;
      refAct.financement = a.actionnaire.financement;

      refAct.nbrActionsApAugmentation += a.actionnaire.nbrActionsApAugmentation;
      refAct.nbrActionsAvAugmentation += a.actionnaire.nbrActionsAvAugmentation;
    });

    console.log('currentShareHolders 2', currentShareHolders);

    this.actionnaires_ap = Array.from(acts_index.values())
      .sort((a: any, b: any) => {
        if (a.offFundRaiser) return 1;
        if (a.isFund) return -1;
        if (b.isFund) return 1;
        if (a.libelle > b.libelle) return 1;
        if (a.libelle < b.libelle) return -1;
        return 0;
      })
      .filter(
        (a: any) => a.nbrActionsAvAugmentation + a.nbrActionsApAugmentation > 0
      );

    this.calcul();
  }


  /// ADD ACTIONNAIRE
  addActionnaire(actionnaire?: any) {
    this.shareholdersCreateForm()?.resetForm(); // réinitialiser le formulaire
    if (actionnaire) {
      let act = { ...actionnaire };
      act.id = null; // si tu veux forcer un id "nouveau"
      act.offFundRaiser = false;
      act.nbrActionsAvAugmentation = 0;
      act.montantAvAugmentation = console.log('sending to form:', act);


      this.shareholdersCreateForm()?.setActionnaire(act);
    }
    this.opened = true; // ouvrir la modale ou le formulaire
  }

  /// EDIT ACTIONNAIRE
  editActionnaire(actionnaire: any) {
    this.shareholdersCreateForm()?.setActionnaire(actionnaire);
    this.opened = true;
  }

  /// CALCUL
  calcul() {
    this.totalActionnaires = this.actionnaires_ap.filter(
      (obj: any, index: number) =>
        this.actionnaires_ap.findIndex(
          (item: any) => item?.libelle === obj?.libelle
        ) === index
    ).length;

    this.totalAvAugmentation = this.actionnaires_ap?.reduce(
      (a: number, b: any) => a + b.nbrActionsAvAugmentation,
      0
    );
    this.totalApAugmentation = this.actionnaires_ap?.reduce(
      (a: number, b: any) => a + b.nbrActionsApAugmentation,
      0
    );
    this.totalNombreAction =
      this.totalAvAugmentation + this.totalApAugmentation;
  }

  /// SUPPRIMER ACTIONNAIRE
  supprimerActionnaire(actionnaire?: any) {
    if (confirm('Veuillez confirmer cette suppression ?')) {
      if (actionnaire.id) {
        this.managementService
          .deleteActionnaire(actionnaire.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.toastr.success('Actionnaire supprimé avec Succès!');
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
