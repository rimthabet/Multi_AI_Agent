import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DcfComponent } from './dcf.component';

describe('DcfComponent', () => {
  let component: DcfComponent;
  let fixture: ComponentFixture<DcfComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DcfComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DcfComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
