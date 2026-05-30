import { TechnologyMapping, SpecialtyMapping } from '../../../types';

export type TProcessMarkdownFileParams = {
  filePath: string;
  technologyMapping: TechnologyMapping;
  specialtyMapping: SpecialtyMapping;
};

export type TRevisionMetadata = {
  sourceBranch: string;
  sourceCommitSha: string;
  sourcePath: string;
  importedAt: Date;
};

export type TProcessMarkdownContentParams = {
  filePath: string;
  content: string;
  technologyMapping: TechnologyMapping;
  specialtyMapping: SpecialtyMapping;
  revisionMetadata?: TRevisionMetadata;
};
