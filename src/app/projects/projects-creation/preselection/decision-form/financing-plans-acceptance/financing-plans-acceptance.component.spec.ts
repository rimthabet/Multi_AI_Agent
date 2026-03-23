import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancingPlansAcceptanceComponent } from './financing-plans-acceptance.component';

describe('FinancingPlansAcceptanceComponent', () => {
  let component: FinancingPlansAcceptanceComponent;
  let fixture: ComponentFixture<FinancingPlansAcceptanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancingPlansAcceptanceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinancingPlansAcceptanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
