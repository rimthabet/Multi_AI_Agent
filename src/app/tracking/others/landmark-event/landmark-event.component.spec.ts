import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LandmarkEventComponent } from './landmark-event.component';

describe('LandmarkEventComponent', () => {
  let component: LandmarkEventComponent;
  let fixture: ComponentFixture<LandmarkEventComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandmarkEventComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LandmarkEventComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
