import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgressStatusMeetingComponent } from './progress-status-meeting.component';

describe('ProgressStatusMeetingComponent', () => {
  let component: ProgressStatusMeetingComponent;
  let fixture: ComponentFixture<ProgressStatusMeetingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressStatusMeetingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProgressStatusMeetingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
