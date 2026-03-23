import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PieChart03Component } from './pie-chart-03.component';

describe('PieChart03Component', () => {
  let component: PieChart03Component;
  let fixture: ComponentFixture<PieChart03Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PieChart03Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PieChart03Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
