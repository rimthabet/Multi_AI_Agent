import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FundsDivestmentComponent } from './funds-divestment.component';

describe('FundsDivestmentComponent', () => {
  let component: FundsDivestmentComponent;
  let fixture: ComponentFixture<FundsDivestmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundsDivestmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FundsDivestmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
