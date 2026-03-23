import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, input, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { NgxGaugeModule } from 'ngx-gauge';
import { ManagementService } from '../../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'ratio-widget-oca',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule,
    NgxGaugeModule
  ],
  templateUrl: './ratio-widget-oca.component.html',
  styleUrl: './ratio-widget-oca.component.scss'
})
export class RatioWidgetOcaComponent implements OnInit {

  private readonly managementService = inject(ManagementService);
  private readonly destroyRef = inject(DestroyRef);

  //Inputs
  liberations = input<any>();
  projet = input<any>();

  //Properties
  capital = 0;
  montantOCA = 0;
  ratio: any;
  loading = true;

  //Initialization
  ngOnInit(): void {

    try {
      this.liberations().filter((l: any) => l.souscription.financement.projet.id == this.projet().id)
      this.montantOCA = this.liberations().reduce((sum: number, l: any) => sum + l.montantLiberation, 0);
    } catch { }

    this.managementService.findCapitalProjet(this.projet().id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.capital = data?.capital;
        this.ratio = (100.0 * this.montantOCA / this.capital).toFixed(2);
      },
      error: (err) => console.log(err),
      complete: () => this.loading = false
    })

  }

  //Parse foreground color
  parseForeColor() {
    if (this.ratio && +this.ratio >= 5) return '#33cc33';
    else return '#ff1a1a'
  }



}
