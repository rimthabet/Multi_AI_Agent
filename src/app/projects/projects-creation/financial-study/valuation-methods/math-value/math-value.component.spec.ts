import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MathValueComponent } from './math-value.component';

describe('MathValueComponent', () => {
  let component: MathValueComponent;
  let fixture: ComponentFixture<MathValueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MathValueComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MathValueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
