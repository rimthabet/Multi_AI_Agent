import { CommonModule } from '@angular/common';
import { Component, effect, input } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule, CdsBadgeModule, CdsSearchModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';

@Component({
  selector: 'fund-docs',
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
    CdsSearchModule
  ],
  templateUrl: './fund-docs.component.html',
  styleUrl: './fund-docs.component.scss'
})
export class FundDocsComponent {

  //Inputs
  fonds = input<any>();

  //Properties
  docs: any = [];
  filteredDocs: any = [];

  searchPatternForm!: FormGroup;

  //Initialize
  ngOnInit(): void {
    this.searchPatternForm = new FormGroup({
      pattern: new FormControl(''),
    });

    if (this.fonds()) {
      this.docs = this.fonds().fonds.documents.filter(
        (d: any) => d.type.categorie.libelle == 'Document Juridique'
      );

      this.filteredDocs = [...this.docs];

    }
    this.searchPatternForm.controls['pattern'].valueChanges.subscribe((value: any) => this.filterProjets(value))
  }

  // ===== EFFECTS =====
  readonly docsEffect = effect(() => {
    if (this.fonds()) {
      this.setFonds(this.fonds());
    }
  });

  //Set fonds
  setFonds(data?: any) {
    const fonds = data ?? this.fonds(); // ✅ Utilisation correcte du signal
    if (!fonds) return;

    this.docs = fonds.fonds?.documents?.filter(
      (d: any) => d.type?.categorie?.libelle === 'Document Juridique'
    ) ?? [];

    this.docs.forEach((d: any) => {
      if (d.titre?.toLowerCase().includes('comite_valorisation_')) {
        d.titre = d.titre.substring(25);
      }
    });

    this.docs.sort((d1: any, d2: any) => d1.titre.localeCompare(d2.titre));
    this.filteredDocs = [...this.docs];
  }

  //Trim file title
  trimFileTitle(name: string): string {
    if (name.toLocaleLowerCase().indexOf('comite_valorisation_') >= 0) {
      name = name.substring(25);
      this.trimFileTitle(name);
    }
    return name;
  }

  //Filter projects
  filterProjets($event?: any): void {
    if ($event && $event != '') {
      this.filteredDocs = this.docs.filter((d: any) => (d.titre as string).toLowerCase().match($event!.toLowerCase()))
    }
    else this.filteredDocs = [...this.docs];
  }

  //Refactor path
  refactor(path: any) {
    if (path.indexOf('/opt/fms') >= 0)
      return path.replace('/opt/fms', 'http://www.nasoft.net:8087');

    return 'http://www.nasoft.net:8087/' + path;
  }

}
