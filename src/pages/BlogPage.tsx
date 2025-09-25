import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calendar, User, ArrowLeft, Search, Tag, Clock, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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
}

export default function BlogPage() {
  const { slug } = useParams();
  const { user, blogPosts, getBlogPosts } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [currentPost, setCurrentPost] = useState<BlogPost | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      const blogPosts = getBlogPosts();
      setPosts(blogPosts.filter(post => post.status === 'published'));
      
      if (slug) {
        const post = blogPosts.find(p => p.slug === slug && p.status === 'published');
        setCurrentPost(post || null);
        
        // Update page title and meta tags for SEO
        if (post) {
          document.title = post.metaTitle || `${post.title} - Smart Process Flow Blog`;
          
          // Update meta description
          const metaDescription = document.querySelector('meta[name="description"]');
          if (metaDescription) {
            metaDescription.setAttribute('content', post.metaDescription || post.excerpt);
          } else {
            const meta = document.createElement('meta');
            meta.name = 'description';
            meta.content = post.metaDescription || post.excerpt;
            document.head.appendChild(meta);
          }
          
          // Update meta keywords
          const metaKeywords = document.querySelector('meta[name="keywords"]');
          if (metaKeywords) {
            metaKeywords.setAttribute('content', post.metaKeywords || post.tags.join(', '));
          } else {
            const meta = document.createElement('meta');
            meta.name = 'keywords';
            meta.content = post.metaKeywords || post.tags.join(', ');
            document.head.appendChild(meta);
          }
          
          // Add structured data for SEO
          const structuredData = {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post.title,
            "description": post.excerpt,
            "author": {
              "@type": "Person",
              "name": post.author
            },
            "datePublished": post.publishedAt,
            "dateModified": post.updatedAt,
            "publisher": {
              "@type": "Organization",
              "name": "Smart Process Flow"
            }
          };
          
          const script = document.createElement('script');
          script.type = 'application/ld+json';
          script.textContent = JSON.stringify(structuredData);
          document.head.appendChild(script);
        }
      } else {
        document.title = 'Blog - Smart Process Flow | Automation Insights & Updates';
      }
      
      setLoading(false);
    };

    loadPosts();
  }, [slug, getBlogPosts]);

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || post.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const allTags = Array.from(new Set(posts.flatMap(post => post.tags)));

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Single post view
  if (slug && currentPost) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            to="/blog"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Link>

          <article className="bg-white rounded-xl shadow-lg overflow-hidden">
            {currentPost.featuredImage && (
              <div className="relative h-64 md:h-80 overflow-hidden">
                <img
                  src={currentPost.featuredImage}
                  alt={currentPost.imageAlt || currentPost.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            )}
            
            <div className="p-8">
              <header className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  {currentPost.title}
                </h1>
                
                <div className="flex items-center space-x-6 text-gray-600 mb-6">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    <span>{currentPost.author}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{formatDate(currentPost.publishedAt)}</span>
                  </div>
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 mr-2" />
                    <span>{currentPost.views} views</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {currentPost.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </header>

              <div 
                className="prose prose-lg max-w-none blog-post-content"
                dangerouslySetInnerHTML={{ __html: currentPost.content }}
              />
              
              <style dangerouslySetInnerHTML={{
                __html: `
                .blog-post-content {
                  line-height: 1.8;
                }
                .blog-post-content h2 {
                  margin-top: 2rem;
                  margin-bottom: 1rem;
                }
                .blog-post-content h3 {
                  margin-top: 1.5rem;
                  margin-bottom: 0.75rem;
                }
                .blog-post-content p {
                  margin-bottom: 1.25rem;
                }
                .blog-post-content a {
                  color: #2563eb;
                  text-decoration: underline;
                  transition: color 0.2s ease;
                }
                .blog-post-content a:hover {
                  color: #1d4ed8;
                }
                .blog-post-content img {
                  border-radius: 0.5rem;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                  margin: 1.5rem 0;
                }
                .blog-post-content blockquote {
                  border-left: 4px solid #3b82f6;
                  background: #f8fafc;
                  padding: 1rem 1.5rem;
                  margin: 1.5rem 0;
                  border-radius: 0.5rem;
                }
                .blog-post-content code {
                  background: #f1f5f9;
                  padding: 0.25rem 0.5rem;
                  border-radius: 0.25rem;
                  font-size: 0.875rem;
                }
                .blog-post-content pre {
                  background: #1e293b;
                  color: #e2e8f0;
                  padding: 1rem;
                  border-radius: 0.5rem;
                  overflow-x: auto;
                  margin: 1.5rem 0;
                }
                `
              }} />
            </div>
          </article>
        </div>
      </div>
    );
  }

  // Blog listing view
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Smart Process Flow Blog
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Stay updated with the latest automation insights, industry trends, and platform updates.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Search and Filter */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search blog posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Global styles for blog content */}
        <style dangerouslySetInnerHTML={{
          __html: `
            .blog-post-content {
              line-height: 1.8;
            }
            .blog-post-content h2 {
              margin-top: 2rem;
              margin-bottom: 1rem;
              font-size: 1.875rem;
              font-weight: bold;
            }
            .blog-post-content h3 {
              margin-top: 1.5rem;
              margin-bottom: 0.75rem;
              font-size: 1.5rem;
              font-weight: bold;
            }
            .blog-post-content h4 {
              margin-top: 1.25rem;
              margin-bottom: 0.5rem;
              font-size: 1.25rem;
              font-weight: bold;
            }
            .blog-post-content p {
              margin-bottom: 1.25rem;
            }
            .blog-post-content a {
              color: #2563eb;
              text-decoration: underline;
              transition: color 0.2s ease;
            }
            .blog-post-content a:hover {
              color: #1d4ed8;
            }
            .blog-post-content img {
              border-radius: 0.5rem;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              margin: 1.5rem 0;
              max-width: 100%;
              height: auto;
            }
            .blog-post-content blockquote {
              border-left: 4px solid #3b82f6;
              background: #f8fafc;
              padding: 1rem 1.5rem;
              margin: 1.5rem 0;
              border-radius: 0.5rem;
            }
            .blog-post-content code {
              background: #f1f5f9;
              padding: 0.25rem 0.5rem;
              border-radius: 0.25rem;
              font-size: 0.875rem;
              font-family: 'Courier New', monospace;
            }
            .blog-post-content pre {
              background: #1e293b;
              color: #e2e8f0;
              padding: 1rem;
              border-radius: 0.5rem;
              overflow-x: auto;
              margin: 1.5rem 0;
            }
            .blog-post-content ul, .blog-post-content ol {
              margin: 1rem 0;
              padding-left: 1.5rem;
            }
            .blog-post-content li {
              margin-bottom: 0.5rem;
            }
            .blog-post-content strong {
              font-weight: 600;
            }
            .blog-post-content em {
              font-style: italic;
            }
            .blog-post-content div[style*="background"] {
              border-radius: 0.5rem;
              padding: 1rem;
              margin: 1rem 0;
            }
            .blog-post-content div[style*="grid"] {
              gap: 1rem;
            }
          `
        }} />

        {/* Blog Posts Grid */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">No blog posts found</div>
            <p className="text-gray-400">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map(post => (
              <article
                key={post.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                {post.featuredImage && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={post.featuredImage}
                      alt={post.imageAlt || post.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                    {post.featured && (
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        Featured
                      </div>
                    )}
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{formatDate(post.publishedAt)}</span>
                    </div>
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      <span>{post.views}</span>
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                    <Link
                      to={`/blog/${post.slug}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {post.title}
                    </Link>
                  </h2>

                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="h-4 w-4 mr-1" />
                      <span>{post.author}</span>
                    </div>
                    <Link
                      to={`/blog/${post.slug}`}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      Read More →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}