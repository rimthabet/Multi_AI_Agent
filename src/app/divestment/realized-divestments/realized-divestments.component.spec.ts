import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RealizedDivestmentsComponent } from './realized-divestments.component';

describe('RealizedDivestmentsComponent', () => {
  let component: RealizedDivestmentsComponent;
  let fixture: ComponentFixture<RealizedDivestmentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RealizedDivestmentsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RealizedDivestmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
