export interface IServiceHistoryLine {
  id: string;
  code: string;
  name: string;
  quantity: number | null;
  unit: string;
  unitPrice: number;
  discount: number | null;
}

export interface IServiceHistoryItem {
  workId: string;
  workNumber: number;
  openedOn: string;
  closedOn: string | null;
  status: string;
  clientId: string | null;
  clientName: string;
  vehicleId: string | null;
  registration: string;
  vehicleMake: string;
  vehicleModel: string;
  odometer: number | null;
  summary: string;
  labor: IServiceHistoryLine[];
  parts: IServiceHistoryLine[];
  totalAmount: number | null;
  currency: string;
  invoiceNumber: number | null;
  invoiceId: string | null;
  hasInvoice: boolean;
}

export interface IServiceHistoryPage {
  totalCount: number;
  totalInvoiced: number;
  lastServiceDate: string | null;
  lastRecordedOdometer: number | null;
  offset: number;
  limit: number;
  hasMore: boolean;
  items: IServiceHistoryItem[];
}

export type ServiceHistoryScope = "client" | "vehicle";
