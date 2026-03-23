import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BarChart03Component } from './bar-chart-03.component';

describe('BarChart03Component', () => {
  let component: BarChart03Component;
  let fixture: ComponentFixture<BarChart03Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarChart03Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BarChart03Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
