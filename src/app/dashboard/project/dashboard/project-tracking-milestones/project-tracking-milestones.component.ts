import { Component, effect, inject, input, OnInit, output } from '@angular/core';
import _ from 'lodash';
import { ManagementService } from '../../../../services/management.service';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { DatePipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 'project-tracking-milestones',
  imports: [ClarityModule, CdsModule, DecimalPipe, DatePipe],
  templateUrl: './project-tracking-milestones.component.html',
  styleUrl: './project-tracking-milestones.component.scss'
})
export class ProjectTrackingMilestonesComponent implements OnInit {

  projet = input<any>();
  dataReady = output<any>();
  private readonly managementService = inject(ManagementService);

  projectChangeEffect = effect(() => {
    if (this.projet()?.projet) {
      this.loadSouscriptions();
    }
  });

  loading: boolean = false;
  souscriptions: any = [];

  ngOnInit() {
    this.loadSouscriptions();
  }

  loadSouscriptions() {
    if (!this.projet()?.projet?.id) return;

    this.loading = true;

    this.managementService
      .findSouscriptionsByProjet(this.projet()?.projet.id)
      .subscribe({
        next: (data: any) => {
          // Initialize as empty array
          let souscriptions: any[] = [];

          // Process PSA if available
          if (data?.psa?.length) {
            souscriptions = data.psa.map((sa: any) => ({
              p: sa.financement?.projet,
              date: sa.dateBulletin,
              fonds: sa.fonds,
              montant: sa.montant,
              actions: sa.actions,
              nominal: sa.nominal,
              type: 'Actions',
            }));
          }

          // Process PSO if available
          if (data?.pso?.length) {
            souscriptions = [
              ...souscriptions,
              ...data.pso.map((so: any) => ({
                p: so.financement?.projet,
                date: so.dateBulletin,
                fonds: so.fonds,
                montant: so.montant,
                actions: so.nombreOCA,
                nominal: so.nominal,
                type: 'OCA',
              }))
            ];
          }

          // Process PSC if available
          if (data?.psc?.length) {
            souscriptions = [
              ...souscriptions,
              ...data.psc.map((sc: any) => ({
                p: sc.financement?.projet,
                date: sc.dateSignatureContrat,
                fonds: sc.fonds,
                montant: sc.montant,
                actions: null,
                nominal: null,
                type: 'CCA',
              }))
            ];
          }

          // Group by date
          const grouped = _.groupBy(souscriptions, (p) => p.date);

          // Process grouped data
          this.souscriptions = Object.keys(grouped).map((key: any) => {
            const uniqueFonds: any[] = [];
            grouped[key].forEach((item: any) => {
              if (!uniqueFonds.some(fond => fond.fonds?.id === item.fonds?.id)) {
                uniqueFonds.push(item);
              }
            });
            return { d: key, p: uniqueFonds };
          });

          // Sort by date descending
          this.souscriptions.sort((s1: any, s2: any) => {
            if (s1.d > s2.d) return -1;
            if (s1.d < s2.d) return 1;
            return 0;
          });

          this.dataReady.emit(this.souscriptions);
        },
        error: (err) => {
          console.error('Error loading souscriptions:', err);
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        }
      });
  }

}
