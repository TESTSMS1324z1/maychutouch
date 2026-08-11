export interface AutoPayment {
  id: string;
  conditionNodeId: string; // The node whose balance is checked
  conditionType: 'greaterThan' | 'lessThan';
  conditionValue: number;
  paymentAmount: number;
  targetNodeId: string; // The node receiving the payment
}

export interface NodeData {
  id: string;
  type?: 'default' | 'calculator';
  x: number;
  y: number;
  text: string;
  color: string;
  groupId?: string;
  balance: number;
  autoPayments?: AutoPayment[];
  formula?: string;
  result?: number | string;
}

export interface ConnectionData {
  id: string;
  fromId: string;
  toId: string;
  amount: number;
  info?: string;
}

export interface GroupData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  color: string;
  balance: number;
  autoPayments?: AutoPayment[];
}

export interface ViewPoint {
  id: string;
  name: string;
  x: number;
  y: number;
  scale: number;
}
