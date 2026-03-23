import { CommonModule, formatDate } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DivestmentParticipationCcaXlsxService } from '../../services/reports/divestment-participation-cca-xlsx.service';

@Component({
  selector: 'cca-participations',
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
  templateUrl: './cca-participations.component.html',
  styleUrl: './cca-participations.component.scss'
})
export class CCAParticipationsComponent implements OnInit {

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);
  private readonly router = inject(Router);
  private readonly divestmentParticipationCcaXlsxService = inject(DivestmentParticipationCcaXlsxService);

  public participationForm!: FormGroup;

  fonds: any[] = [];
  participationsCCA: any[] = [];

  selectedFonds: any = null;
  selectedParticipation: any = null;

  fonds_loading: boolean = true;
  loading: boolean = false;
  participationModalOpened: boolean = false;

  ngOnInit(): void {

    this.participationForm = this.fb.group({
      dateSortie: ['', [Validators.required]],
    });


    this.loadFonds();
  }


  // Load list of funds
  loadFonds() {
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
            this.selectFund(selectedFond);
          } else {
            this.selectFund(data[0]);
            sessionStorage.setItem('LastVisitedFunds', data[0].id);
          }
        } else {
          this.selectFund(data[0]);
          sessionStorage.setItem('LastVisitedFunds', data[0].id);
        }

        this.selectFund(this.selectedFonds);
      },
      error: () => {
        this.toastr.error('Erreur de chargement!', 'Fonds non chargés!');
      },
      complete: () => (this.fonds_loading = false),
    })
  }


  // Select the fund
  selectFund(fund: any) {
    this.selectedFonds = fund;
    this.loadParticipationsCca();
    sessionStorage.setItem('LastVisitedFunds', fund.id);
  }


  // Load the participations CCA
  loadParticipationsCca() {
    this.loading = true;
    this.managementService
      .findInvSoucriptionCcaByFonds(this.selectedFonds.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          data.sort((a: any, b: any) => {
            if (a.sc.financement.projet.nom > b.sc.financement.projet.nom)
              return 1;
            if (a.sc.financement.projet.nom < b.sc.financement.projet.nom)
              return -1;

            if (a.sc.dateSignatureContrat < b.sc.dateSignatureContrat)
              return -1;
            if (a.sc.dateSignatureContrat > b.sc.dateSignatureContrat)
              return 1;

            return 0;
          });

          this.participationsCCA = data;
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Participations non chargées!');
        },
        complete: () => (this.loading = false),
      })
  }

  // Display the participation modal
  displayParticipationModal(participation: any) {
    this.selectedParticipation = participation;
    this.participationForm.patchValue({
      dateSortie: participation?.sc?.dateSortie
        ? formatDate(participation.sc.dateSortie, 'MM-dd-yyyy', 'en-US')
        : '',
    });
    this.participationModalOpened = true;
  }

  // Update the participation cca
  updateParticipationsCca() {
    const [d1, m1, y1] = this.participationForm?.value['dateSortie'].split('/');
    let participation = {
      ...this.selectedParticipation.sc,
      dateSortie: new Date(y1, m1 - 1, d1),
    };

    this.managementService
      .updateInvSouscription(participation, 'cca')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success(
            'La date de sortie a été mise à jour avec succès pour cette participation!'
          );
          this.loadParticipationsCca();
        },
        error: () => {
          this.toastr.error('Erreur de mise à jour!', 'Participation non mise à jour!');
        }
      })
  }

  // Set the selected participation
  setSelectedParticipation(participation: any) {
    this.selectedParticipation = participation;
  }

  // Delete the participation
  deleteParticipation() {
    if (confirm('Veuillez confirmer cette annulation !')) {
      this.selectedParticipation.sc.dateSortie = null;

      this.managementService
        .updateInvSouscription(this.selectedParticipation.sc, 'cca')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success(
              'La date de sortie a été annulée avec succès pour cette participation!'
            );
            this.loadParticipationsCca();
            this.participationForm.reset();
          },
          error: () => {
            this.toastr.error('Erreur de mise à jour!', 'Participation non mise à jour!');
          }
        })
    }
  }

  // Go to the fonds home
  goToFiche() {
    this.router.navigateByUrl('/dashboard/funds/' + this.selectedFonds?.id);
  }

  // Export the participations CCA
  exportParticipationCCA() {
    this.divestmentParticipationCcaXlsxService.exportToExcel(
      this.participationsCCA,
      this.selectedFonds
    );
  }

  equals(a: any, b: any) {
    return a?.id == b?.id;
  }

}
