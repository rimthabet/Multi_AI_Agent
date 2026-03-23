import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownComponent } from 'ngx-markdown';

interface TocItem {
  id: string;
  title: string;
  level: number;
  children?: TocItem[];
}

@Component({
  selector: 'app-documentation',

  imports: [CommonModule, MarkdownComponent],
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss']
})
export class IndexComponent implements OnInit, AfterViewInit {

  @ViewChild('markdownContainer', { static: false }) markdownContainer!: ElementRef;

  // Table of Contents data
  tableOfContents: TocItem[] = [];
  activeSection: string = '';
  sidebarCollapsed: boolean = false;

  // Embedded markdown content with proper heading IDs
  documentationMarkdown = `
# Documentation {#documentation}

## 1. Création d'un fonds {#creation-fonds}

### 1.1 Détails {#details-fonds}
La création d'un fonds nécessite la définition des **caractéristiques principales** :
- Nom du fonds
- Stratégie d'investissement
- Durée de vie
- Montant cible

### 1.2 Commissaires aux comptes {#commissaires-comptes}
Désignation des auditeurs externes pour assurer la conformité réglementaire.

Les commissaires aux comptes doivent être :
- Certifiés et agréés
- Indépendants de la société de gestion
- Expérimentés dans le secteur financier

### 1.3 Périodes de souscription {#periodes-souscription}
- **Première clôture** : Date d'ouverture aux investisseurs
- **Clôtures intermédiaires** : Périodes additionnelles
- **Clôture finale** : Date limite de souscription

#### 1.3.1 Calendrier type {#calendrier-type}
Le processus de souscription suit généralement ce calendrier :
1. Préparation des documents (2-3 mois)
2. Marketing auprès des investisseurs (3-6 mois)
3. Première clôture
4. Clôtures intermédiaires (si nécessaire)

### 1.4 Documents {#documents-fonds}
Documents requis pour la constitution :
\`\`\`
- Prospectus d'information
- Règlement de gestion
- DICI (Document d'Informations Clés pour l'Investisseur)
- Contrats de distribution
\`\`\`

### 1.5 Révision {#revision-fonds}
Validation finale par les équipes juridiques et de conformité.

---

## 2. Création d'un projet {#creation-projet}

### 2.1 Prospection {#prospection}
Identification des opportunités d'investissement potentielles sur le marché.

#### 2.1.1 Sources de deal flow {#sources-deal-flow}
- Réseau professionnel
- Banques d'affaires
- Autres fonds de private equity
- Approche directe

### 2.2 Présélection {#preselection}
> **Note importante** : Cette étape permet de filtrer les projets selon nos critères d'investissement.

Critères de présélection :
1. Secteur d'activité cible
2. Taille de l'entreprise
3. Géographie
4. Rentabilité attendue

### 2.3 Étude {#etude}
Analyse approfondie incluant :
- **Due diligence financière**
- **Due diligence juridique**  
- **Due diligence commerciale**
- **Due diligence ESG**

#### 2.3.1 Due diligence financière {#dd-financiere}
Analyse des états financiers historiques et prévisionnels.

#### 2.3.2 Due diligence juridique {#dd-juridique}
Vérification de la conformité réglementaire et des aspects contractuels.

### 2.4 Comité interne {#comite-interne}
Présentation du projet devant l'équipe d'investissement interne.

### 2.5 Comité d'investissement {#comite-investissement}
Décision finale d'investissement par le comité composé de :
- Associés gérants
- Experts externes
- Représentants des investisseurs

---

## 3. Investissement {#investissement}

### 3.1 Collecte des documents {#collecte-documents}
Rassemblement de tous les documents contractuels nécessaires à la finalisation.

### 3.2 Souscriptions des fonds {#souscriptions-fonds}
Processus de souscription et de versement des capitaux par les investisseurs.

#### 3.2.1 Processus de souscription {#processus-souscription}
1. Réception des bulletins de souscription
2. Vérification des documents KYC
3. Validation par le comité de souscription
4. Appel de fonds

---

## 4. Suivi et gestion {#suivi-gestion}

### 4.1 Reporting {#reporting}
Suivi régulier des investissements et communication aux investisseurs.

### 4.2 Gouvernance {#gouvernance}
Participation aux conseils d'administration des sociétés en portefeuille.

---

## 5. Sortie {#sortie}

### 5.1 Stratégies de sortie {#strategies-sortie}
- Vente industrielle
- Vente financière (LBO secondaire)
- Introduction en bourse
- Management buy-out

### 5.2 Processus de cession {#processus-cession}
Étapes de la cession d'un investissement.

---

*Dernière mise à jour : ${new Date().toLocaleDateString('fr-FR')}*
  `.trim();

  constructor() { }

  ngOnInit(): void {
    this.generateTableOfContents();
  }

  ngAfterViewInit(): void {
    // Add scroll listener for active section highlighting
    setTimeout(() => {
      this.setupScrollListener();
    }, 1000);
  }

  // Generate table of contents from markdown headings
  generateTableOfContents(): void {
    const headingRegex = /^(#{1,6})\s+(.+?)\s*(?:\{#([^}]+)\})?$/gm;
    const toc: TocItem[] = [];
    const stack: TocItem[] = [];

    let match;
    while ((match = headingRegex.exec(this.documentationMarkdown)) !== null) {
      const level = match[1].length;
      const title = match[2].trim();
      const id = match[3] || this.generateId(title);

      const item: TocItem = {
        id,
        title,
        level,
        children: []
      };

      // Handle nesting
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      if (stack.length === 0) {
        toc.push(item);
      } else {
        const parent = stack[stack.length - 1];
        if (!parent.children) parent.children = [];
        parent.children.push(item);
      }

      stack.push(item);
    }

    this.tableOfContents = toc;
  }

  // Generate ID from title
  generateId(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  }

  // Scroll to section
  scrollToSection(id: string): void {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      this.activeSection = id;
    }
  }

  // Setup scroll listener for active section highlighting
  setupScrollListener(): void {
    const headings = document.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.activeSection = entry.target.id;
          }
        });
      },
      {
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0
      }
    );

    headings.forEach(heading => observer.observe(heading));
  }

  // Toggle sidebar
  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  // Method to handle markdown loading errors
  onMarkdownError(error: any): void {
    console.error('Error loading markdown:', error);
  }

  // Method to handle markdown load success
  onMarkdownLoad(): void {
    // Re-setup scroll listener after content loads
    setTimeout(() => {
      this.setupScrollListener();
    }, 100);
  }
}