/*
  Smart Process Flow - Seed Data
  -------------------------------
  Default system settings and sample blog posts
*/

-- Insert default system settings
INSERT INTO system_settings (
    credits_per_bdt, credits_per_process, free_trial_credits, min_purchase_credits,
    enabled_services, system_notification
) 
SELECT 
    2.0, 0.5, 100, 200,
    '["pdf-excel-converter","webcontainer-demo","ctg-port-tracking","exp-issue","exp-correction","exp-duplicate-reporting","exp-search","damco-booking","damco-booking-download","damco-fcr-submission","damco-fcr-extractor","damco-edoc-upload","hm-einvoice-create","hm-einvoice-download","hm-einvoice-correction","hm-packing-list","bepza-ep-issue","bepza-ep-submission","bepza-ep-download","bepza-ip-issue","bepza-ip-submit","bepza-ip-download","cash-incentive-application","damco-tracking-maersk","myshipment-tracking","egm-download","custom-tracking"]'::jsonb,
    '{"enabled": false, "message": "", "type": "info", "showToAll": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM system_settings);

-- Insert welcome blog post
INSERT INTO blog_posts (
    title, slug, content, excerpt, author, tags, featured, status, views,
    meta_title, meta_description, meta_keywords, published_at
) 
SELECT 
    'Welcome to Smart Process Flow Blog',
    'welcome-to-smart-process-flow',
    '<div class="blog-content"><h2>Welcome</h2><p>Smart Process Flow is revolutionizing automation.</p></div>',
    'Discover how Smart Process Flow is transforming business automation in Bangladesh.',
    'Smart Process Flow Team',
    ARRAY['automation', 'bangladesh', 'business', 'processes'],
    true, 'published', 245,
    'Welcome to Smart Process Flow',
    'Learn about Smart Process Flow automation.',
    'automation, bangladesh, export',
    now()
WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = 'welcome-to-smart-process-flow');

-- Insert tutorial blog post
INSERT INTO blog_posts (
    title, slug, content, excerpt, author, tags, featured, status, views,
    meta_title, meta_description, meta_keywords, published_at
) 
SELECT 
    'How to Automate Your Export Documentation',
    'automate-export-documentation',
    '<div class="blog-content"><h2>Export Docs</h2><p>Automation saves time and reduces errors.</p></div>',
    'Learn how to automate export documentation.',
    'Automation Expert',
    ARRAY['export', 'documentation', 'automation', 'tutorial'],
    false, 'published', 189,
    'How to Automate Export Documentation',
    'Step-by-step automation guide.',
    'export, documentation, automation',
    now()
WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = 'automate-export-documentation');
