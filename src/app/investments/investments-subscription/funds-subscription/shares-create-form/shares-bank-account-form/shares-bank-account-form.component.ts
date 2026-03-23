import { Component, DestroyRef, effect, inject, input, OnInit, output } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../../../services/management.service';
import { ClrNumberInputModule } from "@clr/angular";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';

@Component({
  selector: ' shares-bank-account-form',
 
  imports: [ClarityModule, CdsModule, ReactiveFormsModule, FormsModule, CurrencyPipe, ClrNumberInputModule],
  providers: [DatePipe],
  templateUrl: './shares-bank-account-form.component.html',
  styleUrl: './shares-bank-account-form.component.scss'
})
export class SharesBankAccountFormComponent implements OnInit {
  // ===== INPUT =====
  souscription = input<any>();

  // ===== OUTPUT =====
  readonly closeEvent = output<void>();

  // ===== DEPENDENCIES =====
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly toastr = inject(ToastrService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly datePipe = inject(DatePipe);


  // ===== PROPERTIES =====
  bankAccountSaveForm!: FormGroup;


  //===== INITIALIZATION =====
  ngOnInit(): void {
    this.bankAccountSaveForm = this.formBuilder.group({
      numeroCompte: [undefined, [Validators.required]],
      banque: [undefined, [Validators.required]],
      agence: [undefined, [Validators.required]],
      greffeTribunal: [undefined, [Validators.required]],
      dateDepot: [undefined, [Validators.required]],
      dateReunion: [undefined],
      capitalAvAugmentation: [undefined],
      capitalApAugmentation: [undefined],
    });
  }


  // ===== SAVE BANK ACCOUNT =====
  saveBankAccount() {
    const [d1, m1, y1] = this.bankAccountSaveForm?.value['dateDepot'].split('/');
    const [d2, m2, y2] = this.bankAccountSaveForm?.value['dateReunion'].split('/');
    if (this.souscription) {
      this.souscription().numeroCompte =
        this.bankAccountSaveForm.value['numeroCompte'];
      this.souscription().banque = this.bankAccountSaveForm.value['banque'];
      this.souscription().agence = this.bankAccountSaveForm.value['agence'];
      this.souscription().greffeTribunal =
        this.bankAccountSaveForm.value['greffeTribunal'];
      this.souscription().dateDepot =   new Date(
        y1, m1 - 1, d1
      );
      this.souscription().dateReunion = new Date(
        y2, m2 - 1, d2
      );
      this.souscription().capitalAvAugmentation =
        this.bankAccountSaveForm.value['capitalAvAugmentation'];
      this.souscription().capitalApAugmentation =
        this.bankAccountSaveForm.value['capitalApAugmentation'];

      this.managementService
        .saveInvSouscription(this.souscription(), 'action')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.toastr.success(
              'Les informations du compte bancaire en actions sauvegardées avec succès!'
            );
            this.souscription = data;
          },
          error: (error) =>
            this.toastr.error(
              '',
              'Échec de sauvegarde des informations du compte bancaire en actions!'
            ),
        })
    }
  }

  // ===== INIT FORM BANK ACCOUNT =====
  initForm(data?: any) {
    if (data) this.souscription = data;
    else data = this.souscription();
    let souscriptionData = data;

    this.bankAccountSaveForm.patchValue({
      numeroCompte: souscriptionData.numeroCompte,
      banque: souscriptionData.banque,
      agence: souscriptionData.agence,
      greffeTribunal: souscriptionData.greffeTribunal,
      dateDepot: souscriptionData.dateDepot
        ? this.datePipe.transform(new Date(souscriptionData.dateDepot), 'dd/MM/yyyy')
        : '',
      dateReunion: souscriptionData.dateReunion
        ? this.datePipe.transform(new Date(souscriptionData.dateReunion), 'dd/MM/yyyy')
        : '',
      capitalAvAugmentation: souscriptionData.capitalAvAugmentation,
      capitalApAugmentation: souscriptionData.capitalApAugmentation,
    });
  }


  // ===== CANCEL =====
  cancel() {
    this.closeEvent.emit();
  }

  // ===== EFFECTS BANK ACCOUNT =====
  readonly bankAccountEffect = effect(() => {
    if (this.souscription()) {
      this.initForm();
    }
  });


  // ===== GENERATE BULLETIN =====
  generateBulletin() { }

}
