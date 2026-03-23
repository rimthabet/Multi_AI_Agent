import { Component, inject, input, output, effect, OnInit } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { DestroyRef } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe, DecimalPipe, PercentPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SubscriptionVestingsComponent } from "../subscription-vestings/subscription-vestings.component";
import { SubscriptionFormComponent } from "./subscription-form/subscription-form.component";
import { KpiBadge01Component } from "../../../widgets/kpi-badge-01/kpi-badge-01.component";

@Component({
  selector: 'period-subscriptions',
  imports: [ClarityModule, CdsModule, FormsModule, ReactiveFormsModule, DatePipe, PercentPipe, CurrencyPipe, SubscriptionVestingsComponent, SubscriptionFormComponent, KpiBadge01Component],
  templateUrl: './period-subscriptions.component.html',
  styleUrl: './period-subscriptions.component.scss',
  providers: [DatePipe, PercentPipe, DecimalPipe]
})
export class PeriodSubscriptionsComponent implements OnInit {

  // ===== INPUTS =====
  subscription_periode = input<any>();
  fonds = input<any>();
  subscriptions = input<any[]>();
  subscribers = input<any[]>();

  liberation_conformite_documentaire = input<any[]>();
  prospection_conformite_documentaire = input<any[]>();

  // ===== OUTPUTS =====
  refreshEvent = output<void>();

  // ===== SERVICES =====
  managementService = inject(ManagementService);
  toastr = inject(ToastrService);
  destroyRef = inject(DestroyRef);


  // ===== PROPRIÉTÉS=====
  per_periode_subscriptions: any[] = [];
  selected_periode_total_souscrit: number = 0;
  selected_periode_total_libere: number = 0;
  selected_periode_total_subscribers: number = 0;
  selected_periode_total_liberations: number = 0;
  selected_periode_percent_souscrit: number = 0;
  selected_periode_percent_libere: number = 0;

  selectedSubscription: any = null;
  loading: boolean = false;
  tagged_to_update: boolean = false;

  showSubscriptionForm: boolean = false;
  showVestings: boolean = false;

  // ===== EFFET DE RÉINITIALISATION =====
  periodChangeEffect = effect(() => {
    if (this.subscription_periode() && this.subscriptions()) {
      this.calculatePeriodeSubscriptions();
      this.calculateTotals();
      this.calculatePercentages();
    }
  });

  // ===== LIFECYCLE =====
  ngOnInit() {
    this.calculatePeriodeSubscriptions();
    this.calculateTotals();
    this.calculatePercentages();
  }

  ///CALCULATE PERIODE SUBSCRIPTIONS
  calculatePeriodeSubscriptions() {
    const periode = this.subscription_periode();
    const allSubscriptions = this.subscriptions() || [];

    if (!periode || !allSubscriptions.length) {
      this.per_periode_subscriptions = [];
      return;
    }

    const debut = new Date(periode.dateDebut);
    const fin = new Date(periode.dateFin);

    const filtered = allSubscriptions.filter(
      (s: any) =>
        new Date(s.souscription!.dateSouscription).getTime() >= debut.getTime() &&
        new Date(s.souscription!.dateSouscription).getTime() <= fin.getTime()
    );

    this.per_periode_subscriptions = filtered.map((s: any) => ({
      ...s,
      montantLibere: s.liberations?.reduce((a: number, b: any) => a + b?.montantLiberation, 0) || 0,
    })).sort((a: any, b: any) => {
      if (a.souscription?.montantSouscription < b.souscription?.montantSouscription) return 1;
      if (a.souscription?.montantSouscription > b.souscription?.montantSouscription) return -1;
      return 0;
    });
  }

  ///CALCULATE TOTALS
  calculateTotals() {
    this.selected_periode_total_souscrit = this.per_periode_subscriptions.reduce(
      (a: number, b: any) => a + (b.souscription?.montantSouscription || 0),
      0
    );

    this.selected_periode_total_libere = this.per_periode_subscriptions.reduce(
      (a: number, b: any) => a + (b.liberations?.reduce(
        (x: number, y: any) => x + (y?.montantLiberation || 0), 0
      ) || 0),
      0
    );

    this.selected_periode_total_subscribers = new Set(
      this.per_periode_subscriptions.map(
        (a: any) => a.souscription?.souscripteur?.libelle
      )
    ).size;

    this.selected_periode_total_liberations = this.per_periode_subscriptions.reduce(
      (a: number, b: any) => a + (b.liberations?.length || 0),
      0
    );
  }

  ///CALCULATE PERCENTAGES
  calculatePercentages() {
    const fonds = this.fonds();
    this.selected_periode_percent_souscrit = fonds?.montant ? this.selected_periode_total_souscrit / fonds.montant : 0;
    this.selected_periode_percent_libere = this.selected_periode_total_souscrit ? this.selected_periode_total_libere / this.selected_periode_total_souscrit : 0;
  }

  // Vérifie si le document est disponible
  verifierLiberationDocument(liberation: any, lcd: any): any {
    let result = { message: '', status: '', url: '' };

    try {
      let docs = liberation?.documents.filter(
        (d: any) => lcd.documentType.id == d.type.id
      );

      if (docs.length > 0) {
        result.message = docs[0].nomFichier;
        result.status = 'success';
        result.url = docs[0].chemin.replace('/opt/fms/mpm/', '');
        return result;
      }

      if (lcd.qualification == 'OBLIGATOIRE') {
        result.message = 'Document manquant!';
        result.status = 'failure';
        return result;
      }
    } catch (error) {
      console.log(error);
    }

    result.status = 'ignore';
    return result;
  }

  // Delete subscription
  deleteSubscription(subscription_record: any) {

    if (confirm('Voulez-vous vraiment supprimer cette souscription?')) {
      this.managementService.deleteSubscription(subscription_record?.souscription?.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.toastr.success('', 'Souscription supprimée avec succès!');
            this.reloadSubscriptions();
          },
          error: (error: any) => {
            this.toastr.error('', 'Souscription non supprimée!');
          }
        })
    }
  }

  ///RELOAD SUBSCRIPTIONS
  reloadSubscriptions() {
    this.refreshEvent.emit();
  }

  // CHECK FOR UPDATE
  checkForUpdate() {
    if (this.tagged_to_update) {
      this.reloadSubscriptions();
      this.tagged_to_update = false;
    }
  }
}