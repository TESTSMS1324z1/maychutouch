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
  x: number;
  y: number;
  text: string;
  color: string;
  groupId?: string;
  balance: number;
  autoPayments?: AutoPayment[];
}

export interface ConnectionData {
  id: string;
  fromId: string;
  toId: string;
  amount: number;
}

export interface GroupData {
  id: string;
  x: number;
  y: number;
  title: string;
  color: string;
}

export interface ViewPoint {
  id: string;
  name: string;
  x: number;
  y: number;
  scale: number;
}
