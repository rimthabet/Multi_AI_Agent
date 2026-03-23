import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestmentsSubscriptionComponent } from './investments-subscription.component';

describe('InvestmentsSubscriptionComponent', () => {
  let component: InvestmentsSubscriptionComponent;
  let fixture: ComponentFixture<InvestmentsSubscriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestmentsSubscriptionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvestmentsSubscriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
