import {
  Component,
  DestroyRef,
  inject,
  input,
  OnChanges,
  OnInit,
  SimpleChanges,
  viewChild,
} from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { ManagementService } from '../../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DocumentUploadComponent } from '../../../../tools/document-upload/document-upload.component';
import { ComiteInvestmentFormComponent } from '../comite-investment-form/comite-investment-form.component';
import { ComiteInvestmentDocumentGenerationComponent } from '../comite-investment-document-generation/comite-investment-document-generation.component';
import { DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { KpiBadge01Component } from "../../../../widgets/kpi-badge-01/kpi-badge-01.component";

@Component({
  selector: 'funds-comite-investment',
  imports: [
    ClarityModule,
    CdsModule,
    FormsModule,
    ReactiveFormsModule,
    DocumentUploadComponent,
    ComiteInvestmentFormComponent,
    ComiteInvestmentDocumentGenerationComponent,
    DatePipe,
    KpiBadge01Component
  ],
  templateUrl: './funds-comite-investment.component.html',
  styleUrl: './funds-comite-investment.component.scss',
})
export class FundsComiteInvestmentComponent implements OnInit, OnChanges {
  // Inputs
  prospection = input<any>();
  financement = input<any>();
  fonds = input<any>();
  participations = input<any[]>();

  ///viewChild
  comiteForm = viewChild<ComiteInvestmentFormComponent>('comiteForm');

  selectedComite: any = null;
  comite: any = null;

  // injects
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);

  // PROPERTIES
  comites_investissement: any[] | undefined;
  participation: any | undefined;
  conformite_documentaires: any[] = [];

  //INITIALIZE
  ngOnInit(): void {
    this.loadConformiteDocumentaires();
    this.loadComiteInvestissement();
  }

  // LOAD CONFORMITE DOCUMENTAIRES
  loadConformiteDocumentaires() {
    this.managementService
      .findConformitesByTache(2, 11)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.conformite_documentaires = data;
        },
        error: (error: any) => {
          console.error(error);
        },
      });
  }

  // ON CHANGES
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['participations'] && changes['participations'].currentValue) {
      this.participations()?.forEach((p: any) => {
        if (this.fonds()?.id === p.fonds.id) this.setParticipation(p);
      });
    }
  }

  // LOAD COMITE INVESTISSEMENT
  loadComiteInvestissement() {
    this.managementService
      .fetchComiteInvestissements(this.financement()?.id, this.fonds()?.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.comites_investissement = data;
          this.comite = data?.[0];
          this.selectedComite = this.comite;
        },
        error: console.error,
      });
  }

  // ON COMITE CHANGE
  onComiteChange(id: number): void {
    this.selectedComite =
      this.comites_investissement?.find((c) => c.id === id) || null;
  }

  // SET PARTICIPATION
  setParticipation(data: any) {
    this.participation = data;
    this.comiteForm()?.setParticipation(data);
  }
}
