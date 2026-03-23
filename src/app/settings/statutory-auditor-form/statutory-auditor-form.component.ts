import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, model, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClarityModule } from '@clr/angular';
import { CdsButtonModule, CdsIconModule, CdsModalModule } from '@cds/angular';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'statutory-auditor-form',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsModalModule
  ],
  templateUrl: './statutory-auditor-form.component.html',
  styleUrl: './statutory-auditor-form.component.scss'
})
export class StatutoryAuditorFormComponent {

  refreshEvent = output<any>();
  opened = model<boolean>(false);

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);

  commissaires: any | undefined;

  commissaireSaveForm: FormGroup = this.fb.group({
    libelle: [undefined, [Validators.required]],
    cabinet: [undefined, [Validators.required]],
  });

  // Save the commissaire
  saveCommisaire() {
    let commissaire = {
      libelle: this.commissaireSaveForm.controls['libelle'].value,
      cabinet: this.commissaireSaveForm.controls['cabinet'].value,
    };

    this.managementService.saveCommissaireProjet(commissaire).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.toastr.success('', 'Commissaire ajouté avec succès!');
        this.refreshEvent.emit(data);
        this.opened.set(false);
      },
      error: () =>
        this.toastr.error('', 'Ajout de commissaire échoué !'),
    })
  }

}

