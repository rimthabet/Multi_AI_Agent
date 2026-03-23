import { Component, DestroyRef, inject, input, output } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'member-meeting',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule
  ],
  templateUrl: './member-meeting.component.html',
  styleUrl: './member-meeting.component.scss'
})
export class MemberMeetingComponent {

  reunion = input<any>();
  actionnaires = input<any>();
  administrateurs = input<any>();
  commisaires_aux_comptes = input<any>();
  fonds = input<any>();
  refresh = output<any>(); 

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);
 

  types: any[] = [
    { id: 0, libelle: 'Fonds' },
    { id: 1, libelle: 'Actionnaire' },
    { id: 2, libelle: 'Administrateur' },
    { id: 3, libelle: 'Commissaire aux comptes' },
  ];

  selectedMemberNature: string = 'Administrateur';

  membreSaveForm: FormGroup = this.fb.group({
    actionnaire: [''],
    administrateur: [''],
    commisaire: [''],
    fonds: [''],
    autre: [''],
    libelle: [''],
    description: [''],
    luiMeme: ['', [Validators.required]],
  });

  // After view init
  ngAfterViewInit(): void {
    this.membreSaveForm.get('actionnaire')!.valueChanges.subscribe((value) => {
      if (value) {
        this.membreSaveForm.get('libelle')!.setValue(value.libelle);
        this.membreSaveForm.get('luiMeme')!.setValue(true);
      } else {
        this.membreSaveForm.get('luiMeme')!.setValue(false);
        this.membreSaveForm.get('libelle')!.reset();
      }
    });

    this.membreSaveForm
      .get('administrateur')!
      .valueChanges.subscribe((value) => {
        if (value) {
          this.membreSaveForm.get('libelle')!.setValue(value.libelle);
          this.membreSaveForm.get('luiMeme')!.setValue(true);
        } else {
          this.membreSaveForm.get('luiMeme')!.setValue(false);
          this.membreSaveForm.get('libelle')!.reset();
        }
      });

    this.membreSaveForm.get('fonds')!.valueChanges.subscribe((value) => {
      if (value) {
        this.membreSaveForm.get('libelle')!.setValue(value.libelle);
        this.membreSaveForm.get('luiMeme')!.setValue(true);
      } else {
        this.membreSaveForm.get('luiMeme')!.setValue(false);
        this.membreSaveForm.get('libelle')!.reset();
      }
    });
  }

  saveMembre() {
    let membre: any = {
      reunion: { id: this.reunion()?.id },
      description: this.membreSaveForm.get('description')?.value,
      type: this.types.find((type) => type.libelle == this.selectedMemberNature)
        ?.id,
    };
    switch (this.selectedMemberNature) {
      case 'Actionnaire':
        membre.actionnaire = this.membreSaveForm.get('actionnaire')?.value;
        membre.libelle = this.membreSaveForm.get('luiMeme')?.value
          ? membre.actionnaire?.libelle
          : this.membreSaveForm.get('libelle')?.value;
        break;

      case 'Administrateur':
        membre.administrateur =
          this.membreSaveForm.get('administrateur')?.value;
        membre.libelle = this.membreSaveForm.get('luiMeme')?.value
          ? membre.administrateur?.nom
          : this.membreSaveForm.get('libelle')?.value;
        break;

      case 'Fonds':
        membre.fonds = this.membreSaveForm.get('fonds')?.value;
        membre.libelle = this.membreSaveForm.get('libelle')?.value;
        break;

      case 'Commissaire aux comptes':
        membre.commisaireAuxComptes =
          this.membreSaveForm.get('commisaire')?.value;
        break;

      case 'Autre':
        membre.autre = this.membreSaveForm.get('autre')?.value;
        break;

      default:
        return;
    } 
      this.managementService.saveMembre(membre).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data: any) => {
          console.log('Membre saved successfully:', data);
          this.toastr.success('Membre sauvegardé avec succès !');
          this.refresh.emit({ reunionId: this.reunion()?.id, membre: data });
        },
        error: (error: any) => {
          console.error('Error saving membre:', error);
          this.toastr.error('Une erreur est survenue lors de la sauvegarde du membre !');
        },

        complete: () => {
          this.membreSaveForm.reset();
        },
      })
  
  }

  // Method to check if the current form is invalid
  invalidForm() {
    switch (this.selectedMemberNature) {
      case 'Actionnaire':
        return (
          this.membreSaveForm.get('actionnaire')?.invalid ||
          this.membreSaveForm.get('luiMeme')?.invalid ||
          this.membreSaveForm.get('libelle')?.invalid
        );
      case 'Administrateur':
        return (
          this.membreSaveForm.get('administrateur')?.invalid ||
          this.membreSaveForm.get('luiMeme')?.invalid ||
          this.membreSaveForm.get('libelle')?.invalid
        );
      case 'Fonds':
        return (
          this.membreSaveForm.get('fonds')?.invalid ||
          this.membreSaveForm.get('libelle')?.invalid
        );
      case 'Commissaire aux comptes':
        return (
          !this.membreSaveForm.get('commisaire')?.value ||
          this.membreSaveForm.get('commisaire')?.invalid
        );
      case 'Autre':
        return (
          !this.membreSaveForm.get('autre')?.value ||
          this.membreSaveForm.get('autre')?.invalid ||
          !this.membreSaveForm.get('description')?.value ||
          this.membreSaveForm.get('description')?.invalid
        );
      default:
        return true;
    }
  }

  equals(a: any, b: any) {
    return a?.id == b?.id;
  }

}
