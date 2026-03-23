import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestmentsVestingsComponent } from './investments-vestings.component';

describe('InvestmentsVestingsComponent', () => {
  let component: InvestmentsVestingsComponent;
  let fixture: ComponentFixture<InvestmentsVestingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestmentsVestingsComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(InvestmentsVestingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
