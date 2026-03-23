import {
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { CdsModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../services/management.service';

@Component({
  selector: 'funds-statutory-auditors-form',
  imports: [ClarityModule, CdsModule, FormsModule, ReactiveFormsModule],
  templateUrl: './funds-statutory-auditors-form.component.html',
  styleUrl: './funds-statutory-auditors-form.component.scss',
})
export class FundsStatutoryAuditorsFormComponent implements OnInit {
  // ===== INPUTS =====
  fonds = input<any>();

  // ===== DEPENDENCIES =====
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);

  // ===== FORMS =====
  commissaireSaveForm!: FormGroup;
  auditorModalOpened: boolean = false;

  // ===== PROPERTIES =====
  mandats: any[] = [];
  auditors: any[] = [];

  // ===== INITIALIZE =====
  ngOnInit(): void {
    // INIT FORM
    this.initForm();

    // SUBSCRIBE ANNEE D
    this.commissaireSaveForm.get('annee_d')?.valueChanges.subscribe((value) => {
      if (value) {
        this.commissaireSaveForm.get('annee_f')?.setValue(value + 3);
      } else {
        this.commissaireSaveForm.get('annee_f')?.setValue(0);
      }
    });

    // LOAD DATA
    this.loadAuditors();
    this.loadMandats();
  }

  // ===== EFFECTS =====
  readonly fondsEffect = effect(() => {
    if (this.fonds()) {
      this.loadMandats();
      this.loadAuditors();
    }
  });

  // INIT FORM MANDAT
  initForm() {
    this.commissaireSaveForm = this.formBuilder.group({
      commissaire: [undefined, [Validators.required]],
      annee_d: [undefined, [Validators.required]],
      annee_f: [undefined, [Validators.required]],
    });
  }

  // LOAD AUDITORS
  loadAuditors(): void {
    this.managementService
      .findCommissaires()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.auditors = data;
        },
        error: () => {
          this.toastr.error(
            'Erreur de chargement!',
            'Categories des documents non chargées!'
          );
        },
        complete: () => {},
      });
  }

  // LOAD MANDATS
  loadMandats() {
    this.managementService
      .findMandats(this.fonds()?.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.mandats = data;
        },
        error: (error) => console.error(error),
      });
  }

  // ADD MANDAT
  addMandat() {
    const commissaireValue =
      this.commissaireSaveForm.controls['commissaire'].value;

    const commissaireObj =
      typeof commissaireValue === 'object' && commissaireValue !== null
        ? commissaireValue
        : this.auditors.find((a) => a.id == commissaireValue);

    let mandat = {
      cac: commissaireObj,
      anneeD: this.commissaireSaveForm.controls['annee_d'].value,
      anneeF: this.commissaireSaveForm.controls['annee_f'].value,
      fonds: this.fonds(),
    };

    this.managementService
      .addMandat(mandat)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.toastr.success('Mandat ajouté avec succès!');
          this.loadMandats();
          this.commissaireSaveForm.reset();
          this.auditorModalOpened = false;
        },
        error: (error) => {
          console.error(error);
          this.toastr.error("Erreur lors de l'ajout du mandat!");
        },
      });
  }

  // DELETE MANDAT
  deleteMandat(mandat: any) {
    if (confirm('Veuillez confirmer cette suppression !')) {
      this.managementService
        .deleteMandat(mandat?.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('Suppression de mandat avec succès!');
            this.loadMandats();
          },
          error: (error) => console.error(error),
        });
    }
  }

  // OPEN MODAL
  openModal() {
    this.auditorModalOpened = true;
  }

  // EQUALS
  equals(a: any, b: any) {
    return a?.id == b?.id;
  }
}
