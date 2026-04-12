import os
import json
import random
import requests
from openai import OpenAI
from app.config import settings

# Initialize OpenAI client (only used if AI_PROVIDER="openai")
client = OpenAI(api_key=settings.OPENAI_API_KEY)


def get_ai_provider() -> str:
    return os.getenv("AI_PROVIDER", "ollama").lower()


# ==========================================
# Pre-built activity library — instant fallback when AI is offline
# ==========================================

_ACTIVITY_LIBRARY: dict = {
    "memory_recall": [
        {"content": {"words": ["Apple", "River", "Cloud"]}},
        {"content": {"words": ["Chair", "Window", "Table"]}},
        {"content": {"words": ["Sun", "Moon", "Stars"]}}
    ],
    "image_recall": [
        {"content": {"images": [
            {"url": "https://images.unsplash.com/photo-1560159906-839a9c9fcd09?w=200", "label": "Apple"},
            {"url": "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=200", "label": "Chair"},
            {"url": "https://images.unsplash.com/photo-1520699049698-acd2f029cefc?w=200", "label": "Book"}
        ]}},
        {"content": {"images": [
            {"url": "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=200", "label": "Dog"},
            {"url": "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200", "label": "Cat"},
            {"url": "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=200", "label": "Pineapple"}
        ]}}
    ],
    "pattern_recognition": [
        {"content": {"sequence": ["🔴", "🔵", "🔴", "🔵"], "options": ["🔴", "🔵", "🟢"], "answer": "🔴"}},
        {"content": {"sequence": ["☀️", "🌙", "☀️", "🌙"], "options": ["⭐", "☀️", "🌙"], "answer": "☀️"}},
        {"content": {"sequence": ["❤️", "❤️", "⭐", "❤️", "❤️"], "options": ["⭐", "🌙", "❤️"], "answer": "⭐"}},
        {"content": {"sequence": ["🔺", "🟥", "🔺", "🟥"], "options": ["🟢", "🔺", "🟥"], "answer": "🔺"}},
        {"content": {"sequence": ["🐶", "🐱", "🐶", "🐱"], "options": ["🐭", "🐶", "🐱"], "answer": "🐶"}},
        {"content": {"sequence": ["🍎", "🍌", "🍎", "🍌"], "options": ["🍇", "🍎", "🍌"], "answer": "🍎"}},
        {"content": {"sequence": ["🌻", "🌹", "🌻", "🌹"], "options": ["🌷", "🌻", "🌹"], "answer": "🌻"}},
        {"content": {"sequence": ["🚗", "🚌", "🚗", "🚌"], "options": ["🚲", "🚗", "🚌"], "answer": "🚗"}},
        {"content": {"sequence": ["☕", "🥐", "☕", "🥐"], "options": ["🍰", "☕", "🥐"], "answer": "☕"}},
        {"content": {"sequence": ["Circle", "Square", "Circle", "Square"], "options": ["Circle", "Triangle", "Square"], "answer": "Circle"}}
    ],
    "digit_span": [
        {"content": {"sequence": [3, 7, 2, 9]}},
        {"content": {"sequence": [5, 1, 8, 4, 6]}},
        {"content": {"sequence": [9, 2, 5]}}
    ],
    "stroop_test": [
        {"content": {"word": "RED", "color": "blue", "answer": "blue"}},
        {"content": {"word": "GREEN", "color": "red", "answer": "red"}},
        {"content": {"word": "BLUE", "color": "yellow", "answer": "yellow"}}
    ],
    "task_sequencing": [
        {"content": {"steps": ["Boil water", "Add tea bag", "Pour water into cup", "Wait 3 minutes"]}},
        {"content": {"steps": ["Write letter", "Put in envelope", "Add stamp", "Mail it"]}}
    ],
    "sentence_completion": [
        {"content": {"sentence": "The dog chased the ___ across the yard.", "answer": "ball"}},
        {"content": {"sentence": "It was raining, so I brought my ___.", "answer": "umbrella"}}
    ],
    "semantic_fluency": [
        {"content": {"category": "Animals"}},
        {"content": {"category": "Fruits"}},
        {"content": {"category": "Furniture"}}
    ],
    "family_recognition": [
        {"content": {"image": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=face", "options": ["Mother", "Sister", "Aunt"], "answer": "Mother", "memberName": "Mom"}},
        {"content": {"image": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop&crop=face", "options": ["Brother", "Father", "Uncle"], "answer": "Brother", "memberName": "Sibling"}},
        {"content": {"image": "https://images.unsplash.com/photo-1581579438747-104c53d7fbc4?w=300&h=300&fit=crop&crop=face", "options": ["Grandmother", "Neighbor", "Teacher"], "answer": "Grandmother", "memberName": "Grandma"}},
        {"content": {"image": "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=300&h=300&fit=crop&crop=face", "options": ["Father", "Cousin", "Friend"], "answer": "Father", "memberName": "Dad"}},
        {"content": {"image": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop&crop=face", "options": ["Daughter", "Niece", "Student"], "answer": "Daughter", "memberName": "Daughter"}}
    ],
    "phone_recognition": [
        {"content": {"name": "Emergency", "number": "911"}},
        {"content": {"name": "Daughter", "number": "555-0199"}},
        {"content": {"name": "Doctor", "number": "555-0100"}}
    ],
    "object_matching": [
        {"content": {"target": "Hammer", "options": ["Nail", "Screw", "Tape"], "answer": "Nail"}},
        {"content": {"target": "Sock", "options": ["Shoe", "Hat", "Glove"], "answer": "Shoe"}}
    ],
    "word_association": [
        {"content": {"prompt": "What goes best with 'Salt'?", "options": ["Pepper", "Sugar", "Water"], "answer": "Pepper"}},
        {"content": {"prompt": "What goes best with 'Day'?", "options": ["Night", "Week", "Time"], "answer": "Night"}}
    ],
    "story_recall": [
        {"content": {"story": "Maria bought 3 apples.", "question": "What did Maria buy?", "answer": "apples"}}
    ]
}

def _mutate_activity(activity_type: str, chosen: dict, level: int) -> dict:
    import copy
    import random
    import string

    content = copy.deepcopy(chosen["content"])
    level = min(level, 3)  # Hard cap at 3

    # Shuffle internal lists everywhere for NON-REPETITIVE randomness
    if "options" in content:
        random.shuffle(content["options"])
        # Level 3: add extra distractor options to make it harder
        if level == 3 and len(content["options"]) < 6:
            extras = ["Diamond", "Feather", "Lantern", "Compass", "Anchor", "Violin"]
            for e in random.sample(extras, min(2, 6 - len(content["options"]))):
                if e not in content["options"]:
                    content["options"].append(e)
            random.shuffle(content["options"])
    
    if "words" in content:
        random.shuffle(content["words"])
        # Level scaling: L1=base(3), L2=+3 words(6), L3=+5 words(8)
        extra_pool = ["Tree", "Bird", "House", "Car", "Ocean", "Mountain", "Pencil",
                      "Coffee", "Train", "Bridge", "Feather", "Lantern", "Mirror", "Compass"]
        pool = [x for x in extra_pool if x not in content["words"]]
        if level == 2:
            adds = min(3, len(pool))
        elif level == 3:
            adds = min(5, len(pool))
        else:
            adds = 0
        if adds > 0:
            content["words"].extend(random.sample(pool, adds))
            random.shuffle(content["words"])
            
    if "sequence" in content:
        first = content["sequence"][0]
        if isinstance(first, str) and len(first) > 0 and first[0] not in string.digits:
            # Pattern sequences: extend pattern length
            if level == 2:
                content["sequence"].extend([random.choice(["⭐", "♦"]), first])
            elif level == 3:
                content["sequence"].extend([random.choice(["🔶", "🔺"]), first, random.choice(["⭐", "♦"]), first])
        elif isinstance(first, (int,)):
            # Digit span: L1=base(3-4), L2=+2 digits, L3=+4 digits
            extra_digits = level - 1 if level == 2 else 4 if level == 3 else 0
            content["sequence"].extend([random.randint(0, 9) for _ in range(extra_digits)])

    if "steps" in content and level == 3:
        # Add extra steps at Level 3 to make sequencing harder
        bonus_steps = ["Check the result", "Clean up afterwards"]
        content["steps"].extend(random.sample(bonus_steps, min(len(bonus_steps), 1)))

    if "story" in content and level >= 2:
        # Make story longer at higher levels
        extras = [
            " Later, she met her friend Tom at the park.",
            " The weather was sunny with a gentle breeze.",
            " On the way home, she stopped at the library."
        ]
        content["story"] += random.choice(extras)

    return {
        "type": activity_type,
        "content": content,
        "level": level
    }

def _get_fallback_activity(activity_type: str, difficulty: str, level: int = 1) -> dict:
    import random
    options = _ACTIVITY_LIBRARY.get(activity_type, _ACTIVITY_LIBRARY["memory_recall"])
    chosen = random.choice(options)
    return _mutate_activity(activity_type, chosen, level)

async def generate_ai_response(system_prompt: str, user_prompt: str) -> str:
    """Generate a response using the configured AI provider."""
    provider = get_ai_provider()
    full_prompt = f"System: {system_prompt}\n\nUser: {user_prompt}"

    if provider == "ollama":
        try:
            url = "http://localhost:11434/api/generate"
            payload = {"model": "llama3", "prompt": full_prompt, "stream": False}
            response = requests.post(url, json=payload, timeout=60)
            response.raise_for_status()
            return response.json().get("response", "")
        except Exception as e:
            return json.dumps({"error": f"Ollama failed: {str(e)}"})

    elif provider == "openai":
        try:
            response = client.chat.completions.create(
                model="gpt-4.1",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.3,
            )
            return response.choices[0].message.content
        except Exception as e:
            return json.dumps({"error": f"OpenAI failed: {str(e)}"})
    else:
        return json.dumps({"error": f"Unknown AI provider: {provider}"})


async def _get_json_response(system_prompt: str, user_prompt: str) -> dict:
    """Parse the AI string response into a dict."""
    system_prompt_with_json = (
        system_prompt
        + "\n\nCRITICAL: Respond ONLY with a valid JSON object. "
        "Do not include markdown code block wrappers. Just the raw JSON object."
    )
    response_text = await generate_ai_response(system_prompt_with_json, user_prompt)
    try:
        return json.loads(response_text)
    except json.JSONDecodeError:
        if "```json" in response_text:
            try:
                cleaned = response_text.split("```json")[1].split("```")[0].strip()
                return json.loads(cleaned)
            except Exception:
                pass
        return {"error": "Failed to parse AI response", "raw": response_text}
    except Exception as e:
        return {"error": str(e)}


async def analyze_screening(level: str, test_results: str) -> dict:
    from app.prompts.screening_prompts import SCREENING_ANALYSIS_SYSTEM, SCREENING_ANALYSIS_USER
    user_prompt = SCREENING_ANALYSIS_USER.format(level=level, test_results=test_results)
    return await _get_json_response(SCREENING_ANALYSIS_SYSTEM, user_prompt)


async def generate_health_guidance(
    mood: str, confusion_level: int, sleep_hours: float,
    appetite: str, notes: str, recent_logs: str,
) -> dict:
    from app.prompts.caregiver_prompts import HEALTH_GUIDANCE_SYSTEM, HEALTH_GUIDANCE_USER
    user_prompt = HEALTH_GUIDANCE_USER.format(
        mood=mood, confusion_level=confusion_level, sleep_hours=sleep_hours,
        appetite=appetite, notes=notes or "None",
        recent_logs=recent_logs or "No recent logs available",
    )
    return await _get_json_response(HEALTH_GUIDANCE_SYSTEM, user_prompt)


async def generate_activity(activity_type: str, difficulty: str, severity: str = "mild", level: int = 1, language: str = "en") -> dict:
    """Generate a cognitive activity — uses pre-built library when Ollama is the provider."""
    provider = get_ai_provider()

    # Ollama is rarely running locally — skip the 60s timeout and use the library instantly
    if provider == "ollama":
        return _get_fallback_activity(activity_type, difficulty, level)

    # OpenAI: try AI first, fall back to library on error
    try:
        from app.prompts.activity_prompts import ACTIVITY_GENERATION_SYSTEM, ACTIVITY_GENERATION_USER
        user_prompt = ACTIVITY_GENERATION_USER.format(
            severity=severity, activity_type=activity_type, difficulty=difficulty, level=level, language=language
        )
        sys_prompt = ACTIVITY_GENERATION_SYSTEM.format(language=language) if "{language}" in ACTIVITY_GENERATION_SYSTEM else ACTIVITY_GENERATION_SYSTEM
        
        result = await _get_json_response(sys_prompt, user_prompt)
        if "error" in result:
            return _get_fallback_activity(activity_type, difficulty, level)
        if "content" not in result:
             # Ensure format matches frontend expectations if AI drifted
             return {"type": activity_type, "content": result, "level": level}
        result["level"] = level
        return result
    except Exception:
        return _get_fallback_activity(activity_type, difficulty, level)


async def generate_consultation_summary(screening_data: str, ai_analysis: str) -> dict:
    from app.prompts.consultation_prompts import CONSULTATION_SUMMARY_SYSTEM, CONSULTATION_SUMMARY_USER
    user_prompt = CONSULTATION_SUMMARY_USER.format(
        screening_data=screening_data, ai_analysis=ai_analysis
    )
    return await _get_json_response(CONSULTATION_SUMMARY_SYSTEM, user_prompt)
