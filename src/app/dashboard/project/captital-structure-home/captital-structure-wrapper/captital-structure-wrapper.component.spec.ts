import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaptitalStructureWrapperComponent } from './captital-structure-wrapper.component';

describe('CaptitalStructureWrapperComponent', () => {
  let component: CaptitalStructureWrapperComponent;
  let fixture: ComponentFixture<CaptitalStructureWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaptitalStructureWrapperComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CaptitalStructureWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
