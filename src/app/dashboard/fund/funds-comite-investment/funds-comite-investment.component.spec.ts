import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FundsComiteInvestmentComponent } from './funds-comite-investment.component';

describe('FundsComiteInvestmentComponent', () => {
  let component: FundsComiteInvestmentComponent;
  let fixture: ComponentFixture<FundsComiteInvestmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundsComiteInvestmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FundsComiteInvestmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
