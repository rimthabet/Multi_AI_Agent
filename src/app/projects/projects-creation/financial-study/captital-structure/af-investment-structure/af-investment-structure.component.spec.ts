import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AfInvestmentStructureComponent } from './af-investment-structure.component';

describe('AfInvestmentStructureComponent', () => {
  let component: AfInvestmentStructureComponent;
  let fixture: ComponentFixture<AfInvestmentStructureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AfInvestmentStructureComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AfInvestmentStructureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
