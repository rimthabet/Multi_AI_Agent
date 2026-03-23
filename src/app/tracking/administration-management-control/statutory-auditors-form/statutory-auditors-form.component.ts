import { CommonModule, DatePipe } from '@angular/common';
import { Component, DestroyRef, effect, inject, input, OnInit, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { DocumentUploadComponent } from '../../../tools/document-upload/document-upload.component';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StatutoryAuditorFormComponent } from '../../../settings/statutory-auditor-form/statutory-auditor-form.component';

@Component({
  selector: 'statutory-auditors-form',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule,
    DocumentUploadComponent,
    StatutoryAuditorFormComponent
  ],
  providers: [DatePipe],
  templateUrl: './statutory-auditors-form.component.html',
  styleUrl: './statutory-auditors-form.component.scss'
})
export class StatutoryAuditorsFormComponent implements OnInit {

  commisaire_au_compte = viewChild<StatutoryAuditorFormComponent>("commissaire_form");

  projet = input<any>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);
  private readonly datePipe = inject(DatePipe);

  commisaires_aux_comptes: any[] = [];
  pcacs: any[] = [];
  conformite_documentaires: any[] | undefined;

  opened: boolean = false;
  statuary_form_opened: boolean = false;
  loading: boolean = false;
  formOpened: boolean = false;

  selectedPcac: any | undefined;

  public commissaireSaveForm!: FormGroup;

  constructor() {
    effect(() => this.loadCommissaires());
  }

  ngOnInit(): void {
    this.commissaireSaveForm = this.fb.group({
      commissaire: [undefined, [Validators.required]],
      date_d: [undefined, [Validators.required]],
      date_f: [undefined, [Validators.required]],
    });

    this.loadPcacByProject();

    this.managementService
      .findConformitesByTache(5, 4)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.conformite_documentaires = data;
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Conformités non chargées!');
        }
      })
  }


  //open form modal
  openFormModal() {
    this.resetForm();
    this.formOpened = true;
  }

  //close form modal
  closeFormModal() {
    this.formOpened = false;
    this.resetForm();
  }


  // Set the projet
  setProjet(projet: any) {
    this.projet().set(projet);
    this.loadPcacByProject();
  }


  // Load commissaires
  loadCommissaires() {
    this.managementService.findCommissairesProjet().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data: any) => {
      this.commisaires_aux_comptes = data;
    })
  }


  // Add commissaire
  addCommissaire() {
    const [d1, m1, y1] = this.commissaireSaveForm?.value['date_d'].split('/');
    const [d2, m2, y2] = this.commissaireSaveForm?.value['date_f'].split('/');
    if (!this.selectedPcac?.id) {
      let commissaire: any = {
        commissaire: this.commissaireSaveForm?.value['commissaire'],
        dateDebut: new Date(y1, m1 - 1, d1),
        dateFin: new Date(y2, m2 - 1, d2),
        projet: this.projet(),
      };

      this.managementService.addPcac(commissaire).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data: any) => {
          this.toastr.success('Commissaire au compte ajouté avec succès!');
          this.loadPcacByProject();
          this.resetForm();
          this.formOpened = false;
        },
        error: () => {
          this.toastr.error("Erreur lors de l'ajout du commissaire");
        },
        complete: () => {
          this.loading = false;
        }
      })

    } else {
      this.updateCommissaire();
    }
  }

  // Update commissaire
  updateCommissaire() {
    const [d1, m1, y1] = this.commissaireSaveForm?.value['date_d'].split('/');
    const [d2, m2, y2] = this.commissaireSaveForm?.value['date_f'].split('/');
    if (this.selectedPcac?.id) {
      let commissaire = {
        id: this.selectedPcac.id,
        commissaire: this.commissaireSaveForm?.value['commissaire'],
        dateDebut: new Date(y1, m1 - 1, d1),
        dateFin: new Date(y2, m2 - 1, d2),
        projet: this.projet(),
      };


      this.managementService.updatePcac(commissaire).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data: any) => {
          this.toastr.success(
            'Commissaire au compte mis à jour avec succès!'
          );

          this.loadPcacByProject();
          this.resetForm();
          this.formOpened = false;
        },
        error: () => {
          this.toastr.error(
            'Erreur lors de la mise à jour des dates du commissaire'
          );
        },
        complete: () => {
          this.loading = false;
        }
      })

    }
  }

  // Load pcacs by project
  loadPcacByProject() {
    this.loading = true;
    this.managementService.findPcac(this.projet()?.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.pcacs = data;
        this.pcacs?.sort((a: any, b: any) => {
          if (a.dateDebut < b.dateDebut) return 1;
          if (a.dateDebut > b.dateDebut) return -1;
          if (a.dateFin < b.dateFin) return 1;
          if (a.dateFin > b.dateFin) return -1;
          return 0;
        });
      },
      error: () => {
        this.toastr.error('Erreur de chargement!', 'Commissaires non chargés!');
      },
      complete: () => {
        this.loading = false;
      },
    })

  }

  // Delete commissaire
  deletePcac(commissaire: any) {
    if (confirm('Veuillez confirmer cette suppression !')) {
      this.managementService
        .deletePcac(commissaire?.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.toastr.success(
              'Suppression de commissaire au compte avec succès!'
            );
            this.loadPcacByProject();
          },
          error: () => {
            this.toastr.error(
              'Erreur lors de la suppression du commissaire'
            );
          },
          complete: () => {
            this.loading = false;
          }
        })
    }
  }

  // Edit commissaire
  edit(commissaire: any) {
    if (commissaire) {
      this.selectedPcac = commissaire;
      this.formOpened = true;

      this.commissaireSaveForm.patchValue({
        commissaire: commissaire?.commissaire,
        date_d: commissaire?.dateDebut
          ? this.datePipe.transform(new Date(commissaire?.dateDebut), 'dd/MM/yyyy')
          : '',

        date_f: commissaire?.dateFin
          ? this.datePipe.transform(new Date(commissaire?.dateFin), 'dd/MM/yyyy')
          : '',
      });
    }
  }

  // Show document
  showDocument(commissaire: any) {
    this.selectedPcac = commissaire;
    this.opened = true;
  }

  // Reset form
  resetForm() {
    this.selectedPcac = undefined;
    this.commissaireSaveForm?.reset();
  }

  // Trim path
  trimPath(path: any) {

    try {
      path = (path as string);
      return path;
    } catch {
      return '';
    }
  }

  equals(a: any, b: any) {
    return a?.id == b?.id;
  }

}


