import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule, CdsCardModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';

@Component({
  selector: 'ci-subscription-release',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule,
    CdsCardModule
  ],
  templateUrl: './ci-subscription-release.component.html',
  styleUrl: './ci-subscription-release.component.scss'
})
export class CiSubscriptionReleaseComponent{
 
//Inputs
comite = input<any>();

}
