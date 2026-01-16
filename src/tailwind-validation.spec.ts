/**
 * Tailwind CSS Configuration Validation Tests
 * Story 1.1 - Setup Tailwind CSS avec Design Tokens
 *
 * Ces tests valident que:
 * 1. Tailwind CSS est correctement installé
 * 2. Les design tokens sont configurés
 * 3. Le config file est valide
 */

import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

describe('Tailwind CSS Configuration - Story 1.1', () => {
  const configPath = path.join(__dirname, '../tailwind.config.js');
  const postcssPath = path.join(__dirname, '../.postcssrc.json');
  const stylesPath = path.join(__dirname, 'styles.scss');

  describe('AC1: Installation de Tailwind CSS', () => {
    it('devrait avoir un fichier tailwind.config.js', () => {
      expect(fs.existsSync(configPath)).toBe(true);
    });

    it('devrait avoir un fichier .postcssrc.json', () => {
      expect(fs.existsSync(postcssPath)).toBe(true);
    });

    it('devrait configurer @tailwindcss/postcss dans postcssrc', () => {
      const postcssConfig = JSON.parse(fs.readFileSync(postcssPath, 'utf8'));
      expect(postcssConfig.plugins).toHaveProperty('@tailwindcss/postcss');
      expect(postcssConfig.plugins).toHaveProperty('autoprefixer');
    });
  });

  describe('AC2: Configuration des Design Tokens', () => {
    let tailwindConfig: any;

    beforeAll(async () => {
      // Import du config Tailwind (ES module)
      const configModule = await import(configPath);
      tailwindConfig = configModule.default;
    });

    it('devrait définir les couleurs du design system', () => {
      const colors = tailwindConfig.theme.extend.colors;
      expect(colors.black).toBe('#101111');
      expect(colors['green-primary']).toBe('#32d299');
      expect(colors['green-dark']).toBe('#28413b');
      expect(colors.white).toBe('#FFFFFF');
      expect(colors['text-secondary']).toBe('#E2E2E2');
      expect(colors['text-dark']).toBe('#000000');
    });

    it('devrait définir le système de spacing 8px', () => {
      const spacing = tailwindConfig.theme.extend.spacing;
      expect(spacing['1']).toBe('8px');
      expect(spacing['2']).toBe('16px');
      expect(spacing['3']).toBe('24px');
      expect(spacing['4']).toBe('32px');
      expect(spacing['5']).toBe('40px');
      expect(spacing['6']).toBe('48px');
      expect(spacing['7']).toBe('56px');
      expect(spacing['8']).toBe('64px');
    });

    it('devrait définir les font families', () => {
      const fontFamily = tailwindConfig.theme.extend.fontFamily;
      expect(fontFamily.heading).toEqual(['Bebas Neue', 'sans-serif']);
      expect(fontFamily.body).toEqual(['Asar', 'serif']);
      expect(fontFamily.secondary).toEqual(['Athiti', 'sans-serif']);
      expect(fontFamily.decorative).toEqual(['Boosting', 'sans-serif']);
    });

    it('devrait définir les box shadows', () => {
      const boxShadow = tailwindConfig.theme.extend.boxShadow;
      expect(boxShadow).toHaveProperty('sm');
      expect(boxShadow).toHaveProperty('md');
      expect(boxShadow).toHaveProperty('lg');
      expect(boxShadow).toHaveProperty('xl');
    });

    it('devrait définir les border radius', () => {
      const borderRadius = tailwindConfig.theme.extend.borderRadius;
      expect(borderRadius).toHaveProperty('none');
      expect(borderRadius).toHaveProperty('sm');
      expect(borderRadius).toHaveProperty('md');
      expect(borderRadius).toHaveProperty('lg');
      expect(borderRadius).toHaveProperty('full');
    });
  });

  describe('AC3: Intégration dans styles.scss', () => {
    it('devrait avoir les directives @tailwind dans styles.scss', () => {
      const stylesContent = fs.readFileSync(stylesPath, 'utf8');
      expect(stylesContent).toContain('@tailwind base');
      expect(stylesContent).toContain('@tailwind components');
      expect(stylesContent).toContain('@tailwind utilities');
    });
  });

  describe('AC4: Configuration PurgeCSS', () => {
    let tailwindConfig: any;

    beforeAll(async () => {
      const configModule = await import(configPath);
      tailwindConfig = configModule.default;
    });

    it('devrait configurer le content pour PurgeCSS', () => {
      expect(tailwindConfig.content).toContain('./src/**/*.{html,ts}');
    });
  });
});
