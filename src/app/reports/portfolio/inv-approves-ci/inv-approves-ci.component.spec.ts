import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvApprovesCiComponent } from './inv-approves-ci.component';

describe('InvApprovesCiComponent', () => {
  let component: InvApprovesCiComponent;
  let fixture: ComponentFixture<InvApprovesCiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvApprovesCiComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvApprovesCiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
