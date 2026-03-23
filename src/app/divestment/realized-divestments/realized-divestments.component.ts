import { CommonModule, formatDate } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../services/management.service';
import { DocumentUploadComponent } from '../../tools/document-upload/document-upload.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DivestmentRealizedXlsxService } from '../../services/reports/divestment-realized-xlsx.service';

@Component({
  selector: 'realized-divestments',
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
    RouterLink
  ],
  templateUrl: './realized-divestments.component.html',
  styleUrl: './realized-divestments.component.scss'
})
export class RealizedDivestmentsComponent implements OnInit {

  //  Injects and ViewChild 
  docUpload = viewChild.required<DocumentUploadComponent>("DocumentUploadComponent");

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);
  private readonly router = inject(Router);
  private readonly divestmentRealizedXlsxService = inject(DivestmentRealizedXlsxService);

  public desinvestissementForm!: FormGroup;

  fonds: any[] = [];
  desinvestissementsRealise: any[] = [];
  types: any[] = [];
  conformite_documentaires: any[] = [];

  selectedFonds: any = null;
  selectedDesinvestisssment: any = null;

  fonds_loading: boolean = true;
  loading: boolean = false;
  desinvestisssmentModalOpened: boolean = false;

  // Lifecycle hooks
  ngOnInit(): void {

    this.desinvestissementForm = this.fb.group({
      dateComiteAutorisantSortie: ['', [Validators.required]],
      dateSignatureProtocoleCession: ['', [Validators.required]],
      actionsCedees: ['', [Validators.required]],
      prixVenteAction: ['', [Validators.required]],
      prixTotalVente: ['', [Validators.required]],
      triRealise: ['', [Validators.required]],
      typeSortieRealisee: ['', [Validators.required]],
    });

    this.findFondsList();
  }


  // Select the fonds
  selectFonds(fond: any) {
    this.selectedFonds = fond;
    this.loadDesinvestissementsRealise();
    localStorage.setItem('LastVisitedFunds', fond.id);
  }


  // Find funds list
  findFondsList() {
    this.managementService.findFondsList().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.fonds = data.filter(
          (fonds: any) => fonds.etat?.libelle !== 'En cours de levée'
        );
        let lastVisitedFunds = sessionStorage.getItem('LastVisitedFunds');

        if (lastVisitedFunds) {
          let selectedFond = this.fonds.find(
            (fond: any) => fond.id == lastVisitedFunds
          );

          if (selectedFond) {
            this.selectedFonds = selectedFond;
          } else {
            this.selectedFonds = data[0];
            sessionStorage.setItem('LastVisitedFunds', data[0].id);
          }
        } else {
          this.selectedFonds = data[0];
          sessionStorage.setItem('LastVisitedFunds', data[0].id);
        }


        this.loadDesinvestissementsRealise();
        this.loadTypesSortie();
        this.loadConformite();
      },
      error: () => {
        this.toastr.error('Erreur de chargement!', 'Fonds non chargés!');
      },
      complete: () => (this.fonds_loading = false),
    })
  }

  // Load the conformite
  loadConformite() {
    this.managementService
      .findConformitesByTache(7, 1)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.conformite_documentaires = data;
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Conformité documentaire non chargée!');
        },
        complete: () => (this.fonds_loading = false),
      })
  }

  // Load the desinvestissements realized
  loadDesinvestissementsRealise() {
    this.loading = true;
    this.managementService
      .findInvSoucriptionActionByFonds(this.selectedFonds.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          data.sort((a: any, b: any) => {
            if (a.sa.financement.projet.nom > b.sa.financement.projet.nom)
              return 1;
            if (a.sa.financement.projet.nom < b.sa.financement.projet.nom)
              return -1;

            if (a.sa.dateBulletin < b.sa.dateBulletin) return -1;
            if (a.sa.dateBulletin > b.sa.dateBulletin) return 1;

            return 0;
          });
          this.desinvestissementsRealise = data;

        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Desinvestissements non chargés!');
        },
        complete: () => (this.loading = false),
      })
  }

  // Display the participation modal
  displayParticipationModal(participation: any) {
    this.selectedDesinvestisssment = participation;

    this.desinvestissementForm.patchValue({
      dateComiteAutorisantSortie: participation?.sa?.dateComiteAutorisantSortie
        ? formatDate(participation.sa.dateComiteAutorisantSortie, 'dd/MM/yyyy', 'fr-FR')
        : '',
      dateSignatureProtocoleCession: participation?.sa?.dateSignatureProtocoleCession
        ? formatDate(participation.sa.dateSignatureProtocoleCession, 'dd/MM/yyyy', 'fr-FR')
        : '',
      actionsCedees: participation?.sa?.actionsCedees,
      triRealise: participation?.sa?.triRealise * 100,
      prixVenteAction: participation?.sa?.prixVenteAction,
      prixTotalVente: participation?.sa?.prixTotalVente,
      typeSortieRealisee: participation?.sa?.typeSortieRealisee,
    });

    this.desinvestisssmentModalOpened = true;
  }

  // Update the desinvestissement realized
  updateDesinvestissementRealise() {
    const [d1, m1, y1] = this.desinvestissementForm?.value['dateComiteAutorisantSortie'].split('/');
    let desinvestissement = {
      ...this.selectedDesinvestisssment.sa,
      dateComiteAutorisantSortie: this.desinvestissementForm.value['dateComiteAutorisantSortie']
        ? new Date(y1, m1 - 1, d1)
        : '',
      dateSignatureProtocoleCession: new Date(
        y1, m1 - 1, d1
      ),
      actionsCedees: this.desinvestissementForm.value['actionsCedees'],

      triRealise: this.desinvestissementForm.value['triRealise'] / 100,
      prixVenteAction: this.desinvestissementForm.value['prixVenteAction'],
      prixTotalVente: this.desinvestissementForm.value['prixTotalVente'],
      typeSortieRealisee:
        this.desinvestissementForm.value['typeSortieRealisee'],
    };

    this.managementService
      .updateInvSouscription(desinvestissement, 'action')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success(
            'Sortie réalisée spécifiée a été  mise à jour avec succès pour cette participation!'
          );
          this.loadDesinvestissementsRealise();
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Desinvestissements non chargés!');
        },
        complete: () => (this.loading = false),
      })
  }

  // Set the selected desinvestissement
  setSelectedDesinvestissement(desinvestissement: any) {
    this.selectedDesinvestisssment = desinvestissement;
  }

  // Delete the desinvestissement
  deleteDesinvestissement() {
    if (confirm('Veuillez confirmer cette annulation !')) {
      this.selectedDesinvestisssment.sa.dateComiteAutorisantSortie = null;
      this.selectedDesinvestisssment.sa.dateSignatureProtocoleCession = null;
      this.selectedDesinvestisssment.sa.actionsCedees = null;
      this.selectedDesinvestisssment.sa.triRealise = null;
      this.selectedDesinvestisssment.sa.prixVenteAction = null;
      this.selectedDesinvestisssment.sa.prixTotalVente = null;
      this.selectedDesinvestisssment.sa.typeSortieRealisee = null;

      this.managementService
        .updateInvSouscription(this.selectedDesinvestisssment.sa, 'action')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success(
              'Sortie réalisée a été annulée avec succès pour cette participation !'
            );
            this.loadDesinvestissementsRealise();
            this.desinvestissementForm.reset();
          },
          error: () => {
            this.toastr.error('Erreur de chargement!', 'Desinvestissements non chargés!');
          },
          complete: () => (this.loading = false),
        })

    }
  }

  // Load the types of sortie
  loadTypesSortie() {
    this.managementService.findTypesSortie().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data: any) => {
      this.types = data;
    })
  }

  // Go to the fonds home
  goToFiche() {
    this.router.navigateByUrl('/dashboard/funds/' + this.selectedFonds?.id);
  }

  // Export the desinvestissements realized
  exportDesinvestissementRealises() {
    this.divestmentRealizedXlsxService.exportToExcel(
      this.desinvestissementsRealise,
      this.selectedFonds
    );
  }

  equals(a: any, b: any) {
    return a?.id == b?.id;
  }

}
