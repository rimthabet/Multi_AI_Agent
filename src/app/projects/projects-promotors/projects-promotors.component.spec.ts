import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectsPromotorsComponent } from './projects-promotors.component';

describe('ProjectsPromotorsComponent', () => {
  let component: ProjectsPromotorsComponent;
  let fixture: ComponentFixture<ProjectsPromotorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectsPromotorsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectsPromotorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
