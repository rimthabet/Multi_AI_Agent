import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubscriberRatiosComponent } from './subscriber-ratios.component';

describe('SubscriberRatiosComponent', () => {
  let component: SubscriberRatiosComponent;
  let fixture: ComponentFixture<SubscriberRatiosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubscriberRatiosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubscriberRatiosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
