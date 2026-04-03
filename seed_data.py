import httpx
import time

base_url = "http://localhost:8000"

def seed():
    try:
        # 1. Login to get Caregiver token
        r = httpx.post(f"{base_url}/auth/login", json={"email": "caregiver@demo.com", "password": "password123"})
        r.raise_for_status()
        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Register a Patient
        print("Registering demo patient...")
        r = httpx.post(f"{base_url}/auth/register", json={
            "email": "richard.demo@example.com",
            "password": "password123",
            "full_name": "Richard Moore",
            "role": "patient",
            "date_of_birth": "1948-03-12"
        })
        
        # If user already exists (e.g., from previous auth run), login instead
        if r.status_code != 200:
            r = httpx.post(f"{base_url}/auth/login", json={
                "email": "richard.demo@example.com", 
                "password": "password123"
            })
            
        r.raise_for_status()
        patient_id = r.json()["user"]["id"]

        print(f"Patient created/fetched with ID: {patient_id}")

        # 3. Create Logs
        logs = [
            {"patient_id": patient_id, "mood": "calm", "confusion_level": 2, "sleep_hours": 7, "appetite": "good", "notes": "Had a normal day overall."},
            {"patient_id": patient_id, "mood": "anxious", "confusion_level": 4, "sleep_hours": 5, "appetite": "fair", "notes": "Was a bit restless during the night."},
            {"patient_id": patient_id, "mood": "happy", "confusion_level": 1, "sleep_hours": 8, "appetite": "good", "notes": "Enjoyed the morning walk."},
            {"patient_id": patient_id, "mood": "agitated", "confusion_level": 5, "sleep_hours": 4, "appetite": "poor", "notes": "Forgot where the kitchen was this morning."},
            {"patient_id": patient_id, "mood": "calm", "confusion_level": 2, "sleep_hours": 7, "appetite": "good", "notes": "Recovered well from yesterday."},
        ]

        print("Submitting logs...")
        for log in logs:
            res = httpx.post(f"{base_url}/caregiver/checkin", json=log, headers=headers)
            res.raise_for_status()
            time.sleep(0.1)

        print("Successfully seeded patient information!")
    except Exception as e:
        print(f"Error seeding data: {e}")

if __name__ == "__main__":
    seed()
