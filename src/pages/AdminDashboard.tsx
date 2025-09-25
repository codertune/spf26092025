import React, { useState, useEffect } from 'react';
import { Users, Settings, BarChart3, CreditCard, Shield, AlertTriangle, Download, Upload, Eye, EyeOff, Trash2, Edit, Plus, Save, X, Bell, BellOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface User {
  id: string;
  email: string;
  name: string;
  company: string;
  mobile: string;
  credits: number;
  emailVerified: boolean;
  memberSince: string;
  isAdmin: boolean;
  trialEndsAt?: string;
  status: 'active' | 'suspended';
  services: string[];
  totalSpent: number;
  lastActivity: string;
}

export default function AdminDashboard() {
  const { 
    user, 
    users, 
    creditSettings, 
    updateCreditSettings, 
    updateSystemNotification,
    updateUserAdmin, 
    suspendUser, 
    activateUser, 
    toggleService, 
    isServiceEnabled,
    exportUserData,
    importUserData,
    blogPosts,
    addBlogPost,
    updateBlogPost,
    deleteBlogPost
  } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editingSettings, setEditingSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState(creditSettings);
  const [showPasswords, setShowPasswords] = useState(false);
  const [importData, setImportData] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [newPost, setNewPost] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    author: '',
    tags: '',
    featured: false,
    status: 'draft' as 'published' | 'draft'
  });
  const [showNewPost, setShowNewPost] = useState(false);
  const [editingPostData, setEditingPostData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    author: '',
    tags: '',
    featured: false,
    status: 'draft' as 'published' | 'draft',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: ''
  });
  const [editingNotification, setEditingNotification] = useState(false);
  const [tempNotification, setTempNotification] = useState(
    creditSettings.systemNotification || {
      enabled: false,
      message: '',
      type: 'info' as 'info' | 'warning' | 'error' | 'success',
      showToAll: true
    }
  );

  useEffect(() => {
    setTempSettings(creditSettings);
    setTempNotification(creditSettings.systemNotification || {
      enabled: false,
      message: '',
      type: 'info',
      showToAll: true
    });
  }, [creditSettings]);

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  const handleSaveSettings = () => {
    updateCreditSettings(tempSettings);
    setEditingSettings(false);
  };

  const handleSaveNotification = () => {
    updateSystemNotification(tempNotification);
    setEditingNotification(false);
  };

  const handleUserUpdate = (userId: string, updates: Partial<User>) => {
    updateUserAdmin(userId, updates);
    setEditingUser(null);
  };

  const handleExport = () => {
    const data = exportUserData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart-process-flow-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (importUserData(importData)) {
      alert('Data imported successfully!');
      setImportData('');
      setShowImport(false);
    } else {
      alert('Import failed. Please check the data format.');
    }
  };

  const handleAddPost = () => {
    if (!newPost.title || !newPost.content) {
      alert('Title and content are required');
      return;
    }

    const slug = newPost.slug || newPost.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    addBlogPost({
      ...newPost,
      slug,
      tags: newPost.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      author: newPost.author || user.name
    });

    setNewPost({
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      author: '',
      tags: '',
      featured: false,
      status: 'draft',
      metaTitle: '',
      metaDescription: '',
      metaKeywords: ''
    });
    setShowNewPost(false);
  };

  const handleEditPost = (post: any) => {
    setEditingPostData({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      author: post.author,
      tags: post.tags.join(', '),
      featured: post.featured,
      status: post.status,
      metaTitle: post.metaTitle || '',
      metaDescription: post.metaDescription || '',
      metaKeywords: post.metaKeywords || ''
    });
    setEditingPost(post.id);
  };

  const handleUpdatePost = () => {
    if (!editingPostData.title || !editingPostData.content) {
      alert('Title and content are required');
      return;
    }

    const slug = editingPostData.slug || editingPostData.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    updateBlogPost(editingPost!, {
      ...editingPostData,
      slug,
      tags: editingPostData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    });

    setEditingPost(null);
    setEditingPostData({
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      author: '',
      tags: '',
      featured: false,
      status: 'draft',
      metaTitle: '',
      metaDescription: '',
      metaKeywords: ''
    });
  };

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    totalCreditsDistributed: users.reduce((sum, u) => sum + u.credits, 0),
    totalRevenue: users.reduce((sum, u) => sum + u.totalSpent, 0),
    enabledServices: creditSettings.enabledServices?.length || 0
  };

  const allServices = [
    { id: 'pdf-excel-converter', name: 'PDF to Excel/CSV Converter', category: 'PDF Extractor' },
    { id: 'exp-issue', name: 'Issue EXP', category: 'Bangladesh Bank' },
    { id: 'exp-correction', name: 'Issued EXP Correction', category: 'Bangladesh Bank' },
    { id: 'exp-duplicate-reporting', name: 'Duplicate EXP', category: 'Bangladesh Bank' },
    { id: 'exp-search', name: 'Search EXP Detail Information', category: 'Bangladesh Bank' },
    { id: 'damco-booking', name: 'Damco (APM) - Booking', category: 'Forwarder Handler - Damco' },
    { id: 'damco-booking-download', name: 'Damco (APM) - Booking Download', category: 'Forwarder Handler - Damco' },
    { id: 'damco-fcr-submission', name: 'Damco (APM) - FCR Submission', category: 'Forwarder Handler - Damco' },
    { id: 'damco-fcr-extractor', name: 'Damco (APM) - FCR Extractor from Mail', category: 'Forwarder Handler - Damco' },
    { id: 'damco-edoc-upload', name: 'Damco (APM) - E-Doc Upload', category: 'Forwarder Handler - Damco' },
    { id: 'hm-einvoice-create', name: 'H&M - E-Invoice Create', category: 'Buyer Handler - H&M' },
    { id: 'hm-einvoice-download', name: 'H&M - E-Invoice Download', category: 'Buyer Handler - H&M' },
    { id: 'hm-einvoice-correction', name: 'H&M - E-Invoice Correction', category: 'Buyer Handler - H&M' },
    { id: 'hm-packing-list', name: 'H&M - Download E-Packing List', category: 'Buyer Handler - H&M' },
    { id: 'bepza-ep-issue', name: 'BEPZA - EP Issue', category: 'BEPZA' },
    { id: 'bepza-ep-submission', name: 'BEPZA - EP Submission', category: 'BEPZA' },
    { id: 'bepza-ep-download', name: 'BEPZA - EP Download', category: 'BEPZA' },
    { id: 'bepza-ip-issue', name: 'BEPZA - IP Issue', category: 'BEPZA' },
    { id: 'bepza-ip-submit', name: 'BEPZA - IP Submit', category: 'BEPZA' },
    { id: 'bepza-ip-download', name: 'BEPZA - IP Download', category: 'BEPZA' },
    { id: 'cash-incentive-application', name: 'Cash Incentive Application', category: 'Cash Incentive Applications' },
    { id: 'ctg-port-tracking', name: 'CTG Port Authority Tracking', category: 'Tracking Services' },
    { id: 'damco-tracking-maersk', name: 'Damco (APM) Tracking', category: 'Tracking Services' },
    { id: 'myshipment-tracking', name: 'MyShipment Tracking (MGH)', category: 'Tracking Services' },
    { id: 'egm-download', name: 'EGM Download', category: 'Tracking Services' },
    { id: 'custom-tracking', name: 'Custom Tracking', category: 'Tracking Services' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, services, and system settings</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: BarChart3 },
              { id: 'users', name: 'Users', icon: Users },
              { id: 'services', name: 'Services', icon: Settings },
              { id: 'settings', name: 'Settings', icon: CreditCard },
              { id: 'notifications', name: 'Notifications', icon: Bell },
              { id: 'blog', name: 'Blog Posts', icon: Edit }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-3 py-2 font-medium text-sm rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.totalUsers}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center">
                  <Shield className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold text-green-600">{stats.activeUsers}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center">
                  <CreditCard className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Credits Distributed</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.totalCreditsDistributed}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center">
                  <BarChart3 className="h-8 w-8 text-orange-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-orange-600">৳{stats.totalRevenue}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center">
                  <Settings className="h-8 w-8 text-red-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Services</p>
                    <p className="text-2xl font-bold text-red-600">{stats.enabledServices}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Users</h3>
              <div className="space-y-4">
                {users.slice(0, 5).map(user => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-blue-600">{user.credits} credits</p>
                      <p className="text-xs text-gray-500">Joined {user.memberSince}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">System Notifications</h3>
                <button
                  onClick={() => setEditingNotification(!editingNotification)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {editingNotification ? 'Cancel' : 'Edit Notification'}
                </button>
              </div>

              {editingNotification ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={tempNotification.enabled}
                        onChange={(e) => setTempNotification(prev => ({ ...prev, enabled: e.target.checked }))}
                        className="mr-2"
                      />
                      Enable Notification
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notification Type
                    </label>
                    <select
                      value={tempNotification.type}
                      onChange={(e) => setTempNotification(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="info">Info (Blue)</option>
                      <option value="warning">Warning (Yellow)</option>
                      <option value="error">Error (Red)</option>
                      <option value="success">Success (Green)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notification Message
                    </label>
                    <textarea
                      value={tempNotification.message}
                      onChange={(e) => setTempNotification(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Enter notification message..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={tempNotification.showToAll}
                        onChange={(e) => setTempNotification(prev => ({ ...prev, showToAll: e.target.checked }))}
                        className="mr-2"
                      />
                      Show to All Users (unchecked = Admin only)
                    </label>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={handleSaveNotification}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Notification
                    </button>
                    <button
                      onClick={() => setEditingNotification(false)}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className={`flex items-center space-x-2 ${tempNotification.enabled ? 'text-green-600' : 'text-gray-500'}`}>
                      {tempNotification.enabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                      <span className="font-medium">
                        {tempNotification.enabled ? 'Notification Enabled' : 'Notification Disabled'}
                      </span>
                    </div>
                  </div>

                  {tempNotification.enabled && tempNotification.message && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Current notification:</p>
                      <div className={`p-4 rounded-lg border-2 ${
                        tempNotification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                        tempNotification.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                        tempNotification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                        'bg-blue-50 border-blue-200 text-blue-800'
                      }`}>
                        <div className="flex items-center space-x-2">
                          {tempNotification.type === 'error' && <AlertTriangle className="h-5 w-5" />}
                          {tempNotification.type === 'warning' && <AlertTriangle className="h-5 w-5" />}
                          {tempNotification.type === 'success' && <Shield className="h-5 w-5" />}
                          {tempNotification.type === 'info' && <Bell className="h-5 w-5" />}
                          <span className="font-medium">{tempNotification.message}</span>
                        </div>
                        <p className="text-xs mt-2 opacity-75">
                          Visible to: {tempNotification.showToAll ? 'All Users' : 'Admins Only'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Notification Examples:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• <strong>Server Maintenance:</strong> "Scheduled maintenance on Sunday 2-4 AM. Services may be temporarily unavailable."</li>
                      <li>• <strong>New Features:</strong> "New PDF extraction service now available! Try it in your dashboard."</li>
                      <li>• <strong>System Issues:</strong> "We're experiencing high traffic. Processing may take longer than usual."</li>
                      <li>• <strong>Important Updates:</strong> "Please update your payment information to continue using premium services."</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
              <div className="flex space-x-4">
                <button
                  onClick={handleExport}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </button>
                <button
                  onClick={() => setShowImport(!showImport)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import Data
                </button>
              </div>
            </div>

            {showImport && (
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h4 className="font-medium text-gray-900 mb-4">Import User Data</h4>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Paste exported JSON data here..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                />
                <div className="flex space-x-4">
                  <button
                    onClick={handleImport}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Import
                  </button>
                  <button
                    onClick={() => setShowImport(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member Since</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map(userData => (
                      <tr key={userData.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{userData.name}</div>
                            <div className="text-sm text-gray-500">{userData.email}</div>
                            <div className="text-xs text-gray-400">{userData.company}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingUser === userData.id ? (
                            <input
                              type="number"
                              defaultValue={userData.credits}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                              onBlur={(e) => handleUserUpdate(userData.id, { credits: parseInt(e.target.value) })}
                            />
                          ) : (
                            <span className="text-sm font-medium text-blue-600">{userData.credits}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            userData.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {userData.status}
                          </span>
                          {userData.isAdmin && (
                            <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                              Admin
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {userData.memberSince}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => setEditingUser(editingUser === userData.id ? null : userData.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {userData.status === 'active' ? (
                            <button
                              onClick={() => suspendUser(userData.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <AlertTriangle className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => activateUser(userData.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <Shield className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Service Management</h3>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="grid gap-4">
                {allServices.map(service => (
                  <div key={service.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{service.name}</h4>
                      <p className="text-sm text-gray-500">{service.category}</p>
                    </div>
                    <button
                      onClick={() => toggleService(service.id)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        isServiceEnabled(service.id)
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {isServiceEnabled(service.id) ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">System Settings</h3>
              <button
                onClick={() => setEditingSettings(!editingSettings)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                {editingSettings ? 'Cancel' : 'Edit Settings'}
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credits per BDT
                  </label>
                  {editingSettings ? (
                    <input
                      type="number"
                      step="0.1"
                      value={tempSettings.creditsPerBDT}
                      onChange={(e) => setTempSettings(prev => ({ ...prev, creditsPerBDT: parseFloat(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-gray-900">{creditSettings.creditsPerBDT}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credits per Process
                  </label>
                  {editingSettings ? (
                    <input
                      type="number"
                      step="0.1"
                      value={tempSettings.creditsPerProcess}
                      onChange={(e) => setTempSettings(prev => ({ ...prev, creditsPerProcess: parseFloat(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-gray-900">{creditSettings.creditsPerProcess}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Free Trial Credits
                  </label>
                  {editingSettings ? (
                    <input
                      type="number"
                      value={tempSettings.freeTrialCredits}
                      onChange={(e) => setTempSettings(prev => ({ ...prev, freeTrialCredits: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-gray-900">{creditSettings.freeTrialCredits}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Purchase Credits
                  </label>
                  {editingSettings ? (
                    <input
                      type="number"
                      value={tempSettings.minPurchaseCredits}
                      onChange={(e) => setTempSettings(prev => ({ ...prev, minPurchaseCredits: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-gray-900">{creditSettings.minPurchaseCredits}</p>
                  )}
                </div>
              </div>

              {editingSettings && (
                <div className="mt-6 flex space-x-4">
                  <button
                    onClick={handleSaveSettings}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditingSettings(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Blog Tab */}
        {activeTab === 'blog' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Blog Management</h3>
              <button
                onClick={() => setShowNewPost(!showNewPost)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Post
              </button>
            </div>

            {showNewPost && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">Create New Blog Post</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Post Title"
                      value={newPost.title}
                      onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="URL Slug (optional)"
                      value={newPost.slug}
                      onChange={(e) => setNewPost(prev => ({ ...prev, slug: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <textarea
                    placeholder="Post Excerpt"
                    value={newPost.excerpt}
                    onChange={(e) => setNewPost(prev => ({ ...prev, excerpt: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  
                  <textarea
                    placeholder="Post Content (HTML supported)"
                    value={newPost.content}
                    onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="Author"
                      value={newPost.author}
                      onChange={(e) => setNewPost(prev => ({ ...prev, author: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Tags (comma separated)"
                      value={newPost.tags}
                      onChange={(e) => setNewPost(prev => ({ ...prev, tags: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <select
                      value={newPost.status}
                      onChange={(e) => setNewPost(prev => ({ ...prev, status: e.target.value as any }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newPost.featured}
                      onChange={(e) => setNewPost(prev => ({ ...prev, featured: e.target.checked }))}
                      className="mr-2"
                    />
                    <label className="text-sm text-gray-700">Featured Post</label>
                  </div>
                  
                  <div className="flex space-x-4">
                    <button
                      onClick={handleAddPost}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Create Post
                    </button>
                    <button
                      onClick={() => setShowNewPost(false)}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Post Modal */}
            {editingPost && (
              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-200">
                <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                  <Edit className="h-5 w-5 mr-2 text-blue-600" />
                  Edit Blog Post
                </h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Post Title"
                      value={editingPostData.title}
                      onChange={(e) => setEditingPostData(prev => ({ ...prev, title: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="URL Slug"
                      value={editingPostData.slug}
                      onChange={(e) => setEditingPostData(prev => ({ ...prev, slug: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <textarea
                    placeholder="Post Excerpt"
                    value={editingPostData.excerpt}
                    onChange={(e) => setEditingPostData(prev => ({ ...prev, excerpt: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  
                  <textarea
                    placeholder="Post Content (HTML supported)"
                    value={editingPostData.content}
                    onChange={(e) => setEditingPostData(prev => ({ ...prev, content: e.target.value }))}
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="Author"
                      value={editingPostData.author}
                      onChange={(e) => setEditingPostData(prev => ({ ...prev, author: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Tags (comma separated)"
                      value={editingPostData.tags}
                      onChange={(e) => setEditingPostData(prev => ({ ...prev, tags: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <select
                      value={editingPostData.status}
                      onChange={(e) => setEditingPostData(prev => ({ ...prev, status: e.target.value as any }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>

                  {/* SEO Fields for New Post */}
                  <div className="border-t pt-4">
                    <h5 className="font-medium text-gray-900 mb-3">SEO Settings (Optional)</h5>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Meta Title (for SEO)"
                        value={newPost.metaTitle || ''}
                        onChange={(e) => setNewPost(prev => ({ ...prev, metaTitle: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <textarea
                        placeholder="Meta Description (for SEO)"
                        value={newPost.metaDescription || ''}
                        onChange={(e) => setNewPost(prev => ({ ...prev, metaDescription: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        placeholder="Meta Keywords (comma separated)"
                        value={newPost.metaKeywords || ''}
                        onChange={(e) => setNewPost(prev => ({ ...prev, metaKeywords: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  {/* SEO Fields */}
                  <div className="border-t pt-4">
                    <h5 className="font-medium text-gray-900 mb-3">SEO Settings</h5>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Meta Title (for SEO)"
                        value={editingPostData.metaTitle}
                        onChange={(e) => setEditingPostData(prev => ({ ...prev, metaTitle: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <textarea
                        placeholder="Meta Description (for SEO)"
                        value={editingPostData.metaDescription}
                        onChange={(e) => setEditingPostData(prev => ({ ...prev, metaDescription: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        placeholder="Meta Keywords (comma separated)"
                        value={editingPostData.metaKeywords}
                        onChange={(e) => setEditingPostData(prev => ({ ...prev, metaKeywords: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingPostData.featured}
                      onChange={(e) => setEditingPostData(prev => ({ ...prev, featured: e.target.checked }))}
                      className="mr-2"
                    />
                    <label className="text-sm text-gray-700">Featured Post</label>
                  </div>
                  
                  <div className="flex space-x-4">
                    <button
                      onClick={handleUpdatePost}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Update Post
                    </button>
                    <button
                      onClick={() => setEditingPost(null)}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {blogPosts.map(post => (
                      <tr key={post.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{post.title}</div>
                            <div className="text-sm text-gray-500">/{post.slug}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {post.author}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            post.status === 'published' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {post.status}
                          </span>
                          {post.featured && (
                            <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              Featured
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {post.views}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleEditPost(post)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit Post"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Post"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteBlogPost(post.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Post"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}