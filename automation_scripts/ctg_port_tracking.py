#!/usr/bin/env python3
"""
CTG Port Authority Tracking Automation
Automates the process of tracking container numbers through CTG Port Authority portal
"""

import os
import sys
import time
import logging
import pandas as pd
import base64
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import json

class CtgPortTrackingAutomation:
    def __init__(self, headless=True):
        self.setup_logging()
        self.driver = None
        self.wait = None
        self.headless = headless
        self.results = []
        self.base_url = "https://cpatos.gov.bd/pcs/"
        
    def setup_logging(self):
        """Setup logging configuration"""
        log_dir = "logs"
        if not os.path.exists(log_dir):
            os.makedirs(log_dir)
            
        log_filename = f"ctg_port_tracking_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
        log_path = os.path.join(log_dir, log_filename)
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_path),
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger('CtgPortTracking')
        
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
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        
        # Disable automation detection
        chrome_options.add_experimental_option("useAutomationExtension", False)
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        
        try:
            # Use system-installed chromedriver for WebContainer compatibility
            chromedriver_paths = [
                '/usr/bin/chromedriver',  # Linux/WebContainer
                '/usr/local/bin/chromedriver',  # Alternative Linux path
                'chromedriver'  # Windows/PATH
            ]
            
            chromedriver_path = None
            for path in chromedriver_paths:
                if os.path.exists(path) or path == 'chromedriver':
                    chromedriver_path = path
                    break
            
            if not chromedriver_path:
                raise Exception("ChromeDriver not found. Please install chromium-chromedriver")
                
            service = Service(chromedriver_path)
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            self.wait = WebDriverWait(self.driver, 20)
            
            # Ensure results directories exist
            os.makedirs("results", exist_ok=True)
            os.makedirs("results/pdfs", exist_ok=True)
            
            self.logger.info(f"✅ Chrome WebDriver setup completed using: {chromedriver_path}")
            return True
        except Exception as e:
            self.logger.error(f"❌ Failed to setup Chrome WebDriver: {str(e)}")
            return False
            
    def navigate_to_portal(self):
        """Navigate to CTG Port Authority portal"""
        try:
            self.logger.info("🌐 Navigating to CTG Port Authority portal...")
            self.driver.get(self.base_url)
            
            # Wait for page to load
            self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
            self.logger.info("📍 Successfully navigated to CTG Port Authority portal")
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Failed to navigate to CTG Port Authority portal: {str(e)}")
            return False
            
    def process_container_number(self, container_number, index):
        """Process a single container number"""
        try:
            self.logger.info(f"🔍 Processing container number {index}: {container_number}")
            
            # Navigate to the portal (in case we need to refresh)
            self.driver.get(self.base_url)
            
            # Wait for the input field to be present
            input_field = self.wait.until(
                EC.presence_of_element_located((By.ID, "containerLocation"))
            )
            
            # Clear and enter container number
            input_field.clear()
            input_field.send_keys(container_number)
            self.logger.info(f"✅ Entered container number: {container_number}")
            
            # Find and click the search button
            submit_button = self.wait.until(
                EC.element_to_be_clickable((By.ID, "submit"))
            )
            submit_button.click()
            self.logger.info("✅ Clicked search button")
            
            # Wait for the results page to load
            time.sleep(5)  # Allow page to fully load
            
            # Check if results are loaded by waiting for page content
            self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
            
            # Generate PDF of the results page
            pdf_filename = f"{index:03d}_{container_number}_tracking.pdf"
            pdf_path = os.path.join("results", "pdfs", pdf_filename)
            
            # Generate PDF using Chrome DevTools Protocol
            pdf_data = self.driver.execute_cdp_cmd("Page.printToPDF", {
                "format": "A4",
                "printBackground": True,
                "marginTop": 0.4,
                "marginBottom": 0.4,
                "marginLeft": 0.4,
                "marginRight": 0.4
            })
            
            with open(pdf_path, "wb") as f:
                f.write(base64.b64decode(pdf_data['data']))
            
            self.logger.info(f"✅ Saved PDF for {container_number}: {pdf_filename}")
            
            # Record successful result
            self.results.append({
                'container_number': container_number,
                'status': 'success',
                'pdf_file': pdf_filename,
                'timestamp': datetime.now().isoformat()
            })
            
            return pdf_filename
            
        except Exception as e:
            self.logger.error(f"❌ Error processing container {container_number}: {str(e)}")
            self.results.append({
                'container_number': container_number,
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            })
            return None
            
    def read_container_numbers_from_file(self, file_path):
        """Read container numbers from CSV or Excel file"""
        try:
            self.logger.info(f"📋 Reading container numbers from file...")
            self.logger.info(f"📁 File path: {file_path}")
            
            # Auto-detect file type
            ext = os.path.splitext(file_path)[1].lower()
            self.logger.info(f"📄 File extension detected: {ext}")
            
            if ext == ".csv":
                self.logger.info("📊 Reading as CSV file...")
                df = pd.read_csv(file_path)
            elif ext in [".xls", ".xlsx"]:
                self.logger.info("📊 Reading as Excel file...")
                df = pd.read_excel(file_path)
            else:
                raise ValueError(f"Unsupported file type: {ext}. Please use .csv or .xlsx")
            
            self.logger.info(f"📊 File loaded successfully with {len(df)} rows")
            self.logger.info(f"📋 Columns found: {list(df.columns)}")
            
            # Look for container column (flexible column names)
            container_column = None
            possible_columns = ['container_number', 'container number', 'container', 'number', 'tracking', 'reference']
            
            for col in df.columns:
                col_lower = col.lower().strip()
                if col_lower in possible_columns or any(term in col_lower for term in ['container', 'number', 'tracking']):
                    container_column = col
                    break
                    
            if container_column is None:
                # If no specific column found, use first column
                container_column = df.columns[0]
                self.logger.warning(f"⚠️ No container column found, using first column: {container_column}")
            else:
                self.logger.info(f"📋 Using column: {container_column}")
            
            # Get the data from the column
            column_data = df[container_column].dropna()
            self.logger.info(f"📊 Raw column data: {column_data.tolist()}")
            
            # Convert to string and clean up
            container_numbers = column_data.astype(str).tolist()
            
            # Remove any empty strings or whitespace-only entries
            container_numbers = [container.strip() for container in container_numbers if container.strip()]
            
            # Remove 'nan' values that might come from pandas
            container_numbers = [container for container in container_numbers if container.lower() != 'nan']
            
            # Log the actual container numbers being processed
            self.logger.info(f"📊 Container numbers to process:")
            for i, container in enumerate(container_numbers, 1):
                self.logger.info(f"   {i}. {container}")
            
            self.logger.info(f"📊 Found {len(container_numbers)} container numbers to process")
            
            return container_numbers
            
        except Exception as e:
            self.logger.error(f"❌ Failed to read file: {str(e)}")
            self.logger.error(f"❌ File path was: {file_path}")
            self.logger.error(f"❌ File exists: {os.path.exists(file_path)}")
            return []
            
    def process_all_containers(self, container_numbers):
        """Process all container numbers"""
        successful_pdfs = []
        failed_containers = []
        
        for i, container in enumerate(container_numbers, start=1):
            self.logger.info(f"🔍 Processing container number {i}/{len(container_numbers)}: {container}")
            
            pdf_filename = self.process_container_number(container, i)
            
            if pdf_filename:
                successful_pdfs.append(pdf_filename)
            else:
                failed_containers.append(container)
                
            # Wait between requests to avoid rate limiting
            time.sleep(3)
                
        return successful_pdfs, failed_containers
        
    def generate_combined_report(self, successful_pdfs):
        """Generate combined PDF report"""
        try:
            if not successful_pdfs:
                return None
                
            self.logger.info("📦 Combining all PDFs into a single report...")
            
            # Create combined report filename
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            combined_filename = f"ctg_port_tracking_report_{timestamp}.pdf"
            combined_path = os.path.join("results", combined_filename)
            
            # Try to combine PDFs using PyPDF2
            try:
                from PyPDF2 import PdfMerger
                
                merger = PdfMerger()
                
                for pdf_filename in successful_pdfs:
                    pdf_path = os.path.join("results", "pdfs", pdf_filename)
                    if os.path.exists(pdf_path):
                        merger.append(pdf_path)
                        self.logger.info(f"📄 Added {pdf_filename} to combined report")
                
                merger.write(combined_path)
                merger.close()
                
                self.logger.info(f"✅ Combined {len(successful_pdfs)} PDFs into single report")
                
            except ImportError:
                # Fallback: copy first PDF if PyPDF2 not available
                self.logger.warning("⚠️ PyPDF2 not available, using first PDF as combined report")
                if successful_pdfs:
                    import shutil
                    first_pdf_path = os.path.join("results", "pdfs", successful_pdfs[0])
                    shutil.copy2(first_pdf_path, combined_path)
                
            self.logger.info(f"💾 Combined report saved: {combined_filename}")
            return combined_filename
            
        except Exception as e:
            self.logger.error(f"❌ Failed to generate combined report: {str(e)}")
            return None
        
    def generate_summary_report(self, successful_pdfs, failed_containers):
        """Generate summary report and log file"""
        try:
            self.logger.info("📊 Generating summary report...")
            
            # Generate timestamp
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            # Create automation log file
            log_filename = f"ctg_port_automation_log_{timestamp}.txt"
            log_path = os.path.join("results", log_filename)
            
            with open(log_path, 'w') as f:
                f.write("=== CTG PORT AUTHORITY TRACKING AUTOMATION LOG ===\n")
                f.write(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write(f"Total Processed: {len(self.results)}\n")
                f.write(f"Successful: {len(successful_pdfs)}\n")
                f.write(f"Failed: {len(failed_containers)}\n")
                f.write(f"Success Rate: {(len(successful_pdfs) / len(self.results) * 100):.1f}%\n\n")
                
                f.write("=== SUCCESSFUL PDFS ===\n")
                for pdf in successful_pdfs:
                    f.write(f"✅ {pdf}\n")
                
                f.write("\n=== FAILED CONTAINERS ===\n")
                for container in failed_containers:
                    f.write(f"❌ {container}\n")
                
                f.write("\n=== DETAILED RESULTS ===\n")
                for result in self.results:
                    f.write(f"Container: {result['container_number']} | Status: {result['status']} | Time: {result['timestamp']}\n")
                    if 'error' in result:
                        f.write(f"   Error: {result['error']}\n")
            
            # Generate JSON summary
            summary_filename = f"ctg_port_tracking_summary_{timestamp}.json"
            summary_path = os.path.join("results", summary_filename)
            
            summary_data = {
                'timestamp': datetime.now().isoformat(),
                'total_processed': len(self.results),
                'successful': len(successful_pdfs),
                'failed': len(failed_containers),
                'success_rate': f"{(len(successful_pdfs) / len(self.results) * 100):.1f}%" if self.results else "0%",
                'successful_pdfs': successful_pdfs,
                'failed_containers': failed_containers,
                'detailed_results': self.results
            }
            
            with open(summary_path, 'w') as f:
                json.dump(summary_data, f, indent=2)
                
            self.logger.info(f"📋 Summary report saved: {summary_filename}")
            self.logger.info(f"📋 Log file saved: {log_filename}")
            
            return [log_filename, summary_filename]
            
        except Exception as e:
            self.logger.error(f"❌ Failed to generate summary report: {str(e)}")
            return []
            
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
            self.logger.info("🚀 Starting CTG Port Authority tracking automation...")
            
            # Setup WebDriver
            if not self.setup_driver():
                return False
                
            # Navigate to CTG Port Authority portal
            if not self.navigate_to_portal():
                return False
            
            # Read container numbers from file
            container_numbers = self.read_container_numbers_from_file(file_path)
            if not container_numbers:
                self.logger.error("❌ No container numbers found in file")
                return False
                
            # Process all containers
            successful_pdfs, failed_containers = self.process_all_containers(container_numbers)
            
            # Generate combined report
            combined_report = self.generate_combined_report(successful_pdfs)
            
            # Generate summary and log files
            summary_files = self.generate_summary_report(successful_pdfs, failed_containers)
            
            # Prepare final result files list
            result_files = []
            if combined_report:
                result_files.append(combined_report)
            result_files.extend(successful_pdfs)
            result_files.extend(summary_files)
            
            # Log final results
            self.logger.info("🎉 CTG Port Authority tracking automation completed successfully!")
            self.logger.info(f"📊 Total processed: {len(container_numbers)}")
            self.logger.info(f"✅ Successful: {len(successful_pdfs)}")
            self.logger.info(f"❌ Failed: {len(failed_containers)}")
            
            if successful_pdfs:
                self.logger.info("📄 Generated PDF files:")
                for pdf in successful_pdfs:
                    self.logger.info(f"   - {pdf}")
                    
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Automation failed: {str(e)}")
            return False
        finally:
            self.cleanup()

def main():
    """Main function for command line usage"""
    if len(sys.argv) < 2:
        print("Usage: python ctg_port_tracking.py <file_path> [--headless]")
        print("Supported file types: .csv, .xlsx, .xls")
        sys.exit(1)
        
    file_path = sys.argv[1]
    headless = '--headless' in sys.argv or '--no-gui' in sys.argv
    
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        sys.exit(1)
    
    automation = CtgPortTrackingAutomation(headless=headless)
    success = automation.run_automation(file_path, headless)
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()