import { BarcodeScanResult, BarcodeScannerDevice, DeviceStatus } from './hardware-types';

export class BarcodeScannerService {
  private device: USBDevice | null = null;
  private status: DeviceStatus = 'disconnected';
  private scanCallbacks: ((result: BarcodeScanResult) => void)[] = [];
  private isReading = false;

  // Connect to USB barcode scanner
  async connectUSB(): Promise<BarcodeScannerDevice | null> {
    try {
      const device = await navigator.usb.requestDevice({
        filters: [
          { classCode: 3 }, // HID class (keyboard wedge scanners)
        ]
      });

      await device.open();
      
      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }

      const interfaceNumber = device.configuration?.interfaces[0].interfaceNumber || 0;
      await device.claimInterface(interfaceNumber);

      this.device = device;
      this.status = 'connected';
      this.startReading();

      return {
        id: device.serialNumber || 'usb-scanner',
        type: 'barcode_scanner',
        name: device.productName || 'USB Barcode Scanner',
        connectionType: 'usb',
        status: 'connected',
        lastConnected: new Date(),
        supportedFormats: ['EAN-13', 'UPC-A', 'Code 128', 'QR Code'],
      };
    } catch (error) {
      console.error('Failed to connect to USB scanner:', error);
      this.status = 'error';
      return null;
    }
  }

  // Connect via keyboard wedge (listen to keyboard input)
  connectKeyboardWedge(): BarcodeScannerDevice {
    let buffer = '';
    let timeout: NodeJS.Timeout | null = null;

    const handleKeyPress = (event: KeyboardEvent) => {
      // Check if scan is in progress
      if (event.key === 'Enter') {
        if (buffer.length > 0) {
          this.emitScan({
            code: buffer,
            format: 'Unknown',
            timestamp: new Date(),
          });
          buffer = '';
        }
      } else if (event.key.length === 1) {
        buffer += event.key;
        
        // Auto-submit after short delay
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
          if (buffer.length > 0) {
            this.emitScan({
              code: buffer,
              format: 'Unknown',
              timestamp: new Date(),
            });
            buffer = '';
          }
        }, 100);
      }
    };

    document.addEventListener('keypress', handleKeyPress);
    this.status = 'connected';

    return {
      id: 'keyboard-wedge',
      type: 'barcode_scanner',
      name: 'Keyboard Wedge Scanner',
      connectionType: 'usb',
      status: 'connected',
      lastConnected: new Date(),
      supportedFormats: ['Any'],
    };
  }

  // Use device camera for barcode scanning
  async connectCamera(): Promise<BarcodeScannerDevice | null> {
    try {
      // Check if BarcodeDetector API is available
      if (!('BarcodeDetector' in window)) {
        console.warn('BarcodeDetector API not supported');
        return null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });

      // Store stream reference
      (this as any).cameraStream = stream;
      this.status = 'connected';

      return {
        id: 'camera-scanner',
        type: 'barcode_scanner',
        name: 'Camera Barcode Scanner',
        connectionType: 'usb',
        status: 'connected',
        lastConnected: new Date(),
        supportedFormats: ['QR Code', 'EAN-13', 'Code 128'],
      };
    } catch (error) {
      console.error('Failed to connect camera:', error);
      this.status = 'error';
      return null;
    }
  }

  // Start reading from USB scanner
  private async startReading(): Promise<void> {
    if (!this.device || this.isReading) return;

    this.isReading = true;

    try {
      while (this.isReading && this.device) {
        const result = await this.device.transferIn(1, 64);
        
        if (result.data) {
          const decoder = new TextDecoder();
          const code = decoder.decode(result.data).trim();
          
          if (code) {
            this.emitScan({
              code,
              format: 'Unknown',
              timestamp: new Date(),
            });
          }
        }
      }
    } catch (error) {
      console.error('Error reading from scanner:', error);
      this.isReading = false;
    }
  }

  // Scan from camera
  async scanFromCamera(video: HTMLVideoElement): Promise<BarcodeScanResult | null> {
    try {
      // @ts-ignore - BarcodeDetector may not be in TypeScript definitions
      const barcodeDetector = new BarcodeDetector({
        formats: ['qr_code', 'ean_13', 'code_128', 'code_39']
      });

      const barcodes = await barcodeDetector.detect(video);
      
      if (barcodes.length > 0) {
        const result = {
          code: barcodes[0].rawValue,
          format: barcodes[0].format,
          timestamp: new Date(),
        };
        
        this.emitScan(result);
        return result;
      }

      return null;
    } catch (error) {
      console.error('Camera scan failed:', error);
      return null;
    }
  }

  // Register scan callback
  onScan(callback: (result: BarcodeScanResult) => void): void {
    this.scanCallbacks.push(callback);
  }

  // Unregister scan callback
  offScan(callback: (result: BarcodeScanResult) => void): void {
    this.scanCallbacks = this.scanCallbacks.filter(cb => cb !== callback);
  }

  // Emit scan event
  private emitScan(result: BarcodeScanResult): void {
    this.scanCallbacks.forEach(callback => callback(result));
  }

  // Disconnect
  async disconnect(): Promise<void> {
    this.isReading = false;

    if (this.device) {
      await this.device.close();
      this.device = null;
    }

    // Stop camera if active
    const stream = (this as any).cameraStream as MediaStream;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      (this as any).cameraStream = null;
    }

    this.status = 'disconnected';
    this.scanCallbacks = [];
  }

  // Get status
  getStatus(): DeviceStatus {
    return this.status;
  }
}

// Singleton instance
export const barcodeScannerService = new BarcodeScannerService();
