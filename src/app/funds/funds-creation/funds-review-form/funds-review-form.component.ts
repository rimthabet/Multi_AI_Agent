import { Component, DestroyRef, inject, input, OnInit } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../services/management.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'funds-review-form',
 
  imports: [ClarityModule, CdsModule, FormsModule, ReactiveFormsModule],
  providers: [DatePipe],
  templateUrl: './funds-review-form.component.html',
  styleUrl: './funds-review-form.component.scss'
})
export class FundsReviewFormComponent implements OnInit {
  // ===== INPUTS =====
  fonds = input<any>();

  // ===== DEPENDENCIES =====
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly toastr = inject(ToastrService);
  private readonly datePipe = inject(DatePipe);

  // ===== PROPERTIES =====
  denomination: string = '';
  alias: string = '';
  montant: number = 0;
  duree: number = 0;
  date_lancement: string = '';
  date_expiration: string = '';
  date_visa_cmf: string = '';
  num_visa_cmf: string = '';
  matriculeFiscale: string = '';
  banque: string = '';
  adresseFonds: string = '';
  frais_depositaire: number = 0;
  frais_gestion: number = 0;
  nature: string = '';

  forme_legale: string = '';
  cadresInvestissement: any[] = [];
  ratio_reglementaire: number = 0;
  ratio_reglementaire_souscripteur: number = 0;
  ratio_emploi_fiscale: number = 0;
  ratio_secteur_activite: number = 0;
  ratio_societe: number = 0;
  ratio_quasi_fond_propre: number = 0;
  ratio_conformite_oca: number = 0;
  ratio_investissement: number = 0;
  nombre_annees: number = 0;
  documents: any[] = [];

  // ===== INITIALIZE =====
  ngOnInit(): void {
    if (this.fonds()) this.initForm();
  }

  // ===== INIT FORM =====
  initForm(data?: any) {
    if (data) this.fonds = data;
    else data = this.fonds();
    this.managementService.findFondsById(data.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.fonds = data.fonds;
          this.denomination = this.fonds().denomination;
          this.alias = this.fonds().alias;
          this.montant = this.fonds().montant;  
          this.duree = this.fonds().duree;
          this.date_lancement = this.datePipe.transform(new Date(this.fonds().dateLancement), 'dd/MM/yyyy') || '';
          this.date_expiration = this.datePipe.transform(new Date(this.fonds().dateExpiration), 'dd/MM/yyyy') || '';
          this.date_visa_cmf = this.datePipe.transform(new Date(this.fonds().dateVisaCMF), 'dd/MM/yyyy') || '';
          this.num_visa_cmf = this.fonds().numVisaCMF;
          this.matriculeFiscale = this.fonds().matriculeFiscale;
          this.banque = this.fonds().banque.libelle;
          this.adresseFonds = this.fonds().adresseFonds;
          this.frais_depositaire = this.fonds().fraisDepositaire;
          this.frais_gestion = this.fonds().fraisGestion;
          this.nature = this.fonds().nature.libelle;

          this.forme_legale = this.fonds().formeLegale?.libelle;
          this.ratio_reglementaire = this.fonds().ratioReglementaire;
          this.ratio_reglementaire_souscripteur =
            this.fonds().ratioReglementaireSouscripteur;
          this.ratio_emploi_fiscale = this.fonds().ratioEmploiFiscale;
          this.ratio_secteur_activite = this.fonds().ratioSecteurActivite;
          this.ratio_societe = this.fonds().ratioSociete;
          this.ratio_quasi_fond_propre = this.fonds().ratioQuasiFondPropre;
          this.ratio_conformite_oca = this.fonds().ratioConformiteOCA;
          this.ratio_investissement = this.fonds().ratioInvestissement;
          this.nombre_annees = this.fonds().nombreAnnees;

          if (this.fonds().cadresInvestissement != null) {
            this.fonds().cadresInvestissement.forEach((element: any) => {
              this.cadresInvestissement.push(element.libelle);
            });
          }

          this.documents = this.fonds().documents;
        },
        error: (error) => console.error(error),
      })

  }

  // ===== VALIDATE FONDS =====
  validerFonds() {
    this.managementService
      .validationFonds(this.fonds().fonds.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          if (data != null)
            this.toastr.success(
              'Fonds appouvé avec Succès!',
              'Fonds appouvé avec Succès!'
            );
          else this.toastr.error('', 'Error!');
        },
        error: (error) => console.error(error),
      });
  }


}

