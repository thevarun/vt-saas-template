export const CHANGELOG_TAGS = ['new', 'improved', 'fixed'] as const;

export type ChangelogTag = (typeof CHANGELOG_TAGS)[number];

export type ChangelogHighlight = {
  tag: ChangelogTag;
  title: string;
  body: string;
};

export type ChangelogVersion = {
  version: string;
  date: string;
  summary: string;
  highlights: ChangelogHighlight[];
  underTheHood: string[];
};

export type Changelog = {
  versions: ChangelogVersion[];
};
