import { Component, DestroyRef, inject, input, viewChild } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FinancingSwitchComponent } from '../../../../tools/financing-switch/financing-switch.component';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { DatePipe } from '@angular/common';
import { FinancingCreateFormComponent } from './financing-create-form/financing-create-form.component';
import { InvestmentCreateFormComponent } from './investment-create-form/investment-create-form.component';
import { DueDiligenceCreationFormComponent } from './due-diligence-creation-form/due-diligence-creation-form.component';
import { KpiBadge01Component } from "../../../../widgets/kpi-badge-01/kpi-badge-01.component";

@Component({
  selector: 'investment-schema',

  imports: [
    ClarityModule,
    CdsModule,
    FormsModule,
    ReactiveFormsModule,
    DecimalPipe,
    FinancingSwitchComponent,
    DatePipe,
    PercentPipe,
    FinancingCreateFormComponent,
    InvestmentCreateFormComponent,
    DueDiligenceCreationFormComponent,
    KpiBadge01Component
],
  templateUrl: './investment-schema.component.html',
  styleUrl: './investment-schema.component.scss',
})
export class InvestmentSchemaComponent {
  // Input
  prospection = input<any>();
  financement_popup =
    viewChild<FinancingCreateFormComponent>('financement_popup');
  investissement_popup = viewChild<InvestmentCreateFormComponent>(
    'investissement_popup'
  );
  expense_popup = viewChild<DueDiligenceCreationFormComponent>('expense_popup');

