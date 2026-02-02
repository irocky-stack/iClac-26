
export type Operation = '+' | '-' | '*' | '/' | '%' | null;

export interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

export interface CalculatorState {
  displayValue: string;
  previousValue: string | null;
  operation: Operation;
  waitingForOperand: boolean;
  history: HistoryItem[];
  memoryValue: number;
}
