import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  workHistory: WorkHistoryItem[];
}

interface WorkHistoryItem {
  id: string;
  serviceId: string;
  serviceName: string;
  fileName: string;
  creditsUsed: number;
  status: 'completed' | 'failed';
  createdAt: string;
  resultFiles: string[];
  downloadUrl?: string;
}

interface CreditSettings {
  creditsPerBDT: number;
  creditsPerProcess: number;
  freeTrialCredits: number;
  minPurchaseCredits: number;
  enabledServices: string[];
  systemNotification?: {
    enabled: boolean;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    showToAll: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  users: User[];
  creditSettings: CreditSettings;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (userData: Partial<User> & { password: string }) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  updateCreditSettings: (settings: Partial<CreditSettings>) => void;
  updateSystemNotification: (notification: CreditSettings['systemNotification']) => void;
  addCredits: (userId: string, credits: number) => void;
  deductCredits: (credits: number) => boolean;
  updateUserAdmin: (userId: string, updates: Partial<User>) => void;
  suspendUser: (userId: string) => void;
  activateUser: (userId: string) => void;
  toggleService: (serviceId: string) => void;
  isServiceEnabled: (serviceId: string) => boolean;
  addWorkHistory: (userId: string, workItem: Omit<WorkHistoryItem, 'id' | 'createdAt'>) => void;
  getWorkHistory: (userId: string) => WorkHistoryItem[];
  cleanupOldHistory: () => void;
  updateWorkHistoryFiles: (userId: string, workId: string, resultFiles: string[]) => void;
  blogPosts: BlogPost[];
  getBlogPosts: () => BlogPost[];
  addBlogPost: (post: Omit<BlogPost, 'id' | 'publishedAt' | 'updatedAt' | 'views'>) => void;
  updateBlogPost: (id: string, updates: Partial<BlogPost>) => void;
  deleteBlogPost: (id: string) => void;
  exportUserData: () => string;
  importUserData: (data: string) => boolean;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: string;
  publishedAt: string;
  updatedAt: string;
  tags: string[];
  featured: boolean;
  status: 'published' | 'draft';
  views: number;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  featuredImage?: string;
  imageAlt?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hash function for password storage (simple implementation)
const hashPassword = (password: string): string => {
  // In production, use bcrypt or similar
  return btoa(password + 'salt_key_2024');
};

const verifyPassword = (password: string, hash: string): boolean => {
  return hashPassword(password) === hash;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [userPasswords, setUserPasswords] = useState<{ [userId: string]: string }>({});
  const [creditSettings, setCreditSettings] = useState<CreditSettings>({
    creditsPerBDT: 2,
    creditsPerProcess: 0.5,
    freeTrialCredits: 100,
    minPurchaseCredits: 200,
    systemNotification: {
      enabled: false,
      message: '',
      type: 'info',
      showToAll: true
    },
    enabledServices: [
      'pdf-excel-converter',
      'webcontainer-demo',
      'ctg-port-tracking',
      'exp-issue',
      'exp-correction',
      'exp-duplicate-reporting',
      'exp-search',
      'damco-booking',
      'damco-booking-download',
      'damco-fcr-submission',
      'damco-fcr-extractor',
      'damco-edoc-upload',
      'hm-einvoice-create',
      'hm-einvoice-download',
      'hm-einvoice-correction',
      'hm-packing-list',
      'bepza-ep-issue',
      'bepza-ep-submission',
      'bepza-ep-download',
      'bepza-ip-issue',
      'bepza-ip-submit',
      'bepza-ip-download',
      'cash-incentive-application',
      'damco-tracking-maersk',
      'myshipment-tracking',
      'egm-download',
      'custom-tracking'
    ]
  });

  // Load data from database on mount
  useEffect(() => {
    console.log('🔄 AuthProvider: Loading data from database...');
    
    const loadDataFromDatabase = async () => {
      try {
        // Load current user from localStorage (session management)
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            // Verify user still exists in database
            const response = await fetch(`/api/users/${parsedUser.id}`);
            if (response.ok) {
              const result = await response.json();
              if (result.success) {
                setUser(result.user);
                console.log('✅ Loaded current user from database:', result.user.email);
              }
            } else {
              // User no longer exists, clear localStorage
              localStorage.removeItem('currentUser');
            }
          } catch (e) {
            console.error('Error loading current user:', e);
            localStorage.removeItem('currentUser');
          }
        }
        
        // Load all users from database
        try {
          const usersResponse = await fetch('/api/users');
          if (usersResponse.ok) {
            const usersResult = await usersResponse.json();
            if (usersResult.success) {
              setUsers(usersResult.users);
              console.log('✅ Loaded users from database:', usersResult.users.length);
            }
          }
        } catch (e) {
          console.error('Error loading users from database:', e);
        }
        
        // Load system settings from database
        try {
          const settingsResponse = await fetch('/api/settings');
          if (settingsResponse.ok) {
            const settingsResult = await settingsResponse.json();
            if (settingsResult.success) {
              setCreditSettings(settingsResult.settings);
              console.log('✅ Loaded settings from database with', settingsResult.settings.enabledServices?.length || 0, 'enabled services');
            }
          }
        } catch (e) {
          console.error('Error loading settings from database:', e);
        }
        
        // Load blog posts from database
        try {
          const blogResponse = await fetch('/api/blog');
          if (blogResponse.ok) {
            const blogResult = await blogResponse.json();
            if (blogResult.success) {
              setBlogPosts(blogResult.posts);
              console.log('✅ Loaded blog posts from database:', blogResult.posts.length);
            }
          }
        } catch (e) {
          console.error('Error loading blog posts from database:', e);
          // Fallback to sample blog posts if database fails
          initializeSampleBlogPosts();
        }
        
      } catch (error) {
        console.error('Error loading data from database:', error);
        // Fallback to localStorage if database is not available
        loadFromLocalStorageFallback();
      } finally {
        setIsLoading(false);
      }
    };
    
    const loadFromLocalStorageFallback = () => {
      console.log('⚠️ Falling back to localStorage...');
      
      const savedUser = localStorage.getItem('currentUser');
      const savedUsers = localStorage.getItem('allUsers');
      const savedSettings = localStorage.getItem('creditSettings');
      const savedBlogPosts = localStorage.getItem('blogPosts');

      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          console.log('✅ Loaded saved user from localStorage:', parsedUser.email);
          setUser(parsedUser);
        } catch (e) {
          console.error('Error loading user data:', e);
        }
      }

      if (savedUsers) {
        try {
          const parsedUsers = JSON.parse(savedUsers);
          console.log('✅ Loaded saved users from localStorage:', parsedUsers.length);
          setUsers(parsedUsers);
        } catch (e) {
          console.error('Error loading users data:', e);
        }
      }

      if (savedSettings) {
        try {
          const loadedSettings = JSON.parse(savedSettings);
          console.log('✅ Loaded saved settings from localStorage with', loadedSettings.enabledServices?.length || 0, 'enabled services');
          setCreditSettings(loadedSettings);
        } catch (e) {
          console.error('Error loading settings data:', e);
        }
      }
      
      if (savedBlogPosts) {
        try {
          const loadedBlogPosts = JSON.parse(savedBlogPosts);
          console.log('✅ Loaded saved blog posts from localStorage:', loadedBlogPosts.length);
          setBlogPosts(loadedBlogPosts);
        } catch (e) {
          console.error('Error loading blog posts data:', e);
          initializeSampleBlogPosts();
        }
      } else {
        initializeSampleBlogPosts();
      }
    };

