import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DisputeStatusButtonComponent } from './dispute-status-button.component';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('DisputeStatusButtonComponent', () => {
  let component: DisputeStatusButtonComponent;
  let fixture: ComponentFixture<DisputeStatusButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisputeStatusButtonComponent, MatDialogModule, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DisputeStatusButtonComponent);
    component = fixture.componentInstance;
  });

  it('blocks filing a dispute when funds have already been released', () => {
    component.escrowFunded = true;
    component.paymentStatus = 'RELEASED';
    component.bookingStatus = 'Approved';

    component.checkDisputeStatus();

    expect(component.canFileDispute).toBeFalse();
    expect(component.disputeBlockedReason).toContain('already been released');
  });
});
