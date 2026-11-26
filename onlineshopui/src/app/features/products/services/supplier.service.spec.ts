import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { take } from 'rxjs';
import { SupplierService } from './supplier.service';
import { EnvironmentConfig } from '../../../core/types/providers/environment-config';
import { MOCK_ENVIRONMENT_CONFIG } from '../../../core/mocks/data/environment.mock';
import { MOCK_SUPPLIERS } from '../../../core/mocks/data/suppliers.mock';

describe('SupplierService', () => {
    let service: SupplierService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                SupplierService,
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: EnvironmentConfig, useValue: MOCK_ENVIRONMENT_CONFIG }
            ]
        });

        service = TestBed.inject(SupplierService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    describe('Initialization', () => {
        it('should be created', () => {
            // Prepare
            // (service created in beforeEach)

            // Action
            // (no action needed)

            // Verify
            expect(service).toBeTruthy();
        });

        it('should initialize with empty suppliers signal', () => {
            // Prepare
            // (service created in beforeEach)

            // Action
            // (no action needed)

            // Verify
            expect(service.suppliers()).toEqual([]);
            expect(service.loading()).toBe(false);
            expect(service.error()).toBeNull();
        });
    });

    describe('loadAll()', () => {
        it('should load all suppliers successfully', () => {
            // Prepare
            // (service created in beforeEach)

            // Action
            service.loadAll().pipe(take(1)).subscribe();

            const req = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/suppliers`);
            expect(req.request.method).toBe('GET');
            req.flush(MOCK_SUPPLIERS);

            // Verify
            expect(service.suppliers()).toEqual(MOCK_SUPPLIERS);
            expect(service.loading()).toBe(false);
            expect(service.error()).toBeNull();
        });

        it('should set loading to true while fetching', () => {
            // Prepare
            // (service created in beforeEach)

            // Action
            service.loadAll().subscribe();

            // Verify
            expect(service.loading()).toBe(true);

            const req = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/suppliers`);
            req.flush(MOCK_SUPPLIERS);

            expect(service.loading()).toBe(false);
        });

        it('should set error when request fails', () => {
            // Prepare
            // (service created in beforeEach)

            // Action
            service.loadAll().pipe(take(1)).subscribe();

            const req = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/suppliers`);
            req.flush('Error', { status: 500, statusText: 'Server Error' });

            // Verify
            expect(service.suppliers()).toEqual([]);
            expect(service.error()).toBe('Failed to load suppliers');
            expect(service.loading()).toBe(false);
        });
    });
});

