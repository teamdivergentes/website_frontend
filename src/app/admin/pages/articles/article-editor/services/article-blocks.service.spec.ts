import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ArticleBlocksService } from './article-blocks.service';

describe('ArticleBlocksService', () => {
  let service: ArticleBlocksService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ArticleBlocksService,
        provideZonelessChangeDetection(),
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

    it('should use empty additionalRequestHeaders (HttpOnly cookies via withCredentials)', () => {
      const tools = service.buildTools() as Record<string, { config?: { additionalRequestHeaders?: Record<string, string> } }>;
      const imageConfig = tools['image'].config;
      expect(imageConfig?.additionalRequestHeaders).toEqual({});
    });

    it('should use empty headers for linkTool (HttpOnly cookies via withCredentials)', () => {
      const tools = service.buildTools() as Record<string, { config?: { headers?: Record<string, string> } }>;
      const linkConfig = tools['linkTool'].config;
      expect(linkConfig?.headers).toEqual({});
    });
  });
});
