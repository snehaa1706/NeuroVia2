"""
NeuroVia Clock Analysis — Phase 5
OpenCV-based structural analysis of clock drawing tests.
Serves as an independent, deterministic evaluator alongside AI vision.
"""

import base64
import logging
from typing import Dict, Any, Tuple
import numpy as np

try:
    import cv2
except ImportError:
    cv2 = None

logger = logging.getLogger(__name__)


class ClockAnalyzer:
    """Evaluates clock drawing images using deterministic OpenCV heuristics."""

    @classmethod
    def decode_image(cls, b64_str: str) -> np.ndarray:
        """Decode base64 string to OpenCV BGR image matrix."""
        # Strip data URI header if present
        if "base64," in b64_str:
            b64_str = b64_str.split("base64,")[1]
            
        img_data = base64.b64decode(b64_str)
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Failed to decode image from base64 string")
        return img

    @classmethod
    def _detect_circle(cls, gray_img: np.ndarray) -> Tuple[bool, float]:
        """Detect the main clock face circle using Hough Transform."""
        # Blur to reduce noise
        blurred = cv2.GaussianBlur(gray_img, (9, 9), 2)
        
        # Hough Circles
        circles = cv2.HoughCircles(
            blurred, 
            cv2.HOUGH_GRADIENT, 
            dp=1.2, 
            minDist=100,
            param1=50, 
            param2=30, 
            minRadius=int(min(gray_img.shape)*0.2), 
            maxRadius=int(min(gray_img.shape)*0.9)
        )
        
        if circles is not None:
            # We found a circle, evaluate its quality (circularity)
            # A perfect circle gets 1.0. For Hough, param2 hit implies good circularity.
            return True, 1.0 
            
        # Fallback: Contour analysis if Hough fails
        _, thresh = cv2.threshold(gray_img, 127, 255, cv2.THRESH_BINARY_INV)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            return False, 0.0
            
        # Find largest contour
        largest_contour = max(contours, key=cv2.contourArea)
        area = cv2.contourArea(largest_contour)
        perimeter = cv2.arcLength(largest_contour, True)
        
        if perimeter == 0:
            return False, 0.0
            
        # Circularity = 4 * PI * (Area / Perimeter^2)
        circularity = 4 * np.pi * (area / (perimeter * perimeter))
        
        if circularity > 0.6: # Relaxed threshold for hand-drawn circles
            return True, min(1.0, circularity)
            
        return False, 0.0

    @classmethod
    def analyze_clock_image(cls, b64_image: str) -> Dict[str, Any]:
        """Full pipeline: decode -> grayscale -> edge -> detect circle -> detect interior objects."""
        if cv2 is None:
            logger.warning("[ClockAnalysis] OpenCV not installed. Returning safe fallback.")
            return {
                "score": 5, "max_score": 10,
                "assessment": "Computer Vision module unavailable.",
                "details": {"cv_error": "cv2 import failed"}
            }

        try:
            img = cls.decode_image(b64_image)
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Phase 1: Sub-scores start at 0
            circle_score = 0
            content_score = 0
            
            # Phase 2: Detect structural circle
            has_circle, circularity = cls._detect_circle(gray)
            if has_circle:
                circle_score = 2 + (circularity * 3) # Max 5 for the face
                
            # Phase 3: Detect interior components (numbers/hands) via blob counting
            # Center mask based on image size to look for hands/numbers
            h, w = gray.shape
            mask = np.zeros(gray.shape, dtype="uint8")
            cv2.circle(mask, (w//2, h//2), int(min(w,h)*0.4), 255, -1)
            
            masked_gray = cv2.bitwise_and(gray, gray, mask=mask)
            _, thresh = cv2.threshold(masked_gray, 127, 255, cv2.THRESH_BINARY_INV)
            
            # Count connected components (representing numbers/hands drawn inside)
            num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(thresh, connectivity=8)
            
            # Ignore background label [0]
            components_found = num_labels - 1 
            
            # Expect ~12 numbers + 2-3 hand components. 
            # Very rough heuristic: if we see 10-20 blobs, good layout.
            if 8 <= components_found <= 25:
                content_score = 5
            elif 3 <= components_found < 8:
                content_score = 3
            elif components_found > 25:
                content_score = 2 # Likely scribbles
                
            # Composite Total Score
            total = int(round(circle_score + content_score))
            total = max(0, min(total, 10))
            
            # Assessment generation
            if total >= 8:
                assessment = "Normal visual-spatial and executive function."
            elif total >= 5:
                assessment = "Mild spatial disorganization. Circle or components degraded."
            else:
                assessment = "Significant visual-spatial impairment. Pattern not recognized."
                
            return {
                "score": total,
                "max_score": 10,
                "assessment": assessment,
                "details": {
                    "has_circle": has_circle,
                    "circularity_metric": round(circularity, 2) if has_circle else 0,
                    "interior_components": components_found
                }
            }

        except Exception as e:
            logger.error(f"[ClockAnalysis] Pipeline failure: {e}")
            return {
                "score": 0, "max_score": 10,
                "assessment": "Error analyzing image structurally.",
                "details": {"error": str(e)}
            }
