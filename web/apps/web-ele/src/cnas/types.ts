export type CnasPageMode =
  | 'approval'
  | 'dashboard'
  | 'detail'
  | 'form'
  | 'list'
  | 'matrix'
  | 'monitor'
  | 'schedule'
  | 'workflow'
  | 'wizard';

export interface CnasPageDefinition {
  description: string;
  fields: string[];
  id: string;
  mode: CnasPageMode;
  module: string;
  title: string;
}
