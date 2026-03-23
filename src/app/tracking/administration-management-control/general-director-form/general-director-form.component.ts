import { CommonModule, DatePipe } from '@angular/common';
import { Component, DestroyRef, effect, inject, input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DocumentUploadComponent } from '../../../tools/document-upload/document-upload.component';

@Component({
  selector: 'general-director-form',
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
  templateUrl: './general-director-form.component.html',
  styleUrl: './general-director-form.component.scss'
})
export class GeneralDirectorFormComponent implements OnInit {

  projet = input<any>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);
  private readonly datePipe = inject(DatePipe);

  public directeurSaveForm!: FormGroup;

  directeurs: any[] = [];
  conformite_documentaires: any[] | undefined;
  selectedDirecteur: any | undefined;
  loading: boolean = false;
  opened: boolean = false;
  formOpened: boolean = false;


  constructor() {
    // Load the directeurs
    effect(() => this.loadDirecteursByProject());
  }

  ngOnInit(): void {

    this.directeurSaveForm = this.fb.group({
      nom: [undefined, [Validators.required]],
      mandat: [undefined, [Validators.required]],
      dateDebut: [undefined, [Validators.required]],
      dateFin: [undefined, [Validators.required]],
    });

    // Load the conformite documentaires
    this.managementService.findConformitesByTache(5, 2)
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
    this.projet().set(projet);
    this.loadDirecteursByProject();
  }


  // Add directeur
  addDirecteur() {
    const [d1, m1, y1] = this.directeurSaveForm?.value['dateDebut'].split('/');
    const [d2, m2, y2] = this.directeurSaveForm?.value['dateFin'].split('/');

    if (!this.selectedDirecteur?.id) {
      let directeur = {
        nom: this.directeurSaveForm?.value['nom'],
        mandat: this.directeurSaveForm?.value['mandat'],
        dateDebut: new Date(y1, m1 - 1, d1),
        dateFin: new Date(y2, m2 - 1, d2),
        projet: this.projet(),
      };

      this.managementService.addDirecteurGeneral(directeur).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data: any) => {
          this.toastr.success('Directeur sauvegardée avec succès!');
          this.loadDirecteursByProject();
          this.resetForm();
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Directeur non sauvegardée!');
        },
        complete: () => {
          this.loading = false;
        }
      })

    } else this.updateDirecteur();
  }

  // Update directeur
  updateDirecteur() {
    const [d1, m1, y1] = this.directeurSaveForm?.value['dateDebut'].split('/');
    const [d2, m2, y2] = this.directeurSaveForm?.value['dateFin'].split('/');
    if (this.selectedDirecteur.id) {
      let directeur = {
        id: this.selectedDirecteur.id,
        nom: this.directeurSaveForm?.value['nom'],
        mandat: this.directeurSaveForm?.value['mandat'],
        dateDebut: new Date(y1, m1 - 1, d1),
        dateFin: new Date(y2, m2 - 1, d2),
        projet: this.projet(),
      };

      this.managementService.updateDirecteurGeneral(directeur).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data: any) => {
          this.toastr.success('Directeur mis à jour avec succès!');
          this.loadDirecteursByProject();
          this.resetForm();
          this.closeFormModal();
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Directeur non mis à jour!');
        },
        complete: () => {
          this.loading = false;
        }
      })

    }
  }


  //edit directeur
  edit(directeur: any) {
    this.openFormModal();
    if (directeur) {
      this.resetForm();
      this.selectedDirecteur = directeur;
      this.directeurSaveForm.patchValue({
        nom: directeur.nom,
        mandat: directeur.mandat,
        dateDebut: directeur.dateDebut
          ? this.datePipe.transform(new Date(directeur.dateDebut), 'dd/MM/yyyy')
          : '',

        dateFin: directeur.dateFin
          ? this.datePipe.transform(new Date(directeur.dateFin), 'dd/MM/yyyy')
          : '',

      });
    }
  }

  //load directeurs by project
  loadDirecteursByProject() {

    this.loading = true;

    this.managementService.findDirecteurGeneral(this.projet()?.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.directeurs = data;

        this.directeurs?.sort((a: any, b: any) => {
          if (a.dateDebut < b.dateDebut) return 1;
          if (a.dateDebut > b.dateDebut) return -1;
          if (a.dateFin < b.dateFin) return 1;
          if (a.dateFin > b.dateFin) return -1;
          return 0;
        });
      },
      error: () => {
        this.toastr.error('Erreur de chargement!', 'Directeurs non chargés!');
      },
      complete: () => {
        this.loading = false;
      },
    })

  }

  //delete directeur general
  deleteDirecteurGeneral(directeur: any) {
    if (confirm('Veuillez confirmer cette suppression !')) {
      this.managementService
        .deleteDirecteurGeneral(directeur?.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success(
              'Suppression de directeur général avec succès!'
            );
            this.loadDirecteursByProject();
          },
          error: () => {
            this.toastr.error('Erreur de chargement!', 'Directeur non supprimé!');
          },
          complete: () => {
            this.loading = false;
          }
        })
    }
  }

  //reset form
  resetForm() {
    this.selectedDirecteur = undefined;
    this.directeurSaveForm?.reset();
  }

  //show document
  showDocument(directeur: any) {
    this.selectedDirecteur = directeur;
    this.opened = true;
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

  closeFormModal() {
    this.formOpened = false;
    this.resetForm();
  }

  openFormModal() {
    this.formOpened = true;
    this.resetForm();
  }
}
