import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectPromotorsComponent } from './project-promotors.component';

describe('ProjectPromotorsComponent', () => {
  let component: ProjectPromotorsComponent;
  let fixture: ComponentFixture<ProjectPromotorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectPromotorsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectPromotorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
