#!/usr/bin/env python3
"""
Verify that each frontend page has working data dependencies.

This script validates:
- SPA route availability from the frontend dev server
- Backend/database-backed API endpoints used by each page
- Authenticated user flows for profile/add/remove actions
- Optional admin verification flow when admin credentials are provided
"""

from __future__ import annotations

import os
import sys
import time
from dataclasses import dataclass
from typing import Dict, List, Optional

import requests

FRONTEND_BASE = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000")
API_BASE = os.getenv("API_BASE_URL", "http://localhost:5000")


@dataclass
class CheckResult:
    name: str
    status: str
    details: str


class PageDataVerifier:
    def __init__(self) -> None:
        self.results: List[CheckResult] = []
        self.session = requests.Session()
        self.user_token: Optional[str] = None
        self.user_id: Optional[int] = None
        self.selected_book_id: Optional[int] = None

    def log(self, name: str, status: str, details: str) -> None:
        self.results.append(CheckResult(name=name, status=status, details=details))
        icon = "PASS" if status == "PASS" else "FAIL" if status == "FAIL" else "SKIP"
        print(f"[{icon}] {name}: {details}")

    def auth_headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.user_token:
            headers["Authorization"] = f"Bearer {self.user_token}"
        return headers

    def require(self, condition: bool, name: str, ok_details: str, fail_details: str) -> bool:
        if condition:
            self.log(name, "PASS", ok_details)
            return True
        self.log(name, "FAIL", fail_details)
        return False

    def check_frontend_routes(self) -> bool:
        routes = [
            "/login",
            "/homepage",
            "/add-db-book",
            "/add-new-book",
            "/admin-verification",
            "/search-books",
            "/profile",
            "/search-awards",
        ]
        ok = True

        for route in routes:
            name = f"Route {route}"
            try:
                response = self.session.get(
                    f"{FRONTEND_BASE}{route}",
                    headers={"Accept": "text/html"},
                    timeout=10,
                )
                route_ok = response.status_code == 200 and "<div id=\"root\"></div>" in response.text
                ok = self.require(
                    route_ok,
                    name,
                    "Frontend route served SPA shell",
                    f"Unexpected response status/body (status={response.status_code})",
                ) and ok
            except Exception as exc:  # pragma: no cover - runtime integration check
                self.log(name, "FAIL", f"Request error: {exc}")
                ok = False

        return ok

    def check_homepage_data(self) -> bool:
        name = "Homepage data (/api/tableName)"
        try:
            response = self.session.get(f"{API_BASE}/api/tableName", timeout=10)
            data = response.json()
            has_rows = response.status_code == 200 and isinstance(data, list) and len(data) > 0
            if has_rows:
                first = data[0]
                self.selected_book_id = first.get("book_id")
                return self.require(
                    True,
                    name,
                    f"Loaded {len(data)} rows; sample award={first.get('prize_name', 'N/A')}",
                    "",
                )
            return self.require(False, name, "", f"No data returned (status={response.status_code})")
        except Exception as exc:
            self.log(name, "FAIL", f"Request error: {exc}")
            return False

    def check_books_for_profile_data(self) -> bool:
        name = "Books for profile (/api/books-for-profile)"
        try:
            response = self.session.get(f"{API_BASE}/api/books-for-profile", timeout=10)
            data = response.json()
            has_rows = response.status_code == 200 and isinstance(data, list) and len(data) > 0
            return self.require(
                has_rows,
                name,
                f"Loaded {len(data)} rows",
                f"No data returned (status={response.status_code})",
            )
        except Exception as exc:
            self.log(name, "FAIL", f"Request error: {exc}")
            return False

    def check_search_books_page_data(self) -> bool:
        name = "Search Books page data (/api/search-books-award-winners)"
        try:
            response = self.session.get(f"{API_BASE}/api/search-books-award-winners", timeout=10)
            data = response.json()
            has_rows = response.status_code == 200 and isinstance(data, list) and len(data) > 0
            return self.require(
                has_rows,
                name,
                f"Loaded {len(data)} award-winning rows",
                f"No data returned (status={response.status_code})",
            )
        except Exception as exc:
            self.log(name, "FAIL", f"Request error: {exc}")
            return False

    def create_and_login_user(self) -> bool:
        timestamp = int(time.time())
        username = f"webcheck_{timestamp}"
        password = "TestPassword123!"
        email = f"webcheck_{timestamp}@example.com"

        signup_name = "Login/Signup page backend (/signup)"
        try:
            signup_response = self.session.post(
                f"{API_BASE}/signup",
                json={"username": username, "email": email, "password": password},
                headers={"Content-Type": "application/json"},
                timeout=10,
            )
            signup_data = signup_response.json()
            signup_ok = signup_response.status_code == 200 and "token" in signup_data and "userId" in signup_data
            if not self.require(
                signup_ok,
                signup_name,
                "Signup succeeded",
                f"Signup failed (status={signup_response.status_code})",
            ):
                return False

            login_name = "Login/Signup page backend (/login)"
            login_response = self.session.post(
                f"{API_BASE}/login",
                json={"username": username, "password": password},
                headers={"Content-Type": "application/json"},
                timeout=10,
            )
            login_data = login_response.json()
            login_ok = login_response.status_code == 200 and "token" in login_data
            if not self.require(
                login_ok,
                login_name,
                "Login succeeded",
                f"Login failed (status={login_response.status_code})",
            ):
                return False

            self.user_token = login_data["token"]
            self.user_id = int(login_data.get("userId") or signup_data["userId"])
            return True
        except Exception as exc:
            self.log(signup_name, "FAIL", f"Request error: {exc}")
            return False

    def check_awards_pages(self) -> bool:
        all_ok = True

        try:
            response = self.session.get(f"{API_BASE}/api/awards", timeout=10)
            awards = response.json()
            ok = response.status_code == 200 and isinstance(awards, list) and len(awards) > 0
            all_ok = self.require(
                ok,
                "Search Awards page data (/api/awards)",
                f"Loaded {len(awards)} awards",
                f"Awards not available (status={response.status_code})",
            ) and all_ok

            if ok:
                award_id = awards[0].get("award_id")
                detail = self.session.get(f"{API_BASE}/api/awards/{award_id}", timeout=10)
                detail_data = detail.json()
                detail_ok = detail.status_code == 200 and isinstance(detail_data, list)
                all_ok = self.require(
                    detail_ok,
                    "Search Awards page results (/api/awards/:id)",
                    f"Award {award_id} returned {len(detail_data)} entries",
                    f"Award details failed (status={detail.status_code})",
                ) and all_ok
        except Exception as exc:
            self.log("Search Awards page data", "FAIL", f"Request error: {exc}")
            return False

        return all_ok

    def check_profile_page(self) -> bool:
        if self.user_id is None:
            self.log("Profile page data", "FAIL", "No authenticated user available")
            return False

        all_ok = True
        try:
            pref = self.session.get(
                f"{API_BASE}/api/user/preference/{self.user_id}",
                headers=self.auth_headers(),
                timeout=10,
            )
            all_ok = self.require(
                pref.status_code in (200, 404),
                "Profile page preference data",
                f"Preference endpoint reachable (status={pref.status_code})",
                f"Preference endpoint failed (status={pref.status_code})",
            ) and all_ok

            books = self.session.get(
                f"{API_BASE}/api/user/{self.user_id}/preferred-books",
                headers=self.auth_headers(),
                timeout=10,
            )
            books_data = books.json()
            all_ok = self.require(
                books.status_code == 200 and isinstance(books_data, list),
                "Profile page preferred books data",
                f"Preferred books endpoint returned {len(books_data)} rows",
                f"Preferred books failed (status={books.status_code})",
            ) and all_ok
        except Exception as exc:
            self.log("Profile page data", "FAIL", f"Request error: {exc}")
            return False

        return all_ok

    def check_add_db_book_flow(self) -> bool:
        if self.user_id is None:
            self.log("Add DB Book flow", "FAIL", "No authenticated user available")
            return False

        try:
            response = self.session.get(f"{API_BASE}/api/books-for-profile", timeout=10)
            data = response.json()
            if not (response.status_code == 200 and isinstance(data, list) and len(data) > 0):
                return self.require(False, "Add DB Book page source data", "", "No selectable entries returned")

            selected = next((row for row in data if row.get("book_id") is not None), None)
            if selected is None:
                return self.require(False, "Add DB Book page source data", "", "No book_id rows available")

            book_id = int(selected["book_id"])
            add_resp = self.session.post(
                f"{API_BASE}/api/user/add-book",
                json={"userId": self.user_id, "bookId": book_id},
                headers=self.auth_headers(),
                timeout=10,
            )
            add_ok = add_resp.status_code in (200, 400, 409)
            if not self.require(
                add_ok,
                "Add DB Book page action (/api/user/add-book)",
                f"Add call accepted (status={add_resp.status_code})",
                f"Add call failed (status={add_resp.status_code})",
            ):
                return False

            remove_resp = self.session.post(
                f"{API_BASE}/api/user/remove-book",
                json={"userId": self.user_id, "bookId": book_id},
                headers=self.auth_headers(),
                timeout=10,
            )
            return self.require(
                remove_resp.status_code == 200,
                "Add DB Book cleanup (/api/user/remove-book)",
                "Cleanup remove succeeded",
                f"Cleanup remove failed (status={remove_resp.status_code})",
            )
        except Exception as exc:
            self.log("Add DB Book flow", "FAIL", f"Request error: {exc}")
            return False

    def check_add_new_book_page_data(self) -> bool:
        try:
            response = self.session.get(f"{API_BASE}/api/awards", timeout=10)
            data = response.json()
            return self.require(
                response.status_code == 200 and isinstance(data, list) and len(data) > 0,
                "Add New Book page data (/api/awards)",
                f"Award dropdown source has {len(data)} rows",
                f"Award dropdown source unavailable (status={response.status_code})",
            )
        except Exception as exc:
            self.log("Add New Book page data", "FAIL", f"Request error: {exc}")
            return False

    def check_admin_page(self) -> bool:
        admin_user = os.getenv("SMOKE_ADMIN_USERNAME")
        admin_pass = os.getenv("SMOKE_ADMIN_PASSWORD")

        if not admin_user or not admin_pass:
            self.log(
                "Admin Verification page data",
                "SKIP",
                "Set SMOKE_ADMIN_USERNAME and SMOKE_ADMIN_PASSWORD to validate admin page data",
            )
            return True

        try:
            login = self.session.post(
                f"{API_BASE}/admin/login",
                json={"username": admin_user, "password": admin_pass},
                headers={"Content-Type": "application/json"},
                timeout=10,
            )
            login_data = login.json()
            if not (login.status_code == 200 and "token" in login_data):
                return self.require(False, "Admin Verification admin login", "", f"Admin login failed (status={login.status_code})")

            token = login_data["token"]
            response = self.session.get(
                f"{API_BASE}/api/unverified-books",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10,
            )
            data = response.json()
            return self.require(
                response.status_code == 200 and isinstance(data, list),
                "Admin Verification page data (/api/unverified-books)",
                f"Admin endpoint reachable; {len(data)} unverified entries",
                f"Admin endpoint failed (status={response.status_code})",
            )
        except Exception as exc:
            self.log("Admin Verification page data", "FAIL", f"Request error: {exc}")
            return False

    def run(self) -> int:
        all_ok = True

        all_ok = self.check_frontend_routes() and all_ok
        all_ok = self.check_homepage_data() and all_ok
        all_ok = self.check_books_for_profile_data() and all_ok
        all_ok = self.check_search_books_page_data() and all_ok
        all_ok = self.create_and_login_user() and all_ok
        all_ok = self.check_awards_pages() and all_ok
        all_ok = self.check_profile_page() and all_ok
        all_ok = self.check_add_db_book_flow() and all_ok
        all_ok = self.check_add_new_book_page_data() and all_ok
        all_ok = self.check_admin_page() and all_ok

        passed = sum(1 for r in self.results if r.status == "PASS")
        failed = sum(1 for r in self.results if r.status == "FAIL")
        skipped = sum(1 for r in self.results if r.status == "SKIP")

        print("\n=== Webpage/Data Verification Summary ===")
        print(f"Passed:  {passed}")
        print(f"Failed:  {failed}")
        print(f"Skipped: {skipped}")

        return 0 if all_ok and failed == 0 else 1


def main() -> int:
    print("Checking frontend routes and database-backed page dependencies...")
    verifier = PageDataVerifier()
    return verifier.run()


if __name__ == "__main__":
    sys.exit(main())
