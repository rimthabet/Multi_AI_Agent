import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoricalFundRatiosComponent } from './historical-fund-ratios.component';

describe('HistoricalFundRatiosComponent', () => {
  let component: HistoricalFundRatiosComponent;
  let fixture: ComponentFixture<HistoricalFundRatiosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoricalFundRatiosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoricalFundRatiosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
