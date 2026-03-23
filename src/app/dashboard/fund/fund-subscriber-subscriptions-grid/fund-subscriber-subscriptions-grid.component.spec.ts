import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FundSubscriberSubscriptionsGridComponent } from './fund-subscriber-subscriptions-grid.component';

describe('FundSubscriberSubscriptionsGridComponent', () => {
  let component: FundSubscriberSubscriptionsGridComponent;
  let fixture: ComponentFixture<FundSubscriberSubscriptionsGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundSubscriberSubscriptionsGridComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(FundSubscriberSubscriptionsGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
