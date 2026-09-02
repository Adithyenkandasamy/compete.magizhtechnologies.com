import requests
import sys

BASE_URL = "http://localhost:8000"

def print_result(name, success, data=None, error=None):
    if success:
        print(f"✅ {name}: SUCCESS")
        if data:
            print(f"   Response: {data}")
    else:
        print(f"❌ {name}: FAILED")
        if error:
            print(f"   Error: {error}")
    print("-" * 50)

def test_health():
    try:
        r = requests.get(f"{BASE_URL}/health")
        if r.status_code == 200:
            print_result("Health Check", True, r.json())
            return True
        else:
            print_result("Health Check", False, error=f"{r.status_code} - {r.text}")
    except Exception as e:
        print_result("Health Check", False, error=str(e))
    return False

def test_register():
    payload = {
        "name": "Automated Tester",
        "email": "tester@example.com",
        "password": "securepassword123",
        "college": "Test University"
    }
    try:
        r = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        if r.status_code in [200, 201]:
            print_result("User Registration", True, r.json())
            return True
        elif r.status_code == 400 and "already registered" in r.text.lower():
            print_result("User Registration", True, "User already registered (skipping)")
            return True
        else:
            print_result("User Registration", False, error=f"{r.status_code} - {r.text}")
    except Exception as e:
        print_result("User Registration", False, error=str(e))
    return False

def test_login():
    payload = {
        "email": "tester@example.com",
        "password": "securepassword123"
    }
    try:
        # Check if auth uses OAuth2PasswordRequestForm or JSON
        r = requests.post(f"{BASE_URL}/api/auth/login", json=payload)
        if r.status_code == 422:
            # Maybe it expects form data?
            r = requests.post(f"{BASE_URL}/api/auth/login", data={"username": payload["email"], "password": payload["password"]})
        
        if r.status_code == 200:
            data = r.json()
            token = data.get("access_token")
            print_result("User Login", True, "Got Access Token")
            return token
        else:
            print_result("User Login", False, error=f"{r.status_code} - {r.text}")
    except Exception as e:
        print_result("User Login", False, error=str(e))
    return None

def test_get_events(token):
    headers = {"Authorization": f"Bearer {token}"}
    try:
        r = requests.get(f"{BASE_URL}/api/events", headers=headers)
        if r.status_code == 200:
            print_result("List Events", True, f"Found {len(r.json())} events")
            return True
        else:
            print_result("List Events", False, error=f"{r.status_code} - {r.text}")
    except Exception as e:
        print_result("List Events", False, error=str(e))
    return False

def run_all_tests():
    print("=" * 50)
    print("🚀 Starting API Tests...")
    print("=" * 50)
    
    if not test_health():
        print("Backend is not running or healthy. Aborting.")
        sys.exit(1)
        
    test_register()
    
    token = test_login()
    if token:
        test_get_events(token)
    else:
        print("Skipping authenticated endpoints due to login failure.")

if __name__ == "__main__":
    run_all_tests()
