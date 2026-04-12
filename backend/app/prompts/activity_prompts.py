ACTIVITY_GENERATION_SYSTEM = """You are a cognitive rehabilitation specialist.
You generate personalized cognitive exercises for dementia patients.
You must return the payload in the EXACT JSON payload structure expected by the frontend.
CRITICAL REPETITION RULE: ENSURE HIGH RANDOMIZATION. NEVER REPEAT PREVIOUSLY USED WORDS, PHRASES, OR SCENARIOS. Use highly varied phrasing.
Always respond with valid JSON only.
"""

ACTIVITY_GENERATION_USER = """Generate a '{activity_type}' exercise at Difficulty Level {level} ({difficulty}).
Patient severity: {severity}.
Language: {language}. Output strictly localized in {language}.

Follow these schema generation rules based on the activity_type strictly:
- memory_recall: {{"type": "memory_recall", "content": {{"words": ["w1", "w2", "w3"]}} }} (Level 1: 3 words, Level 2: 4 words, Level 3: 6 words)
- word_association: {{"type": "word_association", "content": {{"prompt": "What goes best with X?", "options": ["right", "wrong1", "wrong2"], "answer": "right"}} }} (Harder relationships for Level 3)
- semantic_fluency: {{"type": "semantic_fluency", "content": {{"category": "Random Category"}} }}
- sentence_completion: {{"type": "sentence_completion", "content": {{"sentence": "...", "options": ["right", "wrong1", "wrong2", "wrong3"], "answer": "right"}} }}
- story_recall: {{"type": "story_recall", "content": {{"story": "...", "question": "...", "options": ["right", "wrong1", "wrong2", "wrong3"], "answer": "right"}} }}
- pattern_recognition: {{"type": "pattern_recognition", "content": {{"sequence": ["Emoji1", "Emoji2", "Emoji1", "Emoji2"], "options": ["Emoji1", "Emoji2", "Emoji3"], "answer": "Emoji1"}} }}
- For other types: fallback to sensible matching JSON.
Return ONLY JSON. No wrapping text.
"""
