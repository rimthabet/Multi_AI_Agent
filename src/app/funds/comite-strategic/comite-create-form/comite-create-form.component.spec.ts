import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComiteCreateFormComponent } from './comite-create-form.component';

describe('ComiteCreateFormComponent', () => {
  let component: ComiteCreateFormComponent;
  let fixture: ComponentFixture<ComiteCreateFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComiteCreateFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComiteCreateFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
