import { Component, DestroyRef, inject, input, model, signal, viewChild } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { FinancingSwitchComponent } from "../../../../tools/financing-switch/financing-switch.component";
import { ManagementService } from '../../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HorizontalScrollerComponent } from "../../../../widgets/horizontal-scroller/horizontal-scroller.component";
import { NgxGaugeModule } from 'ngx-gauge';
import { Gauge01Component } from "../../../../widgets/gauge-01/gauge-01.component";
import { BeInvestmentStructureComponent } from "./be-investment-structure/be-investment-structure.component";
import { AfInvestmentStructureComponent } from "./af-investment-structure/af-investment-structure.component";
import { NonFundraisingStructureComponent } from "../../../projects-study/capital-structure/non-fundraising-structure/non-fundraising-structure.component";

@Component({
  selector: 'captital-structure',

  imports: [ClarityModule, CdsModule, FinancingSwitchComponent, HorizontalScrollerComponent, NgxGaugeModule, Gauge01Component, BeInvestmentStructureComponent, AfInvestmentStructureComponent, NonFundraisingStructureComponent],
  templateUrl: './captital-structure.component.html',
  styleUrl: './captital-structure.component.scss'
})
export class CaptitalStructureComponent {

  // Inputs
  prospection = input<any>();
  financement = model<any>(undefined);

  // View Child
  be_investment_structure = viewChild<BeInvestmentStructureComponent>("be_investment_structure");
  af_investment_structure = viewChild<AfInvestmentStructureComponent>("af_investment_structure");
  non_fundraising_structure = viewChild<NonFundraisingStructureComponent>("non_fundraising_structure");

  // Injects
  protected readonly destroyRef = inject(DestroyRef);
  protected readonly managementService = inject(ManagementService);


  // Declarations
  participations: any | [];
  valorisationActionAp: any | [];
  valorisationActionAv: any | [];

  valeurAction: number = 0;

  fonds_actionnaires: any[] = [];

  actionnaires: any[] = [];
  actionnaires_hl: any[] = [];
  transactions: any[] = [];

  totalActions: number = 0;

  loading = true;

  // Load Actionnaires
  loadActionnaires() {

    this.loading = true;
    this.managementService
      .findActionnairesByFinancement(this.financement()?.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {

          this.actionnaires = data;
          this.be_investment_structure()?.setActionnaires(data);
          this.af_investment_structure()?.setActionnaires(data);
          this.non_fundraising_structure()?.setActionnaires(data);

          this.actionnaires_hl = this.parseHLShareHolders(data);
          this.fonds_actionnaires = this.actionnaires_hl.filter(
            (actionnaire: any) => actionnaire.isFund
          );
          this.totalActions = this.actionnaires_hl?.reduce(
            (a: number, b: any) => a + b?.nbrActionsApAugmentation,
            0
          );
        },
        complete: () => (this.loading = false),
      })

  }

  // Parse Share Holders
  parseHLShareHolders(data: any) {
    if (!Array.isArray(data)) {
      console.warn('parseHLShareHolders: data is not an array', data);
      return [];
    }

    const acts_index = new Map(
      data.map((act: any) => {
        return [
          act.actionnaire.libelle,
          {
            id: null,
            isFund: false,
            offFundRaiser: false,
            fundRaisings: 0,
            libelle: act.actionnaire.libelle,
            nbrActionsApAugmentation: 0,
            montantApAugmentation: 0,
            nbreActions: 0,
            financement: undefined,
            transactions: [],
          },
        ];
      })
    );

    const act_actions_index: Map<string, number> = new Map();

    data.forEach((a: any) => {
      let refAct: any = acts_index.get(a.actionnaire.libelle);
      if (
        a.actionnaire.isFund &&
        a.actionnaire.financement.financementActions > 0
      )
        refAct.fundRaisings++;

      refAct.isFund = a.actionnaire.isFund;
      refAct.id = a.actionnaire.id;
      refAct.financement = a.actionnaire.financement;
      refAct.offFundRaiser = a.actionnaire.offFundRaiser;

      let transactions = a.transactions?.filter(
        (tr: any) =>
          tr.financement.dateDemandeFinancement <=
          this.financement().dateDemandeFinancement
      );

      if (transactions?.length > 0) {
        if (
          transactions[0].financement.dateDemandeFinancement >=
          a.actionnaire.financement.dateDemandeFinancement
        ) {
          refAct.nbrActionsApAugmentation = transactions[0].nbrActions;
          refAct.montantApAugmentation =
            transactions[0].nbrActions * this.valeurAction;

          if (a.actionnaire.isFund) {
            act_actions_index.set(a.actionnaire.id, transactions[0].nbrActions);
          }
        } else if (
          a.actionnaire.isFund &&
          act_actions_index.get(a.actionnaire.id)
        ) {
          refAct.nbrActionsApAugmentation =
            act_actions_index.get(a.actionnaire.id)! +
            a.actionnaire.nbrActionsApAugmentation;
          refAct.montantApAugmentation =
            act_actions_index.get(a.actionnaire.id)! * this.valeurAction;
        } else {
          refAct.nbrActionsApAugmentation =
            a.actionnaire.nbrActionsApAugmentation;
          refAct.montantApAugmentation =
            refAct.nbrActionsApAugmentation * this.valeurAction;
        }

        refAct.transactions = transactions;
      } else {
        refAct.nbrActionsApAugmentation +=
          a.actionnaire.nbrActionsApAugmentation +
          a.actionnaire.nbrActionsAvAugmentation;
        refAct.montantApAugmentation +=
          a.actionnaire.montantApAugmentation +
          a.actionnaire.montantAvAugmentation;
      }
    });

    let actionnaires = Array.from(acts_index.values()).sort(
      (a: any, b: any) => {
        if (a.offFundRaiser) return 1;
        if (a.isFund) return -1;
        if (b.isFund) return 1;
        if (a.libelle > b.libelle) return 1;
        if (a.libelle < b.libelle) return -1;
        return 0;
      }
    );

    return actionnaires;
  }

  // Get Ratio
  getRatio(n: number, m: number) {
    return Math?.round((n / m) * 100)?.toLocaleString('fr');
  }

  // Format
  format(n: number) {
    return n?.toLocaleString('fr', { minimumFractionDigits: 2 });
  }

  formatInt(n?: number): string {
    return n?.toLocaleString('fr', { maximumFractionDigits: 0 }) ?? '0';
  }

  // Financement Changed
  financementChanged($event: any) {
    if ($event != '') {
      this.financement.set($event);
      this.managementService
        .findValorisationAction(this.financement()?.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.valorisationActionAp = data?.nominalApPart;
            this.valorisationActionAv = data?.valeurActionAvPart;
          },
          error: (error: any) => console.log('Error ', error),
        })

      this.managementService
        .loadNominal(this.financement()?.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.valeurAction = data?.nominal;
          },
          error: (error: any) => console.log('Error ', error),
        })

      // this.loadNominals();
      this.loadActionnaires();
    }
  }

}
