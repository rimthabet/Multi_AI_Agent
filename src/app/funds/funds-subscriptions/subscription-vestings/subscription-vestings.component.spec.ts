import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubscriptionVestingsComponent } from './subscription-vestings.component';

describe('SubscriptionVestingsComponent', () => {
  let component: SubscriptionVestingsComponent;
  let fixture: ComponentFixture<SubscriptionVestingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubscriptionVestingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubscriptionVestingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
