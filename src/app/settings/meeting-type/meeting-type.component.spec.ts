import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeetingTypeComponent } from './meeting-type.component';

describe('MeetingTypeComponent', () => {
  let component: MeetingTypeComponent;
  let fixture: ComponentFixture<MeetingTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeetingTypeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MeetingTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