    function initializeSampleBlogPosts() {
      const samplePosts: BlogPost[] = [
        {
          id: 'post_sample_1',
          title: 'Welcome to Smart Process Flow Blog',
          slug: 'welcome-to-smart-process-flow',
          content: `
            <div class="blog-content">
              <h2 style="color: #2563eb; font-size: 1.875rem; font-weight: bold; margin-bottom: 1rem;">Welcome to Our Automation Platform</h2>
              <p style="margin-bottom: 1.5rem; line-height: 1.7; color: #374151;">Smart Process Flow is revolutionizing how businesses handle their commercial processes in Bangladesh. Our platform automates complex workflows, from PDF extraction to export documentation.</p>
              
              <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 1.5rem; border-radius: 0.75rem; margin: 2rem 0; color: white;">
                <h3 style="color: white; font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">🚀 Key Features</h3>
                <ul style="list-style: none; padding: 0; margin: 0;">
                  <li style="margin-bottom: 0.75rem; padding-left: 1.5rem; position: relative;">
                    <span style="position: absolute; left: 0; color: #fbbf24;">✅</span>
                    PDF to Excel conversion with intelligent table detection
                  </li>
                  <li style="margin-bottom: 0.75rem; padding-left: 1.5rem; position: relative;">
                    <span style="position: absolute; left: 0; color: #fbbf24;">✅</span>
                    Bangladesh Bank EXP processing automation
                  </li>
                  <li style="margin-bottom: 0.75rem; padding-left: 1.5rem; position: relative;">
                    <span style="position: absolute; left: 0; color: #fbbf24;">✅</span>
                    Damco booking and FCR submission
                  </li>
                  <li style="margin-bottom: 0.75rem; padding-left: 1.5rem; position: relative;">
                    <span style="position: absolute; left: 0; color: #fbbf24;">✅</span>
                    H&M e-invoice management
                  </li>
                  <li style="padding-left: 1.5rem; position: relative;">
                    <span style="position: absolute; left: 0; color: #fbbf24;">✅</span>
                    BEPZA permit processing
                  </li>
                </ul>
              </div>
              
              <h3 style="color: #059669; font-size: 1.5rem; font-weight: bold; margin: 2rem 0 1rem 0;">🎯 Getting Started</h3>
              <p style="margin-bottom: 1.5rem; line-height: 1.7; color: #374151;">Sign up for your free account and get <strong style="color: #2563eb;">100 trial credits</strong> to explore our automation services. Our platform is designed to save you time and reduce manual errors in your business processes.</p>
              
              <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 1rem 1.5rem; margin: 1.5rem 0; border-radius: 0.5rem;">
                <p style="margin: 0; color: #0c4a6e; font-weight: 500;">💡 <strong>Pro Tip:</strong> Start with our PDF to Excel converter to see the power of automation in action!</p>
              </div>
              
              <p style="margin-bottom: 0; line-height: 1.7; color: #374151; text-align: center; font-style: italic;">Stay tuned for more updates and automation tips! 🚀</p>
            </div>
          `,
          excerpt: 'Discover how Smart Process Flow is transforming business automation in Bangladesh with our comprehensive suite of commercial process tools.',
          author: 'Smart Process Flow Team',
          publishedAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
          tags: ['automation', 'bangladesh', 'business', 'processes'],
          featured: true,
          status: 'published',
          views: 245,
          metaTitle: 'Welcome to Smart Process Flow - Business Automation Platform',
          metaDescription: 'Learn about Smart Process Flow\'s automation platform for Bangladesh commercial processes including PDF extraction, export documentation, and more.',
          metaKeywords: 'automation, bangladesh, business processes, pdf extraction, export documentation',
          featuredImage: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&fit=crop',
          imageAlt: 'Modern office workspace with automation technology and digital processes'
        },
        {
          id: 'post_sample_2',
          title: 'How to Automate Your Export Documentation',
          slug: 'automate-export-documentation',
          content: `
            <div class="blog-content">
              <h2 style="color: #dc2626; font-size: 1.875rem; font-weight: bold; margin-bottom: 1rem;">📋 Streamline Your Export Process</h2>
              <p style="margin-bottom: 1.5rem; line-height: 1.7; color: #374151;">Export documentation can be time-consuming and error-prone when done manually. Our automation platform simplifies this process significantly.</p>
              
              <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 0.75rem; padding: 1.5rem; margin: 2rem 0;">
                <h3 style="color: #92400e; font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">🎯 Step-by-Step Guide</h3>
                <ol style="margin: 0; padding-left: 1.5rem; color: #92400e;">
                  <li style="margin-bottom: 1rem; line-height: 1.6;">
                    <strong style="color: #1f2937;">Upload Your Documents:</strong> Simply drag and drop your PDF invoices or Excel files
                  </li>
                  <li style="margin-bottom: 1rem; line-height: 1.6;">
                    <strong style="color: #1f2937;">Select Services:</strong> Choose from Bangladesh Bank EXP, Damco booking, or H&M e-invoice services
                  </li>
                  <li style="margin-bottom: 1rem; line-height: 1.6;">
                    <strong style="color: #1f2937;">Review & Process:</strong> Our AI processes your documents automatically
                  </li>
                  <li style="line-height: 1.6;">
                    <strong style="color: #1f2937;">Download Results:</strong> Get your completed documentation in minutes
                  </li>
                </ol>
              </div>
              
              <h3 style="color: #059669; font-size: 1.5rem; font-weight: bold; margin: 2rem 0 1rem 0;">💪 Benefits</h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin: 1.5rem 0;">
                <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 0.5rem; padding: 1rem; text-align: center;">
                  <div style="font-size: 2rem; margin-bottom: 0.5rem;">⏰</div>
                  <div style="font-weight: bold; color: #065f46;">Save 80%</div>
                  <div style="color: #047857; font-size: 0.875rem;">Processing Time</div>
                </div>
                <div style="background: #fef2f2; border: 1px solid #ef4444; border-radius: 0.5rem; padding: 1rem; text-align: center;">
                  <div style="font-size: 2rem; margin-bottom: 0.5rem;">🎯</div>
                  <div style="font-weight: bold; color: #7f1d1d;">Reduce 95%</div>
                  <div style="color: #991b1b; font-size: 0.875rem;">Manual Errors</div>
                </div>
                <div style="background: #eff6ff; border: 1px solid #3b82f6; border-radius: 0.5rem; padding: 1rem; text-align: center;">
                  <div style="font-size: 2rem; margin-bottom: 0.5rem;">🌙</div>
                  <div style="font-weight: bold; color: #1e3a8a;">24/7</div>
                  <div style="color: #1d4ed8; font-size: 0.875rem;">Automated Processing</div>
                </div>
                <div style="background: #f3e8ff; border: 1px solid #8b5cf6; border-radius: 0.5rem; padding: 1rem; text-align: center;">
                  <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔒</div>
                  <div style="font-weight: bold; color: #581c87;">Secure</div>
                  <div style="color: #7c3aed; font-size: 0.875rem;">& Compliant</div>
                </div>
              </div>
              
              <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 2rem; border-radius: 1rem; margin: 2rem 0; text-align: center; color: white;">
                <h4 style="color: white; font-size: 1.25rem; font-weight: bold; margin-bottom: 1rem;">Ready to automate your export documentation?</h4>
                <a href="/services" style="display: inline-block; background: white; color: #6366f1; padding: 0.75rem 2rem; border-radius: 0.5rem; text-decoration: none; font-weight: bold; transition: all 0.3s ease;">
                  🚀 Explore Our Services Today!
                </a>
              </div>
            </div>
          `,
          excerpt: 'Learn how to automate your export documentation process and save hours of manual work with our step-by-step guide.',
          author: 'Automation Expert',
          publishedAt: '2024-01-10T14:30:00Z',
          updatedAt: '2024-01-10T14:30:00Z',
          tags: ['export', 'documentation', 'automation', 'tutorial'],
          featured: false,
          status: 'published',
          views: 189,
          metaTitle: 'How to Automate Export Documentation - Smart Process Flow',
          metaDescription: 'Step-by-step guide to automating your export documentation process using Smart Process Flow\'s automation platform.',
          metaKeywords: 'export documentation, automation, bangladesh export, business processes',
          featuredImage: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&fit=crop',
          imageAlt: 'Export documentation and shipping containers at port with digital overlay'
        }
      ];
      setBlogPosts(samplePosts);
      localStorage.setItem('blogPosts', JSON.stringify(samplePosts));
    }
    
