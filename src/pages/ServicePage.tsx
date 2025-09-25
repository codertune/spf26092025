import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, FileText, Globe, Building, CreditCard, Truck, BarChart3, DollarSign } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

interface Service {
  id: string;
  name: string;
  description: string;
  credits: number;
  price: number;
  category: string;
  features: string[];
}

const services: Service[] = [
  // PDF Extractor
  {
    id: 'pdf-excel-converter',
    name: 'PDF to Excel/CSV Converter',
    description: 'Advanced PDF table extraction with intelligent recognition and multiple output formats.',
    credits: 1,
    price: 0.5,
    category: 'PDF Extractor',
    features: ['Intelligent table detection', 'Multiple extraction methods', 'Excel/CSV output', 'Commercial document patterns']
  },

  // Bangladesh Bank Services
  {
    id: 'exp-issue',
    name: 'Issue EXP',
    description: 'Automated EXP issuance through Bangladesh Bank portal with form filling and validation.',
    credits: 2,
    price: 1,
    category: 'Bangladesh Bank',
    features: ['Automated form filling', 'Validation checks', 'Certificate download', 'Bulk processing']
  },
  {
    id: 'exp-correction',
    name: 'Issued EXP Correction (Before Duplicate Reporting)',
    description: 'Correct issued EXP details before duplicate reporting with automated form updates.',
    credits: 1.5,
    price: 0.75,
    category: 'Bangladesh Bank',
    features: ['Error detection', 'Automated corrections', 'Pre-duplicate validation', 'Status tracking']
  },
  {
    id: 'exp-duplicate-reporting',
    name: 'Duplicate EXP',
    description: 'Handle export acknowledgements and duplicate EXP reporting automatically.',
    credits: 2,
    price: 1,
    category: 'Bangladesh Bank',
    features: ['Duplicate detection', 'Acknowledgement processing', 'Report generation', 'Compliance tracking']
  },
  {
    id: 'exp-search',
    name: 'Search EXP Detail Information',
    description: 'Search and retrieve detailed EXP information from Bangladesh Bank database.',
    credits: 0.5,
    price: 0.25,
    category: 'Bangladesh Bank',
    features: ['Advanced search', 'Detailed reports', 'Export to Excel', 'Historical data']
  },

  // Damco Services
  {
    id: 'damco-booking',
    name: 'Damco (APM) - Booking',
    description: 'Automated booking creation through Damco APM portal with shipment details.',
    credits: 3,
    price: 1.5,
    category: 'Forwarder Handler - Damco',
    features: ['Automated booking', 'Shipment scheduling', 'Container allocation', 'Booking confirmation']
  },
  {
    id: 'damco-booking-download',
    name: 'Damco (APM) - Booking Download',
    description: 'Download booking confirmations and related documents from Damco portal.',
    credits: 1,
    price: 0.5,
    category: 'Forwarder Handler - Damco',
    features: ['Document download', 'PDF extraction', 'Batch processing', 'File organization']
  },
  {
    id: 'damco-fcr-submission',
    name: 'Damco (APM) - FCR Submission',
    description: 'Submit Forwarder Cargo Receipt (FCR) through Damco portal automatically.',
    credits: 2,
    price: 1,
    category: 'Forwarder Handler - Damco',
    features: ['FCR automation', 'Document validation', 'Submission tracking', 'Status updates']
  },
  {
    id: 'damco-fcr-extractor',
    name: 'Damco (APM) - FCR Extractor from Mail',
    description: 'Extract FCR documents from email attachments and process automatically.',
    credits: 1.5,
    price: 0.75,
    category: 'Forwarder Handler - Damco',
    features: ['Email processing', 'Attachment extraction', 'OCR recognition', 'Data parsing']
  },
  {
    id: 'damco-edoc-upload',
    name: 'Damco (APM) - E-Doc Upload',
    description: 'Upload electronic documents to Damco portal with automated categorization.',
    credits: 1,
    price: 0.5,
    category: 'Forwarder Handler - Damco',
    features: ['Document upload', 'Auto categorization', 'Batch processing', 'Upload verification']
  },

  // H&M Services
  {
    id: 'hm-einvoice-create',
    name: 'H&M - E-Invoice Create',
    description: 'Create electronic invoices in H&M supplier portal with automated data entry.',
    credits: 2,
    price: 1,
    category: 'Buyer Handler - H&M',
    features: ['Invoice automation', 'Data validation', 'Multi-item support', 'Template matching']
  },
  {
    id: 'hm-einvoice-download',
    name: 'H&M - E-Invoice Download',
    description: 'Download processed e-invoices and related documents from H&M portal.',
    credits: 1,
    price: 0.5,
    category: 'Buyer Handler - H&M',
    features: ['Bulk download', 'PDF generation', 'Status tracking', 'Archive management']
  },
  {
    id: 'hm-einvoice-correction',
    name: 'H&M - E-Invoice Correction',
    description: 'Correct and resubmit e-invoices with error handling and validation.',
    credits: 1.5,
    price: 0.75,
    category: 'Buyer Handler - H&M',
    features: ['Error detection', 'Automated corrections', 'Resubmission', 'Approval tracking']
  },
  {
    id: 'hm-packing-list',
    name: 'H&M - Download E-Packing List',
    description: 'Download electronic packing lists from H&M supplier portal.',
    credits: 1,
    price: 0.5,
    category: 'Buyer Handler - H&M',
    features: ['Packing list download', 'Format conversion', 'Data extraction', 'Batch processing']
  },

  // BEPZA Services
  {
    id: 'bepza-ep-issue',
    name: 'BEPZA - EP Issue',
    description: 'Issue Export Permits (EP) through BEPZA portal with automated form submission.',
    credits: 2.5,
    price: 1.25,
    category: 'BEPZA',
    features: ['EP automation', 'Form validation', 'Document upload', 'Permit tracking']
  },
  {
    id: 'bepza-ep-submission',
    name: 'BEPZA - EP Submission',
    description: 'Submit Export Permit applications with supporting documents to BEPZA.',
    credits: 2,
    price: 1,
    category: 'BEPZA',
    features: ['Application submission', 'Document management', 'Status monitoring', 'Approval tracking']
  },
  {
    id: 'bepza-ep-download',
    name: 'BEPZA - EP Download',
    description: 'Download approved Export Permits and certificates from BEPZA portal.',
    credits: 1,
    price: 0.5,
    category: 'BEPZA',
    features: ['Permit download', 'Certificate extraction', 'Batch processing', 'File organization']
  },
  {
    id: 'bepza-ip-issue',
    name: 'BEPZA - IP Issue',
    description: 'Issue Import Permits (IP) through BEPZA portal with automated processing.',
    credits: 2.5,
    price: 1.25,
    category: 'BEPZA',
    features: ['IP automation', 'Compliance checks', 'Document validation', 'Permit generation']
  },
  {
    id: 'bepza-ip-submit',
    name: 'BEPZA - IP Submit',
    description: 'Submit Import Permit applications with required documentation to BEPZA.',
    credits: 2,
    price: 1,
    category: 'BEPZA',
    features: ['Application processing', 'Document upload', 'Validation checks', 'Submission tracking']
  },
  {
    id: 'bepza-ip-download',
    name: 'BEPZA - IP Download',
    description: 'Download approved Import Permits and related documents from BEPZA.',
    credits: 1,
    price: 0.5,
    category: 'BEPZA',
    features: ['Permit retrieval', 'Document download', 'Status updates', 'Archive management']
  },

  // Cash Incentive Services
  {
    id: 'cash-incentive-application',
    name: 'Cash Incentive Application',
    description: 'Submit cash incentive applications through multiple government portals.',
    credits: 3,
    price: 1.5,
    category: 'Cash Incentive Applications',
    features: ['Multi-portal support', 'Document upload', 'Application tracking', 'Status monitoring']
  },
  {
    id: 'ctg-port-tracking',
    name: 'CTG Port Authority Tracking',
    description: 'Track shipments through Chittagong Port Authority with real-time updates.',
    credits: 1,
    price: 0.5,
    category: 'Tracking Services',
    features: ['Real-time tracking', 'Port status', 'Vessel information', 'ETA updates']
  },
  {
    id: 'damco-tracking-maersk',
    name: 'Damco (APM) Tracking',
    description: 'Track shipments through Damco APM with detailed status reports.',
    credits: 1,
    price: 0.5,
    category: 'Tracking Services',
    features: ['Container tracking', 'Status updates', 'Route information', 'Delivery confirmation']
  },
  {
    id: 'myshipment-tracking',
    name: 'MyShipment Tracking (MGH)',
    description: 'Track shipments through MyShipment MGH platform with comprehensive details.',
    credits: 1,
    price: 0.5,
    category: 'Tracking Services',
    features: ['Multi-carrier tracking', 'Status notifications', 'Delivery updates', 'Historical data']
  },
  {
    id: 'egm-download',
    name: 'EGM Download',
    description: 'Download Export General Manifest (EGM) documents from relevant portals.',
    credits: 1,
    price: 0.5,
    category: 'Tracking Services',
    features: ['EGM retrieval', 'Document download', 'Format conversion', 'Batch processing']
  },
  {
    id: 'custom-tracking',
    name: 'Custom Tracking',
    description: 'Track customs clearance status with automated status updates.',
    credits: 1.5,
    price: 0.75,
    category: 'Tracking Services',
    features: ['Customs tracking', 'Clearance status', 'Document verification', 'Process monitoring']
  }
];

