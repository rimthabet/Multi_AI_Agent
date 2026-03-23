import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TriOcaComponent } from './tri-oca.component';

describe('TriOcaComponent', () => {
  let component: TriOcaComponent;
  let fixture: ComponentFixture<TriOcaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TriOcaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TriOcaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
