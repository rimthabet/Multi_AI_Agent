import { Component, OnInit } from '@angular/core';
import { InvestmentsVestingsComponent } from '../../../investments/investments-vestings/investments-vestings.component';
import { CommonModule, DecimalPipe, DatePipe, PercentPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CdsModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { NgxGaugeModule } from 'ngx-gauge';
import { HorizontalScrollerComponent } from '../../../widgets/horizontal-scroller/horizontal-scroller.component';

@Component({
  selector: 'inv-approved-released',
  imports: [CommonModule, ClarityModule, CdsModule, FormsModule, ReactiveFormsModule, NgxGaugeModule, DecimalPipe, DatePipe, PercentPipe, RouterLink, HorizontalScrollerComponent],
   templateUrl: '../../../investments/investments-vestings/investments-vestings.component.html',
  styleUrl: '../../../investments/investments-vestings/investments-vestings.component.scss'
})
export class InvApprovedReleasedComponent extends InvestmentsVestingsComponent implements OnInit {

  //Initialization
  override ngOnInit(): void {
    //call parent ngOnInit
    super.ngOnInit();
    this.title = 'Investissements approuvés et libérés par les fonds';
  }
}