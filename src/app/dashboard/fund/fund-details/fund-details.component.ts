import { Component, DestroyRef, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule, CdsBadgeModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ManagementService } from '../../../services/management.service';
import { KpiBadge01Component } from "../../../widgets/kpi-badge-01/kpi-badge-01.component";

@Component({
  selector: 'fund-details',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule,
    CdsBadgeModule,
    KpiBadge01Component
],
  templateUrl: './fund-details.component.html',
  styleUrl: './fund-details.component.scss'
})
export class FundDetailsComponent {

  //Inputs
  fonds = input<any>();

  //Signals
  totalActif = input<number>(0);

  //Injects
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);

  //Properties
  mandats: any = [];

  //Set fonds -use internal signal instead
  setFonds(data: any): void {
    this.managementService.findMandats(data.fonds.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (mandatsData: any) => {
        this.mandats = mandatsData;
      },
      error: (data: any) => console.error(data),
    })
  }

}