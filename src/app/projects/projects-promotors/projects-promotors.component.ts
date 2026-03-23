// Angular
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CdsModule } from '@cds/angular';
import { ClarityModule, ClrCommonFormsModule } from '@clr/angular';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../services/management.service';

@Component({
  selector: 'app-projects-promotors',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ClarityModule,
    CdsModule,
    ClrCommonFormsModule
  ],
  templateUrl: './projects-promotors.component.html',
  styleUrl: './projects-promotors.component.scss'
})
export class ProjectsPromotorsComponent implements OnInit {

  // ===== DEPENDENCIES =====
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly toastr = inject(ToastrService);
  private readonly formBuilder = inject(FormBuilder);

  // ===== COMPONENT STATE =====
  loading: boolean = false;
  showPromotorForm: boolean = false;
  selectedItem: any | null = null;

  // ===== DATA =====
  promoteurs: any[] = [];
  contacts: any[] = [];

  // ===== FORM =====
  promotorForm = this.formBuilder.group({
    nom: [undefined, [Validators.required]],
    dateContact: [undefined, [Validators.required]],
    lieuContact: [undefined, [Validators.required]],
    email: [undefined, [Validators.required, Validators.email]],
    telephone: [undefined, [Validators.required]],
    age: [undefined],
    diplome: [undefined],
    experience: [undefined],
    poste: [undefined],
    observation: [undefined],
    contact: [undefined]
  });

  // ===== LIFECYCLE =====
  ngOnInit(): void {
    this.loadData();
  }


  /**
   * Load initial data for the component
   */
  loadData(): void {
    this.loadPromotors();
    this.loadContacts();
  }

  /**
   * Load contacts from the API
   */
  loadContacts(): void {
    this.managementService.findContact()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.contacts = data.sort((c1: any, c2: any) =>
            c1.nom.localeCompare(c2.nom)
          );
        },
      });
  }

  /**
   * Load promoters from the API
   */
  loadPromotors(): void {
    this.loading = true;
    this.managementService.findPromoteur()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.promoteurs = data.sort((p1: any, p2: any) =>
            p1.nom.localeCompare(p2.nom)
          );
        },
        complete: () => {
          this.loading = false;
        }
      });
  }

  /**
   * Show the promoter form modal
   */
  showPromotorModal(clear: boolean): void {
    if (clear) {
      this.selectedItem = null;
      this.promotorForm.reset();
    } else if (this.selectedItem) {
      this.populateForm(this.selectedItem);
    }
    this.showPromotorForm = true;
  }

  /**
   * Populate the form with promoter data
   */
  populateForm(promoter: any): void {
    this.promotorForm.patchValue({
      nom: promoter.nom,
      dateContact: promoter.dateContact,
      lieuContact: promoter.lieuContact,
      email: promoter.email,
      telephone: promoter.telephone,
      age: promoter.age,
      diplome: promoter.diplome,
      experience: promoter.experience,
      poste: promoter.poste,
      observation: promoter.observation,
      contact: promoter.contact?.id
    });
  }


  savePromotor(): void {
    if (!this.selectedItem?.id) {
      const promoteur = {
        nom: this.promotorForm.value['nom'],
        dateContact: this.promotorForm.value['dateContact'],
        lieuContact: this.promotorForm.value['lieuContact'],
        email: this.promotorForm.value['email'],
        telephone: this.promotorForm.value['telephone'],
        age: this.promotorForm.value['age'],
        diplome: this.promotorForm.value['diplome'],
        experience: this.promotorForm.value['experience'],
        poste: this.promotorForm.value['poste'],
        observation: this.promotorForm.value['observation'],
        contact: this.contacts.find(u => u.id == this.promotorForm?.value['contact'])
      };

      this.managementService.savePromoteur(promoteur)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.toastr.success('Promoteur ajouté avec succès', 'Succès');
            this.loadPromotors();
            this.showPromotorForm = false;
            this.promotorForm.reset();
          }
        });
    } else {
      this.updatePromoteur();
    }
  }

  /**
   * Update an existing promoter
   */
  updatePromoteur(): void {
    const updatedPromoteur = {
      id: this.selectedItem.id,
      nom: this.promotorForm.value['nom'],
      dateContact: this.promotorForm.value['dateContact'],
      lieuContact: this.promotorForm.value['lieuContact'],
      email: this.promotorForm.value['email'],
      telephone: this.promotorForm.value['telephone'],
      age: this.promotorForm.value['age'],
      diplome: this.promotorForm.value['diplome'],
      experience: this.promotorForm.value['experience'],
      poste: this.promotorForm.value['poste'],
      observation: this.promotorForm.value['observation'],
      contact: this.contacts.find(u => u.id == this.promotorForm?.value['contact'])
    };

    this.managementService.updatePromoteur(updatedPromoteur)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success('Promoteur mis à jour avec succès', 'Succès');
          this.loadPromotors();
          this.showPromotorForm = false;
          this.promotorForm.reset();
        }
      });
  }

  /**
   * Delete the selected promoter
   */
  deletePromoteur(): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce promoteur ?')) {
      this.managementService.deletePromoteur(this.selectedItem.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('Promoteur supprimé avec succès', 'Succès');
            this.loadPromotors();
            this.selectedItem = null;
          },
          error: (error) => {
            console.error('Error deleting promoter:', error);
            this.toastr.error('Erreur lors de la suppression du promoteur', 'Erreur');
          }
        });
    }
  }
}

