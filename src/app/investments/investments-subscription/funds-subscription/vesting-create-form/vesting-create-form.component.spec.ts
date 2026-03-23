import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VestingCreateFormComponent } from './vesting-create-form.component';

describe('VestingCreateFormComponent', () => {
  let component: VestingCreateFormComponent;
  let fixture: ComponentFixture<VestingCreateFormComponent>;

  beforeEach(async () => {    
    await TestBed.configureTestingModule({
      imports: [VestingCreateFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VestingCreateFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
