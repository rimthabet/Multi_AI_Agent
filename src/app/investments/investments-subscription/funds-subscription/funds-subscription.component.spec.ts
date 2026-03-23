import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FundsSubscriptionComponent } from './funds-subscription.component';

describe('FundsSubscriptionComponent', () => {
  let component: FundsSubscriptionComponent;
  let fixture: ComponentFixture<FundsSubscriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundsSubscriptionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FundsSubscriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
