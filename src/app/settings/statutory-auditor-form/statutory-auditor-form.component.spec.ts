import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatutoryAuditorFormComponent } from './statutory-auditor-form.component';

describe('StatutoryAuditorFormComponent', () => {
  let component: StatutoryAuditorFormComponent;
  let fixture: ComponentFixture<StatutoryAuditorFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatutoryAuditorFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatutoryAuditorFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
