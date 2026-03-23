import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, inject, input, OnInit, output } from '@angular/core';
import { CdsButtonModule, CdsIconModule, CdsDividerModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { KpiBadge01Component } from "../../../widgets/kpi-badge-01/kpi-badge-01.component";
import { ManagementService } from '../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule, RouterLink } from '@angular/router';
@Component({
  selector: 'fund-card',
  imports: [ClarityModule, CdsButtonModule, RouterLink, RouterModule, CdsIconModule, CdsDividerModule, DecimalPipe, DatePipe, KpiBadge01Component],
  templateUrl: './fund-card.component.html',
  styleUrl: './fund-card.component.scss'
})
export class FundCardComponent implements OnInit {

  fund = input<any>({});
  readonly displayEtatChangePopup = output<any>({
    alias: 'openEtatChangePopup'
  });

  private readonly managementService = inject(ManagementService);
  private readonly destroyRef = inject(DestroyRef);

  periodes_souscription: any[] = [];
  participations: any[] = [];
  restricted_conformites: any[] | undefined;

  souscriptions: any[] = [];
  foreColor: string = 'black';
  bgColor: string = '#8ccde9';
  statut: string = '';

  total_actif = 0;
  total_investi_actions = 0;
  total_investi_cca = 0;
  total_investi_oca = 0;

  // Lifecycle hooks
  ngOnInit(): void {

    this.loadFundStats();
    this.loadSouscriptions();
    this.loadSubscriptionPeriodes();
    this.loadFundConformiteDocuments();
  }

  // Load fund stats
  loadFundStats() {
    this.managementService
      .findStatsByFund(this.fund().id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.total_investi_actions = data.invA?.reduce((n: number, s: any) => n + s.montantLiberation, 0);
          this.total_investi_cca = data.invC?.reduce((n: number, s: any) => n + s.montantLiberation, 0);
          this.total_investi_oca = data.invO?.reduce((n: number, s: any) => n + s.montantLiberation, 0);
        },
        error: (error: any) => {
          console.log(error);
        }
      });
  }

  // Load subscription periods
  loadSubscriptionPeriodes() {
    this.managementService
      .findSubscriptionPeriodes(this.fund().id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          console.log(data);
          this.periodes_souscription = data;
        },
        error: (error: any) => {
          console.log(error);
        }
      });
  }

  // Load souscriptions
  loadSouscriptions() {
    this.managementService
      .findSouscriptionsByFonds(this.fund().id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data: any) => {
        this.souscriptions = data;
        this.total_actif = data.reduce(
          (n: number, s: any) => n + s.montantSouscription,
          0
        );
      });
  }

  // Load fund conformite documents
  loadFundConformiteDocuments() {
    this.managementService
      .findConformiteDocumentsByFund(this.fund().id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.restricted_conformites = data.filter(
            (c: any) => c.conformite.phase.rang == 1
          );
        },
        error: (error: any) => {
          console.log(error);
        }
      });
  }

  // Check if a date is expired
  isExpired(dateFin: Date) {
    return new Date(dateFin).getTime() < new Date().getTime();
  }

  log() {
    console.log(this.fund());
  }
}

