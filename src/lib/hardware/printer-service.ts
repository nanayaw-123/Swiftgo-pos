import { ReceiptData, PrinterDevice, DeviceStatus } from './hardware-types';

// ESC/POS Commands for thermal printers
const ESC = '\x1B';
const GS = '\x1D';

export class PrinterService {
  private device: USBDevice | null = null;
  private endpoint: USBEndpoint | null = null;
  private status: DeviceStatus = 'disconnected';

  // Connect to USB printer
  async connectUSB(): Promise<PrinterDevice | null> {
    try {
      // Request USB device
      const device = await navigator.usb.requestDevice({
        filters: [
          { classCode: 7 }, // Printer class
        ]
      });

      await device.open();
      
      // Select configuration
      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }

      // Claim interface
      const interfaceNumber = device.configuration?.interfaces[0].interfaceNumber || 0;
      await device.claimInterface(interfaceNumber);

      // Find endpoint
      const iface = device.configuration?.interfaces[0];
      const endpoint = iface?.alternates[0]?.endpoints.find(
        ep => ep.direction === 'out' && ep.type === 'bulk'
      );

      if (!endpoint) {
        throw new Error('No suitable endpoint found');
      }

      this.device = device;
      this.endpoint = endpoint;
      this.status = 'connected';

      return {
        id: device.serialNumber || 'usb-printer',
        type: 'receipt_printer',
        name: device.productName || 'USB Receipt Printer',
        connectionType: 'usb',
        status: 'connected',
        lastConnected: new Date(),
        paperWidth: 80, // Default 80mm
        supportsGraphics: true,
        maxLineWidth: 48, // 80mm ÷ ~1.67mm per char
      };
    } catch (error) {
      console.error('Failed to connect to USB printer:', error);
      this.status = 'error';
      return null;
    }
  }

  // Connect to Network printer (via IP)
  async connectNetwork(ipAddress: string, port: number = 9100): Promise<PrinterDevice | null> {
    // Network printing would require backend proxy or specialized library
    // This is a placeholder for network printer support
    return {
      id: `network-${ipAddress}`,
      type: 'receipt_printer',
      name: `Network Printer (${ipAddress})`,
      connectionType: 'network',
      status: 'connected',
      lastConnected: new Date(),
      paperWidth: 80,
      supportsGraphics: true,
      maxLineWidth: 48,
    };
  }

  // Print receipt
  async printReceipt(receipt: ReceiptData): Promise<boolean> {
    if (!this.device || !this.endpoint) {
      throw new Error('Printer not connected');
    }

    try {
      const commands = this.buildReceiptCommands(receipt);
      const encoder = new TextEncoder();
      const data = encoder.encode(commands);

      await this.device.transferOut(this.endpoint.endpointNumber, data);
      
      return true;
    } catch (error) {
      console.error('Print failed:', error);
      return false;
    }
  }

  // Build ESC/POS commands for receipt
  private buildReceiptCommands(receipt: ReceiptData): string {
    let commands = '';

    // Initialize printer
    commands += `${ESC}@`; // Reset
    commands += `${ESC}a\x01`; // Center align

    // Store header
    commands += `${ESC}E\x01`; // Bold on
    commands += `${GS}!\x11`; // Double height & width
    commands += `${receipt.storeName}\n`;
    commands += `${GS}!\x00`; // Normal size
    commands += `${ESC}E\x00`; // Bold off

    if (receipt.storeAddress) {
      commands += `${receipt.storeAddress}\n`;
    }
    if (receipt.storePhone) {
      commands += `Tel: ${receipt.storePhone}\n`;
    }

    commands += '\n';

    // Receipt number and date
    commands += `${ESC}a\x00`; // Left align
    commands += `Receipt: ${receipt.receiptNumber}\n`;
    commands += `Date: ${receipt.date.toLocaleString()}\n`;
    commands += `Cashier: ${receipt.cashierName}\n`;
    commands += this.printLine();

    // Items
    commands += `${ESC}E\x01`; // Bold
    commands += this.formatRow('ITEM', 'QTY', 'PRICE', 'TOTAL');
    commands += `${ESC}E\x00`; // Normal
    commands += this.printLine();

    receipt.items.forEach(item => {
      commands += `${item.name}\n`;
      commands += this.formatRow(
        '',
        `${item.quantity}x`,
        `${receipt.currency}${item.unitPrice.toFixed(2)}`,
        `${receipt.currency}${item.total.toFixed(2)}`
      );
    });

    commands += this.printLine();

    // Totals
    commands += `${ESC}a\x02`; // Right align
    commands += `Subtotal: ${receipt.currency}${receipt.subtotal.toFixed(2)}\n`;
    
    if (receipt.discount > 0) {
      commands += `Discount: -${receipt.currency}${receipt.discount.toFixed(2)}\n`;
    }
    
    if (receipt.tax > 0) {
      commands += `Tax: ${receipt.currency}${receipt.tax.toFixed(2)}\n`;
    }

    commands += `${ESC}E\x01`; // Bold
    commands += `${GS}!\x11`; // Double size
    commands += `TOTAL: ${receipt.currency}${receipt.total.toFixed(2)}\n`;
    commands += `${GS}!\x00${ESC}E\x00`; // Normal

    // Payment info
    commands += `${ESC}a\x00`; // Left align
    commands += this.printLine();
    commands += `Payment Method: ${receipt.paymentMethod}\n`;
    commands += `Amount Paid: ${receipt.currency}${receipt.amountPaid.toFixed(2)}\n`;
    
    if (receipt.change > 0) {
      commands += `Change: ${receipt.currency}${receipt.change.toFixed(2)}\n`;
    }

    // Footer
    if (receipt.footer) {
      commands += '\n';
      commands += `${ESC}a\x01`; // Center
      commands += `${receipt.footer}\n`;
    }

    commands += '\n';
    commands += `${ESC}a\x01`; // Center
    commands += 'Thank you for your business!\n';
    commands += '\n\n\n\n';
    
    // Cut paper
    commands += `${GS}V\x00`; // Full cut

    return commands;
  }

  // Format row with columns
  private formatRow(col1: string, col2: string, col3: string, col4: string): string {
    const widths = [16, 8, 12, 12]; // Column widths
    return (
      col1.padEnd(widths[0]).slice(0, widths[0]) +
      col2.padEnd(widths[1]).slice(0, widths[1]) +
      col3.padEnd(widths[2]).slice(0, widths[2]) +
      col4.padEnd(widths[3]).slice(0, widths[3]) +
      '\n'
    );
  }

  // Print dashed line
  private printLine(): string {
    return '-'.repeat(48) + '\n';
  }

  // Test print
  async testPrint(): Promise<boolean> {
    const testReceipt: ReceiptData = {
      storeName: 'SwiftPOS Test',
      storeAddress: 'Test Address',
      receiptNumber: 'TEST-001',
      date: new Date(),
      cashierName: 'Test User',
      items: [
        { name: 'Test Item 1', quantity: 1, unitPrice: 10.00, total: 10.00 },
        { name: 'Test Item 2', quantity: 2, unitPrice: 5.00, total: 10.00 },
      ],
      subtotal: 20.00,
      tax: 0.00,
      discount: 0.00,
      total: 20.00,
      paymentMethod: 'Cash',
      amountPaid: 20.00,
      change: 0.00,
      currency: 'GHS',
      footer: 'This is a test receipt',
    };

    return this.printReceipt(testReceipt);
  }

  // Disconnect
  async disconnect(): Promise<void> {
    if (this.device) {
      await this.device.close();
      this.device = null;
      this.endpoint = null;
      this.status = 'disconnected';
    }
  }

  // Get status
  getStatus(): DeviceStatus {
    return this.status;
  }
}

// Singleton instance
export const printerService = new PrinterService();
