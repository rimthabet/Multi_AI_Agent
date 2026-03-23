import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FundsSubscriptionsComponent } from './funds-subscriptions.component';

describe('FundsSubscriptionsComponent', () => {
  let component: FundsSubscriptionsComponent;
  let fixture: ComponentFixture<FundsSubscriptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundsSubscriptionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FundsSubscriptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
