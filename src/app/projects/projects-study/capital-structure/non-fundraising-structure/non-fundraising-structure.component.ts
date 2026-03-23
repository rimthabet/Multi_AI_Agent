import { formatDate, PercentPipe, DatePipe, DecimalPipe, CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, effect, inject, input, model, OnInit, output } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'non-fundraising-structure',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule,
    PercentPipe,
    DatePipe,
    DecimalPipe,
    CurrencyPipe
  ],
  templateUrl: './non-fundraising-structure.component.html',
  styleUrl: './non-fundraising-structure.component.scss'
})
export class NonFundraisingStructureComponent implements OnInit {

  //Inputs & Outputs

  financement = input<any>();
  valorisationAction = input<any>();
  valeurAction = input<any>();
  actionnaires = model<any>();

  height = input<string>('190px');
  loading = model<boolean>(true);

  refreshEvent = output<any>();


  //Services
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly toastr = inject(ToastrService);
  private readonly formBuilder = inject(FormBuilder);

  // Constructor
  constructor() {
    // Using effects to react to changes in input signals
    effect(() => {
      this.calcul();
      this.loading.set(false);
    });
  }

  total_nombre_action: number = 0;

  total_actionnaires: any = 0;
  totalApAugmentation: number = 0;
  totalAvAugmentation: number = 0;
  totalNombreAction: number = 0;

  transactions: any[] = [];
  nominals: any[] = [];
  selectedActionnaire: any | undefined;

  openedCorrect: boolean = false;
  openedAdd: boolean = false;
  openedModify: boolean = false;
  openedNominalModify: boolean = false;

  public actionniareSaveForm!: FormGroup;
  public transactionSaveForm!: FormGroup;
  public nominalSaveForm!: FormGroup;



