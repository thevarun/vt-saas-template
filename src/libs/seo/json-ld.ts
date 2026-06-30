/**
 * JSON-LD serialization helper
 *
 * Serializes a structured-data object for safe injection into an inline
 * <script type="application/ld+json"> via dangerouslySetInnerHTML.
 *
 * JSON.stringify does NOT escape characters that are significant inside an HTML
 * <script> context, so a string value containing `</script>` (or a bare `<`)
 * can break out of the script element and inject arbitrary markup. The pSEO
 * frontmatter is author-controlled today, but forks may point the engine at
 * less-trusted content, so this escaping is cheap defense-in-depth.
 *
 * We escape:
 * - `<`              -> escaped (prevents `</script>` breakout and tag injection)
 * - U+2028 / U+2029  -> unicode escapes (line/paragraph separators)
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
