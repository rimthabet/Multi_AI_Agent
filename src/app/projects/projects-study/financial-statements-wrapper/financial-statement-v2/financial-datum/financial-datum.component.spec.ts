import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancialDatumComponent } from './financial-datum.component';

describe('FinancialDatumComponent', () => {
  let component: FinancialDatumComponent;
  let fixture: ComponentFixture<FinancialDatumComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancialDatumComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinancialDatumComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
