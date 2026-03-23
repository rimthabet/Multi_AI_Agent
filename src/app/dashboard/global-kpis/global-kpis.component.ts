import { Component, computed, input } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { DecimalPipe, KeyValuePipe } from '@angular/common';

interface EtatDetails {
  etatName: string;
  count: number;
  color: string;
}

type ProjectsByEtat = Record<number, EtatDetails>;

@Component({
  selector: 'global-kpis',
  imports: [CdsModule, ClarityModule, KeyValuePipe, DecimalPipe],
  templateUrl: './global-kpis.component.html',
  styleUrl: './global-kpis.component.scss'
})
export class GlobalKpisComponent {

  // inputs
  fonds = input<any>();
  projets = input<any>();
  subscriptions = input<any>();

  // Filter on the projects canceled
  canceledProjects = computed(() => {
    const canceled = ['abandon', 'rejeté'];
    return this.projets().filter((p: any) => {
      const etat = p.projet?.etatAvancement?.libelle?.toLowerCase() || '';
      return canceled.some(word => etat.includes(word));
    });
  });

  // Filter on the projects canceled
  activeProjects = computed(() => {
    const canceled = ['abandon', 'rejeté'];
    return this.projets().filter((p: any) => !this.canceledProjects().includes(p));
  });

  // Group projects by state
  activeProjectsByEtatWithDetails = computed<ProjectsByEtat>(() => {
    const projects = this.activeProjects();
    return projects.reduce(this.agrgatingFunction, {});
  });

  // Group projects by state
  inactiveProjectsByEtatWithDetails = computed<ProjectsByEtat>(() => {
    const projects = this.canceledProjects() || [];
    return projects.reduce(this.agrgatingFunction, {});
  });

  // Aggregation function
  private readonly agrgatingFunction = (acc: ProjectsByEtat, project: any) => {
    const etat = project.projet?.etatAvancement;
    if (etat?.id) {
      if (!acc[etat.id]) {
        acc[etat.id] = {
          etatName: etat.libelle,
          count: 0,
          color: etat.couleur
        };
      }
      acc[etat.id].count++;
    }
    return acc;
  }

  // Subscribers
  subscribers = computed(() => {
    const subs = this.subscriptions().filter((sub: any) => sub != undefined);
    return new Set(subs.map((sub: any) => sub.souscripteur?.id).filter(Boolean)).size;
  });

  // Sectors
  secteurs = computed(() => {
    const projets = this.projets();
    return new Set(
      projets
        .flatMap((p: any) => p.projet?.secteurs)
        .map((secteur: any) => secteur.id)
        .filter(Boolean)
    ).size;
  });

  // Promotors
  promoteurs = computed(() => {
    const projets = this.projets();
    return new Set(
      projets
        .map((p: any) => p.projet?.promoteur?.id)
        .filter(Boolean)
    ).size;
  });

}