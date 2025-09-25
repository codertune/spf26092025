#!/usr/bin/env python3
"""
Example Automation Script Template
Replace this with your actual automation logic
"""

import os
import sys
import time
import logging
import pandas as pd
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import json

class ExampleAutomation:
    def __init__(self, headless=True):
        self.setup_logging()
        self.driver = None
        self.wait = None
        self.headless = headless
        self.results = []
        
    def setup_logging(self):
        """Setup logging configuration"""
        log_dir = "logs"
        if not os.path.exists(log_dir):
            os.makedirs(log_dir)
            
        log_filename = f"example_automation_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
        log_path = os.path.join(log_dir, log_filename)
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_path),
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger('ExampleAutomation')
        
    def setup_driver(self):
        """Setup Chrome WebDriver with options"""
        self.logger.info("🔧 Initializing Chrome WebDriver...")
        
        chrome_options = Options()
        if self.headless:
            chrome_options.add_argument("--headless=new")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--start-maximized")
        
        try:
            # For production, use ChromeDriverManager
            # service = Service(ChromeDriverManager().install())
            # For local development, specify path
            service = Service('/usr/bin/chromedriver')  # Adjust path as needed
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            self.wait = WebDriverWait(self.driver, 20)
            
            # Ensure results directories exist
            os.makedirs("results", exist_ok=True)
            os.makedirs("results/pdfs", exist_ok=True)
            
            self.logger.info("✅ Chrome WebDriver setup completed")
            return True
        except Exception as e:
            self.logger.error(f"❌ Failed to setup Chrome WebDriver: {str(e)}")
            return False
            
    def read_input_file(self, file_path):
        """Read input data from CSV or Excel file"""
        try:
            self.logger.info(f"📋 Reading input data from file...")
            
            # Auto-detect file type
            ext = os.path.splitext(file_path)[1].lower()
            
            if ext == ".csv":
                df = pd.read_csv(file_path)
            elif ext in [".xls", ".xlsx"]:
                df = pd.read_excel(file_path)
            else:
                raise ValueError(f"Unsupported file type: {ext}")
            
            # Extract data (adjust column names as needed)
            data_list = df.iloc[:, 0].dropna().astype(str).tolist()  # First column
            self.logger.info(f"📊 Found {len(data_list)} items to process")
            
            return data_list
            
        except Exception as e:
            self.logger.error(f"❌ Failed to read file: {str(e)}")
            return []
            
    def process_single_item(self, item, index):
        """Process a single data item"""
        try:
            self.logger.info(f"🔍 Processing item {index}: {item}")
            
            # YOUR AUTOMATION LOGIC HERE
            # Example: Navigate to website, fill forms, extract data
            
            # Navigate to target website
            self.driver.get("https://example-website.com")
            
            # Find input field and enter data
            input_field = self.wait.until(EC.presence_of_element_located((By.ID, "search-input")))
            input_field.clear()
            input_field.send_keys(item)
            
            # Submit form
            submit_btn = self.wait.until(EC.element_to_be_clickable((By.ID, "submit-btn")))
            submit_btn.click()
            
            # Wait for results and extract data
            self.wait.until(EC.presence_of_element_located((By.CLASS_NAME, "results")))
            
            # Extract result data (customize based on your needs)
            result_data = {
                'item': item,
                'status': 'success',
                'data': 'extracted_data_here',
                'timestamp': datetime.now().isoformat()
            }
            
            self.results.append(result_data)
            self.logger.info(f"✅ Successfully processed: {item}")
            
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Error processing {item}: {str(e)}")
            self.results.append({
                'item': item,
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            })
            return False
            
    def generate_report(self):
        """Generate final report"""
        try:
            self.logger.info("📊 Generating final report...")
            
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            report_filename = f"example_automation_report_{timestamp}.pdf"
            report_path = os.path.join("results", report_filename)
            
            # Generate HTML content for PDF
            html_content = self.generate_html_report()
            
            # Convert HTML to PDF (you can use libraries like weasyprint, pdfkit, etc.)
            # For now, save as HTML
            html_path = report_path.replace('.pdf', '.html')
            with open(html_path, 'w', encoding='utf-8') as f:
                f.write(html_content)
            
            self.logger.info(f"💾 Report saved: {report_filename}")
            return report_filename
            
        except Exception as e:
            self.logger.error(f"❌ Failed to generate report: {str(e)}")
            return None
            
    def generate_html_report(self):
        """Generate HTML report content"""
        successful = [r for r in self.results if r['status'] == 'success']
        failed = [r for r in self.results if r['status'] == 'error']
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Example Automation Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .header {{ border-bottom: 2px solid #007bff; padding-bottom: 10px; margin-bottom: 20px; }}
                .summary {{ background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; }}
                .success {{ color: #28a745; }}
                .error {{ color: #dc3545; }}
                table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                th {{ background-color: #f2f2f2; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📊 Example Automation Report</h1>
                <p><strong>Generated:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            </div>
            
            <div class="summary">
                <h2>📈 Summary</h2>
                <p><strong>Total Processed:</strong> {len(self.results)}</p>
                <p><strong class="success">Successful:</strong> {len(successful)}</p>
                <p><strong class="error">Failed:</strong> {len(failed)}</p>
                <p><strong>Success Rate:</strong> {(len(successful)/len(self.results)*100):.1f}%</p>
            </div>
            
            <h2>📋 Detailed Results</h2>
            <table>
                <tr>
                    <th>Item</th>
                    <th>Status</th>
                    <th>Data/Error</th>
                    <th>Timestamp</th>
                </tr>
        """
        
        for result in self.results:
            status_class = "success" if result['status'] == 'success' else "error"
            data_or_error = result.get('data', result.get('error', 'N/A'))
            html += f"""
                <tr>
                    <td>{result['item']}</td>
                    <td class="{status_class}">{result['status']}</td>
                    <td>{data_or_error}</td>
                    <td>{result['timestamp']}</td>
                </tr>
            """
        
        html += """
            </table>
        </body>
        </html>
        """
        
        return html
        
    def cleanup(self):
        """Clean up resources"""
        try:
            if self.driver:
                self.logger.info("🔒 Closing browser and cleaning up...")
                self.driver.quit()
                self.logger.info("✅ Cleanup completed")
        except Exception as e:
            self.logger.error(f"❌ Error during cleanup: {str(e)}")
            
    def run_automation(self, file_path, headless=True):
        """Main automation workflow"""
        try:
            self.logger.info("🚀 Starting example automation...")
            
            # Setup WebDriver
            if not self.setup_driver():
                return False
                
            # Read input data
            data_list = self.read_input_file(file_path)
            if not data_list:
                self.logger.error("❌ No data found in input file")
                return False
                
            # Process each item
            for i, item in enumerate(data_list, start=1):
                self.logger.info(f"🔍 Processing item {i}/{len(data_list)}: {item}")
                self.process_single_item(item, i)
                
                # Wait between requests to avoid rate limiting
                time.sleep(2)
                
            # Generate final report
            report_file = self.generate_report()
            
            # Log final results
            successful = len([r for r in self.results if r['status'] == 'success'])
            failed = len([r for r in self.results if r['status'] == 'error'])
            
            self.logger.info("🎉 Example automation completed!")
            self.logger.info(f"📊 Total processed: {len(data_list)}")
            self.logger.info(f"✅ Successful: {successful}")
            self.logger.info(f"❌ Failed: {failed}")
            
            if report_file:
                self.logger.info(f"📄 Report generated: {report_file}")
                
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Automation failed: {str(e)}")
            return False
        finally:
            self.cleanup()

def main():
    """Main function for command line usage"""
    if len(sys.argv) < 2:
        print("Usage: python example_automation.py <file_path> [--headless]")
        print("Supported file types: .csv, .xlsx, .xls")
        sys.exit(1)
        
    file_path = sys.argv[1]
    headless = '--headless' in sys.argv or '--no-gui' in sys.argv
    
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        sys.exit(1)
    
    automation = ExampleAutomation(headless=headless)
    success = automation.run_automation(file_path, headless)
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()