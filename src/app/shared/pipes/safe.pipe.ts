import { Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeHtml, SafeResourceUrl, SafeStyle, SafeUrl } from '@angular/platform-browser';

/**
 * Pipe pour sécuriser les URLs et le contenu HTML.
 *
 * Types supportés :
 *   - 'html'        : assainit via DomSanitizer (Angular retire les tags/attributs dangereux)
 *   - 'style'       : bypass pour les styles CSS (contenu admin de confiance uniquement — RISQUE CSS injection)
 *   - 'url'         : bypass pour les URLs simples (contenu admin de confiance uniquement — RISQUE javascript: scheme)
 *   - 'resourceUrl' : bypass pour les URLs de ressources embarquées, ex. <iframe> (contenu admin de confiance uniquement — RISQUE SSRF/XSS)
 *
 * IMPORTANT : les types 'style', 'url' et 'resourceUrl' contournent la sécurité Angular.
 * Ne les utiliser qu'avec des valeurs contrôlées côté admin et jamais avec des entrées utilisateur.
 *
 * @example
 * <iframe [src]="youtubeUrl | safe: 'resourceUrl'"></iframe>
 * <div [innerHTML]="htmlContent | safe: 'html'"></div>
 */
@Pipe({
  name: 'safe',
  standalone: true
})
export class SafePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string, type: string): SafeHtml | SafeStyle | SafeUrl | SafeResourceUrl | string {
    switch (type) {
      case 'html':
        // Sanitisation stricte : si Angular juge le contenu dangereux (retourne null),
        // on retourne une chaîne vide plutôt que d'injecter le contenu tel quel.
        return this.sanitizer.sanitize(SecurityContext.HTML, value) ?? '';

      case 'style':
        // RISQUE : bypass — réserver au contenu admin de confiance (CSS injection possible)
        return this.sanitizer.bypassSecurityTrustStyle(value);

      case 'url':
        // RISQUE : bypass — réserver au contenu admin de confiance (javascript: scheme possible)
        return this.sanitizer.bypassSecurityTrustUrl(value);

      case 'resourceUrl':
        // RISQUE : bypass — réserver au contenu admin de confiance (SSRF/XSS possible via src embarqué)
        return this.sanitizer.bypassSecurityTrustResourceUrl(value);

      default:
        throw new Error(
          `SafePipe : type "${type}" non supporté. Types valides : 'html', 'style', 'url', 'resourceUrl'.`
        );
    }
  }
}
