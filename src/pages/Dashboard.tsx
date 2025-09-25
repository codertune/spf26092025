import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Play, Square, Download, AlertCircle, CheckCircle, Clock, CreditCard, BarChart3, Settings, Trash2, FileDown, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface FileAnalysis {
  name: string;
  size: number;
  type: string;
  rows: number;
  credits: number;
}

interface AutomationProcess {
  id: string;
  serviceId: string;
  serviceName: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  files: FileAnalysis[];
  creditsUsed: number;
  output: string[];
  resultFiles?: string[];
}

export default function Dashboard() {
  const { user, deductCredits, updateUser, isServiceEnabled, addWorkHistory, getWorkHistory, creditSettings, addCredits } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [fileAnalysis, setFileAnalysis] = useState<{ [key: string]: FileAnalysis }>({});
  const [selectedService, setSelectedService] = useState('');
  const [automationProcesses, setAutomationProcesses] = useState<AutomationProcess[]>([]);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // All available services - filtered by admin settings
  const allServices = [
    { id: 'pdf-excel-converter', name: 'PDF to Excel/CSV Converter', category: 'PDF Extractor', requiresCredentials: false },
    { id: 'webcontainer-demo', name: 'WebContainer Demo Service', category: 'Demo Services', requiresCredentials: false },
    { id: 'exp-issue', name: 'Issue EXP', category: 'Bangladesh Bank', requiresCredentials: true },
    { id: 'exp-correction', name: 'Issued EXP Correction', category: 'Bangladesh Bank', requiresCredentials: true },
    { id: 'exp-duplicate-reporting', name: 'Duplicate EXP', category: 'Bangladesh Bank', requiresCredentials: true },
    { id: 'exp-search', name: 'Search EXP Detail Information', category: 'Bangladesh Bank', requiresCredentials: true },
    { id: 'damco-booking', name: 'Damco (APM) - Booking', category: 'Forwarder Handler - Damco', requiresCredentials: true },
    { id: 'damco-booking-download', name: 'Damco (APM) - Booking Download', category: 'Forwarder Handler - Damco', requiresCredentials: true },
    { id: 'damco-fcr-submission', name: 'Damco (APM) - FCR Submission', category: 'Forwarder Handler - Damco', requiresCredentials: true },
    { id: 'damco-fcr-extractor', name: 'Damco (APM) - FCR Extractor from Mail', category: 'Forwarder Handler - Damco', requiresCredentials: true },
    { id: 'damco-edoc-upload', name: 'Damco (APM) - E-Doc Upload', category: 'Forwarder Handler - Damco', requiresCredentials: true },
    { id: 'hm-einvoice-create', name: 'H&M - E-Invoice Create', category: 'Buyer Handler - H&M', requiresCredentials: true },
    { id: 'hm-einvoice-download', name: 'H&M - E-Invoice Download', category: 'Buyer Handler - H&M', requiresCredentials: true },
    { id: 'hm-einvoice-correction', name: 'H&M - E-Invoice Correction', category: 'Buyer Handler - H&M', requiresCredentials: true },
    { id: 'hm-packing-list', name: 'H&M - Download E-Packing List', category: 'Buyer Handler - H&M', requiresCredentials: true },
    { id: 'bepza-ep-issue', name: 'BEPZA - EP Issue', category: 'BEPZA', requiresCredentials: true },
    { id: 'bepza-ep-submission', name: 'BEPZA - EP Submission', category: 'BEPZA', requiresCredentials: true },
    { id: 'bepza-ep-download', name: 'BEPZA - EP Download', category: 'BEPZA', requiresCredentials: true },
    { id: 'bepza-ip-issue', name: 'BEPZA - IP Issue', category: 'BEPZA', requiresCredentials: true },
    { id: 'bepza-ip-submit', name: 'BEPZA - IP Submit', category: 'BEPZA', requiresCredentials: true },
    { id: 'bepza-ip-download', name: 'BEPZA - IP Download', category: 'BEPZA', requiresCredentials: true },
    { id: 'cash-incentive-application', name: 'Cash Incentive Application', category: 'Cash Incentive Applications', requiresCredentials: false },
    { id: 'ctg-port-tracking', name: 'CTG Port Authority Tracking', category: 'Tracking Services', requiresCredentials: false },
    { id: 'damco-tracking-maersk', name: 'Damco (APM) Tracking', category: 'Tracking Services', requiresCredentials: false },
    { id: 'myshipment-tracking', name: 'MyShipment Tracking (MGH)', category: 'Tracking Services', requiresCredentials: false },
    { id: 'egm-download', name: 'EGM Download', category: 'Tracking Services', requiresCredentials: false },
    { id: 'custom-tracking', name: 'Custom Tracking', category: 'Tracking Services', requiresCredentials: false },
    { id: 'example-automation', name: 'Example Automation Service', category: 'Custom Services', requiresCredentials: false }  // Add your new service here
  ];

  // Filter services based on admin settings - only show enabled services
  const services = allServices.filter(service => {
    const enabled = isServiceEnabled(service.id);
    console.log(`Dashboard - Service ${service.id}: enabled = ${enabled}`);
    return enabled;
  });


  const analyzeFile = (file: File): FileAnalysis => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    let credits = 1;
    let rows = 1;

    if (fileExtension === 'csv') {
      // For CSV files, we'll read and count actual rows
      // This will be updated when the file is actually read
      credits = 1; // Temporary, will be updated after reading
      rows = 1; // Temporary, will be updated after reading
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      // For Excel files, estimate based on file size
      const fileSizeKB = file.size / 1024;
      rows = Math.max(1, Math.floor(fileSizeKB / 2)); // Rough estimation for Excel
      credits = rows; // 1 credit per row
    } else if (fileExtension === 'pdf') {
      credits = 1; // 1 credit for PDF files
    }

    return {
      name: file.name,
      size: file.size,
      type: file.type,
      rows,
      credits: credits
    };
  };

  const readCSVFile = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim() !== ''); // Remove empty lines
          const dataRows = lines.length > 1 ? lines.length - 1 : 0; // Exclude header row
          resolve(dataRows);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const handleFileUpload = (uploadedFiles: FileList | null) => {
    if (!uploadedFiles) return;

    // Check file type restrictions based on selected service
    if (selectedService) {
      const invalidFiles = Array.from(uploadedFiles).filter(file => {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        
        if (selectedService === 'pdf-excel-converter') {
          return fileExtension !== 'pdf';
        } else {
          return !['xlsx', 'xls', 'csv'].includes(fileExtension || '');
        }
      });

      if (invalidFiles.length > 0) {
        const serviceData = services.find(s => s.id === selectedService);
        const allowedTypes = selectedService === 'pdf-excel-converter' ? 'PDF files only' : 'Excel/CSV files only';
        alert(`Invalid file type for ${serviceData?.name}. ${allowedTypes} are supported.`);
        return;
      }
    }

    // Process files with smart analysis
    processFilesWithSmartAnalysis(uploadedFiles);
  };

  const processFilesWithSmartAnalysis = async (uploadedFiles: FileList) => {
    const newFiles = Array.from(uploadedFiles);
    const analysis: { [key: string]: FileAnalysis } = {};

    // Process each file
    for (const file of newFiles) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'csv') {
        try {
          // Read CSV and count actual rows
          const dataRows = await readCSVFile(file);
          analysis[file.name] = {
            name: file.name,
            size: file.size,
            type: file.type,
            rows: dataRows,
            credits: dataRows // 1 credit per data row (excluding header)
          };
        } catch (error) {
          console.error('Error reading CSV file:', error);
          // Fallback to basic analysis
          analysis[file.name] = analyzeFile(file);
        }
      } else {
        // Use basic analysis for non-CSV files
        analysis[file.name] = analyzeFile(file);
      }
    }

    // Update state with accurate analysis
    setFiles(prev => [...prev, ...newFiles]);
    setFileAnalysis(prev => ({ ...prev, ...analysis }));

    // Also upload to backend for server-side processing
    uploadFilesToBackend(uploadedFiles);
  };

  const uploadFilesToBackend = async (uploadedFiles: FileList) => {
    const formData = new FormData();
    Array.from(uploadedFiles).forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        // Handle HTTP error responses
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorText = await response.text();
          if (errorText) {
            const errorResult = JSON.parse(errorText);
            errorMessage = errorResult.message || errorMessage;
          }
        } catch (parseError) {
          // Use default error message if parsing fails
        }
        throw new Error(errorMessage);
      }
      
      const text = await response.text();
      if (!text) {
        throw new Error('Empty response from server');
      }

      let result;
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        throw new Error(`Invalid server response: ${text}`);
      }

      if (result.success) {
        // Backend analysis is now secondary - we use frontend analysis for display
        console.log('Backend analysis completed:', result);
      } else {
        throw new Error(result.message || 'File upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      if (error.message.includes('Failed to fetch') || error.message.includes('ECONNREFUSED') || error.message.includes('fetch')) {
        console.warn('Backend server not running, using frontend analysis only');
        alert('⚠️ Backend server is not running.\n\nTo enable full functionality:\n1. Open a new terminal\n2. Run: npm run server\n\nOr restart with: npm run dev:full');
      } else if (error.message.includes('File too large')) {
        alert('❌ Upload Failed\n\n' + error.message + '\n\nPlease select smaller files (under 10MB each).');
      } else if (error.message.includes('Too many files')) {
        alert('❌ Upload Failed\n\n' + error.message + '\n\nPlease select 10 files or fewer.');
      } else if (error.message.includes('Invalid file type')) {
        alert('❌ Upload Failed\n\n' + error.message + '\n\nSupported formats: PDF, Excel (.xlsx, .xls), CSV (.csv)');
      } else {
        console.warn('Backend upload failed, using frontend analysis only:', error.message);
        alert('❌ Upload Failed\n\n' + error.message + '\n\nPlease ensure the backend server is running and try again.');
      }
    }
  };

  const removeFile = (fileName: string) => {
    setFiles(prev => prev.filter(file => file.name !== fileName));
    setFileAnalysis(prev => {
      const updated = { ...prev };
      delete updated[fileName];
      return updated;
    });
  };

  const getTotalCreditsRequired = () => {
    return Object.values(fileAnalysis).reduce((total, file) => total + file.credits, 0);
  };

  const startAutomation = async () => {
    if (!selectedService || files.length === 0) {
      alert('Please select a service and upload files');
      return;
    }

    const totalCredits = getTotalCreditsRequired();
    if (!user || (!user.isAdmin && user.credits < totalCredits)) {
      alert('Insufficient credits. Please purchase more credits.');
      return;
    }

    setIsProcessing(true);

    try {
      // Start automation via backend API
      const response = await fetch('/api/automation/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          serviceId: selectedService,
          files: Object.values(fileAnalysis),
          userCredentials: credentials,
          parameters: { headless: true }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      if (!text) {
        throw new Error('Empty response from server');
      }

      const result = JSON.parse(text);
      
      if (result.success) {
        // Deduct credits after successful start
        if (!user.isAdmin && !deductCredits(totalCredits)) {
          alert('Failed to deduct credits. Please try again.');
          setIsProcessing(false);
          return;
        }

        const selectedServiceData = services.find(s => s.id === selectedService);
        
        const newProcess: AutomationProcess = {
          id: result.processId,
          serviceId: selectedService,
          serviceName: selectedServiceData?.name || 'Unknown Service',
          status: 'running',
          progress: 0,
          startTime: new Date(),
          files: Object.values(fileAnalysis),
          creditsUsed: totalCredits,
          output: ['🚀 Starting automation process...', `📋 Service: ${selectedServiceData?.name}`, `📁 Processing ${files.length} files...`]
        };

        setAutomationProcesses(prev => [newProcess, ...prev]);
        
        // Start polling for status updates
        startStatusPolling(result.processId);
        
        // Add to work history
        if (user) {
          addWorkHistory(user.id, {
            serviceId: selectedService,
            serviceName: selectedServiceData?.name || 'Unknown Service',
            fileName: files.map(f => f.name).join(', '),
            creditsUsed: getTotalCreditsRequired(),
            status: 'completed',
            resultFiles: []
          });
        }
      } else {
        alert('Failed to start automation: ' + result.message);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Automation start error:', error);
      if (error.message.includes('Failed to fetch') || error.message.includes('ECONNREFUSED') || error.message.includes('fetch')) {
        alert('⚠️ Backend server is not running.\n\nTo start automation:\n1. Open a new terminal\n2. Run: npm run server\n\nOr restart with: npm run dev:full');
      } else if (error.message.includes('Unexpected end of JSON input')) {
        alert('⚠️ Server connection error.\n\nThe backend server may be starting up or crashed.\n\nPlease:\n1. Check if server is running: npm run server\n2. Wait a moment and try again');
      } else {
        alert('Failed to start automation: ' + error.message + '\n\nPlease ensure the backend server is running.');
      }
      setIsProcessing(false);
    }

    // Clear form
    setFiles([]);
    setFileAnalysis({});
    setSelectedService('');
  };

  const startStatusPolling = (processId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/automation/status/${processId}`);
        const status = await response.json();
        
        if (status.success) {
          setAutomationProcesses(prev => prev.map(process => {
            if (process.id === processId) {
              // If process failed and credits were deducted, refund them
              if (status.status === 'failed' && process.status !== 'failed' && !user?.isAdmin) {
                // Refund credits for failed automation
                if (user && user.id) {
                  addCredits(user.id, process.creditsUsed);
                  console.log(`💰 Refunded ${process.creditsUsed} credits for failed process ${processId}`);
                }
              }
              
              return {
                ...process,
                status: status.status,
                progress: status.progress,
                output: status.output,
                endTime: status.endTime ? new Date(status.endTime) : undefined,
                resultFiles: status.resultFiles || []
              };
            }
            return process;
          }));
          
          // Stop polling if process is completed or failed
          if (status.status === 'completed' || status.status === 'failed' || status.status === 'stopped') {
            clearInterval(pollInterval);
            setIsProcessing(false);
          }
        }
      } catch (error) {
        console.error('Status polling error:', error);
        clearInterval(pollInterval);
        setIsProcessing(false);
      }
    }, 2000); // Poll every 2 seconds
  };

  const stopAutomation = (processId: string) => {
    fetch(`/api/automation/stop/${processId}`, {
      method: 'POST'
    })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        setAutomationProcesses(prev => prev.map(process => {
          if (process.id === processId) {
            return {
              ...process,
              status: 'stopped',
              endTime: new Date(),
              output: [...process.output, '🛑 Automation stopped by user']
            };
          }
          return process;
        }));
      }
    })
    .catch(error => {
      console.error('Stop automation error:', error);
    });
    
    setIsProcessing(false);
  };

  const downloadResults = (processId: string) => {
    // This will be handled by individual file download buttons
    console.log('Download results for process:', processId);
  };

  const downloadFile = (processId: string, filename: string) => {
    const downloadUrl = `/api/files/${processId}/${filename}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const previewPdf = (processId: string, filename: string) => {
    const previewUrl = `/api/preview/${processId}/${filename}`;
    const previewWindow = window.open(previewUrl, '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no,status=no');
    
    if (!previewWindow) {
      alert('Please allow popups for this site to preview PDF files');
    } else {
      previewWindow.focus();
    }
  };

  const downloadSampleFile = (serviceId: string) => {
    let csvContent = '';
    let filename = '';

    switch (serviceId) {
      case 'damco-tracking-maersk':
        csvContent = 'FCR Number\nCTG2358534\nCTG2358538\nCTG2358542\nCTG2358546\nCTG2358550';
        filename = 'sample_fcr_numbers.csv';
        break;
      case 'exp-issue':
        csvContent = 'Invoice Number,Invoice Date,Buyer Name,Amount USD\nINV-2024-001,2024-01-15,ABC Company Ltd,25000.00\nINV-2024-002,2024-01-16,XYZ Trading Inc,18500.50\nINV-2024-003,2024-01-17,Global Imports LLC,32000.75';
        filename = 'sample_exp_data.csv';
        break;
      case 'hm-einvoice-create':
        csvContent = 'PO Number,Style Number,Color,Size,Quantity,Unit Price\nPO123456,ST001,Red,M,1000,12.50\nPO123456,ST001,Blue,L,800,12.50\nPO123457,ST002,Black,S,1200,15.75';
        filename = 'sample_hm_invoice_data.csv';
        break;
      case 'cash-incentive-application':
        csvContent = 'EXP Number,Export Date,Invoice Number,FOB Value USD,Destination Country\nEXP2024001,2024-01-15,INV-001,25000.00,USA\nEXP2024002,2024-01-16,INV-002,18500.50,Germany\nEXP2024003,2024-01-17,INV-003,32000.75,UK';
        filename = 'sample_cash_incentive_data.csv';
        break;
      case 'ctg-port-tracking':
        csvContent = 'Container Number\nCTGU1234567\nCTGU2345678\nCTGU3456789\nCTGU4567890';
        filename = 'sample_container_numbers.csv';
        break;
      default:
        csvContent = 'Reference Number,Date,Description,Amount\nREF001,2024-01-15,Sample Entry 1,1000.00\nREF002,2024-01-16,Sample Entry 2,1500.50\nREF003,2024-01-17,Sample Entry 3,2000.75';
        filename = 'sample_data.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const getAcceptedFileTypes = () => {
    if (!selectedService) return '.pdf,.xlsx,.xls,.csv';
    
    if (selectedService === 'pdf-excel-converter') {
      return '.pdf';
    } else {
      return '.xlsx,.xls,.csv';
    }
  };

  const getFileTypeDescription = () => {
    if (!selectedService) return 'PDF, Excel, CSV files supported';
    
    if (selectedService === 'pdf-excel-converter') {
      return 'PDF files only';
    } else {
      return 'Excel, CSV files only';
    }
  };

  if (!user) {
    // This should never happen now due to ProtectedRoute, but keeping as fallback
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name}!
          </h1>
          <p className="text-gray-600">Manage your automation processes and monitor real-time progress.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Available Credits</p>
                <p className="text-2xl font-bold text-blue-600">{user.credits}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-green-600">৳{user.totalSpent}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Services Used</p>
                <p className="text-2xl font-bold text-purple-600">{user.services.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active Processes</p>
                <p className="text-2xl font-bold text-orange-600">
                  {automationProcesses.filter(p => p.status === 'running').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Google AdSense Ad - Top of Dashboard */}
        {user && creditSettings.adsenseSettings?.enabled && (
          <div className="mb-8">
            <AdSenseAd
              adSlot={creditSettings.adsenseSettings.dashboardTopSlot}
              style={{ minHeight: '90px' }}
              className="w-full bg-gray-100 rounded-lg border border-gray-200"
            />
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Automation Control Panel */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Upload className="h-6 w-6 text-blue-600 mr-3" />
              Start New Automation
            </h2>

            {/* Service Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Service
              </label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a service...</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name} ({service.category})
                  </option>
                ))}
              </select>
            </div>

            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Files
              </label>
              {selectedService && selectedService !== 'pdf-excel-converter' && (
                <div className="mb-3">
                  <button
                    onClick={() => downloadSampleFile(selectedService)}
                    className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Download Sample File
                  </button>
                  <p className="text-xs text-gray-500 mt-1">
                    Download a sample file to see the required format
                  </p>
                </div>
              )}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 cursor-pointer transition-colors"
              >
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Click to upload files or drag and drop</p>
                <p className="text-sm text-gray-500">{getFileTypeDescription()}</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={getAcceptedFileTypes()}
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
            </div>

            {/* File Analysis */}
            {Object.keys(fileAnalysis).length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">File Analysis</h3>
                <div className="space-y-2">
                  {Object.entries(fileAnalysis).map(([fileName, analysis]) => (
                    <div key={fileName} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-blue-600 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{analysis.name}</p>
                          <p className="text-xs text-gray-500">
                            {analysis.rows} rows • {analysis.credits} credits
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(fileName)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className={`mt-3 p-3 rounded-lg ${user?.isAdmin ? 'bg-green-50' : 'bg-blue-50'}`}>
                  {user?.isAdmin ? (
                    <p className="text-sm font-medium text-green-900">
                      Admin Access: Unlimited Credits
                    </p>
                  ) : (
                    <>
                  <p className="text-sm font-medium text-blue-900">
                    Total Credits Required: {getTotalCreditsRequired()}
                  </p>
                  <p className="text-xs text-blue-700">
                    Your Balance: {user.credits} credits
                  </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Credentials (for services that need login) */}
            {selectedService && services.find(s => s.id === selectedService)?.requiresCredentials && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Portal Credentials</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Username"
                    value={credentials.username}
                    onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Portal credentials required for: {services.find(s => s.id === selectedService)?.category}
                </p>
              </div>
            )}

            {/* Start Button */}
            <button
              onClick={startAutomation}
              disabled={!selectedService || files.length === 0 || isProcessing}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
            >
              <Play className="h-5 w-5 mr-2" />
              {isProcessing ? 'Processing...' : 'Start Automation'}
            </button>
          </div>

          {/* Google AdSense Ad - Below Start Automation */}
          {user && creditSettings.adsenseSettings?.enabled && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <AdSenseAd
                adSlot={creditSettings.adsenseSettings.dashboardBottomSlot}
                style={{ minHeight: '250px' }}
                className="w-full bg-gray-100 rounded-lg border border-gray-200"
              />
            </div>
          )}

          {/* Process Monitor */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <BarChart3 className="h-6 w-6 text-green-600 mr-3" />
              Process Monitor & History
            </h2>

            {/* Toggle between current processes and history */}
            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => setShowHistory(false)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  !showHistory 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Current Processes
              </button>
              <button
                onClick={() => setShowHistory(true)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  showHistory 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Work History (7 days)
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {!showHistory ? (
                // Current Processes View
                automationProcesses.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No automation processes yet</p>
                    <p className="text-sm text-gray-400">Start your first automation to see progress here</p>
                  </div>
                ) : (
                  automationProcesses.map(process => (
                    <div key={process.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900">{process.serviceName}</h3>
                          <p className="text-sm text-gray-500">
                            {process.files.length} files • {process.creditsUsed} credits used
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {process.status === 'running' && (
                            <button
                              onClick={() => stopAutomation(process.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Square className="h-4 w-4" />
                            </button>
                          )}
                          <div className={`w-3 h-3 rounded-full ${
                            process.status === 'running' ? 'bg-yellow-500 animate-pulse' :
                            process.status === 'completed' ? 'bg-green-500' :
                            process.status === 'failed' ? 'bg-red-500' : 'bg-gray-500'
                          }`} />
                        </div>
                      </div>

                      {process.status === 'running' && (
                        <div className="mb-3">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{process.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${process.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="bg-gray-50 rounded p-3 max-h-32 overflow-y-auto">
                        <div className="text-xs font-mono space-y-1">
                          {process.output.map((line, index) => (
                            <div key={index} className="text-gray-700">{line}</div>
                          ))}
                        </div>
                      </div>

                      {process.status === 'completed' && process.resultFiles && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm font-medium text-gray-700 mb-2">Result Files:</p>
                          <div className="space-y-2">
                            {process.resultFiles.filter(file => file.includes('report')).map((file, index) => (
                              <div key={index} className="flex items-center justify-between bg-green-50 p-2 rounded border border-green-200">
                                <div className="flex items-center">
                                  <FileText className="h-4 w-4 text-green-600 mr-2" />
                                  <span className="text-sm font-medium text-green-800">{file}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => downloadFile(process.id, file)}
                                    className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors flex items-center"
                                    title="Download file"
                                  >
                                    <Download className="h-3 w-3 mr-1" />
                                    Download
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )
              ) : (
                // Work History View
                !user || getWorkHistory(user.id).length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No work history yet</p>
                    <p className="text-sm text-gray-400">Complete some automation tasks to see your history here</p>
                  </div>
                ) : (
                  user && getWorkHistory(user.id).map(historyItem => (
                    <div key={historyItem.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900">{historyItem.serviceName}</h3>
                          <p className="text-sm text-gray-500">
                            File: {historyItem.fileName} • {historyItem.creditsUsed} credits used
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(historyItem.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            historyItem.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <span className={`text-xs font-medium ${
                            historyItem.status === 'completed' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {historyItem.status}
                          </span>
                        </div>
                      </div>
                      
                      {historyItem.resultFiles.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm font-medium text-gray-700 mb-2">Available Downloads:</p>
                          <div className="space-y-2">
                            {historyItem.resultFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                                <div className="flex items-center">
                                  {file.endsWith('.pdf') ? (
                                    <FileText className="h-4 w-4 text-red-600 mr-2" />
                                  ) : file.endsWith('.xlsx') || file.endsWith('.xls') ? (
                                    <FileText className="h-4 w-4 text-green-600 mr-2" />
                                  ) : file.endsWith('.txt') || file.endsWith('.log') ? (
                                    <FileText className="h-4 w-4 text-gray-600 mr-2" />
                                  ) : (
                                    <FileText className="h-4 w-4 text-blue-600 mr-2" />
                                  )}
                                  <span className="text-sm font-medium text-gray-800">{file}</span>
                                  <span className="text-xs text-gray-500 ml-2">
                                    ({file.endsWith('.pdf') ? 'PDF Report' : 
                                      file.endsWith('.xlsx') || file.endsWith('.xls') ? 'Excel File' :
                                      file.endsWith('.txt') || file.endsWith('.log') ? 'Log File' : 'Document'})
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {file.endsWith('.pdf') && (
                                    <button
                                      onClick={() => previewPdf(historyItem.id || `history_${index}`, file)}
                                      className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors flex items-center"
                                      title="Preview PDF"
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      Preview
                                    </button>
                                  )}
                                  <button
                                    onClick={() => downloadFile(historyItem.id || `history_${index}`, file)}
                                    className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors flex items-center"
                                    title="Download file"
                                  >
                                    <Download className="h-3 w-3 mr-1" />
                                    Download
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>

        {/* Work History Summary */}
        {user && getWorkHistory(user.id).length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-6 w-6 text-purple-600 mr-3" />
              Work Summary (Last 7 Days)
            </h2>
            
            {(() => {
              const workHistory = getWorkHistory(user.id);
              return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {workHistory.length}
                </div>
                <div className="text-sm text-gray-600">Total Jobs</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {workHistory.filter(h => h.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  {workHistory.reduce((sum, h) => sum + h.creditsUsed, 0)}
                </div>
                <div className="text-sm text-gray-600">Credits Used</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 mb-2">
                    {workHistory.reduce((sum, h) => sum + h.resultFiles.length, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Files Generated</div>
              </div>
            </div>
              );
            })()}
            
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                📅 History automatically cleans up after 7 days • 
                💾 Download important files before they expire
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}