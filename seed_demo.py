import httpx
import time

base_url = "http://localhost:8000"

def seed():
    try:
        # 1. Register (or login if already exists)
        print("Registering demo patient...")
        r = httpx.post(f"{base_url}/auth/register", json={
            "email": "richard.demo@example.com",
            "password": "password123",
            "full_name": "Richard Moore",
        })
        if r.status_code == 200:
            token = r.json()["access_token"]
            print("Registered successfully.")
        else:
            print(f"Register returned {r.status_code}, trying login...")
            r2 = httpx.post(f"{base_url}/auth/login", json={
                "email": "richard.demo@example.com",
                "password": "password123"
            })
            r2.raise_for_status()
            token = r2.json()["access_token"]
            print("Logged in successfully.")

        headers = {"Authorization": f"Bearer {token}"}

        # 2. Health check-ins
        print("Submitting health checkins...")
        logs = [
            {"mood": "calm",    "confusion_level": 2, "sleep_hours": 7.0, "appetite": "good", "notes": "Had a normal day overall."},
            {"mood": "anxious", "confusion_level": 4, "sleep_hours": 5.0, "appetite": "fair", "notes": "Was a bit restless during the night."},
            {"mood": "happy",   "confusion_level": 1, "sleep_hours": 8.0, "appetite": "good", "notes": "Enjoyed the morning walk."},
            {"mood": "agitated","confusion_level": 9, "sleep_hours": 4.0, "appetite": "poor", "notes": "Forgot where the kitchen was this morning. Very confused."},
            {"mood": "calm",    "confusion_level": 2, "sleep_hours": 7.0, "appetite": "good", "notes": "Recovered well from yesterday."},
        ]
        for log in logs:
            res = httpx.post(f"{base_url}/health/checkin", json=log, headers=headers)
            print(f"  Checkin: {res.status_code}")
            time.sleep(0.1)

        # 3. Medication
        print("Adding a medication...")
        med_res = httpx.post(f"{base_url}/medications/", json={
            "name": "Donepezil",
            "dosage": "5mg",
            "frequency": "Once daily",
            "time_slots": ["08:00 AM"]
        }, headers=headers)
        print(f"  Medication: {med_res.status_code}")
        if med_res.status_code == 200:
            med_id = med_res.json()["id"]
            # 4. Log missed doses to trigger alerts
            print("Logging missed doses...")
            for note in ["Forgot to take morning pill.", "Forgot again."]:
                r3 = httpx.post(f"{base_url}/medications/{med_id}/log", json={
                    "status": "missed", "notes": note
                }, headers=headers)
                print(f"  Missed log: {r3.status_code}")

        print("\n✅ Successfully seeded patient information!")
    except Exception as e:
        print(f"❌ Error seeding data: {e}")

if __name__ == "__main__":
    seed()
