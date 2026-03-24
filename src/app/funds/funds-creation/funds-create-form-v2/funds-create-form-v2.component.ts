import { AfterViewInit, Component, DestroyRef, effect, inject, model, OnInit, output } from '@angular/core';
import { ClrStepperModule, ClrInputModule, ClrPasswordModule, ClrNumberInputModule, ClrTooltipModule, ClrDatepickerModule, ClrSelectModule, ClrComboboxModule } from "@clr/angular";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CdsIconModule } from "@cds/angular";
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { formatDate } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'funds-create-form-v2',
  imports: [ClrStepperModule, ClrInputModule, FormsModule, ReactiveFormsModule, ClrPasswordModule, ClrNumberInputModule, CdsIconModule, ClrTooltipModule, ClrDatepickerModule, ClrSelectModule, ClrComboboxModule],
  templateUrl: './funds-create-form-v2.component.html',
  styleUrl: './funds-create-form-v2.component.scss'
})
export class FundsCreateFormV2Component implements OnInit, AfterViewInit {

  // ===== INPUTS =====
  fonds = model<any>();
  loading = model<boolean>(false);

  // ===== DEPENDENCIES =====
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly toastr = inject(ToastrService);
  private readonly route = inject(ActivatedRoute);

  // ===== TABLE DATA =====
  natures: any[] = [];
  forme_legales: any[] = [];
  cadresInvestissement: any[] = [];
  banques: any[] = [];
  private prefillParams: Record<string, string> = {};
  private prefillApplied = false;
  ngOnInit(): void {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const mapped: Record<string, string> = {};
      Object.keys(params || {}).forEach(key => {
        const value = params[key];
        if (value !== undefined && value !== null && value !== '') {
          mapped[this.normalizeKey(key)] = String(value);
        }
      });
      this.prefillParams = mapped;
      this.applyPrefillTextFields();
    });
  }


  // Fund template form
  templateForm: any = {
    profile: {
      denomination: undefined,
      alias: undefined,
      montant: undefined,
      duree: 10,
      adresseFonds: undefined,
      webSite: undefined,
    },
    dates: {
      date_agrement: '',
      date_lancement: '',
      date_expiration: '',
      date_visa_cmf: '',
    },
    financial_identity: {
      num_visa_cmf: undefined,
      matricule_fiscal: undefined,
      banque: undefined,
    },
    legal_identity: {
      forme_legale: undefined,
      nature: undefined,
      cadre_investissement: undefined
    },
    management_charges: {
      frais_depositaire: undefined,
      frais_gestion: undefined,
    },
    compliance_ratios: {
      ratio_reglementaire: undefined,
      ratio_reglementaire_2: undefined,
      ratio_secteur_activite: undefined,
      ratio_societe: undefined,
      ratio_quasi_fond_propre: undefined,
      ratio_conformite_oca: undefined,
      ratio_investissement: undefined,
    },
    subscriptions_periode_length: {
      nombre_annees: undefined,
    },
  };




  // ===== EFFECTS =====
  readonly fundEffect = effect(() => {

    if (this.fonds()) {

      this.templateForm = {
        profile: {
          denomination: this.fonds()?.denomination,
          alias: this.fonds()?.alias,
          montant: this.fonds()?.montant,
          duree: this.fonds()?.duree,
          adresseFonds: this.fonds()?.adresseFonds,
          webSite: this.fonds()?.webSite,
        },
        dates: {
          date_agrement: formatDate(this.fonds()?.dateAgrement, 'dd/MM/yyyy', 'fr'),
          date_lancement: formatDate(this.fonds()?.dateLancement, 'dd/MM/yyyy', 'fr'),
          date_expiration: formatDate(this.fonds()?.dateExpiration, 'dd/MM/yyyy', 'fr'),
          date_visa_cmf: formatDate(this.fonds()?.dateVisaCMF, 'dd/MM/yyyy', 'fr'),
        },
        financial_identity: {
          num_visa_cmf: this.fonds()?.numVisaCMF,
          matricule_fiscal: this.fonds()?.matriculeFiscal,
          banque: this.fonds()?.banque,
        },
        legal_identity: {
          forme_legale: this.fonds()?.formeLegale,
          nature: this.fonds()?.nature,
          cadre_investissement: this.fonds()?.cadresInvestissement
        },
        management_charges: {
          frais_depositaire: this.fonds()?.fraisDepositaire,
          frais_gestion: this.fonds()?.fraisGestion,
        },
        compliance_ratios: {
          ratio_reglementaire: this.fonds()?.ratioReglementaire,
          ratio_reglementaire_2: this.fonds()?.ratioReglementaire2,
          ratio_secteur_activite: this.fonds()?.ratioSecteurActivite,
          ratio_societe: this.fonds()?.ratioSociete,
          ratio_quasi_fond_propre: this.fonds()?.ratioQuasiFondPropre,
          ratio_conformite_oca: this.fonds()?.ratioConformiteOCA,
          ratio_investissement: this.fonds()?.ratioInvestissement,
        },
        subscriptions_periode_length: {
          nombre_annees: this.fonds()?.nombreAnnees,
        },
      };

    }

  });


  // ===== NG ON INIT =====
  ngAfterViewInit(): void {

    this.loadNatures();
    this.loadFormeLegales();
    this.loadCadresInvestissement();
    this.loadBanques();

  }



  // ===== LOAD NATURES =====
  loadNatures() {

    this.managementService
      .findNatures()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => (this.natures = data),
        error: (error) => console.error(error),
        complete: () => this.applyPrefillSelectFields(),
      });
  }

  // ===== LOAD FORME LEGALES =====
  loadFormeLegales() {
    this.managementService
      .findForme()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => (this.forme_legales = data),
        error: (error) => console.error(error),
        complete: () => this.applyPrefillSelectFields(),
      });
  }

  // ===== LOAD CADRES INVESTISSEMENT =====
  loadCadresInvestissement() {
    this.managementService
      .findCadreInvestissement()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => (this.cadresInvestissement = data),
        error: (error) => console.error(error),
        complete: () => this.applyPrefillSelectFields(),
      });
  }

  // ===== LOAD BANQUES =====
  loadBanques() {
    this.managementService
      .findBanque()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => (this.banques = data),
        error: (error) => console.error(error),
        complete: () => this.applyPrefillSelectFields(),
      });
  }

  private normalizeKey(value: string): string {
    return (value || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  }

  private getParam(...keys: string[]): string | undefined {
    const normalizedKeys = Object.keys(this.prefillParams);
    for (const key of keys) {
      const normKey = this.normalizeKey(key);
      const exact = this.prefillParams[normKey];
      if (exact !== undefined) return exact;

      const contains = normalizedKeys.find(k => k.includes(normKey) || normKey.includes(k));
      if (contains) return this.prefillParams[contains];
    }
    return undefined;
  }

  private parseNumber(value: string | undefined): number | undefined {
    if (!value) return undefined;
    const cleaned = value.replace(/\s/g, '').replace(/,/g, '.');
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : undefined;
  }

  private parseDate(value: string | undefined): string | undefined {
    if (!value) return undefined;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-');
      return `${d}/${m}/${y}`;
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      return value;
    }
    return value;
  }

  private applyPrefillTextFields() {
    if (!Object.keys(this.prefillParams).length) return;

    const profile = this.templateForm.profile;
    profile.denomination = this.getParam('denomination') ?? profile.denomination;
    profile.alias = this.getParam('alias') ?? profile.alias;
    profile.adresseFonds = this.getParam('adresseFonds', 'adresse_fonds', 'adresse') ?? profile.adresseFonds;
    profile.webSite = this.getParam('webSite', 'website', 'site_web') ?? profile.webSite;

    const montant = this.parseNumber(this.getParam('montant'));
    if (montant !== undefined) profile.montant = montant;

    const duree = this.parseNumber(this.getParam('duree'));
    if (duree !== undefined) profile.duree = duree;

    const dates = this.templateForm.dates;
    const dateAgrement = this.parseDate(
      this.getParam('date_agrement', 'dateAgrement', 'date_d_agrement', 'date_d_agrement_du_fonds')
    );
    const dateVisa = this.parseDate(
      this.getParam(
        'date_visa_cmf',
        'dateVisaCMF',
        'date_obtention_visa_cmf',
        'date_obtention_du_visa_cmf',
        'date_obtention_visa',
        'date_visa'
      )
    );
    const dateLancement = this.parseDate(
      this.getParam('date_lancement', 'dateLancement', 'date_du_lancement')
    );
    const dateExpiration = this.parseDate(
      this.getParam('date_expiration', 'dateExpiration', 'date_d_expiration', 'date_du_expiration')
    );
    if (dateAgrement) dates.date_agrement = dateAgrement;
    if (dateVisa) dates.date_visa_cmf = dateVisa;
    if (dateLancement) dates.date_lancement = dateLancement;
    if (dateExpiration) dates.date_expiration = dateExpiration;

    const financial = this.templateForm.financial_identity;
    financial.num_visa_cmf = this.getParam(
      'num_visa_cmf',
      'numVisaCMF',
      'numero_visa_cmf',
      'numero_du_visa_cmf',
      'numero_du_visa'
    ) ?? financial.num_visa_cmf;
    financial.matricule_fiscal = this.getParam('matricule_fiscal', 'matriculeFiscal') ?? financial.matricule_fiscal;

    const charges = this.templateForm.management_charges;
    const fraisDepositaire = this.parseNumber(this.getParam('frais_depositaire', 'fraisDepositaire','frais_du_depositaire','frais_du_dépositaire','frais_dépositaire'));
    const fraisGestion = this.parseNumber(this.getParam('frais_gestion', 'fraisGestion','frais_de_gestion'));
    if (fraisDepositaire !== undefined) charges.frais_depositaire = fraisDepositaire;
    if (fraisGestion !== undefined) charges.frais_gestion = fraisGestion;

    const ratios = this.templateForm.compliance_ratios;
    const ratioKeys = [
      ['ratio_reglementaire', 'ratio_reglementaire'],
      ['ratio_reglementaire_2', 'ratio_reglementaire_2'],
      ['ratio_secteur_activite', 'ratio_secteur_activite'],
      ['ratio_societe', 'ratio_societe'],
      ['ratio_quasi_fond_propre', 'ratio_quasi_fond_propre'],
      ['ratio_conformite_oca', 'ratio_conformite_oca'],
      ['ratio_investissement', 'ratio_investissement'],
    ] as const;

    ratioKeys.forEach(([key, field]) => {
      const val = this.parseNumber(this.getParam(key));
      if (val !== undefined) {
        (ratios as any)[field] = val;
      }
    });

    const sub = this.templateForm.subscriptions_periode_length;
    const nombreAnnees = this.parseNumber(this.getParam('nombre_annees', 'nombreAnnees'));
    if (nombreAnnees !== undefined) sub.nombre_annees = nombreAnnees;
  }

  private applyPrefillSelectFields() {
    if (!Object.keys(this.prefillParams).length) return;

    const financial = this.templateForm.financial_identity;
    const legal = this.templateForm.legal_identity;

    const banqueValue = this.getParam('banque', 'banque_dépositaire', 'banque_depositaire', 'banquedepositaire', 'banque_depoitaire');
    if (banqueValue && this.banques.length) {
      const normalizedValue = this.normalizeKey(banqueValue);
      const banque = this.banques.find(b => {
        const libelle = b?.libelle || '';
        const label = this.normalizeKey(libelle);
        const acronym = libelle.split(/[\s'-]+/).filter((w: string) => w.length > 0).map((w: string) => w.charAt(0).toLowerCase()).join('');
        return String(b?.id) === banqueValue 
            || (label && normalizedValue && label === normalizedValue)
            || (acronym && normalizedValue && acronym === normalizedValue)
            || (normalizedValue.length > 2 && label.includes(normalizedValue));
      });
      if (banque) financial.banque = banque;
    }

    const formeValue = this.getParam('forme_legale', 'formeLegale', 'formelegale', 'forme_légale');
    if (formeValue && this.forme_legales.length) {
      const normalizedValue = this.normalizeKey(formeValue);
      const forme = this.forme_legales.find(f => {
        const libelle = f?.libelle || '';
        const label = this.normalizeKey(libelle);
        const acronym = libelle.split(/[\s'-]+/).filter((w: string) => w.length > 0 && !['de', 'a', 'à', 'la', 'le', 'et', 'en', 'au'].includes(w.toLowerCase())).map((w: string) => w.charAt(0).toLowerCase()).join('');
        return String(f?.id) === formeValue 
            || (label && normalizedValue && label === normalizedValue)
            || (acronym && normalizedValue && acronym === normalizedValue)
            || (normalizedValue.length > 2 && label.includes(normalizedValue));
      });
      if (forme) legal.forme_legale = forme;
    }

    const natureValue = this.getParam('nature', 'natures');
    if (natureValue && this.natures.length) {
      const normalizedValue = this.normalizeKey(natureValue);
      const nature = this.natures.find(n => {
        const label = this.normalizeKey(n?.libelle || '');
        return String(n?.id) === natureValue 
            || (label && normalizedValue && label === normalizedValue)
            || (normalizedValue.length > 2 && label.includes(normalizedValue));
      });
      if (nature) legal.nature = nature;
    }

    const cadreValue = this.getParam('cadre_investissement', 'cadres_investissement' , 'cadre_d_investissement' , 'cadres_d_investissement', 'cadre_dinvestissement', 'cadres_dinvestissement', 'cadreinvestissement', 'cadresinvestissement');
    if (cadreValue && this.cadresInvestissement.length) {
      const parts = cadreValue.split(',').map(v => this.normalizeKey(v)).filter(Boolean);
      const selected = this.cadresInvestissement.filter(c => {
        const label = this.normalizeKey(c?.libelle || '');
        return parts.some(p => {
          return String(c?.id) === p 
              || (label && p && label === p)
              || (p.length > 2 && label.includes(p));
        });
      });
      if (selected.length) legal.cadre_investissement = selected;
    }
  }


  // ===== SAVE FUND =====
  saveFund() {

    this.loading.set(true);

    const [d1, m1, y1] = this.templateForm.dates.date_agrement ? (this.templateForm.dates?.date_agrement as string).split('/') : [];
    const dateAgrement = d1 && m1 && y1 ? new Date(+y1, +m1 - 1, +d1) : null;

    const [d2, m2, y2] = this.templateForm.dates.date_lancement ? (this.templateForm.dates.date_lancement as string).split('/') : [];
    const dateLancement = d2 && m2 && y2 ? new Date(+y2, +m2 - 1, +d2) : null;

    const [d3, m3, y3] = this.templateForm.dates.date_expiration ? (this.templateForm.dates.date_expiration as string).split('/') : [];
    const dateExpiration = d3 && m3 && y3 ? new Date(+y3, +m3 - 1, +d3) : null;

    const [d4, m4, y4] = this.templateForm.dates.date_visa_cmf ? (this.templateForm.dates.date_visa_cmf as string).split('/') : [];
    const dateVisaCMF = d4 && m4 && y4 ? new Date(+y4, +m4 - 1, +d4) : null;

    let fund: any = {

      // Profile
      denomination: this.templateForm.profile?.denomination,
      alias: this.templateForm.profile?.alias,
      montant: this.templateForm.profile?.montant,
      duree: this.templateForm.profile?.duree,
      webSite: this.templateForm.profile?.webSite,

      // Dates
      dateAgrement: dateAgrement,
      dateLancement: dateLancement,
      dateExpiration: dateExpiration,
      dateVisaCMF: dateVisaCMF,

      // Financial Identity
      numVisaCMF: this.templateForm?.financial_identity?.num_visa_cmf,
      matriculeFiscal: this.templateForm?.financial_identity?.matricule_fiscal,

      // Banque
      banque: this.templateForm?.financial_identity?.banque,
      adresseFonds: this.templateForm?.profile?.adresseFonds,
      fraisDepositaire: this.templateForm?.management_charges?.frais_depositaire,
      fraisGestion: this.templateForm?.management_charges?.frais_gestion,

      // Legal Identity
      nature: this.templateForm?.legal_identity?.nature,
      formeLegale: this.templateForm?.legal_identity?.forme_legale,
      cadresInvestissement: this.templateForm?.legal_identity?.cadre_investissement,

      // Due
      nombreAnnees: this.templateForm?.subscriptions_periode_length?.nombre_annees,
    };


    // Conditial saving for the ratios 
    if (this.templateForm.legal_identity.nature &&
      this.templateForm.legal_identity.nature['id'] == 2
    ) {

      fund = {
        ...fund,
        ratioReglementaire: this.templateForm?.compliance_ratios?.ratio_reglementaire,
        ratioReglementaire2: this.templateForm?.compliance_ratios?.ratio_reglementaire_2,
        ratioSecteurActivite: this.templateForm?.compliance_ratios?.ratio_secteur_activite,
        ratioSociete: this.templateForm?.compliance_ratios?.ratio_societe,
        ratioQuasiFondPropre: this.templateForm?.compliance_ratios?.ratio_quasi_fond_propre,
        ratioConformiteOCA: this.templateForm?.compliance_ratios?.ratio_conformite_oca,
        ratioInvestissement: this.templateForm?.compliance_ratios?.ratio_investissement,
      };

    };

    // Si mise à jour, ajouter l'ID
    if (this.fonds()) {
      fund.id = this.fonds()?.id;
    }

    // Appeler le bon service
    if (this.fonds()) {
      // Mise à jour
      this.managementService.updateFonds(fund).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (result: any) => {
          this.toastr.success('Fonds mis à jour avec Succès!');
          this.fonds.set(result);
        },
        error: (error) => {
          this.toastr.error('Erreur lors de la mise à jour du fonds', 'Erreur');
        },
        complete: () => {
          this.loading.set(false);
        }
      });
    } else {
      // Création
      this.managementService.saveFonds(fund).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (result: any) => {
          this.toastr.success('Fonds Ajouté avec Succès!');
          this.fonds.set(result);
        },
        error: (error) => {
          this.toastr.error('Erreur lors de la création du fonds', 'Erreur');
        },
        complete: () => {
          this.loading.set(false);
        }
      });
    }
  }

  // ===== EQUALS =====
  equals(a: any, b: any) {
    return a?.id == b?.id;
  }

}