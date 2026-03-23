import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComiteInterneFormComponent } from './comite-interne-form.component';

describe('ComiteInterneFormComponent', () => {
  let component: ComiteInterneFormComponent;
  let fixture: ComponentFixture<ComiteInterneFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComiteInterneFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComiteInterneFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
