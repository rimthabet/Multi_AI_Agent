import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancingSchemaComponent } from './financing-schema.component';

describe('FinancingSchemaComponent', () => {
  let component: FinancingSchemaComponent;
  let fixture: ComponentFixture<FinancingSchemaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancingSchemaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinancingSchemaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
