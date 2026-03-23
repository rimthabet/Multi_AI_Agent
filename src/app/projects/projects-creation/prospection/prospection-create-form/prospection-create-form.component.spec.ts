import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProspectionCreateFormComponent } from './prospection-create-form.component';

describe('ProspectionCreateFormComponent', () => {
  let component: ProspectionCreateFormComponent;
  let fixture: ComponentFixture<ProspectionCreateFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProspectionCreateFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProspectionCreateFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
