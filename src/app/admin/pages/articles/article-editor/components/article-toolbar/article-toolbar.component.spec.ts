import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ArticleToolbarComponent } from './article-toolbar.component';

describe('ArticleToolbarComponent', () => {
  let component: ArticleToolbarComponent;
  let fixture: ComponentFixture<ArticleToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArticleToolbarComponent, NoopAnimationsModule],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(ArticleToolbarComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isEditMode', false);
    fixture.componentRef.setInput('saving', false);
    fixture.componentRef.setInput('formValid', true);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display "Nouvel article" in creation mode', () => {
    fixture.componentRef.setInput('isEditMode', false);
    fixture.detectChanges();
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent.trim()).toBe('Nouvel article');
  });

  it('should display "Modifier l\'article" in edit mode', () => {
    fixture.componentRef.setInput('isEditMode', true);
    fixture.detectChanges();
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent.trim()).toContain("Modifier l'article");
  });

  it('should show delete button in edit mode', () => {
    fixture.componentRef.setInput('isEditMode', true);
    fixture.detectChanges();
    const deleteBtn = fixture.nativeElement.querySelector('.btn-danger');
    expect(deleteBtn).toBeTruthy();
  });

  it('should not show delete button in creation mode', () => {
    fixture.componentRef.setInput('isEditMode', false);
    fixture.detectChanges();
    const deleteBtn = fixture.nativeElement.querySelector('.btn-danger');
    expect(deleteBtn).toBeFalsy();
  });

  it('should disable save button when form is invalid', () => {
    fixture.componentRef.setInput('formValid', false);
    fixture.detectChanges();
    const saveBtn = fixture.nativeElement.querySelector('.btn-primary');
    expect(saveBtn.disabled).toBeTrue();
  });

  it('should emit saveClicked when save button is clicked', () => {
    const spy = spyOn(component.saveClicked, 'emit');
    const saveBtn = fixture.nativeElement.querySelector('.btn-primary');
    saveBtn.click();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit cancelClicked when back button is clicked', () => {
    const spy = spyOn(component.cancelClicked, 'emit');
    const backBtn = fixture.nativeElement.querySelector('.btn-back');
    backBtn.click();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit deleteClicked when delete button is clicked', () => {
    fixture.componentRef.setInput('isEditMode', true);
    fixture.detectChanges();
    const spy = spyOn(component.deleteClicked, 'emit');
    const deleteBtn = fixture.nativeElement.querySelector('.btn-danger');
    deleteBtn.click();
    expect(spy).toHaveBeenCalled();
  });

  it('should show spinner when saving', () => {
    fixture.componentRef.setInput('saving', true);
    fixture.detectChanges();
    const spinner = fixture.nativeElement.querySelector('.spinner-small');
    expect(spinner).toBeTruthy();
  });
});
