#!/usr/bin/env python3
"""
Nameh.me Backend API Testing Suite
Tests all API endpoints with demo credentials and validates responses
"""

import requests
import sys
import json
from datetime import datetime

class NamehAPITester:
    def __init__(self, base_url="https://d87fc225-204e-4eef-a790-f719f7a652ee.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.demo_email = "demo@nameh.me"
        self.demo_password = "demo123"

    def log(self, message, status="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {status}: {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        self.log(f"Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code}", "PASS")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}", "FAIL")
                try:
                    error_detail = response.json()
                    self.log(f"   Error details: {error_detail}", "ERROR")
                except:
                    self.log(f"   Response text: {response.text[:200]}", "ERROR")
                return False, {}

        except requests.exceptions.Timeout:
            self.log(f"❌ {name} - Request timeout", "FAIL")
            return False, {}
        except Exception as e:
            self.log(f"❌ {name} - Error: {str(e)}", "FAIL")
            return False, {}

    def test_health_endpoints(self):
        """Test health check endpoints"""
        self.log("=== Testing Health Endpoints ===")
        
        success, response = self.run_test("Health Check", "GET", "api/health", 200)
        if success:
            if response.get("status") == "healthy":
                self.log("   Health status is healthy", "INFO")
            else:
                self.log(f"   Unexpected health status: {response.get('status')}", "WARN")
        
        self.run_test("Liveness Check", "GET", "api/health/live", 200)

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        self.log("=== Testing Authentication ===")
        
        # Test login with demo credentials
        success, response = self.run_test(
            "Demo Login", 
            "POST", 
            "api/auth/login", 
            200,
            data={"login": self.demo_email, "password": self.demo_password}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response.get('user_id')
            self.log(f"   Obtained JWT token for user: {response.get('username')}", "INFO")
        else:
            self.log("   Failed to obtain JWT token", "ERROR")
            return False

        # Test invalid login
        self.run_test(
            "Invalid Login", 
            "POST", 
            "api/auth/login", 
            401,
            data={"login": "invalid@test.com", "password": "wrongpass"}
        )

        # Test registration with new user
        test_email = f"test_{datetime.now().strftime('%H%M%S')}@nameh.me"
        success, reg_response = self.run_test(
            "User Registration", 
            "POST", 
            "api/auth/register", 
            200,
            data={
                "email": test_email,
                "username": f"testuser_{datetime.now().strftime('%H%M%S')}",
                "password": "TestPass123!",
                "display_name": "Test User"
            }
        )
        
        if success and 'access_token' in reg_response:
            self.log(f"   Registration successful for: {test_email}", "INFO")
        
        return True

    def test_user_endpoints(self):
        """Test user profile endpoints"""
        self.log("=== Testing User Endpoints ===")
        
        if not self.token:
            self.log("No auth token available, skipping user tests", "SKIP")
            return False

        # Test get profile
        success, profile = self.run_test("Get User Profile", "GET", "api/users/me", 200)
        if success:
            self.log(f"   Profile: {profile.get('email')} ({profile.get('display_name')})", "INFO")

        # Test update profile
        self.run_test(
            "Update Profile", 
            "PATCH", 
            "api/users/me", 
            200,
            data={"display_name": "Updated Demo User"}
        )
        
        return True

    def test_mail_endpoints(self):
        """Test mail-related endpoints"""
        self.log("=== Testing Mail Endpoints ===")
        
        if not self.token:
            self.log("No auth token available, skipping mail tests", "SKIP")
            return False

        # Test get folders
        success, folders_data = self.run_test("Get Mail Folders", "GET", "api/mail/folders", 200)
        if success and 'folders' in folders_data:
            folder_names = [f['name'] for f in folders_data['folders']]
            self.log(f"   Available folders: {folder_names}", "INFO")
            
            # Check for expected folders
            expected_folders = ['inbox', 'sent', 'drafts', 'trash', 'spam']
            for folder in expected_folders:
                if folder in folder_names:
                    folder_info = next(f for f in folders_data['folders'] if f['name'] == folder)
                    self.log(f"   {folder}: {folder_info['total']} total, {folder_info['unread']} unread", "INFO")

        # Test get inbox emails
        success, emails_data = self.run_test("Get Inbox Emails", "GET", "api/mail/emails?folder=inbox", 200)
        email_id = None
        if success and 'emails' in emails_data:
            emails = emails_data['emails']
            self.log(f"   Found {len(emails)} emails in inbox", "INFO")
            if emails:
                email_id = emails[0]['id']
                self.log(f"   First email: '{emails[0]['subject']}'", "INFO")

        # Test get specific email
        if email_id:
            success, email_detail = self.run_test(f"Get Email Details", "GET", f"api/mail/emails/{email_id}", 200)
            if success:
                self.log(f"   Email body length: {len(email_detail.get('body', ''))}", "INFO")

        # Test email actions
        if email_id:
            self.run_test("Star Email", "POST", f"api/mail/emails/{email_id}/action", 200, 
                         data={"action": "star"})
            self.run_test("Unstar Email", "POST", f"api/mail/emails/{email_id}/action", 200, 
                         data={"action": "unstar"})
            self.run_test("Mark Read", "POST", f"api/mail/emails/{email_id}/action", 200, 
                         data={"action": "read"})

        # Test other folders
        for folder in ['sent', 'drafts', 'spam']:
            self.run_test(f"Get {folder.title()} Emails", "GET", f"api/mail/emails?folder={folder}", 200)

        # Test search functionality
        self.run_test("Search Emails", "GET", "api/mail/emails?folder=inbox&search=welcome", 200)

        # Test compose email
        success, compose_result = self.run_test(
            "Compose Email", 
            "POST", 
            "api/mail/compose", 
            200,
            data={
                "to": ["test@example.com"],
                "subject": "Test Email from API",
                "body": "<p>This is a test email sent via API.</p>",
                "folder": "sent"
            }
        )
        if success:
            self.log(f"   Composed email ID: {compose_result.get('id')}", "INFO")

        # Test mail status
        self.run_test("Mail Status", "GET", "api/mail/status", 200)
        
        return True

    def run_all_tests(self):
        """Run all test suites"""
        self.log("Starting Nameh.me API Test Suite")
        self.log(f"Testing against: {self.base_url}")
        
        # Run test suites
        self.test_health_endpoints()
        
        if self.test_auth_endpoints():
            self.test_user_endpoints()
            self.test_mail_endpoints()
        else:
            self.log("Authentication failed, skipping authenticated tests", "ERROR")

        # Print final results
        self.log("=== Test Results ===")
        self.log(f"Tests run: {self.tests_run}")
        self.log(f"Tests passed: {self.tests_passed}")
        self.log(f"Tests failed: {self.tests_run - self.tests_passed}")
        self.log(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = NamehAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())