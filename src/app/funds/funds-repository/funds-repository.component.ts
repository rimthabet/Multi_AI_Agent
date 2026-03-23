import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, Validators } from '@angular/forms';
import { UiService } from '../../services/ui.service';
import { ManagementService } from '../../services/management.service';
import { ToastrService } from 'ngx-toastr';
import { CdsModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { RouterModule, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FundCardComponent } from "../funds-widgets/fund-card/fund-card.component";
import { ClrCommonFormsModule } from "@clr/angular";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-funds-repository',
  imports: [CommonModule, RouterModule, RouterLink, FormsModule, ReactiveFormsModule, ClarityModule, CdsModule, FundCardComponent, ClrCommonFormsModule],
  templateUrl: './funds-repository.component.html',
  styleUrl: './funds-repository.component.scss'
})
export class FundsRepositoryComponent implements OnInit {

  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  private readonly router = inject(Router);

  etatForm: any;
  searchPatternForm: any;
  fondsFilterForm: any;

  fonds: any[] = [];
  filteredFonds: any[] = [];
  etats: any[] = [];
  etats_rejets: any[] = [];
  filteredEtats: any[] = [];
  filteredNatures: any[] = [];

  natures: any[] | undefined;

  layout: string = 'grid';
  selectedFunds: any = null;
  etatChangeModalOpened: boolean = false;
  isAdmin: boolean = false;
  loading: boolean = true;

  userRoles: any | undefined;
  profile: any | undefined;
  filteredNature: any | undefined;

  ngOnInit(): void {

    this.etatForm = this.formBuilder.group({
      etat: [undefined, [Validators.required]],
    });

    this.searchPatternForm = this.formBuilder.group({
      pattern: [undefined],
    });

    this.fondsFilterForm = this.formBuilder.group({
      type: ['tout', [Validators.required]],
    });

    // this.searchPatternForm.controls['pattern'].valueChanges.subscribe(
    //   (value: string) => this.filterFonds(value)
    // );

    this.loadNatures();
    // this.loadProfile();
    this.loadFonds();
    this.loadEtat();
  }


  loadNatures() {
    this.managementService
      .findNatures().pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => (this.natures = data),
        error: (error) => console.error(error)
      });
  }

  loadProfile() {
    // if (this.keycloak.isLoggedIn()) {
    //   this.keycloak
    //     .loadUserProfile()
    //     .then((profile) => {
    //       this.profile = profile;
    //       this.userRoles = this.keycloak.getUserRoles(true);
    //       this.isAdmin = this.userRoles.includes('ADMIN');
    //     })
    //     .catch((error) => {
    //       console.error(
    //         'Erreur lors du chargement du profil utilisateur:',
    //         error
    //       );
    //     });
    // } else {
    // }
  }

  filterFonds($event?: any): void {

    if ($event && $event.trim() !== '') {
      this.filteredFonds = this.fonds.filter((f: any) =>
        (f.denomination as string)
          .toLowerCase()
          .includes($event.toLowerCase())
      );
    } else {
      this.filteredFonds = [...this.fonds];
    }

    ///// filter etat
    if (this.filteredEtats.length > 0) {
      let filteredEtatsLibelles: any[] = this.filteredEtats.map(
        (e: any) => e.id
      );

      this.filteredFonds = this.filteredFonds.filter((f: any) =>
        filteredEtatsLibelles.includes(f.etat?.id)
      );
    }

    ///// filter nature
    if (this.filteredNatures.length > 0) {
      let filteredNatureLibelles: any[] = this.filteredNatures.map(
        (n: any) => n.id
      );

      this.filteredFonds = this.filteredFonds.filter((f: any) =>
        filteredNatureLibelles.includes(f.nature?.id)
      );
    }
  }

  // load fonds
  loadFonds() {
    this.managementService.findFonds()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data: any) => {
        this.fonds = data;
        if (this.profile?.attributes?.fonds.length > 0) {
          this.fonds = this.fonds.filter((fonds: any) =>
            this.profile?.attributes?.fonds.includes(fonds.id.toString())
          );
        }
        this.filteredFonds = this.fonds;
        this.loading = false;
      });
  }

  // load etats fonds
  loadEtat() {
    this.managementService.findEtatsFonds()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          data.sort((e1: any, e2: any) =>
            e1.libelle > e2.libelle ? 1 : e1.libelle < e2.libelle ? -1 : 0
          );
          this.etats = data.filter(
            (e: any) =>
              !(e.libelle as string).toLowerCase().startsWith('rejeté')
          );
          this.etats_rejets = data.filter((e: any) =>
            (e.libelle as string).toLowerCase().startsWith('rejeté')
          );
        },
      })
  }

  // update etat fonds
  updateEtat() {
    let etat = this.etatForm.get('etat')?.value;
    this.managementService
      .updateFundsEtat(this.selectedFunds.id, etat)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.toastr.success('', 'État du fonds mis à jour avec succès!');
          this.etatChangeModalOpened = false;
          this.selectedFunds = null;
          this.loadFonds();
        },
      })
  }

  // display etat change modal
  displayEtatChangeModal(fonds: any) {
    this.selectedFunds = fonds;
    this.etatForm.setValue({
      etat: fonds?.etat ? fonds?.etat : '',
    });
    this.etatChangeModalOpened = true;
  }

  // filter nature  
  filterNature(nature: any) {
    const even = (e: any) => e.id == nature.id;
    if (!this.filteredNatures.some(even)) {
      this.filteredNatures.push(nature);
      this.filterFonds();
    }
  }

  // cancel filter nature
  cancelFilterNature(nature: any) {
    this.filteredNatures = this.filteredNatures.filter(
      (n: any) => n.id != nature.id
    );
    this.filterFonds();
  }

  filterEtat(etat: any) {
    const even = (e: any) => e.id == etat.id;
    if (!this.filteredEtats.some(even)) {
      this.filteredEtats.push(etat);
      this.filterFonds();
    }
  }

  cancelFilterEtat(etat: any) {
    this.filteredEtats = this.filteredEtats.filter((e: any) => e.id != etat.id);
    this.filterFonds();
  }


}
