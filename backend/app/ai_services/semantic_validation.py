"""
NeuroVia Semantic Validation — Phase 4
Evaluates categorical arrays against wordlists substituting heavy NLP downloads.
"""

import difflib
from typing import List, Dict, Any

class SemanticValidator:
    """Validates user categorical lists against curated dictionaries with fuzzy spellchecking."""
    
    # Internal curation minimizes external API calls or 1GB spacy models
    CATEGORIES = {
        "animals": {
            "dog", "cat", "horse", "cow", "pig", "sheep", "goat", "lion", "tiger", "bear",
            "wolf", "fox", "deer", "elephant", "giraffe", "monkey", "ape", "rabbit", "mouse",
            "rat", "bird", "eagle", "hawk", "owl", "penguin", "fish", "shark", "whale", "dolphin",
            "frog", "toad", "snake", "lizard", "turtle", "spider", "ant", "bee", "butterfly",
            "chicken", "duck", "goose", "turkey", "camel", "zebra", "rhino", "hippo", "kangaroo",
            "koala", "panda", "sloth", "bat", "seal", "walrus"
        },
        "fruits": {
            "apple", "banana", "orange", "grape", "strawberry", "blueberry", "raspberry",
            "blackberry", "watermelon", "cantaloupe", "honeydew", "pineapple", "mango",
            "peach", "plum", "cherry", "pear", "kiwi", "lemon", "lime", "coconut",
            "pomegranate", "fig", "date", "apricot", "nectarine", "grapefruit", "cranberry"
        },
        "clothing": {
            "shirt", "pants", "jeans", "shorts", "dress", "skirt", "sweater", "jacket",
            "coat", "socks", "shoes", "boots", "sandals", "sneakers", "hat", "cap",
            "gloves", "scarf", "tie", "belt", "underwear", "bra", "panties", "swimsuit",
            "pajamas", "robe", "slippers"
        }
    }

    @classmethod
    def validate_semantic_answers(cls, words: List[str], category: str = "animals") -> Dict[str, Any]:
        """
        Scores verbal fluency: category adherence, spelling (fuzzy), and duplicate removal.
        """
        # Normalization
        cat_lower = category.lower().strip()
        expected_set = cls.CATEGORIES.get(cat_lower, cls.CATEGORIES["animals"])  # fallback
        
        valid = []
        invalid = []
        duplicates = []
        
        # Track seen to catch duplicates across varying casing/spelling
        seen = set()

        for raw_w in words:
            if not raw_w:
                continue
                
            w = str(raw_w).lower().strip()
            
            # Duplication Check First
            if w in seen:
                duplicates.append(w)
                continue
                
            # 1. Exact Match Check
            if w in expected_set:
                valid.append(w)
                seen.add(w)
                continue
                
            # 2. Fuzzy Match Check (Handle MCI spelling errors)
            closest = difflib.get_close_matches(w, expected_set, n=1, cutoff=0.8)
            if closest:
                # E.g. "elliphant" -> matched to "elephant"
                matched_target = closest[0]
                if matched_target in seen:
                    # They already said elephant essentially
                    duplicates.append(w)
                else:
                    valid.append(w) # Giving credit for misspelled valid word
                    seen.add(matched_target)
            else:
                invalid.append(w)
                seen.add(w) # add to seen so we don't spam invalid array either
                
        return {
            "valid_words": valid,
            "invalid_words": invalid,
            "duplicates": duplicates,
            "score": len(valid)
        }
