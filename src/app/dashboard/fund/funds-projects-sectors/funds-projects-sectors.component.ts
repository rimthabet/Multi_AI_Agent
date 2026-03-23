import { Component, input } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { DecimalPipe } from '@angular/common';
import { effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { KpiBadge01Component } from "../../../widgets/kpi-badge-01/kpi-badge-01.component";

@Component({
  selector: 'funds-projects-sectors',
  imports: [ClarityModule, CdsModule, DecimalPipe, RouterLink, KpiBadge01Component],
  templateUrl: './funds-projects-sectors.component.html',
  styleUrl: './funds-projects-sectors.component.scss'
})
export class FundsProjectsSectorsComponent {
  // Input
  secteurs = input<any[]>();

  // variables
  nbrProjets: number = 0;
  nbrSecteurs: number = 0;
  averagePart: number = 0;

  moyenneActif: number = 0;
  totalActif: number = 0;

  maxActif: number = 0;
  minActif: number = 0;

  projets: any[] = [];

  projetMaxActif: any | undefined;
  projetMinActif: any | undefined;
  userRoles: any | undefined;
  isAdmin: boolean = false;

  // Effects
  readonly secteursEffect = effect(() => {
    this.loadProjets();
  },);


  // Load projets
  loadProjets(): void {

    this.projets = [];

    this.nbrProjets = 0;
    this.averagePart = 0;
    this.moyenneActif = 0;
    this.totalActif = 0;
    this.minActif = 0;
    this.maxActif = 0;

    this.projetMaxActif = '';
    this.projetMinActif = '';

    this.secteurs()?.forEach((secteur: any) => {
      this.nbrProjets += secteur.projets.length;

      secteur.projets.forEach((projet: any) => {
        this.averagePart += projet.part;

        if (this.minActif == 0 || projet.actif < this.minActif) {
          this.minActif = projet.actif;
          this.projetMinActif = projet.p.nom;
        }

        if (projet.actif > this.maxActif) {
          this.maxActif = projet.actif;
          this.projetMaxActif = projet.p.nom;
        }

        this.totalActif += projet.actif;

        projet.p.nom = projet.p.nom.toUpperCase();
        this.projets.push(projet);
      });
    });

    this.projets.sort((a: any, b: any) => {
      if (a.actif < b.actif) return 1;
      if (a.actif > b.actif) return -1;

      if (a.p.nom < b.p.nom) return -1;
      if (a.p.nom > b.p.nom) return 1;
      return 0;
    });

    this.averagePart /= this.nbrProjets;
    this.moyenneActif = this.totalActif / this.nbrProjets;
  }


  // format
  formatPercent(n: number) {
    return (n * 100).toFixed(1) + '%';
  }

}
