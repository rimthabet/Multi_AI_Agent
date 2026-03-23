import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PeriodSubscriptionsComponent } from './period-subscriptions.component';

describe('PeriodSubscriptionsComponent', () => {
  let component: PeriodSubscriptionsComponent;
  let fixture: ComponentFixture<PeriodSubscriptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PeriodSubscriptionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PeriodSubscriptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
