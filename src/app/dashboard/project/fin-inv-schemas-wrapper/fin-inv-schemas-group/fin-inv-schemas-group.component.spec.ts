import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinInvSchemasGroupComponent } from './fin-inv-schemas-group.component';

describe('FinInvSchemasGroupComponent', () => {
  let component: FinInvSchemasGroupComponent;
  let fixture: ComponentFixture<FinInvSchemasGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinInvSchemasGroupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinInvSchemasGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
