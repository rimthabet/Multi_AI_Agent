import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComiteInvestmentFormComponent } from './comite-investment-form.component';

describe('ComiteInvestmentFormComponent', () => {
  let component: ComiteInvestmentFormComponent;
  let fixture: ComponentFixture<ComiteInvestmentFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComiteInvestmentFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComiteInvestmentFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
