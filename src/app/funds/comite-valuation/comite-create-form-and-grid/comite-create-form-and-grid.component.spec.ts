import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComiteCreateFormAndGridComponent } from './comite-create-form-and-grid.component';

describe('ComiteCreateFormAndGridComponent', () => {
  let component: ComiteCreateFormAndGridComponent;
  let fixture: ComponentFixture<ComiteCreateFormAndGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComiteCreateFormAndGridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComiteCreateFormAndGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
