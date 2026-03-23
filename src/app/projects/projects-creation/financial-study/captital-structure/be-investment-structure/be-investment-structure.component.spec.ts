import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeInvestmentStructureComponent } from './be-investment-structure.component';

describe('BeInvestmentStructureComponent', () => {
  let component: BeInvestmentStructureComponent;
  let fixture: ComponentFixture<BeInvestmentStructureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeInvestmentStructureComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeInvestmentStructureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
