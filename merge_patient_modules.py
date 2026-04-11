import re

files_to_merge = [
    "backend/app/routers/activities.py",
    "backend/app/routers/medications.py",
    "backend/app/routers/health.py",
    "backend/app/routers/alerts.py"
]

all_imports = set()
all_code = []

for f in files_to_merge:
    with open(f, "r", encoding="utf-8") as file:
        content = file.read()
        
        # Extract and remove imports
        import_lines = re.findall(r'^(?:from\s+\S+\s+import\s+.*|import\s+.*)$', content, flags=re.MULTILINE)
        for imp in import_lines:
            all_imports.add(imp)
            content = content.replace(imp, "")
            
        # Remove APIRouter and Limiter instantiations
        content = re.sub(r'^router\s*=\s*APIRouter\(\w*\)\s*$', '', content, flags=re.MULTILINE)
        content = re.sub(r'^limiter\s*=\s*Limiter\(.*?\)\s*$', '', content, flags=re.MULTILINE)
        content = re.sub(r'^logger\s*=\s*logging\.getLogger\(.*?\)\s*$', '', content, flags=re.MULTILINE)
        
        all_code.append(content.strip())

merged_content = "\n".join(sorted(all_imports)) + "\n\n"
merged_content += "router = APIRouter()\n"
merged_content += "limiter = Limiter(key_func=get_remote_address)\n"
merged_content += "logger = logging.getLogger(__name__)\n\n"
merged_content += "\n\n".join(all_code)

with open("backend/app/modules/patient/router.py", "w", encoding="utf-8") as f:
    f.write(merged_content)


model_files = [
    "backend/app/models/activity.py",
    "backend/app/models/medication.py",
    "backend/app/models/health_log.py",
    "backend/app/models/alert.py"
]

all_imports = set()
all_code = []

for f in model_files:
    with open(f, "r", encoding="utf-8") as file:
        content = file.read()
        
        # Extract and remove imports
        import_lines = re.findall(r'^(?:from\s+\S+\s+import\s+.*|import\s+.*)$', content, flags=re.MULTILINE)
        for imp in import_lines:
            all_imports.add(imp)
            content = content.replace(imp, "")
            
        all_code.append(content.strip())

merged_models_content = "\n".join(sorted(all_imports)) + "\n\n"
merged_models_content += "\n\n".join(all_code)

with open("backend/app/modules/patient/model.py", "w", encoding="utf-8") as f:
    f.write(merged_models_content)


service_files = [
    "backend/app/services/activity_service.py",
    "backend/app/services/alert_service.py"
]

all_imports = set()
all_code = []

for f in service_files:
    with open(f, "r", encoding="utf-8") as file:
        content = file.read()
        
        # Extract and remove imports
        import_lines = re.findall(r'^(?:from\s+\S+\s+import\s+.*|import\s+.*)$', content, flags=re.MULTILINE)
        for imp in import_lines:
            all_imports.add(imp)
            content = content.replace(imp, "")
            
        all_code.append(content.strip())

merged_services_content = "\n".join(sorted(all_imports)) + "\n\n"
merged_services_content += "\n\n".join(all_code)

with open("backend/app/modules/patient/service.py", "w", encoding="utf-8") as f:
    f.write(merged_services_content)

print("Merged successfully.")
