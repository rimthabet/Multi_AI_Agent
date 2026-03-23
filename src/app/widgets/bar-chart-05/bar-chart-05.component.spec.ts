import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BarChart05Component } from './bar-chart-05.component';

describe('BarChart05Component', () => {
  let component: BarChart05Component;
  let fixture: ComponentFixture<BarChart05Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarChart05Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BarChart05Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
