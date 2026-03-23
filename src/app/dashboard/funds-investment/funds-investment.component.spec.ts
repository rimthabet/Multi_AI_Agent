import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FundsInvestmentComponent } from './funds-investment.component';

describe('FundsInvestmentComponent', () => {
  let component: FundsInvestmentComponent;
  let fixture: ComponentFixture<FundsInvestmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundsInvestmentComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(FundsInvestmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
