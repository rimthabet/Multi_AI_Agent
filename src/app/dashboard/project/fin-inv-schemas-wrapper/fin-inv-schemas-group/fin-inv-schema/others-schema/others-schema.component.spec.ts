import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OthersSchemaComponent } from './others-schema.component';

describe('OthersSchemaComponent', () => {
  let component: OthersSchemaComponent;
  let fixture: ComponentFixture<OthersSchemaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OthersSchemaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OthersSchemaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
