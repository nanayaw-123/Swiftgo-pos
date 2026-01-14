import { CashDrawerDevice, DeviceStatus } from './hardware-types';

// ESC/POS command to open cash drawer
const OPEN_DRAWER_CMD = '\x1B\x70\x00\x19\xFA'; // ESC p 0 25 250

export class CashDrawerService {
  private printerDevice: USBDevice | null = null;
  private printerEndpoint: USBEndpoint | null = null;
  private status: DeviceStatus = 'disconnected';

  // Connect cash drawer (usually through printer)
  async connect(printerDevice?: USBDevice, printerEndpoint?: USBEndpoint): Promise<CashDrawerDevice | null> {
    if (printerDevice && printerEndpoint) {
      this.printerDevice = printerDevice;
      this.printerEndpoint = printerEndpoint;
      this.status = 'connected';

      return {
        id: 'cash-drawer',
        type: 'cash_drawer',
        name: 'Cash Drawer',
        connectionType: 'usb',
        status: 'connected',
        lastConnected: new Date(),
        openCommand: OPEN_DRAWER_CMD,
      };
    }

    try {
      // Request USB device (printer with cash drawer port)
      const device = await navigator.usb.requestDevice({
        filters: [{ classCode: 7 }] // Printer class
      });

      await device.open();
      
      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }

      const interfaceNumber = device.configuration?.interfaces[0].interfaceNumber || 0;
      await device.claimInterface(interfaceNumber);

      const iface = device.configuration?.interfaces[0];
      const endpoint = iface?.alternates[0]?.endpoints.find(
        ep => ep.direction === 'out' && ep.type === 'bulk'
      );

      if (!endpoint) {
        throw new Error('No suitable endpoint found');
      }

      this.printerDevice = device;
      this.printerEndpoint = endpoint;
      this.status = 'connected';

      return {
        id: device.serialNumber || 'usb-cash-drawer',
        type: 'cash_drawer',
        name: 'Cash Drawer',
        connectionType: 'usb',
        status: 'connected',
        lastConnected: new Date(),
        openCommand: OPEN_DRAWER_CMD,
      };
    } catch (error) {
      console.error('Failed to connect cash drawer:', error);
      this.status = 'error';
      return null;
    }
  }

  // Open cash drawer
  async open(): Promise<boolean> {
    if (!this.printerDevice || !this.printerEndpoint) {
      console.error('Cash drawer not connected');
      return false;
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(OPEN_DRAWER_CMD);

      await this.printerDevice.transferOut(
        this.printerEndpoint.endpointNumber,
        data
      );

      return true;
    } catch (error) {
      console.error('Failed to open cash drawer:', error);
      return false;
    }
  }

  // Disconnect
  async disconnect(): Promise<void> {
    // Don't close the printer device if it's shared
    if (this.printerDevice && !(this as any).sharedPrinter) {
      await this.printerDevice.close();
    }
    
    this.printerDevice = null;
    this.printerEndpoint = null;
    this.status = 'disconnected';
  }

  // Get status
  getStatus(): DeviceStatus {
    return this.status;
  }
}

// Singleton instance
export const cashDrawerService = new CashDrawerService();
