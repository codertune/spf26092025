#!/usr/bin/env python3
"""
Damco (APM) Tracking for Incentive - Maersk Portal Automation
Automates the process of tracking FCR numbers through Maersk portal and generating PDF reports
"""

import os
import sys
import time
import logging
import pandas as pd
import base64
import openpyxl  # For Excel file support
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import json

class DamcoTrackingAutomation:
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
            
        log_filename = f"damco_tracking_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
        log_path = os.path.join(log_dir, log_filename)
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_path),
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger('DamcoTrackingMaersk')
        
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
            
    def navigate_to_maersk(self):
        """Navigate to Maersk tracking portal"""
        try:
            self.logger.info("🌐 Navigating to Maersk tracking portal...")
            self.driver.get("https://www.maersk.com/mymaersk-scm-track/")
            
            # Wait for page to load
            self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
            self.logger.info("📍 Successfully navigated to Maersk portal")
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Failed to navigate to Maersk portal: {str(e)}")
            return False
            
    def accept_cookies(self):
        """Handle cookie consent popup"""
        try:
            self.logger.info("🍪 Handling cookie consent popup...")
            
            # Wait for and click "Allow all" button
            allow_btn = self.wait.until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "button[data-test='coi-allow-all-button']"))
            )
            allow_btn.click()
            self.logger.info("✅ Accepted cookies")
            
            # Wait a moment for the popup to disappear
            time.sleep(2)
            return True
            
        except TimeoutException:
            self.logger.warning("⚠️ No cookie banner found")
            return True
        except Exception as e:
            self.logger.error(f"❌ Failed to handle cookie consent: {str(e)}")
            return False
            
    def close_coach_popup(self):
        """Handle welcome coach popup"""
        try:
            self.logger.info("👋 Dismissing welcome coach popup...")
            
            # Wait for and click "Got it" button
            got_it_btn = self.wait.until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "button[data-test='finishButton']"))
            )
            got_it_btn.click()
            self.logger.info("✅ Closed coach popup")
            
            # Wait a moment for the popup to disappear
            time.sleep(2)
            return True
            
        except TimeoutException:
            self.logger.warning("⚠️ No coach popup found")
            return True
        except Exception as e:
            self.logger.error(f"❌ Failed to handle coach popup: {str(e)}")
            return False
            
    def process_booking(self, booking_number, index):
        """Process a single booking number"""
        try:
            self.logger.info(f"🔍 Processing FCR number {index}: {booking_number}")
            
            # Input booking number
            input_box = self.wait.until(EC.presence_of_element_located((By.ID, "formInput")))
            input_box.clear()
            input_box.send_keys(booking_number)
            self.logger.info(f"✅ Entered booking number: {booking_number}")
            
            # Submit search
            submit_btn = self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button[data-test='form-input-button']")))
            self.driver.execute_script("arguments[0].click();", submit_btn)
            self.logger.info("✅ Clicked submit button")
            
            # Wait for iframe to load and switch to it
            self.wait.until(EC.frame_to_be_available_and_switch_to_it((By.ID, "damco-track")))
            
            # Click FCR link
            fcr_link = self.wait.until(EC.element_to_be_clickable(
                (By.XPATH, f"//div[@id='fcr_by_fcr_number']//a[contains(text(), '{booking_number}')]")
            ))
            fcr_link.click()
            self.logger.info(f"✅ Clicked FCR link for {booking_number}")
            
            # Allow page to fully load
            time.sleep(5)
            
            # Save page as PDF using Chrome DevTools Protocol
            pdf_filename = f"{index:03d}_{booking_number}_tracking.pdf"
            pdf_path = os.path.join("results", "pdfs", pdf_filename)
            
            # Generate PDF
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
            
            self.logger.info(f"✅ Saved PDF for {booking_number}: {pdf_filename}")
            
            # Record successful result
            self.results.append({
                'fcr_number': booking_number,
                'status': 'success',
                'pdf_file': pdf_filename,
                'timestamp': datetime.now().isoformat()
            })
            
            return pdf_filename
            
        except Exception as e:
            self.logger.error(f"❌ Error processing FCR {booking_number}: {str(e)}")
            self.results.append({
                'fcr_number': booking_number,
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            })
            return None
            
        finally:
            # Always switch back to default content
            self.driver.switch_to.default_content()
            
    def read_booking_numbers_from_file(self, file_path):
        """Read booking numbers from CSV or Excel file"""
        try:
            self.logger.info(f"📋 Reading FCR numbers from file...")
            self.logger.info(f"📁 File path: {file_path}")
            
            # Auto-detect file type
            ext = os.path.splitext(file_path)[1].lower()
            self.logger.info(f"📄 File extension detected: {ext}")
            
            if ext == ".csv":
                self.logger.info("📊 Reading as CSV file...")
                df = pd.read_csv(file_path)
            elif ext in [".xls", ".xlsx"]:
                self.logger.info("📊 Reading as Excel file...")
                # Try different engines for Excel files
                try:
                    df = pd.read_excel(file_path, engine='openpyxl')
                except Exception as e:
                    self.logger.warning(f"⚠️ openpyxl failed, trying xlrd: {e}")
                    df = pd.read_excel(file_path, engine='xlrd')
                df = pd.read_excel(file_path)
            else:
                raise ValueError(f"Unsupported file type: {ext}. Please use .csv or .xlsx")
            
            self.logger.info(f"📊 File loaded successfully with {len(df)} rows")
            self.logger.info(f"📋 Columns found: {list(df.columns)}")
            
            # Look for booking/FCR column (flexible column names)
            booking_column = None
            possible_columns = ['booking_number', 'fcr_number', 'fcr number', 'fcr', 'booking', 'reference', 'container', 'number']
            
            for col in df.columns:
                col_lower = col.lower().strip()
                if col_lower in possible_columns or any(term in col_lower for term in ['fcr', 'booking', 'reference', 'number']):
                    booking_column = col
                    break
                    
            if booking_column is None:
                # If no specific column found, use first column
                booking_column = df.columns[0]
                self.logger.warning(f"⚠️ No FCR column found, using first column: {booking_column}")
            else:
                self.logger.info(f"📋 Using column: {booking_column}")
            
            # Get the data from the column
            column_data = df[booking_column].dropna()
            self.logger.info(f"📊 Raw column data: {column_data.tolist()}")
            
            # Convert to string and clean up
            booking_numbers = column_data.astype(str).tolist()
            
            # Remove any empty strings or whitespace-only entries
            booking_numbers = [fcr.strip() for fcr in booking_numbers if fcr.strip()]
            
            # Remove 'nan' values that might come from pandas
            booking_numbers = [fcr for fcr in booking_numbers if fcr.lower() != 'nan']
            
            # Log the actual FCR numbers being processed
            self.logger.info(f"📊 FCR numbers to process:")
            for i, fcr in enumerate(booking_numbers, 1):
                self.logger.info(f"   {i}. {fcr}")
            
            self.logger.info(f"📊 Found {len(booking_numbers)} FCR numbers to process")
            
            return booking_numbers
            
        except Exception as e:
            self.logger.error(f"❌ Failed to read file: {str(e)}")
            self.logger.error(f"❌ File path was: {file_path}")
            self.logger.error(f"❌ File exists: {os.path.exists(file_path)}")
            return []
            
    def process_all_bookings(self, booking_numbers):
        """Process all booking numbers"""
        successful_pdfs = []
        failed_bookings = []
        
        for i, booking in enumerate(booking_numbers, start=1):
            self.logger.info(f"🔍 Processing FCR number {i}/{len(booking_numbers)}: {booking}")
            
            pdf_filename = self.process_booking(booking, i)
            
            if pdf_filename:
                successful_pdfs.append(pdf_filename)
            else:
                failed_bookings.append(booking)
                
            # Wait between requests to avoid rate limiting
            time.sleep(2)
                
        return successful_pdfs, failed_bookings
        
    def generate_combined_report(self, successful_pdfs):
        """Generate combined PDF report"""
        try:
            if not successful_pdfs:
                return None
                
            self.logger.info("📦 Combining all PDFs into a single report...")
            
            # Create combined report filename
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            combined_filename = f"damco_tracking_report_{timestamp}.pdf"
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
        
    def generate_summary_report(self, successful_pdfs, failed_bookings):
        """Generate summary report and log file"""
        try:
            self.logger.info("📊 Generating summary report...")
            
            # Generate timestamp
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            # Create automation log file
            log_filename = f"automation_log_{timestamp}.txt"
            log_path = os.path.join("results", log_filename)
            
            with open(log_path, 'w') as f:
                f.write("=== DAMCO TRACKING AUTOMATION LOG ===\n")
                f.write(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write(f"Total Processed: {len(self.results)}\n")
                f.write(f"Successful: {len(successful_pdfs)}\n")
                f.write(f"Failed: {len(failed_bookings)}\n")
                f.write(f"Success Rate: {(len(successful_pdfs) / len(self.results) * 100):.1f}%\n\n")
                
                f.write("=== SUCCESSFUL PDFS ===\n")
                for pdf in successful_pdfs:
                    f.write(f"✅ {pdf}\n")
                
                f.write("\n=== FAILED BOOKINGS ===\n")
                for booking in failed_bookings:
                    f.write(f"❌ {booking}\n")
                
                f.write("\n=== DETAILED RESULTS ===\n")
                for result in self.results:
                    f.write(f"FCR: {result['fcr_number']} | Status: {result['status']} | Time: {result['timestamp']}\n")
                    if 'error' in result:
                        f.write(f"   Error: {result['error']}\n")
            
            # Generate JSON summary
            summary_filename = f"damco_tracking_summary_{timestamp}.json"
            summary_path = os.path.join("results", summary_filename)
            
            summary_data = {
                'timestamp': datetime.now().isoformat(),
                'total_processed': len(self.results),
                'successful': len(successful_pdfs),
                'failed': len(failed_bookings),
                'success_rate': f"{(len(successful_pdfs) / len(self.results) * 100):.1f}%" if self.results else "0%",
                'successful_pdfs': successful_pdfs,
                'failed_bookings': failed_bookings,
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
            self.logger.info("🚀 Starting Damco tracking automation...")
            
            # Setup WebDriver
            if not self.setup_driver():
                return False
                
            # Navigate to Maersk portal
            if not self.navigate_to_maersk():
                return False
                
            # Handle cookie consent and coach popup ONCE
            self.accept_cookies()
            self.close_coach_popup()
            
            # Read booking numbers from file
            booking_numbers = self.read_booking_numbers_from_file(file_path)
            if not booking_numbers:
                self.logger.error("❌ No booking numbers found in file")
                return False
                
            # Process all bookings
            successful_pdfs, failed_bookings = self.process_all_bookings(booking_numbers)
            
            # Generate combined report
            combined_report = self.generate_combined_report(successful_pdfs)
            
            # Generate summary and log files
            summary_files = self.generate_summary_report(successful_pdfs, failed_bookings)
            
            # Prepare final result files list
            result_files = []
            if combined_report:
                result_files.append(combined_report)
            result_files.extend(successful_pdfs)
            result_files.extend(summary_files)
            
            # Log final results
            self.logger.info("🎉 Damco tracking automation completed successfully!")
            self.logger.info(f"📊 Total processed: {len(booking_numbers)}")
            self.logger.info(f"✅ Successful: {len(successful_pdfs)}")
            self.logger.info(f"❌ Failed: {len(failed_bookings)}")
            
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
        print("Usage: python damco_tracking_maersk.py <file_path> [--headless]")
        print("Supported file types: .csv, .xlsx, .xls")
        sys.exit(1)
        
    file_path = sys.argv[1]
    headless = '--headless' in sys.argv or '--no-gui' in sys.argv
    
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        sys.exit(1)
    
    automation = DamcoTrackingAutomation(headless=headless)
    success = automation.run_automation(file_path, headless)
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()