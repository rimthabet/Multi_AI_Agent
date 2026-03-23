import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeetingTrackingComponent } from './meeting-tracking.component';

describe('MeetingTrackingComponent', () => {
  let component: MeetingTrackingComponent;
  let fixture: ComponentFixture<MeetingTrackingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeetingTrackingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MeetingTrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
