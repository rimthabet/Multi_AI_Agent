import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestmentIndustryComponent } from './investment-industry.component';

describe('InvestmentIndustryComponent', () => {
  let component: InvestmentIndustryComponent;
  let fixture: ComponentFixture<InvestmentIndustryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestmentIndustryComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(InvestmentIndustryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
