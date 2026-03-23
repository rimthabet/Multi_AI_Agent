import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestmentChargeComponent } from './investment-charge.component';

describe('InvestmentChargeComponent', () => {
  let component: InvestmentChargeComponent;
  let fixture: ComponentFixture<InvestmentChargeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestmentChargeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvestmentChargeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
