import { Component, DestroyRef, inject, input, model, OnInit } from '@angular/core';
import { CdsModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { DocumentUploadComponent } from "../../../tools/document-upload/document-upload.component";
import { ManagementService } from '../../../services/management.service';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BusinessPlanComponent } from "./business-plan/business-plan.component";
import { ValuationSharesComponent } from "./valuation-shares/valuation-shares.component";
import { FundsParticipationComponent } from "./funds-participation/funds-participation.component";
import { InvestmentSchemaComponent } from "./investment-schema/investment-schema.component";
import { CaptitalStructureComponent } from "./captital-structure/captital-structure.component";
import { TriHomeComponent } from "./tri-home/tri-home.component";
import { ValuationMethodsComponent } from "./valuation-methods/valuation-methods.component";
import { FinancialDataComponent } from '../../projects-study/financial-data/financial-data.component';
import { DocumentsCollectingComponent } from "./documents-collecting/documents-collecting.component";

@Component({
  selector: 'financial-study',
  imports: [CdsModule, ClarityModule, DocumentUploadComponent, FinancialDataComponent, BusinessPlanComponent, ValuationSharesComponent, FundsParticipationComponent, InvestmentSchemaComponent, CaptitalStructureComponent, TriHomeComponent, ValuationMethodsComponent, DocumentsCollectingComponent],
  templateUrl: './financial-study.component.html',
  styleUrl: './financial-study.component.scss'
})
export class FinancialStudyComponent implements OnInit {
  //INPUT
  prospection = input<any>();

  // loading
  loading = model<boolean>(false);

  // injects
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly router = inject(Router);

  //PROPERTIES
  nda_conformite_documentaires: any | undefined;
  visite_conformite_documentaires: any | undefined;
  ndaAlreadySigned: boolean = false;

  //LIFECYCLE HOOKS
  ngOnInit(): void {
    this.loadConformiteDocumentaires();
    this.loadVisiteConformiteDocumentaires();
  }

  //LOAD CONFORMITE DOCUMENTAIRES
  loadConformiteDocumentaires() {
    this.managementService
      .findConformitesByTache(2, 8)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => (this.nda_conformite_documentaires = data),
        error: (error) => console.error('Erreur lors du chargement des conformités :', error),
        complete: () => console.log('Chargement des conformités terminé')
      })
  }

  //LOAD VISITE CONFORMITE DOCUMENTAIRES
  loadVisiteConformiteDocumentaires() {
    this.managementService
      .findConformitesByTache(2, 7)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => (this.visite_conformite_documentaires = data),
        error: (error) => console.error('Erreur lors du chargement des conformités :', error),
        complete: () => console.log('Chargement des conformités terminé')
      })

  }

  //GO TO LINK
  goToLink() {
    // window.open(
    //   environment.reportingUrl +
    //     '/projet/nda/' +
    //     this.prospection?.id +
    //     '/' +
    //     this.prospection?.promoteur.nom +
    //     '/' +
    //     this.prospection?.promoteur.poste,
    //   '_blank'
    // );
  }

  //GENERER PDF
  genererPDF() {
    //  this.ndaPdfService.genererPDF(this.prospection);
  }

  //GO TO FICHE
  goToFiche() {
    this.router.navigateByUrl('/dashboard/project/' + this.prospection()?.id);
  }
}
