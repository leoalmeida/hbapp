import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HeartbeatPage } from './heartbeat.page';

describe('HeartbeatPage', () => {
  let component: HeartbeatPage;
  let fixture: ComponentFixture<HeartbeatPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HeartbeatPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HeartbeatPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
