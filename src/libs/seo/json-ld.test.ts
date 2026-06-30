import { describe, expect, it } from 'vitest';

import { serializeJsonLd } from './json-ld';

describe('serializeJsonLd', () => {
  it('escapes `<` so an embedded `</script>` cannot break out of the script tag', () => {
    const out = serializeJsonLd({ headline: 'foo</script><script>alert(1)</script>bar' });

    expect(out).not.toContain('</script>');
    expect(out).not.toContain('<');
    expect(out).toContain('\\u003c');
  });

  it('escapes U+2028 and U+2029 line/paragraph separators', () => {
    const out = serializeJsonLd({ a: '\u2028', b: '\u2029' });

    expect(out).not.toContain('\u2028');
    expect(out).not.toContain('\u2029');
    expect(out).toContain('\\u2028');
    expect(out).toContain('\\u2029');
  });

  it('round-trips back to the original object via JSON.parse', () => {
    const data = { headline: 'a</script>b', sep: 'x y z', nested: { n: 1 } };
    const out = serializeJsonLd(data);

    expect(JSON.parse(out)).toEqual(data);
  });

  it('leaves ordinary objects untouched apart from the escapes', () => {
    expect(serializeJsonLd({ name: 'Acme' })).toBe('{"name":"Acme"}');
  });
});
