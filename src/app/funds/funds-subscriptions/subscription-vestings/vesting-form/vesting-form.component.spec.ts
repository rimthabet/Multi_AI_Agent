import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VestingFormComponent } from './vesting-form.component';

describe('VestingFormComponent', () => {
  let component: VestingFormComponent;
  let fixture: ComponentFixture<VestingFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VestingFormComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(VestingFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
