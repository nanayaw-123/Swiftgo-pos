// Hardware Device Types
export type DeviceType = 'receipt_printer' | 'barcode_scanner' | 'cash_drawer' | 'card_reader';
export type ConnectionType = 'usb' | 'bluetooth' | 'network' | 'serial';
export type DeviceStatus = 'connected' | 'disconnected' | 'error' | 'initializing';

// Device Interfaces
export interface HardwareDevice {
  id: string;
  type: DeviceType;
  name: string;
  connectionType: ConnectionType;
  status: DeviceStatus;
  lastConnected?: Date;
  configuration?: Record<string, unknown>;
}

export interface PrinterDevice extends HardwareDevice {
  type: 'receipt_printer';
  paperWidth: number; // in mm
  supportsGraphics: boolean;
  maxLineWidth: number; // characters
}

export interface BarcodeScannerDevice extends HardwareDevice {
  type: 'barcode_scanner';
  supportedFormats: string[];
}

export interface CashDrawerDevice extends HardwareDevice {
  type: 'cash_drawer';
  openCommand: string;
}

export interface CardReaderDevice extends HardwareDevice {
  type: 'card_reader';
  supportedCardTypes: string[];
}

// Receipt Data
export interface ReceiptData {
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  receiptNumber: string;
  date: Date;
  cashierName: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  amountPaid: number;
  change: number;
  currency: string;
  footer?: string;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  sku?: string;
}

// Barcode Scan Result
export interface BarcodeScanResult {
  code: string;
  format: string;
  timestamp: Date;
}

// Hardware Events
export interface HardwareEvent {
  type: 'connected' | 'disconnected' | 'error' | 'scan' | 'print_complete';
  deviceId: string;
  data?: unknown;
  timestamp: Date;
}

// Device Configuration
export interface DeviceConfiguration {
  autoConnect: boolean;
  retryAttempts: number;
  timeout: number;
  customSettings?: Record<string, unknown>;
}
