import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinInvSchemaComponent } from './fin-inv-schema.component';

describe('FinInvSchemaComponent', () => {
  let component: FinInvSchemaComponent;
  let fixture: ComponentFixture<FinInvSchemaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinInvSchemaComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(FinInvSchemaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
