import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LandmarkEventCreateFormComponent } from './landmark-event-create-form.component';

describe('LandmarkEventCreateFormComponent', () => {
  let component: LandmarkEventCreateFormComponent;
  let fixture: ComponentFixture<LandmarkEventCreateFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandmarkEventCreateFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LandmarkEventCreateFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
