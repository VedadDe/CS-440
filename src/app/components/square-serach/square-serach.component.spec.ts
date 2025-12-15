import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SquareSerachComponent } from './square-serach.component';

describe('SquareSerachComponent', () => {
  let component: SquareSerachComponent;
  let fixture: ComponentFixture<SquareSerachComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SquareSerachComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SquareSerachComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
