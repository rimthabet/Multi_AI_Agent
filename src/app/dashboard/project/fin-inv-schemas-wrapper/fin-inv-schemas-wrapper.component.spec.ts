import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinInvSchemasWrapperComponent } from './fin-inv-schemas-wrapper.component';

describe('FinInvSchemasWrapperComponent', () => {
  let component: FinInvSchemasWrapperComponent;
  let fixture: ComponentFixture<FinInvSchemasWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinInvSchemasWrapperComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinInvSchemasWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
