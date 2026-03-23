import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvApprovedReleasedComponent } from './inv-approved-released.component';

describe('InvApprovedReleasedComponent', () => {
  let component: InvApprovedReleasedComponent;
  let fixture: ComponentFixture<InvApprovedReleasedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvApprovedReleasedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvApprovedReleasedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
