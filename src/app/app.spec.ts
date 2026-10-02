import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { AdminService } from './core/services/admin.service';

describe('App', () => {
  let adminService: AdminService;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes)
      ]
    }).compileComponents();

    adminService = TestBed.inject(AdminService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should show header and footer when unauthenticated on customer pages', async () => {
    await router.navigateByUrl('/');
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const app = fixture.componentInstance;
    expect(app.showAppHeaderFooter).toBe(true);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-header')).toBeTruthy();
    expect(compiled.querySelector('app-footer')).toBeTruthy();
  });

  it('should show header and footer on customer pages even when logged in as staff (Rahul)', async () => {
    await adminService.login('rahul@thecroppers.in', 'password123', 'staff', 'staff-rahul');
    await router.navigateByUrl('/');
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const app = fixture.componentInstance;
    expect(app.showAppHeaderFooter).toBe(true);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-header')).toBeTruthy();
    expect(compiled.querySelector('app-footer')).toBeTruthy();
  });

  it('should hide header and footer on /admin routes when logged in as superadmin', async () => {
    await adminService.login('owner@thecroppers.in', 'password123', 'superadmin');
    await router.navigateByUrl('/admin/dashboard');
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const app = fixture.componentInstance;
    expect(app.showAppHeaderFooter).toBe(false);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-header')).toBeNull();
    expect(compiled.querySelector('app-footer')).toBeNull();
  });

  it('should hide header and footer on /admin/login route even if unauthenticated', async () => {
    await router.navigateByUrl('/admin/login');
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const app = fixture.componentInstance;
    expect(app.showAppHeaderFooter).toBe(false);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-header')).toBeNull();
    expect(compiled.querySelector('app-footer')).toBeNull();
  });

  it('should restore header and footer when navigating back from admin section to customer pages', async () => {
    await router.navigateByUrl('/admin/login');
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const app = fixture.componentInstance;
    expect(app.showAppHeaderFooter).toBe(false);

    await router.navigateByUrl('/');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(app.showAppHeaderFooter).toBe(true);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-header')).toBeTruthy();
    expect(compiled.querySelector('app-footer')).toBeTruthy();
  });
});

