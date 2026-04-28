import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ArticleBlocksService } from './article-blocks.service';
import { AuthService } from '../../../../../../shared/services/api/auth.service';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

describe('ArticleBlocksService', () => {
  let service: ArticleBlocksService;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['getToken']);
    authServiceSpy.getToken.and.returnValue('test-token');

    TestBed.configureTestingModule({
      providers: [
        ArticleBlocksService,
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });

    service = TestBed.inject(ArticleBlocksService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('buildTools()', () => {
    it('should return a tools configuration object', () => {
      const tools = service.buildTools();
      expect(tools).toBeTruthy();
      expect(typeof tools).toBe('object');
    });

    it('should include all required block types', () => {
      const tools = service.buildTools();
      expect(tools['header']).toBeDefined();
      expect(tools['paragraph']).toBeDefined();
      expect(tools['image']).toBeDefined();
      expect(tools['list']).toBeDefined();
      expect(tools['quote']).toBeDefined();
      expect(tools['delimiter']).toBeDefined();
      expect(tools['embed']).toBeDefined();
      expect(tools['linkTool']).toBeDefined();
    });

    it('should include tunes', () => {
      const tools = service.buildTools();
      expect(tools['textVariant']).toBeDefined();
      expect(tools['imageSize']).toBeDefined();
    });

    it('should inject Authorization header when token is present', () => {
      authServiceSpy.getToken.and.returnValue('my-token');
      const tools = service.buildTools() as Record<string, { config?: { additionalRequestHeaders?: Record<string, string> } }>;
      const imageConfig = tools['image'].config;
      expect(imageConfig?.additionalRequestHeaders?.['Authorization']).toBe('Bearer my-token');
    });

    it('should not inject Authorization header when token is null', () => {
      authServiceSpy.getToken.and.returnValue(null);
      const tools = service.buildTools() as Record<string, { config?: { additionalRequestHeaders?: Record<string, string> } }>;
      const imageConfig = tools['image'].config;
      expect(imageConfig?.additionalRequestHeaders).toEqual({});
    });
  });
});
