import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreselectionCreateFormComponent } from './preselection-create-form.component';

describe('PreselectionCreateFormComponent', () => {
  let component: PreselectionCreateFormComponent;
  let fixture: ComponentFixture<PreselectionCreateFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreselectionCreateFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PreselectionCreateFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
