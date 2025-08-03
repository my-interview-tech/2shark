import { ScanOptions } from "../../types"

  export const DEFAULT_OPTIONS: ScanOptions = {
    docsPath: './docs',
    configPath: {
      technologyPath: './config/category-mapping.yaml',
      specialtiesPath: './config/specialties.yaml',
    },
    databaseUrl: 'postgresql://user:pass@localhost:5432/db',
    clearBeforeScan: false,
  } as const;
  
