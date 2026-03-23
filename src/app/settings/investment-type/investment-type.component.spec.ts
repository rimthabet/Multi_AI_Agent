import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestmentTypeComponent } from './investment-type.component';

describe('InvestmentTypeComponent', () => {
  let component: InvestmentTypeComponent;
  let fixture: ComponentFixture<InvestmentTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestmentTypeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvestmentTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
