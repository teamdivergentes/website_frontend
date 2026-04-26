import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TwitchChannelDialogComponent } from './twitch-channel-dialog.component';
import { TwitchChannelsService } from '../../../shared/services/twitch-channels.service';
import { TwitchChannel } from '../../../shared/models/twitch-channel.model';

const mockChannel: TwitchChannel = {
  id: 42,
  twitchUsername: 'Divergentes',
  displayName: 'Team Divergentes',
  gameLabel: 'Valorant',
  description: 'Description test',
  teamMemberId: undefined,
  teamMember: undefined,
  position: 0,
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z'
};

describe('TwitchChannelDialogComponent', () => {
  let component: TwitchChannelDialogComponent;
  let fixture: ComponentFixture<TwitchChannelDialogComponent>;
  let channelsServiceSpy: jasmine.SpyObj<TwitchChannelsService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<TwitchChannelDialogComponent>>;

  function setupComponent(channelData?: TwitchChannel): void {
    channelsServiceSpy = jasmine.createSpyObj('TwitchChannelsService', [
      'createChannel', 'updateChannel'
    ]);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [TwitchChannelDialogComponent, NoopAnimationsModule],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TwitchChannelsService, useValue: channelsServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { channel: channelData } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TwitchChannelDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('Mode création', () => {
    beforeEach(() => setupComponent(undefined));

    it('doit créer le composant en mode création', () => {
      expect(component).toBeTruthy();
      expect(component.isEdit()).toBeFalse();
    });

    it('doit invalider un pseudo trop court (< 4 chars)', () => {
      component.form.get('twitchUsername')!.setValue('abc');
      component.form.get('twitchUsername')!.markAsTouched();
      expect(component.form.get('twitchUsername')!.hasError('pattern')).toBeTrue();
    });

    it('doit invalider un pseudo avec des caractères spéciaux', () => {
      component.form.get('twitchUsername')!.setValue('test user!');
      component.form.get('twitchUsername')!.markAsTouched();
      expect(component.form.get('twitchUsername')!.hasError('pattern')).toBeTrue();
    });

    it('doit valider un pseudo correct', () => {
      component.form.get('twitchUsername')!.setValue('TeamDvg_2026');
      expect(component.form.get('twitchUsername')!.valid).toBeTrue();
    });

    it('doit invalider un pseudo trop long (> 25 chars)', () => {
      component.form.get('twitchUsername')!.setValue('a'.repeat(26));
      expect(component.form.get('twitchUsername')!.hasError('pattern')).toBeTrue();
    });

    it('doit invalider une description trop longue (> 280 chars)', () => {
      component.form.get('description')!.setValue('x'.repeat(281));
      expect(component.form.get('description')!.hasError('maxlength')).toBeTrue();
    });

    it('doit mettre à jour la preview URL en temps réel', () => {
      component.form.get('twitchUsername')!.setValue('StreamerTest');
      expect(component.previewUsername()).toBe('StreamerTest');
    });

    it('doit appeler createChannel lors de la soumission valide', fakeAsync(() => {
      channelsServiceSpy.createChannel.and.returnValue(of(mockChannel));
      component.form.get('twitchUsername')!.setValue('ValidUser');
      component.save();
      tick();
      expect(channelsServiceSpy.createChannel).toHaveBeenCalledTimes(1);
      expect(dialogRefSpy.close).toHaveBeenCalledWith(mockChannel);
    }));

    it('ne doit pas soumettre si le formulaire est invalide', () => {
      component.form.get('twitchUsername')!.setValue('');
      component.save();
      expect(channelsServiceSpy.createChannel).not.toHaveBeenCalled();
    });

    it('doit afficher l\'erreur 400 "pseudo déjà enregistré"', fakeAsync(() => {
      channelsServiceSpy.createChannel.and.returnValue(
        throwError(() => ({ error: { message: 'unique constraint violation' }, message: '' }))
      );
      component.form.get('twitchUsername')!.setValue('ExistingUser');
      component.save();
      tick();
      expect(component.error()).toBe('Ce pseudo est déjà enregistré.');
    }));

    it('doit afficher un message d\'erreur générique pour les autres erreurs 400', fakeAsync(() => {
      channelsServiceSpy.createChannel.and.returnValue(
        throwError(() => ({ error: { message: 'twitchUsername must match pattern' }, message: '' }))
      );
      component.form.get('twitchUsername')!.setValue('Valid1234');
      component.save();
      tick();
      expect(component.error()).toBeTruthy();
    }));

    it('doit afficher les erreurs de validation sous forme de tableau', fakeAsync(() => {
      channelsServiceSpy.createChannel.and.returnValue(
        throwError(() => ({ error: { message: ['field1 is required', 'field2 too long'] }, message: '' }))
      );
      component.form.get('twitchUsername')!.setValue('Valid1234');
      component.save();
      tick();
      expect(component.error()).toContain('field1 is required');
    }));

    it('doit fermer le dialog sans résultat lors de l\'annulation', () => {
      component.cancel();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(null);
    });
  });

  describe('Mode édition', () => {
    beforeEach(() => setupComponent(mockChannel));

    it('doit être en mode édition', () => {
      expect(component.isEdit()).toBeTrue();
    });

    it('doit pré-remplir le formulaire avec les données existantes', () => {
      expect(component.form.get('twitchUsername')!.value).toBe('Divergentes');
      expect(component.form.get('displayName')!.value).toBe('Team Divergentes');
      expect(component.form.get('gameLabel')!.value).toBe('Valorant');
    });

    it('doit initialiser la preview URL avec le pseudo existant', () => {
      expect(component.previewUsername()).toBe('Divergentes');
    });

    it('doit appeler updateChannel lors de la soumission', fakeAsync(() => {
      channelsServiceSpy.updateChannel.and.returnValue(of(mockChannel));
      component.save();
      tick();
      expect(channelsServiceSpy.updateChannel).toHaveBeenCalledWith(42, jasmine.any(Object));
      expect(dialogRefSpy.close).toHaveBeenCalledWith(mockChannel);
    }));
  });
});
