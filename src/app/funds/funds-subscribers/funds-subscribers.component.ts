import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdsModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ManagementService } from '../../services/management.service';
import { ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'subscribers',
  imports: [ClarityModule, CdsModule, FormsModule,
    ReactiveFormsModule],
  templateUrl: './funds-subscribers.component.html',
  styleUrl: './funds-subscribers.component.scss'
})
export class FundsSubscribersComponent implements OnInit {

  etablissements: any[] = [];
  souscripteurs: any[] = [];

  selectedItem: any | undefined;
  souscripteurForm!: FormGroup;

  openModal: boolean = false;
  loading: boolean = false;

  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);

  ngOnInit(): void {

    this.souscripteurForm = this.formBuilder.group({
      libelle: ['', [Validators.required]],
      nationalite: [255, [Validators.required]],
      categoriePart: [255, [Validators.required]],
      etablissement: ['', [Validators.required]],
    });

    this.loadSouscripteurs();
    this.loadEtablisements();
  }

  // Fetch list of establishments 
  loadEtablisements() {
    this.managementService.findEtablisements()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.etablissements = data;
        },
        error: (error: any) => {
          console.error('Error loading establishments:', error);
        },
        complete: () => { }
      });
  }

  // Fetch list of subscribers 
  loadSouscripteurs() {
    this.loading = true;
    this.managementService.findSouscripteur()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.souscripteurs = data.sort((s1: any, s2: any) => {
            if (s1.nom > s2.nom) return 1;
            if (s1.nom < s2.nom) return -1;
            return 0;
          });
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error loading subscribers:', error);
          this.loading = false;
        },
      });
  }

  // Save subscriber
  saveSouscripteur() {
    if (!this.selectedItem?.id) {
      const souscripteur: any = {
        libelle: this.souscripteurForm?.value['libelle'],
        nationaliteValeur: this.souscripteurForm?.value['nationalite'],
        categoriePartValeur: this.souscripteurForm?.value['categoriePart'],
        etablissement: this.etablissements?.filter(
          (etablissement: any) =>
            etablissement.id == this.souscripteurForm?.value['etablissement']
        )[0],
      };

      this.managementService.saveSouscripteur(souscripteur)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.toastr.success('Souscripteur enregistré avec succès');
            this.loadSouscripteurs();
            this.resetForm();
          },
        });
    } else {
      this.updateSouscripteur();
    }
  }

  // Update subscriber
  updateSouscripteur() {
    if (this.selectedItem?.id) {
      const souscripteur: any = {
        id: this.selectedItem.id,
        libelle: this.souscripteurForm?.value['libelle'],
        nationaliteValeur: this.souscripteurForm?.value['nationalite'],
        categoriePartValeur: this.souscripteurForm?.value['categoriePart'],
        etablissement: this.etablissements?.find(
          (etablissement: any) =>
            etablissement.id == this.souscripteurForm?.value['etablissement']
        ),
      };

      this.managementService.updateSouscripteur(souscripteur)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.toastr.success('Souscripteur modifié avec succès');
            this.loadSouscripteurs();
            this.resetForm();
          },
        });
    }
  }

  // Show subscriber modal 
  showSouscripteurModal(clear: boolean) {
    if (clear) {
      this.selectedItem = undefined;
      this.souscripteurForm.reset();
    }

    if (this.selectedItem) {
      this.souscripteurForm.patchValue({
        libelle: this.selectedItem.libelle,
        nationalite: this.selectedItem.nationaliteValeur,
        categoriePart: this.selectedItem.categoriePartValeur,
        etablissement: this.selectedItem.etablissement.id,
      });
    }

    this.openModal = true;
  }


  // Delete subscriber
  deleteSouscripteur() {
    if (confirm('Veuillez confirmer cette suppression !')) {
      this.managementService.deleteSouscripteur(this.selectedItem.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('Souscripteur supprimé avec succès');
          },
          error: (error) => {
            console.error('Erreur lors de la suppression du souscripteur', error);
          },
          complete: () => {
            this.loadSouscripteurs();
          },
        });
    }
  }

  // Reset form 
  resetForm() {
    this.souscripteurForm.reset();
    this.selectedItem = undefined;
    this.openModal = false;
  }

  // Unsubscribe from all subscriptions 
  // Note: Not needed when using takeUntilDestroyed
}
