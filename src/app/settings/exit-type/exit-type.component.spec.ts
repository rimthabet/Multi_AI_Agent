import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExitTypeComponent } from './exit-type.component';

describe('ExitTypeComponent', () => {
  let component: ExitTypeComponent;
  let fixture: ComponentFixture<ExitTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExitTypeComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ExitTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
