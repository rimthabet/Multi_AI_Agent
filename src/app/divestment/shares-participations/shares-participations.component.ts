import { CommonModule, formatDate } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DivestmentParticipationActionsXlsxService } from '../../services/reports/divestment-participation-actions-xlsx.service';

@Component({
  selector: 'shares-participations',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule,
    RouterLink
  ],
  templateUrl: './shares-participations.component.html',
  styleUrl: './shares-participations.component.scss'
})
export class SharesParticipationsComponent implements OnInit {

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);
  private readonly router = inject(Router);
  private readonly divestmentParticipationActionsXlsxService = inject(DivestmentParticipationActionsXlsxService);

  public participationForm!: FormGroup;

  participationsAction: any[] = [];
  fonds: any[] = [];
  types: any[] = [];

  selectedFonds: any = null;
  selectedParticipation: any = {};

  fonds_loading: boolean = true;
  loading: boolean = false;
  participationModalOpened: boolean = false;

  ngOnInit(): void {

    this.participationForm = this.fb.group({
      dateSortieEsperee: ['', [Validators.required]],
      triEspere: ['', [Validators.required]],
      typeSortieEsperee: ['', [Validators.required]],
    });

    // Load the funds list
    this.findFondsList();

  }

  // Select the fonds
  selectFonds(fond: any) {
    this.selectedFonds = fond;
    this.loadParticipationsAction();
    sessionStorage.setItem('LastVisitedFunds', fond.id);
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

        this.loadTypesSortie();
        this.selectFonds(this.selectedFonds);

      },
      error: () => {
        this.toastr.error('Erreur de chargement!', 'Fonds non chargés!');
      },
      complete: () => (this.fonds_loading = false),
    })
  }

  // Load the participations action
  loadParticipationsAction() {
    this.loading = true;
    this.participationsAction = [];

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
          this.participationsAction = data;
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Participations non chargées!');
        },
        complete: () => (this.loading = false),
      })

  }

  displayParticipationModal(participation: any) {
    this.selectedParticipation = participation;

    this.participationForm.patchValue({
      triEspere: participation?.sa?.triEspere,
      dateSortieEsperee: participation?.sa?.dateSortieEsperee
        ? formatDate(participation.sa.dateSortieEsperee, 'MM-dd-yyyy', 'en-US')
        : '',
      typeSortieEsperee: participation?.sa?.typeSortieEsperee,
    });

    this.participationModalOpened = true;
  }

  // Update the participation action
  updateParticipationsAction() {
    const [d1, m1, y1] = this.participationForm?.value['dateSortieEsperee'].split('/');
    let participation = {
      ...this.selectedParticipation.sa,
      triEspere: this.participationForm.value['triEspere'],
      dateSortieEsperee: new Date(y1, m1 - 1, d1),
      typeSortieEsperee: this.participationForm.value['typeSortieEsperee'],
    };


    this.managementService
      .updateInvSouscription(participation, 'action')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success(
            'Sortie espérée spécifiée a été  mise à jour avec succès pour cette participation !'
          );
          this.loadParticipationsAction();
        },
        error: () => {
          this.toastr.error('Erreur de mise à jour!', 'Participation non mise à jour!');
        }
      })
  }

  // Load the types of sortie
  loadTypesSortie() {
    this.managementService.findTypesSortie().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data: any) => {
      this.types = data;
    })
  }

  // Set the selected participation
  setSelectedParticipation(participation: any) {
    this.selectedParticipation = participation;
  }

  // Delete the participation
  deleteParticipation() {
    if (confirm('Veuillez confirmer cette annulation !')) {
      this.selectedParticipation.sa.triEspere = null;
      this.selectedParticipation.sa.dateSortieEsperee = null;
      this.selectedParticipation.sa.typeSortieEsperee = null;

      this.managementService
        .updateInvSouscription(this.selectedParticipation.sa, 'action')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success(
              'Sortie espérée a été annulée avec succès pour cette participation !'
            );
            this.loadParticipationsAction();
            this.participationForm.reset();
          },
          error: (error: any) => {
            this.toastr.error(
              "Une erreur est survenue lors de l'annulation."
            );
          },
        })
    }

  }

  // Go to the fonds home
  goToFiche() {
    this.router.navigateByUrl('/dashboard/funds/' + this.selectedFonds?.id);
  }

  // Export the participation action
  exportParticipationAction() {
    this.divestmentParticipationActionsXlsxService.exportToExcel(
      this.participationsAction,
      this.selectedFonds
    );
  }

  equals(a: any, b: any) {
    return a?.id == b?.id;
  }

}
