"""
Nameh.me Email Service - Backend API Tests
Tests: Auth, Mail folders, Emails, Labels, Settings, Compose
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealth:
    """Health check endpoints"""
    
    def test_health_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data
        print(f"✓ Health check passed - version {data['version']}")
    
    def test_live_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/health/live")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "alive"
        print("✓ Live check passed")


class TestAuth:
    """Authentication endpoints"""
    
    def test_login_with_demo_credentials(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "login": "demo@nameh.me",
            "password": "demo123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["username"] == "demo"
        assert "user_id" in data
        print(f"✓ Demo login successful - user: {data['username']}")
        return data["access_token"]
    
    def test_login_invalid_credentials(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "login": "wrong@email.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials rejected correctly")
    
    def test_register_new_user(self):
        import uuid
        unique_id = uuid.uuid4().hex[:8]
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"TEST_user_{unique_id}@nameh.me",
            "username": f"TEST_user_{unique_id}",
            "password": "testpass123",
            "display_name": f"Test User {unique_id}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["username"] == f"TEST_user_{unique_id}"
        print(f"✓ Registration successful - user: {data['username']}")
    
    def test_register_duplicate_email(self):
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": "demo@nameh.me",
            "username": "demo_duplicate",
            "password": "testpass123"
        })
        assert response.status_code == 409
        print("✓ Duplicate email rejected correctly")


class TestMailFolders:
    """Mail folder endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "login": "demo@nameh.me",
            "password": "demo123"
        })
        return response.json()["access_token"]
    
    def test_get_folders(self, auth_token):
        response = requests.get(
            f"{BASE_URL}/api/mail/folders",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "folders" in data
        folders = data["folders"]
        folder_names = [f["name"] for f in folders]
        assert "inbox" in folder_names
        assert "sent" in folder_names
        assert "drafts" in folder_names
        assert "trash" in folder_names
        assert "spam" in folder_names
        assert "starred" in folder_names
        
        # Check unread counts
        inbox = next(f for f in folders if f["name"] == "inbox")
        spam = next(f for f in folders if f["name"] == "spam")
        print(f"✓ Folders retrieved - Inbox unread: {inbox['unread']}, Spam unread: {spam['unread']}")


class TestEmails:
    """Email listing and detail endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "login": "demo@nameh.me",
            "password": "demo123"
        })
        return response.json()["access_token"]
    
    def test_get_inbox_emails(self, auth_token):
        response = requests.get(
            f"{BASE_URL}/api/mail/emails?folder=inbox",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "emails" in data
        assert len(data["emails"]) >= 1
        print(f"✓ Inbox emails retrieved - count: {len(data['emails'])}")
        return data["emails"]
    
    def test_get_sent_emails(self, auth_token):
        response = requests.get(
            f"{BASE_URL}/api/mail/emails?folder=sent",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "emails" in data
        print(f"✓ Sent emails retrieved - count: {len(data['emails'])}")
    
    def test_get_spam_emails(self, auth_token):
        response = requests.get(
            f"{BASE_URL}/api/mail/emails?folder=spam",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "emails" in data
        print(f"✓ Spam emails retrieved - count: {len(data['emails'])}")
    
    def test_get_emails_by_category(self, auth_token):
        response = requests.get(
            f"{BASE_URL}/api/mail/emails?folder=inbox&category=primary",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "emails" in data
        print(f"✓ Primary category emails - count: {len(data['emails'])}")
    
    def test_search_emails(self, auth_token):
        response = requests.get(
            f"{BASE_URL}/api/mail/emails?folder=inbox&search=security",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "emails" in data
        # Should find the security email
        print(f"✓ Search 'security' - found: {len(data['emails'])} emails")
    
    def test_get_email_detail(self, auth_token):
        # First get list
        list_response = requests.get(
            f"{BASE_URL}/api/mail/emails?folder=inbox",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        emails = list_response.json()["emails"]
        if emails:
            email_id = emails[0]["id"]
            response = requests.get(
                f"{BASE_URL}/api/mail/emails/{email_id}",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            assert response.status_code == 200
            data = response.json()
            assert "body" in data
            assert "subject" in data
            assert "from_name" in data
            print(f"✓ Email detail retrieved - subject: {data['subject'][:40]}...")


class TestEmailActions:
    """Email action endpoints (star, read, trash, etc.)"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "login": "demo@nameh.me",
            "password": "demo123"
        })
        return response.json()["access_token"]
    
    def test_star_unstar_email(self, auth_token):
        # Get an email
        list_response = requests.get(
            f"{BASE_URL}/api/mail/emails?folder=inbox",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        emails = list_response.json()["emails"]
        if emails:
            email_id = emails[0]["id"]
            original_starred = emails[0].get("is_starred", False)
            
            # Toggle star
            action = "unstar" if original_starred else "star"
            response = requests.post(
                f"{BASE_URL}/api/mail/emails/{email_id}/action",
                headers={"Authorization": f"Bearer {auth_token}"},
                json={"action": action}
            )
            assert response.status_code == 200
            
            # Toggle back
            reverse_action = "star" if original_starred else "unstar"
            response = requests.post(
                f"{BASE_URL}/api/mail/emails/{email_id}/action",
                headers={"Authorization": f"Bearer {auth_token}"},
                json={"action": reverse_action}
            )
            assert response.status_code == 200
            print(f"✓ Star/unstar toggle works")
    
    def test_mark_read_unread(self, auth_token):
        list_response = requests.get(
            f"{BASE_URL}/api/mail/emails?folder=inbox",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        emails = list_response.json()["emails"]
        if emails:
            email_id = emails[0]["id"]
            
            # Mark unread
            response = requests.post(
                f"{BASE_URL}/api/mail/emails/{email_id}/action",
                headers={"Authorization": f"Bearer {auth_token}"},
                json={"action": "unread"}
            )
            assert response.status_code == 200
            
            # Mark read
            response = requests.post(
                f"{BASE_URL}/api/mail/emails/{email_id}/action",
                headers={"Authorization": f"Bearer {auth_token}"},
                json={"action": "read"}
            )
            assert response.status_code == 200
            print(f"✓ Read/unread toggle works")


class TestBulkActions:
    """Bulk email action endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "login": "demo@nameh.me",
            "password": "demo123"
        })
        return response.json()["access_token"]
    
    def test_bulk_mark_read(self, auth_token):
        list_response = requests.get(
            f"{BASE_URL}/api/mail/emails?folder=inbox",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        emails = list_response.json()["emails"]
        if len(emails) >= 2:
            ids = [emails[0]["id"], emails[1]["id"]]
            response = requests.post(
                f"{BASE_URL}/api/mail/bulk-action",
                headers={"Authorization": f"Bearer {auth_token}"},
                json={"ids": ids, "action": "read"}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "ok"
            print(f"✓ Bulk mark read works - {data['count']} emails")


class TestLabels:
    """Label management endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "login": "demo@nameh.me",
            "password": "demo123"
        })
        return response.json()["access_token"]
    
    def test_get_labels(self, auth_token):
        response = requests.get(
            f"{BASE_URL}/api/mail/labels",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "labels" in data
        labels = data["labels"]
        label_names = [lb["name"] for lb in labels]
        assert "Work" in label_names
        assert "Personal" in label_names
        assert "Project" in label_names
        assert "Finance" in label_names
        assert "Travel" in label_names
        print(f"✓ Labels retrieved - count: {len(labels)}")
        for lb in labels:
            print(f"  - {lb['name']} ({lb['color']})")


class TestSettings:
    """User settings endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "login": "demo@nameh.me",
            "password": "demo123"
        })
        return response.json()["access_token"]
    
    def test_get_settings(self, auth_token):
        response = requests.get(
            f"{BASE_URL}/api/users/settings",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "language" in data
        assert "font" in data
        assert "theme" in data
        print(f"✓ Settings retrieved - language: {data['language']}, theme: {data['theme']}")
    
    def test_update_settings(self, auth_token):
        response = requests.patch(
            f"{BASE_URL}/api/users/settings",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"signature": "Test Signature"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["signature"] == "Test Signature"
        
        # Reset
        requests.patch(
            f"{BASE_URL}/api/users/settings",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"signature": ""}
        )
        print(f"✓ Settings update works")


class TestCompose:
    """Email composition endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "login": "demo@nameh.me",
            "password": "demo123"
        })
        return response.json()["access_token"]
    
    def test_compose_email(self, auth_token):
        response = requests.post(
            f"{BASE_URL}/api/mail/compose",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "to": ["test@example.com"],
                "subject": "TEST_Compose Test Email",
                "body": "<p>This is a test email from automated tests.</p>",
                "folder": "sent"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["subject"] == "TEST_Compose Test Email"
        assert "id" in data
        print(f"✓ Email composed successfully - id: {data['id']}")


class TestLabelFiltering:
    """Test that emails have labels and can be filtered"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "login": "demo@nameh.me",
            "password": "demo123"
        })
        return response.json()["access_token"]
    
    def test_emails_have_labels(self, auth_token):
        response = requests.get(
            f"{BASE_URL}/api/mail/emails?folder=inbox",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        emails = response.json()["emails"]
        
        # Count emails with labels
        emails_with_labels = [e for e in emails if e.get("labels") and len(e["labels"]) > 0]
        print(f"✓ Emails with labels: {len(emails_with_labels)} out of {len(emails)}")
        
        # Check specific labels
        work_emails = [e for e in emails if "lbl-work" in (e.get("labels") or [])]
        personal_emails = [e for e in emails if "lbl-personal" in (e.get("labels") or [])]
        project_emails = [e for e in emails if "lbl-project" in (e.get("labels") or [])]
        
        print(f"  - Work label: {len(work_emails)} emails")
        print(f"  - Personal label: {len(personal_emails)} emails")
        print(f"  - Project label: {len(project_emails)} emails")
        
        # At least some emails should have labels
        assert len(emails_with_labels) > 0, "No emails have labels assigned"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
