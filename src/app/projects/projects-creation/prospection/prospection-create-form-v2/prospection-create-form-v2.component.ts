import { AfterViewInit, Component, DestroyRef, effect, inject, model } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ClrStepperModule, ClrInputModule, ClrNumberInputModule, ClrSelectModule, ClrComboboxModule, ClrTextareaModule } from "@clr/angular";
import { FormBuilder, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../../services/management.service';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { CdsIconModule } from "@cds/angular";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';


@Component({
  selector: "prospection-create-form-v2",
  standalone: true,
  imports: [ClrStepperModule, ClrInputModule, ReactiveFormsModule, FormsModule, ClrNumberInputModule, ClrSelectModule, CurrencyPipe, CdsIconModule, DecimalPipe, ClrComboboxModule, ClrTextareaModule],
  templateUrl: './prospection-create-form-v2.component.html',
  styleUrl: './prospection-create-form-v2.component.scss'
})
export class ProspectionCreateFormV2Component implements AfterViewInit {


  loading = model<boolean>(false);
  prospection = model<any>(null);

  // injects
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);

  // data for select
  readonly formes: any[] = [
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

  ////  Form
  prospectionSaveForm = this.formBuilder.group({
    general_info: this.formBuilder.group({
      nom: [undefined, [Validators.required]],
      promoteur: [undefined, [Validators.required]],
      activite: [undefined, [Validators.required]],
      forme: [undefined, [Validators.required]],
      capitalSocial: [undefined, [Validators.required]],
      secteurs: [undefined, [Validators.required]]
    }),
    localization_info: this.formBuilder.group({
      adresseSiege: [undefined, [Validators.required]],
      adresseUsine: [undefined],
      longitude: [undefined],
      latitude: [undefined],
    }),
    administrative_info: this.formBuilder.group({
      rne: [undefined, [Validators.required]],
      typeInvestissements: [undefined, [Validators.required]],
      natureInvestissements: [undefined, [Validators.required]],
    }),
    observations_info: this.formBuilder.group({
      observations: [undefined],
    }),
  });

  // Fullfilling the form when it is a modif view
  prospectionEffect = effect(() => {

    if (this.prospection() && this.prospection().id) {
      this.prospectionSaveForm.patchValue({
        general_info: {
          nom: this.prospection()?.nom,
          promoteur: this.prospection()?.promoteur,
          activite: this.prospection()?.activite,
          forme: this.formes.find((forme: any) => forme.value == this.prospection()?.forme),
          capitalSocial: this.prospection()?.capitalSocial,
          secteurs: this.prospection()?.secteurs[0]
        },
        localization_info: {
          adresseSiege: this.prospection()?.adresseSiege,
          adresseUsine: this.prospection()?.adresseUsine,
          longitude: this.prospection()?.longitude,
          latitude: this.prospection()?.altitude,
        },
        administrative_info: {
          rne: this.prospection()?.rne,
          typeInvestissements: this.prospection()?.typeInvestissement,
          natureInvestissements: this.prospection()?.natureInvestissement,
        },
        observations_info: {
          observations: this.prospection()?.observations,
        },
      });

      console.log("prospection", this.prospection());
    }

  })


  ////// Life cycle hooks
  ngAfterViewInit(): void {

    this.loadPromoteurs();
    this.loadNaturesInvestissement();
    this.loadTypesInvestissement();
    this.loadSecteurs();

  }

  ////////////////////// Save and Update functions 

  // save projet
  saveProjet() {

    // validation
    if (this.prospectionSaveForm?.invalid) {
      this.toastr.error('', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    const forme: any = this.prospectionSaveForm?.get('general_info')?.get('forme')?.value;

    // save prospection
    if (!this.prospection()?.id) {
      let projet: any = {
        nom: this.prospectionSaveForm?.get('general_info')?.get('nom')?.value,
        promoteur: this.prospectionSaveForm?.get('general_info')?.get('promoteur')?.value,
        activite: this.prospectionSaveForm?.get('general_info')?.get('activite')?.value,
        forme: forme?.value,
        capitalSocial: +this.prospectionSaveForm?.get('general_info')?.get('capitalSocial')?.value!,
        adresseSiege: this.prospectionSaveForm?.get('localization_info')?.get('adresseSiege')?.value,
        adresseUsine: this.prospectionSaveForm?.get('localization_info')?.get('adresseUsine')?.value,
        rne: this.prospectionSaveForm?.get('administrative_info')?.get('rne')?.value,
        longitude: this.prospectionSaveForm?.get('localization_info')?.get('longitude')?.value,
        altitude: this.prospectionSaveForm?.get('localization_info')?.get('latitude')?.value,
        observations: this.prospectionSaveForm?.get('observations_info')?.get('observations')?.value,
        natureInvestissement:
          this.prospectionSaveForm?.get('administrative_info')?.get('natureInvestissements')?.value,
        typeInvestissement:
          this.prospectionSaveForm?.get('administrative_info')?.get('typeInvestissements')?.value,
        secteurs: Array.isArray(
          this.prospectionSaveForm?.get('general_info.secteurs')?.value
        )
          ? this.prospectionSaveForm?.get('general_info.secteurs')?.value
          : [this.prospectionSaveForm?.get('general_info.secteurs')?.value],
        tacheRang: 4,
      };

      this.loading.set(true);
      console.log("Projet", projet);

      this.managementService.saveProjet(projet).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data: any) => {
          if (data != null) {
            this.prospection.set(data);
            this.toastr.success('', 'Projet Ajouté/Modifié avec succès!');
          } ''
        },
        error: (data: any) => console.log(data),
        complete: () => {
          this.loading.set(false);
        }
      });
    } else {
      this.updateProjet();
    }
  }

  // update prospection
  updateProjet() {
    let prospection = { ...this.prospection() };
    prospection.nom = this.prospectionSaveForm?.get('general_info.nom')?.value;

    const forme: any = this.prospectionSaveForm?.get('general_info')?.get('forme')?.value;

    prospection.promoteur = this.prospectionSaveForm?.get('general_info')?.get('promoteur')?.value;
    prospection.forme = forme?.value;
    prospection.activite = this.prospectionSaveForm?.get('general_info.activite')?.value;
    const capitalSocialValue = this.prospectionSaveForm?.get('general_info.capitalSocial')?.value;
    prospection.capitalSocial = capitalSocialValue ? +capitalSocialValue : 0;

    prospection.adresseSiege = this.prospectionSaveForm?.get('localization_info.adresseSiege')?.value;
    prospection.adresseUsine = this.prospectionSaveForm?.get('localization_info.adresseUsine')?.value;
    prospection.longitude = this.prospectionSaveForm?.get('localization_info.longitude')?.value;
    prospection.altitude = this.prospectionSaveForm?.get('localization_info.latitude')?.value;

    prospection.rne = this.prospectionSaveForm?.get('administrative_info.rne')?.value;
    prospection.natureInvestissement = this.prospectionSaveForm?.get('administrative_info.natureInvestissements')?.value;
    prospection.typeInvestissement = this.prospectionSaveForm?.get('administrative_info.typeInvestissements')?.value;

    prospection.observations = this.prospectionSaveForm?.get('observations_info.observations')?.value;

    prospection.secteurs = Array.isArray(
      this.prospectionSaveForm?.get('general_info.secteurs')?.value
    )
      ? this.prospectionSaveForm?.get('general_info.secteurs')?.value
      : [this.prospectionSaveForm?.get('general_info.secteurs')?.value];

    this.loading.set(true);
    this.managementService
      .updateProjetProspection(prospection)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(
        {
          next: (data: any) => {
            this.toastr.success('', 'Prospection mise à jour avec succès!');
          },
          error: (data: any) => console.log(data),
          complete: () => {
            this.loading.set(false);
          }
        }
      );
  }


  ////////////////////// Loading data functions
  // load data promoteurs
  loadPromoteurs() {

    this.loading.set(true);

    this.managementService.findPromoteur().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(
      {
        next: (data: any) => {
          this.promoteurs = data;
        },
        error: (data: any) => console.log(data),
        complete: () => {
          this.loading.set(false);
        }
      }
    );
  }


  // load data natures investissement
  loadNaturesInvestissement() {
    this.loading.set(true);

    this.managementService.findNatureInvestissement().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(
      {
        next: (data: any) => {
          this.naturesInvestissement = data;
        },
        error: (data: any) => console.log(data),
        complete: () => {
          this.loading.set(false);
        }
      }
    );
  }

  // load data types investissement
  loadTypesInvestissement() {
    this.loading.set(true);

    this.managementService.findTypeInvestissement().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(
      {
        next: (data: any) => {
          this.typesInvestissement = data;
        },
        error: (data: any) => console.log(data),
        complete: () => {
          this.loading.set(false);
        }
      }
    );
  }

  // load data secteurs
  loadSecteurs() {
    this.loading.set(true);

    this.managementService.findSecteurs().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(
      {
        next: (data: any) => {
          this.secteurs = data;
        },
        error: (data: any) => console.log(data),
        complete: () => {
          this.loading.set(false);
        }
      }
    );
  }

  equals(a: any, b: any): boolean {
    return a?.id === b?.id;
  }

  // for the forme juridique select
  equals2(a: any, b: any): boolean {
    return a?.value === b?.value;
  }
}