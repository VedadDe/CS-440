import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PathPlanningComponent } from './path-planning.component';

describe('PathPlanningComponent', () => {
  let component: PathPlanningComponent;
  let fixture: ComponentFixture<PathPlanningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PathPlanningComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PathPlanningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
