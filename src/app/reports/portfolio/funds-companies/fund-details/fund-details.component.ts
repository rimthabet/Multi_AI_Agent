import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, input, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ManagementService } from '../../../../services/management.service';
import { environment } from '../../../../../environment/environment';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
    CdsInputModule
  ],
  templateUrl: './fund-details.component.html',
  styleUrl: './fund-details.component.scss'
})
export class FundDetailsComponent implements OnInit {

  //Inputs
  data = input<any>();

  //Dependency injection
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);

  //Properties
  fonds: any | undefined;
  subscriptions: any[] | undefined;
  firstExerciseYear: number = 0;
  gestionnaire: string = environment.company_long_name;
  responsable_information: string = environment.responsable_information;

  //Initialization
  ngOnInit(): void {
    if (this.data()) this.setData(this.data());
  }

  //Set data
  setData(data: any): void {
    this.fonds = data.fonds;
    this.managementService.findSouscriptionsByFonds(this.fonds?.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => { this.subscriptions = data; this.firstExerciseYear = new Date(data[0].dateSouscription).getFullYear(); },
      error: (data: any) => console.error(data)
    })
  }


}
