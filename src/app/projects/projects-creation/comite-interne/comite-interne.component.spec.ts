import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComiteInterneComponent } from './comite-interne.component';

describe('ComiteInterneComponent', () => {
  let component: ComiteInterneComponent;
  let fixture: ComponentFixture<ComiteInterneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComiteInterneComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComiteInterneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