  ngOnInit() {
    this.actionniareSaveForm = this.formBuilder.group({
      libelle: [''],
      dateParticipation: ['', Validators.required],
      montant: [''],
      nbrActionsAvAugmentation: [''],
      montantAvAugmentation: [''],
    });

    this.transactionSaveForm = this.formBuilder.group({
      libelle: [''],
      dateChangement: ['', Validators.required],
      montant: [''],
      nbrActionsAvAugmentation: [''],
      montantAvAugmentation: [''],
    });

    this.nominalSaveForm = this.formBuilder.group({
      nominal: ['', Validators.required],
      dateChangement: ['', Validators.required],
    });


    this.transactionSaveForm
      ?.get('nbrActionsAvAugmentation')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
        const montant = value * this.valeurAction();
        this.transactionSaveForm
          .get('montantAvAugmentation')
          ?.setValue(montant);
      });

    this.actionniareSaveForm
      ?.get('nbrActionsAvAugmentation')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {

        const montant = value * this.valeurAction();
        this.actionniareSaveForm
          .get('montantAvAugmentation')
          ?.setValue(montant);
      });

    this.setActionnaires();

  }


  //set actionnaires
  setActionnaires(data?: any) {
    this.calcul();
    if (this.actionnaires()) this.loading.set(false);
  }

  //calcul total actionnaires
  calcul() {
    this.total_actionnaires = this.actionnaires().filter(
      (obj: any, index: number) =>
        this.actionnaires()?.findIndex(
          (item: any) => item?.libelle === obj?.libelle
        ) === index
    ).length;
    this.total_nombre_action = this.actionnaires().reduce(
      (a: number, b: any) => a + b?.nbrActionsApAugmentation,
      0
    );
  }

  //save actionnaire
  saveActionnaire() {
    const dateParticipation = this.actionniareSaveForm.value['dateParticipation'];
    const [d, m, y] = dateParticipation.split('/');
    const dateChangement = new Date(y, m - 1, d);

    let actionnaire: any = {
      financement: this.financement(),
      libelle: this.actionniareSaveForm?.value['libelle'],
      dateChangement: dateChangement,
      nbrActionsAvAugmentation:
        this.actionniareSaveForm?.value['nbrActionsAvAugmentation'],
      montantAvAugmentation:
        this.actionniareSaveForm?.value['montantAvAugmentation'],
      nbrActionsApAugmentation: 0,
      montantApAugmentation: 0,
      offFundRaiser: true,
    };


    this.managementService.saveActionnaire(actionnaire).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.toastr.success(
          'Changement de la part de capital exécuté avec succès!'
        );
        this.openedAdd = false;
        this.refreshEvent.emit(data);
      },
      error: () => {
        this.toastr.error('Erreur de chargement!', 'Changement de la part de capital non exécuté!');
      },

    })

  }

  //update actionnaire
  updateActionnaire() {
    const dateParticipation = this.actionniareSaveForm.value['dateParticipation'];
    let dateChangement = '';

    if (dateParticipation) {
      // Parse date from dd/MM/yyyy format
      let date: Date;
      if (typeof dateParticipation === 'string' && dateParticipation.includes('/')) {
        const [day, month, year] = dateParticipation.split('/');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        date = new Date(dateParticipation);
      }

      if (!isNaN(date.getTime())) {
        dateChangement = formatDate(date, 'dd/MM/yyyy', 'en-US');
      }
    }

    let actionnaire: any = {
      id: this.selectedActionnaire.id,
      financement: this.financement(),
      libelle: this.actionniareSaveForm?.value['libelle'],
      dateChangement: dateChangement,
      nbrActionsAvAugmentation:
        this.actionniareSaveForm?.value['nbrActionsAvAugmentation'],
      montantAvAugmentation:
        this.actionniareSaveForm?.value['montantAvAugmentation'],
      nbrActionsApAugmentation:
        this.selectedActionnaire.nbrActionsApAugmentation,
      montantApAugmentation: this.selectedActionnaire.montantApAugmentation,
      offFundRaiser: true,
    };

    this.managementService.updateActionnaire(actionnaire).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.toastr.success(
          'Changement de la part de capital exécuté avec succès!'
        );
        this.openedCorrect = false;
        this.refreshEvent.emit(data);
      },
      error: () => {
        this.toastr.error('Erreur de chargement!', 'Changement de la part de capital non exécuté!');
      },

    })

  }

  //delete actionnaire
  supprimerActionnaire(actionnaire: any) {
    if (confirm('Veuillez confirmer cette suppression ?')) {

      this.managementService.deleteActionnaire(actionnaire.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data: any) => {
          this.toastr.success('Actionnaire supprimé avec succès!');
          const new_act_list = this.actionnaires()?.filter(
            (act: any) => act?.id != this.selectedActionnaire?.id
          );
          this.actionnaires.set(new_act_list);
          this.refreshEvent.emit(data);
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Actionnaire non supprimé!');
        },

      })

    }

  }

  //save transaction
  saveTransaction() {
    let structureCapitalTransaction: any = {
      financement: { id: this.financement()?.id },
      fonds: { id: this.selectedActionnaire.id },
      dateChangement: this.transactionSaveForm.value['dateChangement']
        ? new Date(this.transactionSaveForm.value['dateChangement'])
        : '',
      offFundRaiser: true,
      nbrActions:
        this.transactionSaveForm.controls['nbrActionsAvAugmentation'].value,
      isFund: true,
    };
    if (!this.selectedActionnaire.isFund) {
      structureCapitalTransaction.actionnaire = {
        id: this.selectedActionnaire.id,
      };
      structureCapitalTransaction.fonds = undefined;
    } else {
      structureCapitalTransaction.fonds = { id: this.selectedActionnaire.id };
      structureCapitalTransaction.actionnaire = undefined;
    }

    this.managementService
      .saveCapitalTransaction(structureCapitalTransaction)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.toastr.success(
            'Changement de la part de capital, executé avec succès!'
          );
          this.openedModify = false;
          this.selectedActionnaire = null;
          this.refreshEvent.emit(data);
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Changement de la part de capital non exécuté!');
        },
      })

  }

  //delete transaction
  supprimerTransaction(transaction: any) {
    if (confirm('Veuillez confirmer cette suppression ?')) {

      this.managementService
        .deleteCapitalTransaction(transaction.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.toastr.success('Transaction supprimé avec succès!');
            this.refreshEvent.emit(data);
          },
          error: () => {
            this.toastr.error('Erreur de chargement!', 'Transaction non supprimé!');
          },
        })

    }
  }

  //add nominal
  addNominal() {
    let nominal = {
      nominal: this.nominalSaveForm.controls['nominal'].value,
      dateChangement: this.nominalSaveForm.value['dateChangement']
        ? new Date(this.nominalSaveForm.value['dateChangement'])
        : '',
      financement: this.financement,
    };

    this.managementService.saveNominal(nominal).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.toastr.success('', 'Nominal sauvegardé avec succès !');
        this.refreshEvent.emit(data);
      },
      error: () => {
        this.toastr.error('', 'Echec de sauvegarde !');
      },
    })

  }

  //set nominals
  setNominals(data: any) {
    this.nominals = data;
  }

  //delete nominal
  deleteNominal(nominal: any) {
    if (confirm('Veuillez confirmer cette suppression ?')) {

      this.managementService.deleteNominal(nominal.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data: any) => {
          this.toastr.success('Nominal supprimé avec succès!');
          this.setNominals(
            this.nominals.filter((n: any) => n.id != nominal.id)
          );
          this.refreshEvent.emit(data);
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Nominal non supprimé!');
        },
      })

    }
  }

  //show modal add
  showTransactionModalAdd() {
    this.openedAdd = true;
    this.actionniareSaveForm?.reset();
  }

  //show modal modify
  showTransactionModalModify(actionnaire: any) {
    this.openedModify = true;
    if (actionnaire) {
      let montantAvAugmentation =
        actionnaire.nbrActions !== undefined && actionnaire.nbrActions !== null
          ? actionnaire.nbrActions * this.valeurAction()
          : actionnaire.montantAvAugmentation +
          actionnaire.montantApAugmentation;

      let nbrActionsAvAugmentation =
        actionnaire.nbrActions ??
        (actionnaire.nbrActionsAvAugmentation +
          actionnaire.nbrActionsApAugmentation ||
          0);

      this.transactionSaveForm.patchValue({
        libelle: actionnaire.libelle,
        nbrActionsAvAugmentation: nbrActionsAvAugmentation,
        montantAvAugmentation: montantAvAugmentation,
      });

      this.selectedActionnaire = actionnaire;
    } else {
      this.resetForm();
      this.selectedActionnaire = null;
    }
  }

  //show modal correct
  showTransactionModalCorrect(actionnaire: any) {
    this.openedCorrect = true;
    if (actionnaire) {
      this.actionniareSaveForm.patchValue({
        libelle: actionnaire.libelle,
        nbrActionsAvAugmentation:
          actionnaire.nbrActions ??
          (actionnaire.nbrActionsAvAugmentation +
            actionnaire.nbrActionsApAugmentation ||
            0),
        montantAvAugmentation:
          actionnaire.nbrActions !== undefined &&
            actionnaire.nbrActions !== null
            ? actionnaire.nbrActions * this.valeurAction()
            : actionnaire.montantAvAugmentation +
            actionnaire.montantApAugmentation * this.valeurAction() || 0,
      });
      this.selectedActionnaire = actionnaire;
    } else {
      this.resetForm();
      this.selectedActionnaire = null;
    }
  }

  //show modal modify
  showNominalModalModify() {
    this.openedNominalModify = true;
  }

  //reset form
  resetForm() {
    this.transactionSaveForm?.reset();
  }


}
