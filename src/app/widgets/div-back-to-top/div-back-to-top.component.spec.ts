import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DivBackToTopComponent } from './div-back-to-top.component';

describe('DivBackToTopComponent', () => {
  let component: DivBackToTopComponent;
  let fixture: ComponentFixture<DivBackToTopComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DivBackToTopComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DivBackToTopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
