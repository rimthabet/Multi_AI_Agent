import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FundsProjectsSectorsComponent } from './funds-projects-sectors.component';

describe('FundsProjectsSectorsComponent', () => {
  let component: FundsProjectsSectorsComponent;
  let fixture: ComponentFixture<FundsProjectsSectorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundsProjectsSectorsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FundsProjectsSectorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
