import { Component, DestroyRef, effect, inject, input, OnInit, output, viewChild, model } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { CdsModule } from '@cds/angular';
import { ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ManagementService } from '../../../../services/management.service';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'prospection-create-form',
  imports: [ClarityModule, FormsModule, CdsModule, ReactiveFormsModule, DecimalPipe, CurrencyPipe],
  templateUrl: './prospection-create-form.component.html',
  styleUrl: './prospection-create-form.component.scss'
})
export class ProspectionCreateFormComponent implements OnInit {

  // inputs
  prospection = input<any>();

  // loading
  loading = model<boolean>(false);

  // outputs
  prospectionForm = viewChild.required<ProspectionCreateFormComponent>("prospection_form");
  projectSaveEvent = output<any>();

  // injects
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  private readonly route = inject(ActivatedRoute);

  loading1: boolean = false;
  loading2: boolean = false;
  loading3: boolean = false;
  loading4: boolean = false;
  // forms
  prospectionSaveForm!: FormGroup;


  // data for select
  formes: any[] = [
    { label: 'SA', value: 0 },
    { label: 'SARL', value: 1 },
    { label: 'SUARL', value: 2 },
    { label: 'Patente', value: 3 },
    { label: 'Auto-entrepreneur', value: 4 },
  ];

  promoteurs: any[] | undefined;
  naturesInvestissement: any[] = [];
  typesInvestissement: any[] = [];
  secteurs: any[] = [];

