import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemberMeetingComponent } from './member-meeting.component';

describe('MemberMeetingComponent', () => {
  let component: MemberMeetingComponent;
  let fixture: ComponentFixture<MemberMeetingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemberMeetingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MemberMeetingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
