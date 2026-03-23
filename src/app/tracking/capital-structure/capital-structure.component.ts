import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, viewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { FinancingSwitchComponent } from '../../tools/financing-switch/financing-switch.component';
import { NonFundraisingStructureComponent } from '../../projects/projects-study/capital-structure/non-fundraising-structure/non-fundraising-structure.component';

@Component({
  selector: 'capital-structure',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule,
    FinancingSwitchComponent,
    NonFundraisingStructureComponent
  ],
  templateUrl: './capital-structure.component.html',
  styleUrl: './capital-structure.component.scss'
})
export class CapitalStructureComponent implements OnInit {

  switch = viewChild<FinancingSwitchComponent>("switch");
  shl = viewChild<NonFundraisingStructureComponent>("shl");

  private readonly managementService = inject(ManagementService);
  private readonly toastr = inject(ToastrService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  projets: any[] | undefined;
  financement: any | undefined;
  selectedProjet: any | undefined;

  participations: any | [];
  valorisationAction: any | [];
  valeurAction: number = 0;

  fonds_actionnaires: any[] = [];
  actionnaires: any[] = [];
  actionnaires_hl: any[] = [];
  transactions: any[] = [];

  totalActions: number = 0;
  loading = true;


  ngOnInit(): void {
    this.loadProject();
  }


  // Load the project
  loadProject() {
    this.managementService.findProjets(5).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        data.sort((p1: any, p2: any) =>
          p1.nom > p2.nom ? 1 : p1.nom < p2.nom ? -1 : 0
        );
        this.projets = data;

        let lastSelectedProject = sessionStorage.getItem('LastVisitedProject');
        if (lastSelectedProject) {
          lastSelectedProject = this.projets?.filter(
            (p: any) => lastSelectedProject == p.id
          )[0];
          this.selectedProjet = lastSelectedProject;
        } else this.selectedProjet = data[0];
      },
      error: () => {
        this.toastr.error('Erreur de chargement!', 'Projets non chargés!');
      },
      complete: () => {
        this.loading = false;
      }
    })
  }


  // Set the projet switch form value
  setProjet(p: any) {
    this.selectedProjet = p;
    sessionStorage.setItem('LastVisitedProject', p.id);
    this.loadActionnaires();
  }

  // Load the nominals
  loadNominals() {
    this.managementService.loadNominals(this.financement?.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => this.shl()?.setNominals(data),
      error: (data: any) => console.log('Error ', data),
      complete: () => {
        this.loading = false;
      }
    })

  }

  // Financement changed
  financementChanged($event: any) {
    if ($event !== '') {
      this.financement = $event;

      this.managementService
        .findValorisationAction(this.financement?.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.valorisationAction = data?.nominalApPart;
          },
          error: () => {
            this.toastr.error('Erreur de chargement!', 'Valorisation non chargée!');
          },
          complete: () => {
            this.loading = false;
          }
        })

      this.managementService
        .loadNominal(this.financement?.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.valeurAction = data?.nominal;
          },
          error: () => {
            this.toastr.error('Erreur de chargement!', 'Valorisation non chargée!');
          },
          complete: () => {
            this.loading = false;
          }
        })

      this.loadNominals();
      this.loadActionnaires();
    }
  }

  // Load the actionnaires
  loadActionnaires() {
    this.loading = true;

    this.managementService
      .findActionnairesByFinancement(this.financement?.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.actionnaires = data;
          this.actionnaires_hl = this.parseHLShareHolders(data);


          this.shl()?.setActionnaires(this.actionnaires_hl);
          this.fonds_actionnaires = this.actionnaires_hl.filter(
            (actionnaire: any) => actionnaire.isFund
          );
          this.totalActions = this.actionnaires_hl?.reduce(
            (a: number, b: any) => a + b?.nbrActionsApAugmentation,
            0
          );
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Actionnaires non chargés!');
        },
        complete: () => (this.loading = false),
      })

  }

  // Parse the actionnaires
  parseHLShareHolders(data: any) {
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
            nbrActionsApAugmentation: 0,
            montantApAugmentation: 0,
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
          this.financement.dateDemandeFinancement
      );

      if (transactions.length > 0) {
        if (
          transactions[0].financement.dateDemandeFinancement >=
          a.actionnaire.financement.dateDemandeFinancement
        ) {
          refAct.nbrActionsApAugmentation = transactions[0].nbrActions;
          refAct.montantApAugmentation =
            transactions[0].nbrActions * this.valeurAction;

          if (a.actionnaire.isFund) { act_actions_index.set(a.actionnaire.id, transactions[0].nbrActions) }

        } else

          if (a.actionnaire.isFund && act_actions_index.get(a.actionnaire.id)) {

            refAct.nbrActionsApAugmentation = act_actions_index.get(a.actionnaire.id) + a.actionnaire.nbrActionsApAugmentation;
            refAct.montantApAugmentation = act_actions_index.get(a.actionnaire.id)! * this.valeurAction;

          } else {

            refAct.nbrActionsApAugmentation = a.actionnaire.nbrActionsApAugmentation;
            refAct.montantApAugmentation = refAct.nbrActionsApAugmentation * this.valeurAction;

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

  // Go to the project fiche
  goToFiche() {
    this.router.navigateByUrl(
      '/dashboard/projects/' + this.selectedProjet?.id
    );
  }

  equals(a: any, b: any) {
    return a?.id == b?.id;
  }


}