  // ===== DEPENDENCIES =====
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);

  // ===== PROPERTIES =====
  scifs: any | undefined;
  selectedScif: any | undefined;
  financements: any | undefined;
  expenses: any | undefined;
  investissements: any | undefined;
  participations: any | undefined;

  total_financement: number = 0;
  total_investissement: number = 0;
  total_expense: number = 0;

  selectedFinancement: any | undefined;
  selectedFin: any | undefined;
  selectedInvestissement: any | undefined;
  selectedExpense: any | undefined;

  fin_loading: boolean = false;
  inv_loading: boolean = false;
  exp_loading: boolean = false;
  scifs_loading: boolean = false;
  part_loading: boolean = false;

  modalFinancing: boolean = false;
  modalInvestissement: boolean = false;
  modalExpensee: boolean = false;

  dateSaveForm: FormGroup = this.formBuilder.group({
    dateSchema: [undefined, [Validators.required]],
  });

  schInFinForm: FormGroup = this.formBuilder.group({
    libelle: [undefined, [Validators.required]],
    elaboration_date: [undefined, [Validators.required]],
  });

  // ===== FINANCIAL CHANGES =====
  financementChanged($event: any) {
    this.selectedFinancement = $event;
    this.loadParticipations();
  }

  // ===== SCIF CHANGES =====
  selectScif(scif: any) {
    this.selectedScif = scif;
    this.loadScif();
  }

  // Loads funds participations for the selected financement
  loadParticipations() {
    this.part_loading = true;

    this.managementService
      .findParticipationFondsByFinancement(this.selectedFinancement?.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.participations = data;
          this.loadScifs();
        },
        complete: () => (this.part_loading = false),
      });
  }

  // Load all the scifs
  loadScifs() {
    this.scifs_loading = true;

    this.managementService
      .findSchemaInvFinByFin(this.selectedFinancement?.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.scifs = data;

          if (this.scifs[0]) {
            this.selectScif(this.scifs![0]);
          } else {
            this.investissements = [];
            this.total_investissement = 0;

            this.financements = [];
            this.total_financement = 0;
          }
        },
        complete: () => (this.scifs_loading = false),
      });
  }

  // Load a single draft of scif (queries Investissement et Financement)
  loadScif() {
    this.fin_loading = true;
    this.inv_loading = true;
    this.exp_loading = true;

    this.managementService
      .findSchemaInvestissement(this.selectedScif?.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          // We set the found data in the data base
          this.investissements = data;
          this.total_investissement = this.investissements?.reduce(
            (a: number, b: any) => a + b.montant,
            0
          );
        },
        complete: () => (this.inv_loading = false),
      });

    this.managementService
      .findSchemaFinancement(this.selectedScif?.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          // We set the found data in the data base
          if (data != null) {
            this.financements = [
              ...this.participations?.map((p: any) => {
                return {
                  libelle: p.fonds.denomination,
                  montant: p.montantCCA + p.montantOCA + p.montantActions,
                  natureBailleurFonds: { libelle: 'FCPR' },
                };
              }),
              ...data,
            ];

            this.total_financement = this.participations?.reduce(
              (a: number, b: any) =>
                a + b.montantOCA + b.montantCCA + b?.montantActions,
              0
            );
            this.total_financement = this.financements?.reduce(
              (a: number, b: any) => a + b?.montant,
              0
            );
          }
        },
        complete: () => (this.fin_loading = false),
      });

    this.managementService
      .findSchemaExpense(this.selectedScif?.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          // We set the found data in the data base
          this.expenses = data;
          this.total_expense = this.expenses?.reduce(
            (a: number, b: any) => a + b.montant,
            0
          );
        },
        complete: () => (this.exp_loading = false),
      });
  }

  refreshFinancements(data: any) {
    if (data.fromDelete) {
      this.financements = this.financements?.filter(
        (i: any) => i?.id != data.financement?.id
      );
    } else {
      // This is coming from add popup
      this.financements = this.financements?.filter(
        (f: any) => f?.id != data.financement?.id
      );

      this.financements.push(data.financement);
      this.selectedFinancement = data.financement;
    }
    this.total_financement = this.financements?.reduce(
      (a: number, b: any) => a + b?.montant,
      0
    );
  }

  refreshExpenses(data: any) {
    if (data.fromDelete) {
      this.expenses = this.expenses?.filter(
        (i: any) => i?.id != data.expense?.id
      );
    } else {
      // This is coming from add popup
      this.expenses = this.expenses?.filter(
        (f: any) => f?.id != data.expense?.id
      );

      this.expenses.push(data.expense);
      this.selectedExpense = data.expense;
    }
    this.total_expense = this.expenses?.reduce(
      (a: number, b: any) => a + b.montant,
      0
    );
  }

  refreshInvestissements(data: any) {
    if (data.fromDelete) {
      this.investissements = this.investissements?.filter(
        (i: any) => i?.id != data.investissement?.id
      );
    } else {
      // This is coming from add popup
      this.investissements = this.investissements?.filter(
        (i: any) => i.id != data.investissement.id
      );

      this.investissements?.push(data.investissement);
      this.selectedInvestissement = data.investissement;
    }

    this.total_investissement = this.investissements?.reduce(
      (a: number, b: any) => a + b.montant,
      0
    );
  }

  // Creation of new Schema Inv + Fin
  saveSchemaInvFin() {
    const [d1, m1, y1] =
      this.schInFinForm?.controls['elaboration_date'].value.split('/');

    let schinvfin: any = {
      dateSchema: new Date(y1, m1 - 1, d1),
      financement: this.selectedFinancement,
      libelle: this.schInFinForm?.controls['libelle'].value,
    };
    this.managementService
      .saveSchemaInvFin(schinvfin)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.toastr.success(
            '',
            "Un nouveau schéma d'investissement et de financmenet a été bien sauvegardé !"
          );
          this.loadScifs();
        },
        error: () => {
          this.toastr.error('', 'Erreur lors de la sauvegarde du schéma!');
        },
      });
  }

  // ===== DELETE SCIF =====
  deleteSchemaInvFin() {
    if (confirm('Veuillez confirmer la suppression du schéma !')) {
      this.managementService
        .deleteSchemaInvFin(this.selectedScif?.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.toastr.success(
              '',
              "Schéma d'Investissement et de Financement supprimé avec succès !"
            );
            this.loadScifs();
          },
          error: () => {
            this.toastr.error('', 'Erreur lors de la suppression du schéma!');
          },
        });
    }
  }

  // ===== ADD FINANCEMENT =====
  addFinancement() {
    if (!this.prospection() || !this.prospection()?.id) {
      this.toastr.warning('', "Veuillez remplir le projet d'abord!");
      return;
    }

    if (this.selectedFin) {
      this.financement_popup()?.setFinancement(this.selectedFin);
    } else {
      this.financement_popup()?.setFinancement(null);
    }

    this.modalFinancing = false;
    setTimeout(() => {
      this.modalFinancing = true;
    }, 0);
  }

  // ===== ADD EXPENSE =====
  addExpense() {
    if (!this.prospection() || !this.prospection()?.id) {
      this.toastr.warning('', "Veuillez remplir le projet d'abord!");
      return;
    }

    if (this.selectedExpense) {
      this.expense_popup()?.setExpense(this.selectedExpense);
    } else {
      this.expense_popup()?.setExpense(null);
    }

    this.modalExpensee = false;
    setTimeout(() => {
      this.modalExpensee = true;
    }, 0);
  }

  addInvestissment() {
    if (!this.prospection() || !this.prospection()?.id) {
      this.toastr.warning('', "Veuillez remplir le projet d'abord!");
      return;
    }

    this.modalInvestissement = false;
    setTimeout(() => {
      this.modalInvestissement = true;
    }, 0);
  }

  // ===== DELETE FINANCEMENT =====
  supprimerSchemaFinancement() {
    if (confirm('Veuillez confirmer cette suppression ?')) {
      this.managementService
        .deleteSchemaFinancement(this.selectedFinancement.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            console.log(data);
            this.toastr.success('', 'Financement supprimé avec succès!');
            this.refreshFinancements({
              financement: this.selectedFinancement,
              fromDelete: true,
            });
          },
          error: () => {
            this.toastr.error(
              '',
              'Erreur lors de la suppression du financement!'
            );
          },
        });
    }
  }

  // ===== DELETE EXPENSE =====
  supprimerSchemaExpense() {
    if (confirm('Veuillez confirmer cette suppression ?')) {
      if (this.selectedExpense.id) {
        this.managementService
          .deleteSchemaExpense(this.selectedExpense.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (data: any) => {
              this.toastr.success('', 'Dépense supprimée avec succès!');
              this.refreshExpenses({
                expense: this.selectedExpense,
                fromDelete: true,
              });
            },
            error: () => {
              this.toastr.error(
                '',
                'Erreur lors de la suppression de la dépense!'
              );
            },
          });
      }
    }
  }

  // ===== DELETE INVESTMENT =====
  supprimerSchemaInvestissement() {
    if (confirm('Veuillez confirmer cette suppression ?')) {
      if (this.selectedInvestissement.id) {
        this.managementService
          .deleteSchemaInvestissement(this.selectedInvestissement.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (data: any) => {
              this.toastr.success('Investissement supprimé avec Succès !');
              this.refreshInvestissements({
                investissement: this.selectedInvestissement,
                fromDelete: true,
              });
            },
            error: () => {
              this.toastr.error(
                '',
                "Erreur lors de la suppression de l'investissement!"
              );
            },
          });
      }
    }
  }
}
