import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaptitalStructureHomeComponent } from './captital-structure-home.component';

describe('CaptitalStructureHomeComponent', () => {
  let component: CaptitalStructureHomeComponent;
  let fixture: ComponentFixture<CaptitalStructureHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaptitalStructureHomeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CaptitalStructureHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