const categoryIcons: { [key: string]: React.ReactNode } = {
  'PDF Extractor': <FileText className="h-6 w-6" />,
  'Bangladesh Bank': <Globe className="h-6 w-6" />,
  'Forwarder Handler - Damco': <Truck className="h-6 w-6" />,
  'Buyer Handler - H&M': <Building className="h-6 w-6" />,
  'BEPZA': <BarChart3 className="h-6 w-6" />,
  'Cash Incentive Applications': <DollarSign className="h-6 w-6" />,
  'Tracking Services': <Truck className="h-6 w-6" />
};

export default function ServicePage() {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const { addToCart, isInCart } = useCart();
  const { user, creditSettings, isServiceEnabled } = useAuth();

  // Filter services based on admin settings
  const enabledServices = services.filter(service => isServiceEnabled(service.id));

  const categories = Array.from(new Set(services.map(service => service.category)));

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleAddToCart = (service: Service) => {
    addToCart({
      id: service.id,
      name: service.name,
      category: service.category,
      credits: service.credits,
      price: service.price
    });
  };

  const getCategoryServices = (category: string) => {
    return services.filter(service => service.category === category);
  };

  const getTotalCredits = () => {
    return enabledServices.reduce((total, service) => total + service.credits, 0);
  };

  const getTotalPrice = () => {
    return enabledServices.reduce((total, service) => total + service.price, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Automation Services
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Complete suite of 27 automation services for Bangladesh commercial processes. 
              From PDF extraction to export documentation, we handle it all.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="text-3xl font-bold text-blue-600 mb-2">{enabledServices.length}</div>
                <div className="text-gray-600">Total Services</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="text-3xl font-bold text-green-600 mb-2">{getTotalCredits()}</div>
                <div className="text-gray-600">Total Credits Available</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="text-3xl font-bold text-purple-600 mb-2">৳{getTotalPrice()}</div>
                <div className="text-gray-600">Total Value</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {categories.map((category) => {
              const categoryServices = getCategoryServices(category);
              const isExpanded = expandedCategories.includes(category);
              
              return (
                <div key={category} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
                        {categoryIcons[category]}
                      </div>
                      <div className="text-left">
                        <h3 className="text-xl font-semibold text-gray-900">{category}</h3>
                        <p className="text-gray-500">{categoryServices.length} services available</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Total Credits</div>
                        <div className="font-semibold text-blue-600">
                          {categoryServices.reduce((sum, s) => sum + s.credits, 0)}
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-6 w-6 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-200">
                      <div className="p-6 space-y-4">
                        {categoryServices.map((service) => (
                          <div
                            key={service.id}
                            className="bg-gray-50 p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                                  {service.name}
                                </h4>
                                <p className="text-gray-600 mb-4">{service.description}</p>
                                
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {service.features.map((feature, index) => (
                                    <span
                                      key={index}
                                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                                    >
                                      {feature}
                                    </span>
                                  ))}
                                </div>
                                
                                <div className="flex items-center space-x-6">
                                  <div className="flex items-center space-x-2">
                                    <CreditCard className="h-4 w-4 text-blue-500" />
                                    <span className="text-sm font-medium text-blue-600">
                                      {service.credits} credits
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <DollarSign className="h-4 w-4 text-green-500" />
                                    <span className="text-sm font-medium text-green-600">
                                      ৳{service.price}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="ml-6">
                                <button
                                  onClick={() => handleAddToCart(service)}
                                  disabled={isInCart(service.id)}
                                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center ${
                                    isInCart(service.id)
                                      ? 'bg-green-100 text-green-700 cursor-not-allowed'
                                      : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transform hover:scale-105'
                                  }`}
                                >
                                  {isInCart(service.id) ? (
                                    'Added to Cart'
                                  ) : (
                                    <>
                                      <Plus className="h-4 w-4 mr-2" />
                                      Add to Cart
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Credit Information */}
          <div className="mt-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 text-white">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">Credit System Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <div className="text-3xl font-bold mb-2">{creditSettings.creditsPerBDT}</div>
                  <div className="text-blue-100">Credits per BDT</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2">{creditSettings.creditsPerProcess}</div>
                  <div className="text-blue-100">Credits per Process</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2">{creditSettings.freeTrialCredits}</div>
                  <div className="text-blue-100">Free Trial Credits</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2">{creditSettings.minPurchaseCredits}</div>
                  <div className="text-blue-100">Min Purchase Credits</div>
                </div>
              </div>
              <p className="mt-6 text-blue-100">
                New users get {creditSettings.freeTrialCredits} free credits to try our services. 
                Exchange rate: ৳{(1/creditSettings.creditsPerBDT).toFixed(2)} = 1 Credit
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}