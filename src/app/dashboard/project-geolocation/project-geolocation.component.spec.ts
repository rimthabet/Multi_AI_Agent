import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectGeolocationComponent } from './project-geolocation.component';

describe('ProjectGeolocationComponent', () => {
  let component: ProjectGeolocationComponent;
  let fixture: ComponentFixture<ProjectGeolocationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectGeolocationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectGeolocationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
