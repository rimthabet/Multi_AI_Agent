import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GlobalKpisComponent } from './global-kpis.component';

describe('GlobalKpisComponent', () => {
  let component: GlobalKpisComponent;
  let fixture: ComponentFixture<GlobalKpisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlobalKpisComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(GlobalKpisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
