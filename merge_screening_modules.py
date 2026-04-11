import re
import os

def extract_content(filename):
    with open(filename, "r", encoding="utf-8") as f:
        return f.read()

# 1. Models
models_files = [
    "backend/app/models/assessment.py",
    "backend/app/models/cognitive.py"
]

all_models_code = []
for file in models_files:
    all_models_code.append(extract_content(file))

with open("backend/app/modules/screening/model.py", "w", encoding="utf-8") as f:
    f.write("\n\n".join(all_models_code))

# 2. Services
services_files = [
    "backend/app/services/screening_service.py",
    "backend/app/services/cognitive_service.py",
    "backend/app/services/scoring.py",
    "backend/app/services/test_generator.py",
    "backend/app/services/anti_repetition.py",
    "backend/app/services/risk_engine.py"
]

all_services_code = []
for file in services_files:
    if not os.path.exists(file): continue
    code = extract_content(file)
    # Fix self-imports pointing to models
    code = code.replace("from app.models.assessment", "from app.modules.screening.model")
    code = code.replace("from app.models.cognitive", "from app.modules.screening.model")
    # Fix internal imports if they reference each other via old paths
    code = code.replace("from app.services.scoring", "from app.modules.screening.service")
    code = code.replace("from app.services.test_generator", "from app.modules.screening.service")
    code = code.replace("from app.services.anti_repetition", "from app.modules.screening.service")
    code = code.replace("from app.services.risk_engine", "from app.modules.screening.service")
    all_services_code.append(code)

with open("backend/app/modules/screening/service.py", "w", encoding="utf-8") as f:
    f.write("\n\n".join(all_services_code))

# 3. Routers
routers_files = {
    "screening": "backend/app/routers/screening.py",
    "cognitive": "backend/app/routers/cognitive.py"
}

all_routers_code = [
    "from fastapi import APIRouter",
    "router = APIRouter()",
]

for prefix, file in routers_files.items():
    if not os.path.exists(file): continue
    code = extract_content(file)
    
    # rename router = APIRouter() to sub_router = APIRouter()
    code = re.sub(r'^router\s*=\s*APIRouter\(.*?\)', f'router_{prefix} = APIRouter()', code, flags=re.MULTILINE)
    # replace @router. with @sub_router.
    code = code.replace("@router.", f"@router_{prefix}.")
    
    # fix model imports
    code = code.replace("from app.models.assessment", "from app.modules.screening.model")
    code = code.replace("from app.models.cognitive", "from app.modules.screening.model")
    
    # fix service imports
    code = code.replace("from app.services.cognitive_service", "from app.modules.screening.service")
    code = code.replace("import app.services.cognitive_service as cognitive_service", "import app.modules.screening.service as cognitive_service")
    code = code.replace("app.services.cognitive_service", "app.modules.screening.service")
    code = code.replace("from app.services import scoring", "from app.modules.screening.service import calculate_level3_composite, calculate_final_composite, score_level_1, score_level_2, score_stroop")
    code = code.replace("from app.services import risk_engine", "from app.modules.screening.service import determine_risk")
    code = code.replace("from app.services import test_generator", "from app.modules.screening.service import generate_orientation_questions, generate_recall_words, generate_digit_span, generate_visual_recognition, generate_visual_pattern, generate_fluency_category, generate_stroop_trials")
    code = code.replace("from app.services.anti_repetition", "from app.modules.screening.service")
    code = code.replace("scoring.score", "score")
    code = code.replace("scoring.calculate", "calculate")
    code = code.replace("risk_engine.determine_risk", "determine_risk")
    code = code.replace("test_generator.generate", "generate")
    code = code.replace("AntiRepetitionEngine", "AntiRepetitionEngine")
    
    all_routers_code.append(code)
    all_routers_code.append(f"router.include_router(router_{prefix}, prefix='/{prefix}', tags=['Screening Module'])")

with open("backend/app/modules/screening/router.py", "w", encoding="utf-8") as f:
    f.write("\n\n".join(all_routers_code))

print("Screening module merged safely!")
