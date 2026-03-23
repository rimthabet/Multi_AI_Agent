import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PieChart02Component } from './pie-chart-02.component';

describe('PieChart02Component', () => {
  let component: PieChart02Component;
  let fixture: ComponentFixture<PieChart02Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PieChart02Component]
    })
      .compileComponents();

    fixture = TestBed.createComponent(PieChart02Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
