export type BlockLoaderTone = 'muted' | 'tint' | 'primary' | 'dark';

export interface BlockLoaderBlock {
  kind: string;
  title: string;
  tone: BlockLoaderTone;
  width: number;
}
