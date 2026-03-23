import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PieChart01Component } from './pie-chart-01.component';

describe('PieChart01Component', () => {
  let component: PieChart01Component;
  let fixture: ComponentFixture<PieChart01Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PieChart01Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PieChart01Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
