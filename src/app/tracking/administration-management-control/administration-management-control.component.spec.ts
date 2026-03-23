import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdministrationManagementControlComponent } from './administration-management-control.component';

describe('AdministrationManagementControlComponent', () => {
  let component: AdministrationManagementControlComponent;
  let fixture: ComponentFixture<AdministrationManagementControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdministrationManagementControlComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdministrationManagementControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
