import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestmentsProjectsComponent } from './investments-projects.component';

describe('InvestmentsProjectsComponent', () => {
  let component: InvestmentsProjectsComponent;
  let fixture: ComponentFixture<InvestmentsProjectsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestmentsProjectsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvestmentsProjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
