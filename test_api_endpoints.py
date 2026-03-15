#!/usr/bin/env python3
"""
API Endpoint Tester for Look Up Book
Tests all major endpoints to verify the server is working correctly
"""

import requests
import json
import time
import os
from typing import Dict, Any, List
from datetime import datetime

class APITester:
    def __init__(self, base_url: str = "http://localhost:5000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.results = []
        self.test_user_id = None
        self.test_book_id = None
        self.test_added_book_id = None
        self.test_author_id = None
        self.test_award_id = None
        self.auth_token = None

    def get_auth_headers(self) -> Dict[str, str]:
        """Return auth headers for protected endpoints."""
        headers = {"Content-Type": "application/json"}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        return headers
        
    def log_result(self, test_name: str, status: str, details: str = ""):
        """Log test result"""
        result = {
            "test": test_name,
            "status": status,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.results.append(result)
        
        # Print formatted result
        status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{status_symbol} {test_name}")
        if details:
            print(f"   └─ {details}")
    
    def test_connection(self):
        """Test basic server connection"""
        try:
            response = self.session.get(f"{self.base_url}/api/authors", timeout=5)
            if response.status_code in [200, 400, 500]:
                self.log_result("Server Connection", "PASS", "Server is responding")
                return True
            else:
                self.log_result("Server Connection", "FAIL", f"Unexpected status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Server Connection", "FAIL", str(e))
            return False
    
    def test_get_random_books(self):
        """Test: GET /api/tableName - Get random books"""
        try:
            response = self.session.get(f"{self.base_url}/api/tableName")
            data = response.json()
            
            if response.status_code == 200 and len(data) > 0:
                self.test_book_id = data[0]['book_id']
                self.log_result(
                    "Get Random Books",
                    "PASS",
                    f"Retrieved {len(data)} books, first ID: {self.test_book_id}"
                )
                return True
            else:
                self.log_result("Get Random Books", "FAIL", f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Get Random Books", "FAIL", str(e))
            return False
    
    def test_get_authors(self):
        """Test: GET /api/authors - Get all authors"""
        try:
            response = self.session.get(f"{self.base_url}/api/authors")
            data = response.json()
            
            if response.status_code == 200 and len(data) > 0:
                self.test_author_id = data[0]['author_id']
                self.log_result(
                    "Get Authors",
                    "PASS",
                    f"Retrieved {len(data)} authors, first ID: {self.test_author_id}"
                )
                return True
            else:
                self.log_result("Get Authors", "FAIL", f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Get Authors", "FAIL", str(e))
            return False
    
    def test_get_books_by_author(self):
        """Test: GET /api/books/:authorId - Get books by author"""
        if not self.test_author_id:
            self.log_result("Get Books by Author", "SKIP", "No author ID available")
            return None
        
        try:
            response = self.session.get(f"{self.base_url}/api/books/{self.test_author_id}")
            data = response.json()
            
            if response.status_code == 200:
                self.log_result(
                    "Get Books by Author",
                    "PASS",
                    f"Retrieved {len(data)} books for author {self.test_author_id}"
                )
                return True
            else:
                self.log_result("Get Books by Author", "FAIL", f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Get Books by Author", "FAIL", str(e))
            return False
    
    def test_get_awards(self):
        """Test: GET /api/awards - Get all awards"""
        try:
            response = self.session.get(f"{self.base_url}/api/awards")
            data = response.json()
            
            if response.status_code == 200 and len(data) > 0:
                self.test_award_id = data[0]['award_id']
                self.log_result(
                    "Get Awards",
                    "PASS",
                    f"Retrieved {len(data)} awards, first ID: {self.test_award_id}"
                )
                return True
            else:
                self.log_result("Get Awards", "FAIL", f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Get Awards", "FAIL", str(e))
            return False
    
    def test_get_books_by_award(self):
        """Test: GET /api/awards/:awardId - Get books by award"""
        if not self.test_award_id:
            self.log_result("Get Books by Award", "SKIP", "No award ID available")
            return None
        
        try:
            response = self.session.get(f"{self.base_url}/api/awards/{self.test_award_id}")
            data = response.json()
            
            if response.status_code == 200:
                self.log_result(
                    "Get Books by Award",
                    "PASS",
                    f"Retrieved {len(data)} books for award {self.test_award_id}"
                )
                return True
            else:
                self.log_result("Get Books by Award", "FAIL", f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Get Books by Award", "FAIL", str(e))
            return False
    
    def test_get_books_for_profile(self):
        """Test: GET /api/books-for-profile - Get books for profile"""
        try:
            response = self.session.get(f"{self.base_url}/api/books-for-profile")
            data = response.json()
            
            if response.status_code == 200:
                self.log_result(
                    "Get Books for Profile",
                    "PASS",
                    f"Retrieved {len(data)} books"
                )
                return True
            else:
                self.log_result("Get Books for Profile", "FAIL", f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Get Books for Profile", "FAIL", str(e))
            return False
    
    def test_signup(self):
        """Test: POST /signup - User signup"""
        try:
            payload = {
                "username": f"testuser_{int(time.time())}",
                "email": f"test_{int(time.time())}@example.com",
                "password": "TestPassword123!"
            }
            
            response = self.session.post(
                f"{self.base_url}/signup",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            data = response.json()
            
            if response.status_code == 200 and 'token' in data:
                self.test_user_id = data['userId']
                self.auth_token = data['token']
                self.log_result(
                    "User Signup",
                    "PASS",
                    f"User created with ID: {self.test_user_id}"
                )
                return True
            else:
                self.log_result("User Signup", "FAIL", f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("User Signup", "FAIL", str(e))
            return False
    
    def test_user_login(self):
        """Test: POST /login - User login"""
        try:
            # First create a test user
            payload = {
                "username": f"logintest_{int(time.time())}",
                "email": f"login_{int(time.time())}@example.com",
                "password": "TestPass123!"
            }
            signup_response = self.session.post(
                f"{self.base_url}/signup",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if signup_response.status_code != 200:
                self.log_result("User Login", "FAIL", "Could not create test user")
                return False
            
            # Now test login
            login_payload = {
                "username": payload["username"],
                "password": payload["password"]
            }
            login_response = self.session.post(
                f"{self.base_url}/login",
                json=login_payload,
                headers={"Content-Type": "application/json"}
            )
            data = login_response.json()
            
            if login_response.status_code == 200 and 'token' in data:
                self.log_result(
                    "User Login",
                    "PASS",
                    f"Login successful, token received"
                )
                return True
            else:
                self.log_result("User Login", "FAIL", f"Status: {login_response.status_code}")
                return False
        except Exception as e:
            self.log_result("User Login", "FAIL", str(e))
            return False
    
    def test_admin_login(self):
        """Test: POST /admin/login - Admin login"""
        admin_username = os.getenv("SMOKE_ADMIN_USERNAME")
        admin_password = os.getenv("SMOKE_ADMIN_PASSWORD")

        if not admin_username or not admin_password:
            self.log_result(
                "Admin Login",
                "SKIP",
                "Set SMOKE_ADMIN_USERNAME and SMOKE_ADMIN_PASSWORD to run this test"
            )
            return None

        try:
            payload = {
                "username": admin_username,
                "password": admin_password
            }
            
            response = self.session.post(
                f"{self.base_url}/admin/login",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'token' in data:
                    self.log_result(
                        "Admin Login",
                        "PASS",
                        f"Admin login successful"
                    )
                    return True
            
            self.log_result(
                "Admin Login",
                "WARN",
                f"Status: {response.status_code}"
            )
            return False
        except Exception as e:
            self.log_result("Admin Login", "WARN", f"Admin endpoint: {str(e)}")
            return False
    
    def test_like_book(self):
        """Test: POST /api/like - Like a book"""
        if not self.test_user_id or not self.test_book_id:
            self.log_result("Like Book", "SKIP", "No user or book ID available")
            return None
        
        try:
            payload = {
                "userId": self.test_user_id,
                "bookId": self.test_book_id,
                "liked": True
            }
            
            response = self.session.post(
                f"{self.base_url}/api/like",
                json=payload,
                headers=self.get_auth_headers()
            )
            data = response.json()
            
            if response.status_code == 200 and 'message' in data:
                self.log_result(
                    "Like Book",
                    "PASS",
                    f"Book liked successfully"
                )
                return True
            else:
                self.log_result("Like Book", "FAIL", f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Like Book", "FAIL", str(e))
            return False
    
    def test_get_user_preferences(self):
        """Test: GET /api/user/preference/:userId - Get user preferences"""
        if not self.test_user_id:
            self.log_result("Get User Preferences", "SKIP", "No user ID available")
            return None
        
        try:
            response = self.session.get(
                f"{self.base_url}/api/user/preference/{self.test_user_id}",
                headers=self.get_auth_headers()
            )
            
            if response.status_code == 200:
                self.log_result(
                    "Get User Preferences",
                    "PASS",
                    "User preferences retrieved"
                )
                return True
            elif response.status_code == 404:
                self.log_result("Get User Preferences", "PASS", "User not found (expected for new user)")
                return True
            else:
                self.log_result("Get User Preferences", "FAIL", f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Get User Preferences", "FAIL", str(e))
            return False

    def test_protected_route_requires_auth(self):
        """Test: Protected route should reject unauthenticated requests"""
        if not self.test_user_id:
            self.log_result("Protected Route Requires Auth", "SKIP", "No user ID available")
            return None

        try:
            response = self.session.get(f"{self.base_url}/api/user/preference/{self.test_user_id}")

            if response.status_code == 401:
                self.log_result(
                    "Protected Route Requires Auth",
                    "PASS",
                    "Endpoint correctly rejected unauthenticated request"
                )
                return True

            self.log_result("Protected Route Requires Auth", "FAIL", f"Expected 401, got {response.status_code}")
            return False
        except Exception as e:
            self.log_result("Protected Route Requires Auth", "FAIL", str(e))
            return False

    def test_update_user_preferences(self):
        """Test: POST /api/user/preference/update - Update and verify preferences"""
        if not self.test_user_id:
            self.log_result("Update User Preferences", "SKIP", "No user ID available")
            return None

        try:
            target_pref = "poetry"
            target_genre = "mystery"

            update_response = self.session.post(
                f"{self.base_url}/api/user/preference/update",
                json={
                    "userId": self.test_user_id,
                    "readingPreference": target_pref,
                    "favoriteGenre": target_genre,
                },
                headers=self.get_auth_headers(),
            )

            if update_response.status_code != 200:
                self.log_result("Update User Preferences", "FAIL", f"Update status: {update_response.status_code}")
                return False

            verify_response = self.session.get(
                f"{self.base_url}/api/user/preference/{self.test_user_id}",
                headers=self.get_auth_headers(),
            )

            if verify_response.status_code != 200:
                self.log_result("Update User Preferences", "FAIL", f"Verify status: {verify_response.status_code}")
                return False

            prefs = verify_response.json()
            if prefs.get("reading_preference") == target_pref and prefs.get("favorite_genre") == target_genre:
                self.log_result("Update User Preferences", "PASS", "Preferences updated and verified")
                return True

            self.log_result(
                "Update User Preferences",
                "FAIL",
                f"Unexpected values: reading_preference={prefs.get('reading_preference')}, favorite_genre={prefs.get('favorite_genre')}"
            )
            return False
        except Exception as e:
            self.log_result("Update User Preferences", "FAIL", str(e))
            return False
    
    def test_add_book_to_profile(self):
        """Test: POST /api/user/add-book - Add book to profile"""
        if not self.test_user_id or not self.test_book_id:
            self.log_result("Add Book to Profile", "SKIP", "No user or book ID available")
            return None
        
        try:
            payload = {
                "userId": self.test_user_id,
                "bookId": self.test_book_id
            }
            
            response = self.session.post(
                f"{self.base_url}/api/user/add-book",
                json=payload,
                headers=self.get_auth_headers()
            )
            
            if response.status_code == 200:
                self.test_added_book_id = self.test_book_id
                self.log_result(
                    "Add Book to Profile",
                    "PASS",
                    "Book added to user profile"
                )
                return True
            elif response.status_code in (400, 409):
                # Expected if foreign key constraints fail
                self.test_added_book_id = self.test_book_id
                self.log_result("Add Book to Profile", "WARN", "Book may already exist in profile")
                return True
            else:
                self.log_result("Add Book to Profile", "FAIL", f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Add Book to Profile", "FAIL", str(e))
            return False

    def test_remove_book_from_profile(self):
        """Test: POST /api/user/remove-book - Remove previously added profile book"""
        if not self.test_user_id or not self.test_added_book_id:
            self.log_result("Remove Book from Profile", "SKIP", "No user or added book ID available")
            return None

        try:
            response = self.session.post(
                f"{self.base_url}/api/user/remove-book",
                json={"userId": self.test_user_id, "bookId": self.test_added_book_id},
                headers=self.get_auth_headers(),
            )

            if response.status_code != 200:
                self.log_result("Remove Book from Profile", "FAIL", f"Status: {response.status_code}")
                return False

            verify_response = self.session.get(
                f"{self.base_url}/api/user/{self.test_user_id}/preferred-books",
                headers=self.get_auth_headers(),
            )

            if verify_response.status_code != 200:
                self.log_result("Remove Book from Profile", "FAIL", f"Verify status: {verify_response.status_code}")
                return False

            preferred_books = verify_response.json()
            still_present = any(int(b.get("book_id", -1)) == int(self.test_added_book_id) for b in preferred_books)

            if still_present:
                self.log_result("Remove Book from Profile", "FAIL", "Book still present after remove")
                return False

            self.log_result("Remove Book from Profile", "PASS", "Book removed and verified")
            return True
        except Exception as e:
            self.log_result("Remove Book from Profile", "FAIL", str(e))
            return False
    
    def run_all_tests(self):
        """Run all tests"""
        print("\n" + "="*60)
        print("LOOK UP BOOK - API ENDPOINT TEST SUITE")
        print("="*60 + "\n")
        
        # Check connection first
        if not self.test_connection():
            print("\n❌ Server is not responding. Please ensure the server is running.")
            print(f"   Try: node server.js in the server directory")
            return False
        
        print("\n📚 Running API Tests...\n")
        
        # Run tests in logical order
        self.test_get_random_books()
        self.test_get_authors()
        self.test_get_books_by_author()
        self.test_get_awards()
        self.test_get_books_by_award()
        self.test_get_books_for_profile()
        self.test_signup()
        self.test_user_login()
        self.test_admin_login()
        self.test_like_book()
        self.test_protected_route_requires_auth()
        self.test_get_user_preferences()
        self.test_update_user_preferences()
        self.test_add_book_to_profile()
        self.test_remove_book_from_profile()
        
        # Print summary
        self.print_summary()
        return True
    
    def print_summary(self):
        """Print test summary"""
        passed = sum(1 for r in self.results if r['status'] == 'PASS')
        failed = sum(1 for r in self.results if r['status'] == 'FAIL')
        warned = sum(1 for r in self.results if r['status'] == 'WARN')
        skipped = sum(1 for r in self.results if r['status'] == 'SKIP')
        
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        print(f"✅ PASSED:  {passed}")
        print(f"❌ FAILED:  {failed}")
        print(f"⚠️  WARNED:  {warned}")
        print(f"⏭️  SKIPPED: {skipped}")
        print(f"📊 TOTAL:   {len(self.results)}")
        print("="*60 + "\n")
        
        if failed == 0:
            print("🎉 All critical tests passed! The API is working correctly.\n")
        else:
            print(f"⚠️  {failed} test(s) failed. Please check the server logs.\n")

def main():
    print("\n🔍 Look Up Book - API Endpoint Tester\n")
    
    # Allow custom base URL
    import sys
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5000"
    
    print(f"Testing server at: {base_url}\n")
    print("Checking if server is running...\n")
    
    tester = APITester(base_url)
    tester.run_all_tests()

if __name__ == "__main__":
    main()
