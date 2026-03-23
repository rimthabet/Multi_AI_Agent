import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DueDiligenceCreationFormComponent } from './due-diligence-creation-form.component';

describe('DueDiligenceCreationFormComponent', () => {
  let component: DueDiligenceCreationFormComponent;
  let fixture: ComponentFixture<DueDiligenceCreationFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DueDiligenceCreationFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DueDiligenceCreationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
