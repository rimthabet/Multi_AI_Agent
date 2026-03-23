import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComiteInvestmentComponent } from './comite-investment.component';

describe('ComiteInvestmentComponent', () => {
  let component: ComiteInvestmentComponent;
  let fixture: ComponentFixture<ComiteInvestmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComiteInvestmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComiteInvestmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