  createdProject: any | undefined;
  _prospection: any | undefined;
  private prefillParams: Record<string, string> = {};

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
      this.applyPrefill();
    });

    // form prospection
    this.prospectionSaveForm = this.formBuilder.group({
      nom: [undefined, [Validators.required]],
      promoteur: [undefined, [Validators.required]],
      activite: [undefined, [Validators.required]],
      forme: [undefined, [Validators.required]],
      capitalSocial: [undefined, [Validators.required]],
      adresseSiege: [undefined, [Validators.required]],
      adresseUsine: [undefined, [Validators.required]],
      rne: [undefined, [Validators.required]],
      longitude: [undefined, [Validators.required]],
      latitude: [undefined, [Validators.required]],
      observations: [undefined, [Validators.required]],
      secteurs: [undefined, [Validators.required]],
      typeInvestissements: [undefined, [Validators.required]],
      natureInvestissements: [undefined, [Validators.required]],
    });

    // load data
    this.loadPromoteurs();
    this.loadNaturesInvestissement();
    this.loadTypesInvestissement();
    this.loadSecteurs();
  }

  // load data promoteurs
  loadPromoteurs() {

    this.loading1 = true;
    this.loading.set(true);

    this.managementService.findPromoteur().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(
      {
        next: (data: any) => {
          this.promoteurs = data;
        },
        error: (data: any) => console.log(data),
        complete: () => {
          this.loading1 = false;
          this.setLoading();
          this.applyPrefill();
        }
      }
    );
  }


  readonly prospectionEffect = effect(() => {
    if (this.prospection()) {
      this.initForm(this.prospection());

    }
  });



  // load data natures investissement
  loadNaturesInvestissement() {
    this.loading2 = true;
    this.loading.set(true);

    this.managementService.findNatureInvestissement().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(
      {
        next: (data: any) => {
          this.naturesInvestissement = data;
        },
        error: (data: any) => console.log(data),
        complete: () => {
          this.loading2 = false;
          this.setLoading();
          this.applyPrefill();
        }
      }
    );
  }

  // load data types investissement
  loadTypesInvestissement() {
    this.loading3 = true;
    this.loading.set(true);

    this.managementService.findTypeInvestissement().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(
      {
        next: (data: any) => {
          this.typesInvestissement = data;
        },
        error: (data: any) => console.log(data),
        complete: () => {
          this.loading3 = false;
          this.setLoading();
          this.applyPrefill();
        }
      }
    );
  }

  // load data secteurs
  loadSecteurs() {
    this.loading4 = true;
    this.loading.set(true);

    this.managementService.findSecteurs().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(
      {
        next: (data: any) => {
          this.secteurs = data;
        },
        error: (data: any) => console.log(data),
        complete: () => {
          this.loading4 = false;
          this.setLoading();
          this.applyPrefill();
        }
      }
    );
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

  private applyPrefill() {
    if (!this.prospectionSaveForm) return;
    if (!Object.keys(this.prefillParams).length) return;

    const nom = this.getParam('nom', 'denomination', 'name');
    const activite = this.getParam('activite', 'activite_projet');
    const adresseSiege = this.getParam('adresse_siege', 'adresseSiege', 'adresse');
    const adresseUsine = this.getParam('adresse_usine', 'adresseUsine');
    const rne = this.getParam('rne');
    const observations = this.getParam('observations');

    const capitalSocial = this.parseNumber(this.getParam('capital_social', 'capitalSocial'));
    const latitude = this.parseNumber(this.getParam('latitude'));
    const longitude = this.parseNumber(this.getParam('longitude'));

    const promoteurValue = this.getParam('promoteur');
    const promoteur = this.promoteurs?.find(p =>
      String(p?.id) === promoteurValue || (p?.nom || p?.libelle || '').toLowerCase() === (promoteurValue || '').toLowerCase()
    );

    const formeValue = this.getParam('forme', 'forme_juridique');
    const forme = this.formes.find(f =>
      String(f?.value) === formeValue || (f?.label || '').toLowerCase() === (formeValue || '').toLowerCase()
    );

    const secteurValue = this.getParam('secteur', 'secteurs');
    const secteur = this.secteurs.find(s =>
      String(s?.id) === secteurValue || (s?.libelle || '').toLowerCase() === (secteurValue || '').toLowerCase()
    );

    const natureValue = this.getParam('nature_investissement', 'natureInvestissements');
    const nature = this.naturesInvestissement.find(n =>
      String(n?.id) === natureValue || (n?.libelle || '').toLowerCase() === (natureValue || '').toLowerCase()
    );

    const typeValue = this.getParam('type_investissement', 'typeInvestissements');
    const type = this.typesInvestissement.find(t =>
      String(t?.id) === typeValue || (t?.libelle || '').toLowerCase() === (typeValue || '').toLowerCase()
    );

    this.prospectionSaveForm.patchValue({
      nom: nom ?? this.prospectionSaveForm.value.nom,
      promoteur: promoteur?.id ?? this.prospectionSaveForm.value.promoteur,
      activite: activite ?? this.prospectionSaveForm.value.activite,
      forme: forme?.value ?? this.prospectionSaveForm.value.forme,
      capitalSocial: capitalSocial ?? this.prospectionSaveForm.value.capitalSocial,
      adresseSiege: adresseSiege ?? this.prospectionSaveForm.value.adresseSiege,
      adresseUsine: adresseUsine ?? this.prospectionSaveForm.value.adresseUsine,
      rne: rne ?? this.prospectionSaveForm.value.rne,
      latitude: latitude ?? this.prospectionSaveForm.value.latitude,
      longitude: longitude ?? this.prospectionSaveForm.value.longitude,
      observations: observations ?? this.prospectionSaveForm.value.observations,
      secteurs: secteur ?? this.prospectionSaveForm.value.secteurs,
      typeInvestissements: type ?? this.prospectionSaveForm.value.typeInvestissements,
      natureInvestissements: nature ?? this.prospectionSaveForm.value.natureInvestissements,
    });
  }


  // init form
  initForm(data?: any) {
    const prospectionData = data ?? this.prospection();
    this._prospection = prospectionData;
    if (!prospectionData) return;
    this.prospectionSaveForm.patchValue({
      nom: prospectionData.nom,
      promoteur: prospectionData?.promoteur?.id,
      activite: prospectionData.activite,
      forme: prospectionData.forme,
      capitalSocial: prospectionData.capitalSocial,
      adresseSiege: prospectionData.adresseSiege,
      adresseUsine: prospectionData.adresseUsine,
      rne: prospectionData.rne,
      longitude: prospectionData.longitude,
      latitude: prospectionData.altitude,
      observations: prospectionData.observations,
      secteurs: prospectionData.secteurs,
      typeInvestissements: prospectionData.typeInvestissement,
      natureInvestissements: prospectionData.natureInvestissement,
    });
  }

  // save projet
  saveProjet() {

    // validation
    if (this.prospectionSaveForm?.invalid) {
      this.toastr.error('', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    // validation observations
    const maxObservationsLength = 1000;
    const observations = this.prospectionSaveForm?.value['observations'];
    if (observations && observations.length > maxObservationsLength) {
      this.toastr.error('',
        `Les observations ne peuvent pas dépasser ${maxObservationsLength} caractères.`
      );
      return;
    }

    // save prospection
    if (!this._prospection()?.id) {
      let projet: any = {
        nom: this.prospectionSaveForm?.value['nom'],
        promoteur: this.promoteurs?.filter(
          (promoteur: any) =>
            promoteur.id == this.prospectionSaveForm?.value['promoteur']
        )[0],
        activite: this.prospectionSaveForm?.value['activite'],
        forme_juridique: this.prospectionSaveForm?.value['forme'],
        capitalSocial: +this.prospectionSaveForm?.value['capitalSocial'],
        adresseSiege: this.prospectionSaveForm?.value['adresseSiege'],
        adresseUsine: this.prospectionSaveForm?.value['adresseUsine'],
        rne: this.prospectionSaveForm?.value['rne'],
        longitude: this.prospectionSaveForm?.value['longitude'],
        altitude: this.prospectionSaveForm?.value['latitude'],
        observations: observations,
        natureInvestissement:
          this.prospectionSaveForm?.value['natureInvestissements'],
        typeInvestissement:
          this.prospectionSaveForm?.value['typeInvestissements'],
        secteurs: [this.prospectionSaveForm?.value['secteurs']],
        tacheRang: 4,
      };

      this.loading.set(true);

      this.managementService.saveProjet(projet).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data: any) => {
          if (data != null) {
            this.projectSaveEvent.emit(data);
            this.createdProject = data;
            this.toastr.success('', 'Projet Ajouté/Modifié avec succès!');
          } ''
        },
        error: (data: any) => console.log(data),
        complete: () => {
          this.setLoading();
        }
      });
    } else {
      this.updateProjet();
    }
  }

  // update prospection
  updateProjet() {

    let prospection = { ...this.prospection() };
    prospection.nom = this.prospectionSaveForm?.value['nom'];
    prospection.promoteur = this.promoteurs?.filter(
      (promoteur: any) =>
        promoteur.id == this.prospectionSaveForm?.value['promoteur']
    )[0];
    prospection.forme = this.prospectionSaveForm?.value['forme'];
    prospection.activite = this.prospectionSaveForm?.value['activite'];
    prospection.capitalSocial =
      +this.prospectionSaveForm?.value['capitalSocial'];
    prospection.adresseSiege = this.prospectionSaveForm?.value['adresseSiege'];
    prospection.adresseUsine = this.prospectionSaveForm?.value['adresseUsine'];
    prospection.rne = this.prospectionSaveForm?.value['rne'];
    prospection.longitude = this.prospectionSaveForm?.value['longitude'];
    prospection.altitude = this.prospectionSaveForm?.value['latitude'];
    prospection.observations = this.prospectionSaveForm?.value['observations'];
    prospection.natureInvestissement =
      this.prospectionSaveForm?.value['natureInvestissements'];
    prospection.typeInvestissement =
      this.prospectionSaveForm?.value['typeInvestissements'];
    prospection.secteurs = [this.prospectionSaveForm?.value['secteurs']];

    this.loading.set(true);
    this.managementService
      .updateProjetProspection(prospection)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(
        {
          next: (data: any) => {
            this.projectSaveEvent.emit(data);
            this.toastr.success('', 'Prospection mise à jour avec succès!');
          },
          error: (data: any) => console.log(data),
          complete: () => {
            this.setLoading();
          }
        }
      );
  }

  // equals function for select
  equals(a: any, b: any) {
    return a?.id == b?.id;
  }

  setLoading() {
    this.loading.set(this.loading1 || this.loading2 || this.loading3 || this.loading4);
  }

}
