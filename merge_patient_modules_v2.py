import re
import os

def extract_content(filename):
    with open(filename, "r", encoding="utf-8") as f:
        content = f.read()
    return content

# 1. Models
models_files = [
    "backend/app/models/activity.py",
    "backend/app/models/medication.py",
    "backend/app/models/health_log.py",
    "backend/app/models/alert.py"
]

all_models_code = []
for file in models_files:
    code = extract_content(file)
    # Just append them, python allows duplicates
    all_models_code.append(code)

with open("backend/app/modules/patient/model.py", "w", encoding="utf-8") as f:
    f.write("\n\n".join(all_models_code))

# 2. Services
services_files = [
    "backend/app/services/activity_service.py",
    "backend/app/services/alert_service.py"
]

all_services_code = []
for file in services_files:
    code = extract_content(file)
    # Replace references to models
    code = code.replace("from app.models.activity", "from app.modules.patient.model")
    code = code.replace("from app.models.alert", "from app.modules.patient.model")
    code = code.replace("from app.models.health_log", "from app.modules.patient.model")
    code = code.replace("from app.models.medication", "from app.modules.patient.model")
    all_services_code.append(code)

with open("backend/app/modules/patient/service.py", "w", encoding="utf-8") as f:
    f.write("\n\n".join(all_services_code))

# 3. Routers
routers_files = {
    "activities": "backend/app/routers/activities.py",
    "medications": "backend/app/routers/medications.py",
    "health": "backend/app/routers/health.py",
    "alerts": "backend/app/routers/alerts.py"
}

all_routers_code = [
    "from fastapi import APIRouter",
    "router = APIRouter()",
]

for prefix, file in routers_files.items():
    code = extract_content(file)
    
    # rename router = APIRouter() to sub_router = APIRouter()
    code = re.sub(r'^router\s*=\s*APIRouter\(.*?\)', f'router_{prefix} = APIRouter()', code, flags=re.MULTILINE)
    # replace @router. with @sub_router.
    code = code.replace("@router.", f"@router_{prefix}.")
    
    # fix imports
    code = code.replace("from app.models.activity", "from app.modules.patient.model")
    code = code.replace("from app.models.alert", "from app.modules.patient.model")
    code = code.replace("from app.models.health_log", "from app.modules.patient.model")
    code = code.replace("from app.models.medication", "from app.modules.patient.model")
    
    code = code.replace("from app.services.activity_service", "from app.modules.patient.service")
    code = code.replace("from app.services.alert_service", "from app.modules.patient.service")
    
    all_routers_code.append(code)
    all_routers_code.append(f"router.include_router(router_{prefix}, prefix='/{prefix}', tags=['Patient Module'])")

with open("backend/app/modules/patient/router.py", "w", encoding="utf-8") as f:
    f.write("\n\n".join(all_routers_code))

print("Patient module merged safely!")
