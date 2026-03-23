import { Component, DestroyRef, effect, inject, input, OnInit, output, model, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../../services/management.service';
import { CurrencyPipe, DatePipe, registerLocaleData } from '@angular/common';
import { CdsModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import localeFr from '@angular/common/locales/fr';
registerLocaleData(localeFr);

@Component({
  selector: 'preselection-create-form',
  imports: [ClarityModule, FormsModule, CdsModule, ReactiveFormsModule, CurrencyPipe],
  providers: [DatePipe],
  templateUrl: './preselection-create-form.component.html',
  styleUrl: './preselection-create-form.component.scss',
})
export class PreselectionCreateFormComponent implements OnInit {

  // inputs
  prospection = model<any>();
  loading = model<boolean>(false);

  // outputs
  projectSaveEvent = output<any>();

  // view child
  preselectionForm = viewChild.required<PreselectionCreateFormComponent>("preselection_form");


  // injects
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  private readonly datePipe = inject(DatePipe);

  chargesInvestissement: any[] = [];
  criteresPreselection: any[] = [];

  preselectionSaveForm!: FormGroup;
  prospectionSaveForm!: FormGroup;

  ngOnInit(): void {
    // form prospection
    this.prospectionSaveForm = this.formBuilder.group({
      promoteur: [undefined, [Validators.required]],
      activite: [undefined, [Validators.required]],
      formeJuridique: [undefined, [Validators.required]],
      adresseUsine: [undefined, [Validators.required]],
      typeInvestissement: [undefined, [Validators.required]],
    });


    // form preselection
    this.preselectionSaveForm = this.formBuilder.group({
      promoteur: [undefined, [Validators.required]],
      activite: [undefined, [Validators.required]],
      formeJuridique: [undefined, [Validators.required]],
      adresseUsine: [undefined, [Validators.required]],
      typeInvestissement: [undefined, [Validators.required]],
      effectif: [undefined, [Validators.required]],
      dateLancement: [new Date(), [Validators.required]],
      cout: [undefined, [Validators.required]],
      chargesInvestissement: [undefined, [Validators.required]],
      dateAffectation: [new Date(), [Validators.required]],
      criteresPreselection: [undefined, [Validators.required]],
    });

    // load data
    this.loadChargesInvestissement();
    this.loadCriteresPreselection();


  }

  // effect
  readonly preselectionEffect = effect(() => {
    if (this.prospection()) {
      this.initForm(this.prospection());
      this.prospectionSaveForm.patchValue({
        promoteur: this.prospection()?.promoteur?.nom,
        activite: this.prospection()?.activite,
        formeJuridique: this.prospection()?.formeJuridique,
        adresseUsine: this.prospection()?.adresseUsine,
        typeInvestissement: this.prospection()?.typeInvestissement?.libelle,
      });
    }
  });


  // load data charges investissement
  loadChargesInvestissement() {
    this.loading.set(true);
    this.managementService
      .findChargeInvestissement()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.chargesInvestissement = data;
        },
        error: (data: any) => console.log(data),
        complete: () => {
          this.loading.set(false);
        },
      })

  }


  // load data criteres preselection
  loadCriteresPreselection() {
    this.loading.set(true);
    this.managementService
      .findCriteresPreselection()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.criteresPreselection = data;
        },
        error: (data: any) => console.log(data),
        complete: () => {
          this.loading.set(false);
        },
      })
  }


  // init form
  initForm(data?: any) {
    const preselectionData = data ?? this.prospection;
    if (!preselectionData) return;

    this.preselectionSaveForm.patchValue({
      promoteur: this.prospection()?.promoteur?.nom,
      activite: this.prospection()?.activite,
      formeJuridique: this.prospection()?.formeJuridique,
      adresseUsine: this.prospection()?.adresseUsine,
      typeInvestissement: this.prospection()?.typeInvestissement?.libelle,
      effectif: this.prospection()?.effectif,
      dateLancement: preselectionData.dateLancement
        ? this.datePipe.transform(preselectionData.dateLancement, 'dd/MM/yyyy')
        : null,
      dateAffectation: preselectionData.dateAffectation
        ? this.datePipe.transform(preselectionData.dateAffectation, 'dd/MM/yyyy')
        : null,
      cout: this.prospection()?.cout,
      chargesInvestissement: this.prospection()?.chargesInvestissement,
      criteresPreselection: this.prospection()?.criteresPreselection || []
    });
  }



  // save preselection
  savePreselection() {
    const [d1, m1, y1] = this.preselectionSaveForm?.value['dateLancement'].split('/');
    const [d2, m2, y2] = this.preselectionSaveForm?.value['dateAffectation'].split('/');
    if (this.prospection) {
      this.prospection().forme = this.preselectionSaveForm.value['forme'];
      this.prospection().effectif = this.preselectionSaveForm.value['effectif'];
      this.prospection().cout = this.preselectionSaveForm.value['cout'];
      this.prospection().dateLancement = new Date(y1, m1 - 1, d1);
      this.prospection().chargesInvestissement = this.preselectionSaveForm?.value['chargesInvestissement'];
      this.prospection().criteresPreselection = this.preselectionSaveForm?.value['criteresPreselection'];
      this.prospection().dateAffectation = new Date(y2, m2 - 1, d2);
      this.prospection().tacheRang = 7;

      this.managementService
        .updateProjetPreselection(this.prospection())
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            if (data != null) {
              this.projectSaveEvent.emit(data);
              this.toastr.success('', 'Projet mis à jour avec succès!');
            }
          },
          error: (data: any) => {
            console.log(data);
            this.toastr.error('', 'Projet non mis à jour!');
          }
        })
    }
  }



}
