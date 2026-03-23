import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FundsSubscriberSubscriptionsComponent } from './funds-subscriber-subscriptions.component';

describe('FundsSubscriberSubscriptionsComponent', () => {
  let component: FundsSubscriberSubscriptionsComponent;
  let fixture: ComponentFixture<FundsSubscriberSubscriptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundsSubscriberSubscriptionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FundsSubscriberSubscriptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
