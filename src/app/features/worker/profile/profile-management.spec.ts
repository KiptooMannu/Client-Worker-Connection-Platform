import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { WorkerProfilePage } from './profile-management';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PlatformStateService } from '../../../core/services/platform-state.service';

describe('WorkerProfilePage', () => {
  let fixture: ComponentFixture<WorkerProfilePage>;
  let component: WorkerProfilePage;

  beforeEach(async () => {
    const authServiceStub = {
      currentUser: jasmine.createSpy('currentUser').and.returnValue({ id: 'user-1', name: 'Account User' })
    };

    const notificationServiceStub = {
      error: jasmine.createSpy('error'),
      success: jasmine.createSpy('success'),
      info: jasmine.createSpy('info')
    };

    const currentWorker = signal({
      id: 'worker-1',
      userId: 'user-1',
      name: 'Account User',
      category: 'Plumbing',
      phoneNumber: '+254700000000',
      bio: 'Experienced plumber',
      skills: ['Plumbing'],
      workHistory: [],
      certifications: [],
      availabilityDetails: { weekdays: true, weekends: false, evenings: false },
      status: 'Active',
      rejectionReason: null,
      uploadedDocuments: []
    });

    const platformStateStub = {
      currentWorker,
      currentWorkerCompletion: jasmine.createSpy('currentWorkerCompletion').and.returnValue(100),
      fetchWorkerProfile: jasmine.createSpy('fetchWorkerProfile'),
      updateWorkerProfile: jasmine.createSpy('updateWorkerProfile').and.returnValue(of({})),
      submitForVerification: jasmine.createSpy('submitForVerification'),
      resubmitWorker: jasmine.createSpy('resubmitWorker'),
      deleteProfilePicture: jasmine.createSpy('deleteProfilePicture').and.returnValue(of({})),
      uploadProfilePicture: jasmine.createSpy('uploadProfilePicture').and.returnValue(of({})),
      mapWorkerProfile: jasmine.createSpy('mapWorkerProfile').and.callFake((data: any) => data)
    };

    await TestBed.configureTestingModule({
      imports: [WorkerProfilePage],
      providers: [
        { provide: AuthService, useValue: authServiceStub },
        { provide: NotificationService, useValue: notificationServiceStub },
        { provide: PlatformStateService, useValue: platformStateStub },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerProfilePage);
    component = fixture.componentInstance;
  });

  it('shows the account name as read-only and removes the editable name input', () => {
    fixture.detectChanges();

    expect(component.getAccountName()).toBe('Account User');
    expect(fixture.nativeElement.textContent).toContain('Account User');
    expect(fixture.nativeElement.textContent).toContain('Managed from account');
    expect(fixture.nativeElement.querySelector('input[placeholder="Julian Thorne"]')).toBeNull();
  });
});
