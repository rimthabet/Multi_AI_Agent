import { Component, DestroyRef, effect, inject, input } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { DocumentUploadComponent } from '../../../tools/document-upload/document-upload.component';

@Component({
  selector: 'project-administrators-form',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule,
    DocumentUploadComponent
  ],
  providers: [DatePipe],
  templateUrl: './project-administrators-form.component.html',
  styleUrl: './project-administrators-form.component.scss'
})
export class ProjectAdministratorsFormComponent {

  projet = input<any>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);
  private readonly datePipe = inject(DatePipe);

  administrateurs: any[] = [];
  conformite_documentaires: any[] | undefined;
  loading: boolean = false;
  opened: boolean = false;
  selectedAdministrateur: any | undefined;
  formOpened: boolean = false;

  administrateurSaveForm!: FormGroup;

  constructor() {
    effect(() => this.loadAdministrateursByProject());
  }

  ngOnInit(): void {
    this.administrateurSaveForm = this.fb.group({
      nom: [undefined, [Validators.required]],
      organisme: [undefined, [Validators.required]],
      dateDebut: [undefined, [Validators.required]],
      dateFin: [undefined, [Validators.required]],
    });

    this.managementService
      .findConformitesByTache(5, 3)
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

  // Set the projet
  setProjet(projet: any) {
    this.projet = projet;
    this.loadAdministrateursByProject();
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

  //add administrateur
  addAdministrateur() {
    const [d1, m1, y1] = this.administrateurSaveForm?.value['dateDebut'].split('/');
    const [d2, m2, y2] = this.administrateurSaveForm?.value['dateFin'].split('/');
    if (!this.selectedAdministrateur?.id) {
      let administrateur = {
        nom: this.administrateurSaveForm?.value['nom'],
        organisme: this.administrateurSaveForm?.value['organisme'],
        dateDebut: new Date(y1, m1 - 1, d1),
        dateFin: new Date(y2, m2 - 1, d2),
        projet: this.projet(),
      };

      this.managementService
        .addAdministrateursByProjet(administrateur)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.toastr.success('Administrateur sauvegardée avec succès!');
            this.loadAdministrateursByProject();
            this.resetForm();
            this.formOpened = false;
          },
          error: () => {
            this.toastr.error('Erreur de chargement!', 'Administrateur non sauvegardée!');
          },
          complete: () => {
            this.loading = false;
          }
        })
    } else this.updateAdministrateur();
  }

  //update administrateur
  updateAdministrateur() {
    const [d1, m1, y1] = this.administrateurSaveForm?.value['dateDebut'].split('/');
    const [d2, m2, y2] = this.administrateurSaveForm?.value['dateFin'].split('/');
    if (this.selectedAdministrateur.id) {
      let administrateur = {
        id: this.selectedAdministrateur.id,
        nom: this.administrateurSaveForm?.value['nom'],
        organisme: this.administrateurSaveForm?.value['organisme'],
        dateDebut: new Date(y1, m1 - 1, d1),
        dateFin: new Date(y2, m2 - 1, d2),
        projet: this.projet(),
      };


      this.managementService
        .updateAdministrateursByProjet(administrateur)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.toastr.success('Administrateur mis à jour avec succès!');
            this.loadAdministrateursByProject();
            this.resetForm();
            this.formOpened = false;
          },
          error: () => {
            this.toastr.error('Erreur de chargement!', 'Administrateur non mis à jour!');
          },
          complete: () => {
            this.loading = false;
          }
        })

    }
  }

  //load administrateurs by project
  loadAdministrateursByProject() {
    this.loading = true;
    this.managementService
      .findAdministrateursByProjet(this.projet()?.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.administrateurs = data;
          this.administrateurs?.sort((a: any, b: any) => {
            if (a.dateDebut < b.dateDebut) return 1;
            if (a.dateDebut > b.dateDebut) return -1;
            if (a.dateFin < b.dateFin) return 1;
            if (a.dateFin > b.dateFin) return -1;
            return 0;
          });
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Administrateurs non chargés!');
        },
        complete: () => {
          this.loading = false;
        },
      })

  }

  //delete administrateur
  deleteAdministrateur(administrateur: any) {
    if (confirm('Veuillez confirmer cette suppression !')) {
      this.managementService
        .deleteAdministrateursByProjet(administrateur?.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success(
              "Suppression d'administrateur du projet  avec succès!"
            );
            this.loadAdministrateursByProject();
          },
          error: () => {
            this.toastr.error('Erreur de chargement!', 'Administrateur non supprimé!');
          },
          complete: () => {
            this.loading = false;
          }
        })
    }
  }

  //edit administrateur
  edit(administrateur: any) {
    this.selectedAdministrateur = administrateur;
    this.formOpened = true;
    this.administrateurSaveForm.patchValue({
      nom: administrateur.nom,
      organisme: administrateur.organisme,
      dateDebut: administrateur.dateDebut
        ? this.datePipe.transform(new Date(administrateur.dateDebut), 'dd/MM/yyyy')
        : '',

      dateFin: administrateur.dateFin
        ? this.datePipe.transform(new Date(administrateur.dateFin), 'dd/MM/yyyy')
        : '',

    });
  }


  //show document
  showDocument(administrateur: any) {
    this.selectedAdministrateur = administrateur;
    this.opened = true;
  }

  //reset form
  resetForm() {
    this.selectedAdministrateur = undefined;
    this.administrateurSaveForm?.reset();
  }

  //trim path
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

