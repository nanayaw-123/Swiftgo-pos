'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Printer, Scan, DollarSign, CreditCard, Bluetooth, Usb, Wifi, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { printerService } from '@/lib/hardware/printer-service';
import { barcodeScannerService } from '@/lib/hardware/barcode-scanner-service';
import { cashDrawerService } from '@/lib/hardware/cash-drawer-service';
import type { HardwareDevice, DeviceStatus, ReceiptData } from '@/lib/hardware/hardware-types';

interface HardwareManagerProps {
  onScan?: (code: string) => void;
  showInDialog?: boolean;
}

export function HardwareManager({ onScan, showInDialog = true }: HardwareManagerProps) {
  const [devices, setDevices] = useState<HardwareDevice[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [testingDevice, setTestingDevice] = useState<string | null>(null);

  useEffect(() => {
    // Set up barcode scan listener
    if (onScan) {
      const handleScan = (result: any) => {
        onScan(result.code);
        toast.success(`Scanned: ${result.code}`);
      };

      barcodeScannerService.onScan(handleScan);

      return () => {
        barcodeScannerService.offScan(handleScan);
      };
    }
  }, [onScan]);

  const connectPrinter = async () => {
    try {
      const device = await printerService.connectUSB();
      if (device) {
        setDevices(prev => [...prev.filter(d => d.type !== 'receipt_printer'), device]);
        toast.success('Printer connected successfully');
      }
    } catch (error) {
      toast.error('Failed to connect printer');
    }
  };

  const connectScanner = async (type: 'usb' | 'keyboard' | 'camera') => {
    try {
      let device;
      
      if (type === 'usb') {
        device = await barcodeScannerService.connectUSB();
      } else if (type === 'keyboard') {
        device = barcodeScannerService.connectKeyboardWedge();
      } else {
        device = await barcodeScannerService.connectCamera();
      }

      if (device) {
        setDevices(prev => [...prev.filter(d => d.type !== 'barcode_scanner'), device]);
        toast.success('Scanner connected successfully');
      }
    } catch (error) {
      toast.error('Failed to connect scanner');
    }
  };

  const connectCashDrawer = async () => {
    try {
      const device = await cashDrawerService.connect();
      if (device) {
        setDevices(prev => [...prev.filter(d => d.type !== 'cash_drawer'), device]);
        toast.success('Cash drawer connected successfully');
      }
    } catch (error) {
      toast.error('Failed to connect cash drawer');
    }
  };

  const testPrinter = async () => {
    setTestingDevice('printer');
    try {
      const success = await printerService.testPrint();
      if (success) {
        toast.success('Test receipt printed!');
      } else {
        toast.error('Print test failed');
      }
    } catch (error) {
      toast.error('Print test failed');
    } finally {
      setTestingDevice(null);
    }
  };

  const openCashDrawer = async () => {
    setTestingDevice('cashdrawer');
    try {
      const success = await cashDrawerService.open();
      if (success) {
        toast.success('Cash drawer opened');
      } else {
        toast.error('Failed to open cash drawer');
      }
    } catch (error) {
      toast.error('Failed to open cash drawer');
    } finally {
      setTestingDevice(null);
    }
  };

  const disconnectDevice = async (device: HardwareDevice) => {
    try {
      if (device.type === 'receipt_printer') {
        await printerService.disconnect();
      } else if (device.type === 'barcode_scanner') {
        await barcodeScannerService.disconnect();
      } else if (device.type === 'cash_drawer') {
        await cashDrawerService.disconnect();
      }

      setDevices(prev => prev.filter(d => d.id !== device.id));
      toast.success('Device disconnected');
    } catch (error) {
      toast.error('Failed to disconnect device');
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'receipt_printer': return <Printer className="w-5 h-5" />;
      case 'barcode_scanner': return <Scan className="w-5 h-5" />;
      case 'cash_drawer': return <DollarSign className="w-5 h-5" />;
      case 'card_reader': return <CreditCard className="w-5 h-5" />;
      default: return <Usb className="w-5 h-5" />;
    }
  };

  const getConnectionIcon = (type: string) => {
    switch (type) {
      case 'usb': return <Usb className="w-4 h-4" />;
      case 'bluetooth': return <Bluetooth className="w-4 h-4" />;
      case 'network': return <Wifi className="w-4 h-4" />;
      default: return <Usb className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: DeviceStatus) => {
    switch (status) {
      case 'connected':
        return (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        );
      case 'disconnected':
        return (
          <Badge variant="secondary">
            <XCircle className="w-3 h-3 mr-1" />
            Disconnected
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-100 text-red-700">
            <XCircle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Initializing
          </Badge>
        );
    }
  };

  const content = (
    <div className="space-y-6">
      {/* Connected Devices */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Connected Devices</h3>
        {devices.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">
            <p>No devices connected. Connect your hardware devices below.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {devices.map(device => (
              <Card key={device.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      {getDeviceIcon(device.type)}
                    </div>
                    <div>
                      <div className="font-medium">{device.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        {getConnectionIcon(device.connectionType)}
                        {device.connectionType.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(device.status)}
                    
                    {device.type === 'receipt_printer' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={testPrinter}
                        disabled={testingDevice === 'printer'}
                      >
                        {testingDevice === 'printer' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Test Print'
                        )}
                      </Button>
                    )}
                    
                    {device.type === 'cash_drawer' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={openCashDrawer}
                        disabled={testingDevice === 'cashdrawer'}
                      >
                        {testingDevice === 'cashdrawer' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Open'
                        )}
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => disconnectDevice(device)}
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Connect New Devices */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Connect Devices</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Printer className="w-5 h-5 text-primary" />
              <div className="font-medium">Receipt Printer</div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Connect USB thermal receipt printer
            </p>
            <Button onClick={connectPrinter} className="w-full" size="sm">
              <Usb className="w-4 h-4 mr-2" />
              Connect USB Printer
            </Button>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Scan className="w-5 h-5 text-primary" />
              <div className="font-medium">Barcode Scanner</div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Connect barcode scanner or use camera
            </p>
            <div className="space-y-2">
              <Button onClick={() => connectScanner('keyboard')} className="w-full" size="sm" variant="outline">
                Keyboard Wedge
              </Button>
              <Button onClick={() => connectScanner('usb')} className="w-full" size="sm" variant="outline">
                <Usb className="w-4 h-4 mr-2" />
                USB Scanner
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <DollarSign className="w-5 h-5 text-primary" />
              <div className="font-medium">Cash Drawer</div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Connect cash drawer via printer
            </p>
            <Button onClick={connectCashDrawer} className="w-full" size="sm">
              Connect Cash Drawer
            </Button>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <CreditCard className="w-5 h-5 text-primary" />
              <div className="font-medium">Card Reader</div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Payment terminal integration
            </p>
            <Button className="w-full" size="sm" disabled>
              Coming Soon
            </Button>
          </Card>
        </div>
      </div>

      {/* Information */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="text-sm space-y-2">
          <p className="font-medium text-blue-900 dark:text-blue-100">Hardware Tips:</p>
          <ul className="list-disc list-inside text-blue-800 dark:text-blue-200 space-y-1">
            <li>USB devices require browser permission on first connect</li>
            <li>Keyboard wedge scanners work immediately without setup</li>
            <li>Cash drawer typically connects through receipt printer</li>
            <li>Test your printer before processing real transactions</li>
          </ul>
        </div>
      </Card>
    </div>
  );

  if (showInDialog) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Usb className="w-4 h-4 mr-2" />
            Hardware Devices
            {devices.length > 0 && (
              <Badge className="ml-2" variant="secondary">{devices.length}</Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Hardware Device Manager</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return content;
}
