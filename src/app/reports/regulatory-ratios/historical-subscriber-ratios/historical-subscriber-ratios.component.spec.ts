import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoricalSubscriberRatiosComponent } from './historical-subscriber-ratios.component';

describe('HistoricalSubscriberRatiosComponent', () => {
  let component: HistoricalSubscriberRatiosComponent;
  let fixture: ComponentFixture<HistoricalSubscriberRatiosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoricalSubscriberRatiosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoricalSubscriberRatiosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
