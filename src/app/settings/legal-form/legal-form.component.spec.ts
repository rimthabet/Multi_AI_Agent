import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LegalFormComponent } from './legal-form.component';

describe('LegalFormComponent', () => {
  let component: LegalFormComponent;
  let fixture: ComponentFixture<LegalFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LegalFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LegalFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