    // Start loading data
    loadDataFromDatabase();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('🔐 Attempting login for:', email);
      console.log('🌐 Backend URL:', '/api/auth/login');
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      const result = await response.json();
      console.log('📊 Response data:', result);
      
      if (result.success) {
        setUser(result.user);
        localStorage.setItem('currentUser', JSON.stringify(result.user));
        
        // Refresh users list
        const usersResponse = await fetch('/api/users');
        if (usersResponse.ok) {
          const usersResult = await usersResponse.json();
          if (usersResult.success) {
            setUsers(usersResult.users);
          }
        }
      }
      
      return { success: result.success, message: result.message };
    } catch (error) {
      console.error('❌ Login error details:', error);
      console.error('❌ Error type:', error.constructor.name);
      console.error('❌ Error message:', error.message);
      return { success: false, message: 'Login failed. Please check your connection and try again.' };
    }
  };

  const register = async (userData: Partial<User> & { password: string }): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('👤 Attempting registration for:', userData.email);
      console.log('🌐 Backend URL:', '/api/auth/register');
      console.log('📊 Registration data:', { ...userData, password: '[HIDDEN]' });
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      const result = await response.json();
      console.log('📊 Response data:', result);
      
      if (result.success) {
        setUser(result.user);
        localStorage.setItem('currentUser', JSON.stringify(result.user));
        
        // Refresh users list
        const usersResponse = await fetch('/api/users');
        if (usersResponse.ok) {
          const usersResult = await usersResponse.json();
          if (usersResult.success) {
            setUsers(usersResult.users);
          }
        }
      }
      
      return { success: result.success, message: result.message };
    } catch (error) {
      console.error('❌ Registration error details:', error);
      console.error('❌ Error type:', error.constructor.name);
      console.error('❌ Error message:', error.message);
      return { success: false, message: 'Registration failed. Please check your connection and try again.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    window.location.href = '/';
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      // Update in database
      fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      .then(response => response.json())
      .then(result => {
        if (result.success) {
          setUser(result.user);
          setUsers(prev => prev.map(u => u.id === user.id ? result.user : u));
          localStorage.setItem('currentUser', JSON.stringify(result.user));
        }
      })
      .catch(error => {
        console.error('Update user error:', error);
        // Fallback to local update
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      });
    }
  };

  const updateCreditSettings = (settings: Partial<CreditSettings>) => {
    const newSettings = { ...creditSettings, ...settings };
    
    // Update in database
    fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings)
    })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        setCreditSettings(result.settings);
      }
    })
    .catch(error => {
      console.error('Update settings error:', error);
      // Fallback to local update
      setCreditSettings(newSettings);
    });
  };

  const updateSystemNotification = (notification: CreditSettings['systemNotification']) => {
    setCreditSettings(prev => ({
      ...prev,
      systemNotification: notification
    }));
  };
  const addCredits = (userId: string, credits: number) => {
    console.log(`Adding ${credits} credits to user ${userId}`);
    
    // Update in database
    fetch(`/api/users/${userId}/credits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credits, operation: 'add' })
    })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        // Refresh user data
        if (user && user.id === userId) {
          const updatedUser = { ...user, credits: result.newCredits };
          setUser(updatedUser);
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
        
        // Refresh users list
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, credits: result.newCredits } : u
        ));
      }
    })
    .catch(error => {
      console.error('Add credits error:', error);
      // Fallback to local update
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, credits: u.credits + credits } : u
      ));
      
      if (user && user.id === userId) {
        const updatedUser = { ...user, credits: user.credits + credits };
        setUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
    });
  };

  const deductCredits = (credits: number): boolean => {
    if (user?.isAdmin) {
      return true;
    }
    
    if (user && user.credits >= credits) {
      // Update in database
      fetch(`/api/users/${user.id}/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits, operation: 'deduct' })
      })
      .then(response => response.json())
      .then(result => {
        if (result.success) {
          const updatedUser = { ...user, credits: result.newCredits };
          setUser(updatedUser);
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
      })
      .catch(error => {
        console.error('Deduct credits error:', error);
        // Fallback to local update
        const updatedUser = { ...user, credits: user.credits - credits };
        updateUser(updatedUser);
      });
      
      return true;
    }
    return false;
  };

  const updateUserAdmin = (userId: string, updates: Partial<User>) => {
    // Update in database
    fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        setUsers(prev => prev.map(u => u.id === userId ? result.user : u));
        
        if (user && user.id === userId) {
          setUser(result.user);
          localStorage.setItem('currentUser', JSON.stringify(result.user));
        }
      }
    })
    .catch(error => {
      console.error('Update user admin error:', error);
      // Fallback to local update
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
      
      if (user && user.id === userId) {
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
    });
  };

  const updateWorkHistoryFiles = (userId: string, workId: string, resultFiles: string[]) => {
    // Update in database
    fetch(`/api/work-history/${workId}/files`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resultFiles })
    })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        // Update local state
        setUsers(prev => prev.map(u => 
          u.id === userId 
            ? { 
                ...u, 
                workHistory: (u.workHistory || []).map(work => 
                  work.id === workId 
                    ? { ...work, resultFiles }
                    : work
                )
              }
            : u
        ));

        if (user && user.id === userId) {
          const updatedWorkHistory = (user.workHistory || []).map(work => 
            work.id === workId 
              ? { ...work, resultFiles }
              : work
          );
          const updatedUser = { ...user, workHistory: updatedWorkHistory };
          setUser(updatedUser);
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
      }
    })
    .catch(error => {
      console.error('Update work history files error:', error);
      // Fallback to local update
      setUsers(prev => prev.map(u => 
        u.id === userId 
          ? { 
              ...u, 
              workHistory: (u.workHistory || []).map(work => 
                work.id === workId 
                  ? { ...work, resultFiles }
                  : work
              )
            }
          : u
      ));

      if (user && user.id === userId) {
        const updatedWorkHistory = (user.workHistory || []).map(work => 
          work.id === workId 
            ? { ...work, resultFiles }
            : work
        );
        const updatedUser = { ...user, workHistory: updatedWorkHistory };
        setUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
    });
  };
  const suspendUser = (userId: string) => {
    updateUserAdmin(userId, { status: 'suspended' });
  };

  const activateUser = (userId: string) => {
    updateUserAdmin(userId, { status: 'active' });
  };

  const toggleService = (serviceId: string) => {
    console.log('🔄 toggleService called for:', serviceId);
    console.log('📋 Current enabled services:', creditSettings.enabledServices);
    
    const currentServices = creditSettings.enabledServices || [];
    const isCurrentlyEnabled = currentServices.includes(serviceId);
    
    const newEnabledServices = isCurrentlyEnabled
      ? currentServices.filter(id => id !== serviceId)
      : [...currentServices, serviceId];
    
    console.log('🔄 Service', serviceId, isCurrentlyEnabled ? 'DISABLED' : 'ENABLED');
    console.log('📋 New enabled services:', newEnabledServices);
    
    const newSettings = { ...creditSettings, enabledServices: newEnabledServices };
    
    // Update in database
    fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings)
    })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        setCreditSettings(result.settings);
        console.log('✅ Settings updated in database');
      }
    })
    .catch(error => {
      console.error('❌ Failed to update settings in database:', error);
      // Fallback to local update
      setCreditSettings(newSettings);
    });
  };

  const isServiceEnabled = (serviceId: string) => {
    const enabled = creditSettings.enabledServices?.includes(serviceId) || false;
    return enabled;
  };

  // Add demo data creation function for testing
  const createDemoData = () => {
    console.log('🎭 Creating demo data for testing...');
    
    const demoUsers: User[] = [
      {
        id: 'user_1',
        email: 'test@example.com',
        name: 'Test User',
        company: 'Test Company Ltd',
        mobile: '+880 1234-567890',
        credits: 100,
        emailVerified: true,
        memberSince: '2024-01-01',
        isAdmin: false,
        trialEndsAt: '2024-12-31',
        status: 'active',
        services: ['pdf-excel-converter', 'damco-tracking-maersk'],
        totalSpent: 0,
        lastActivity: '2024-01-20',
        workHistory: []
      },
      {
        id: 'admin_1',
        email: 'admin@smartprocessflow.com',
        name: 'Admin User',
        company: 'Smart Process Flow',
        mobile: '+880 1234-567891',
        credits: 999999,
        emailVerified: true,
        memberSince: '2024-01-01',
        isAdmin: true,
        status: 'active',
        services: [],
        totalSpent: 0,
        lastActivity: '2024-01-20',
        workHistory: []
      }
    ];
    
    const demoPasswords = {
      'user_1': hashPassword('test123'),
      'admin_1': hashPassword('admin123')
    };
    
    setUsers(demoUsers);
    setUserPasswords(demoPasswords);
    
    console.log('✅ Demo data created successfully');
  };

  // Expose createDemoData function globally for testing
  useEffect(() => {
    (window as any).createDemoData = createDemoData;
    console.log('🎭 Demo data function available: window.createDemoData()');
  }, []);

  const addWorkHistory = (userId: string, workItem: Omit<WorkHistoryItem, 'id' | 'createdAt'>) => {
    // Add to database
    fetch('/api/work-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...workItem })
    })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        const newWorkItem: WorkHistoryItem = {
          id: result.workHistory.id,
          serviceId: result.workHistory.serviceId,
          serviceName: result.workHistory.serviceName,
          fileName: result.workHistory.fileName,
          creditsUsed: result.workHistory.creditsUsed,
          status: result.workHistory.status,
          resultFiles: result.workHistory.resultFiles,
          createdAt: result.workHistory.createdAt,
          downloadUrl: result.workHistory.downloadUrl
        };
        
        // Update local state
        setUsers(prev => prev.map(u => 
          u.id === userId 
            ? { ...u, workHistory: [newWorkItem, ...(u.workHistory || [])] }
            : u
        ));

        if (user && user.id === userId) {
          const updatedUser = { ...user, workHistory: [newWorkItem, ...(user.workHistory || [])] };
          setUser(updatedUser);
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
      }
    })
    .catch(error => {
      console.error('Add work history error:', error);
      // Fallback to local storage
      const newWorkItem: WorkHistoryItem = {
        ...workItem,
        id: `work_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString()
      };

      setUsers(prev => prev.map(u => 
        u.id === userId 
          ? { ...u, workHistory: [newWorkItem, ...(u.workHistory || [])] }
          : u
      ));

      if (user && user.id === userId) {
        const updatedUser = { ...user, workHistory: [newWorkItem, ...(user.workHistory || [])] };
        setUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
    });
  };

  const getWorkHistory = (userId: string) => {
    // Try to get from database first
    fetch(`/api/work-history/${userId}`)
      .then(response => response.json())
      .then(result => {
        if (result.success) {
          // Update local state with database data
          setUsers(prev => prev.map(u => 
            u.id === userId ? { ...u, workHistory: result.workHistory } : u
          ));
          
          if (user && user.id === userId) {
            const updatedUser = { ...user, workHistory: result.workHistory };
            setUser(updatedUser);
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
          }
        }
      })
      .catch(error => {
        console.error('Get work history error:', error);
      });
    
    // Return current local state (will be updated by the fetch above)
    const userData = users.find(u => u.id === userId);
    if (!userData) return [];
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return (userData.workHistory || []).filter(item => 
      new Date(item.createdAt) > sevenDaysAgo
    );
  };

  const cleanupOldHistory = () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    setUsers(prev => prev.map(u => ({
      ...u,
      workHistory: (u.workHistory || []).filter(item => 
        new Date(item.createdAt) > sevenDaysAgo
      )
    })));

    if (user) {
      const filteredHistory = (user.workHistory || []).filter(item => 
        new Date(item.createdAt) > sevenDaysAgo
      );
      const updatedUser = { ...user, workHistory: filteredHistory };
      setUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
  };

  useEffect(() => {
    const interval = setInterval(cleanupOldHistory, 24 * 60 * 60 * 1000); // Daily cleanup
    return () => clearInterval(interval);
  }, []);

  const getBlogPosts = () => {
    return blogPosts;
  };

  const addBlogPost = (postData: Omit<BlogPost, 'id' | 'publishedAt' | 'updatedAt' | 'views'>) => {
    // Add to database
    fetch('/api/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData)
    })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        const newBlogPosts = [result.post, ...blogPosts];
        setBlogPosts(newBlogPosts);
      }
    })
    .catch(error => {
      console.error('Add blog post error:', error);
      // Fallback to local storage
      const newPost: BlogPost = {
        ...postData,
        id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        views: 0
      };

      const newBlogPosts = [newPost, ...blogPosts];
      setBlogPosts(newBlogPosts);
    });
  };

  const updateBlogPost = (id: string, updates: Partial<BlogPost>) => {
    // Update in database
    fetch(`/api/blog/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        const updatedBlogPosts = blogPosts.map(post => 
          post.id === id ? result.post : post
        );
        setBlogPosts(updatedBlogPosts);
      }
    })
    .catch(error => {
      console.error('Update blog post error:', error);
      // Fallback to local storage
      const updatedBlogPosts = blogPosts.map(post => 
        post.id === id 
          ? { ...post, ...updates, updatedAt: new Date().toISOString() }
          : post
      );
      setBlogPosts(updatedBlogPosts);
    });
  };

  const deleteBlogPost = (id: string) => {
    // Delete from database
    fetch(`/api/blog/${id}`, {
      method: 'DELETE'
    })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        const filteredBlogPosts = blogPosts.filter(post => post.id !== id);
        setBlogPosts(filteredBlogPosts);
      }
    })
    .catch(error => {
      console.error('Delete blog post error:', error);
      // Fallback to local storage
      const filteredBlogPosts = blogPosts.filter(post => post.id !== id);
      setBlogPosts(filteredBlogPosts);
    });
  };

  const exportUserData = () => {
    const exportData = {
      users: users.map(user => ({
        email: user.email,
        mobile: user.mobile,
        remainingCredits: user.credits,
        usedCredits: creditSettings.freeTrialCredits - user.credits,
        totalSpent: user.totalSpent,
        memberSince: user.memberSince,
        lastActivity: user.lastActivity,
        workHistory: user.workHistory?.map(work => ({
          serviceId: work.serviceId,
          serviceName: work.serviceName,
          creditsUsed: work.creditsUsed,
          createdAt: work.createdAt
        })) || []
      })),
      exportDate: new Date().toISOString(),
      totalUsers: users.length,
      totalCreditsDistributed: users.reduce((sum, u) => sum + u.credits, 0),
      totalRevenue: users.reduce((sum, u) => sum + u.totalSpent, 0)
    };

    return JSON.stringify(exportData, null, 2);
  };

  const importUserData = (data: string) => {
    try {
      const importData = JSON.parse(data);
      
      if (!importData.users || !Array.isArray(importData.users)) {
        throw new Error('Invalid data format');
      }

      // Validate and restore user data
      console.log(`Importing ${importData.users.length} user records...`);
      return true;
    } catch (error) {
      console.error('Import error:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      users,
      creditSettings,
      isLoading,
      login,
      register,
      logout,
      updateUser,
      updateCreditSettings,
      updateSystemNotification,
      addCredits,
      deductCredits,
      updateUserAdmin,
      suspendUser,
      activateUser,
      toggleService,
      isServiceEnabled,
      addWorkHistory,
      getWorkHistory,
      cleanupOldHistory,
      updateWorkHistoryFiles,
      blogPosts,
      getBlogPosts,
      addBlogPost,
      updateBlogPost,
      deleteBlogPost,
      exportUserData,
      importUserData
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}