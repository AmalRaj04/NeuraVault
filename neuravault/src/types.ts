export interface DockingResult {
  protein: string;
  ligand: string;
  binding_energy: number;
  docking_tool: string;
  tags: string[];
  confidence: number;
  file_hash: string;
  timestamp: string;
  solana_tx: string | null;
}

export interface ParsedDockingData {
  protein: string;
  ligand: string;
  binding_energy: number;
  docking_tool: string;
  file_hash: string;
}

export interface TaggedDockingData extends ParsedDockingData {
  tags: string[];
  confidence: number;
}
