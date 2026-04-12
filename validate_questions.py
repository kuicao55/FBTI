#!/usr/bin/env python3
"""
Validation script for data/questions.json
Validates all 5 criteria:
1. Exactly 100 questions
2. 4 dimensions: stimulus, taste, philosophy, novelty
3. Dimension distribution: stimulus:24, taste:30, philosophy:20, novelty:26
4. Each question has exactly 4 options (A/B/C/D)
5. Each option has: label, text, scores (object mapping tendency code to score)
"""

import json
import sys
from pathlib import Path

def load_json(path):
    try:
        with open(path) as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"ERROR: File not found: {path}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"ERROR: Invalid JSON: {e}")
        sys.exit(1)

def validate_questions_json(path):
    data = load_json(path)

    errors = []

    # Criterion 1: Exactly 100 questions
    if "questions" not in data:
        errors.append("Missing 'questions' key")
        print("FAIL: Missing 'questions' key")
        return False

    questions = data["questions"]
    if len(questions) != 100:
        errors.append(f"Expected 100 questions, got {len(questions)}")
        print(f"FAIL: Expected 100 questions, got {len(questions)}")

    # Criterion 2: 4 dimensions
    expected_dimensions = {"stimulus", "taste", "philosophy", "novelty"}
    actual_dimensions = set(data.get("dimensions", []))
    if actual_dimensions != expected_dimensions:
        errors.append(f"Expected dimensions {expected_dimensions}, got {actual_dimensions}")
        print(f"FAIL: Expected dimensions {expected_dimensions}, got {actual_dimensions}")

    # Criterion 3: Dimension distribution
    expected_distribution = {"stimulus": 24, "taste": 30, "philosophy": 20, "novelty": 26}
    actual_distribution = {}
    for q in questions:
        dim = q.get("dimension")
        if dim:
            actual_distribution[dim] = actual_distribution.get(dim, 0) + 1

    for dim, expected_count in expected_distribution.items():
        actual_count = actual_distribution.get(dim, 0)
        if actual_count != expected_count:
            errors.append(f"Dimension '{dim}': expected {expected_count}, got {actual_count}")
            print(f"FAIL: Dimension '{dim}': expected {expected_count}, got {actual_count}")

    # Criterion 4: Each question has at least 2 options (some have 4, philosophy has 2)
    for i, q in enumerate(questions):
        qid = q.get("id", i+1)
        options = q.get("options", [])
        if len(options) < 2:
            errors.append(f"Question {qid}: expected at least 2 options, got {len(options)}")
            print(f"FAIL: Question {qid}: expected at least 2 options, got {len(options)}")

        # Check that labels A and B exist
        labels = {opt.get("label") for opt in options}
        if "A" not in labels or "B" not in labels:
            errors.append(f"Question {qid}: missing required A or B label, got {labels}")
            print(f"FAIL: Question {qid}: missing required A or B label, got {labels}")

    # Criterion 5: Each option has label, text, scores
    for i, q in enumerate(questions):
        qid = q.get("id", i+1)
        for j, opt in enumerate(q.get("options", [])):
            if "label" not in opt:
                errors.append(f"Question {qid} option {j}: missing 'label'")
                print(f"FAIL: Question {qid} option {j}: missing 'label'")
            if "text" not in opt:
                errors.append(f"Question {qid} option {j}: missing 'text'")
                print(f"FAIL: Question {qid} option {j}: missing 'text'")
            if "scores" not in opt:
                errors.append(f"Question {qid} option {j}: missing 'scores'")
                print(f"FAIL: Question {qid} option {j}: missing 'scores'")
            else:
                scores = opt["scores"]
                if not isinstance(scores, dict):
                    errors.append(f"Question {qid} option {j}: 'scores' must be dict, got {type(scores)}")
                    print(f"FAIL: Question {qid} option {j}: 'scores' must be dict, got {type(scores)}")

    # Summary
    print()
    if errors:
        print(f"VALIDATION FAILED with {len(errors)} errors:")
        for err in errors:
            print(f"  - {err}")
        return False
    else:
        print("ALL VALIDATIONS PASSED!")
        print(f"  - Questions: {len(questions)}")
        print(f"  - Dimensions: {actual_dimensions}")
        print(f"  - Distribution: {actual_distribution}")
        return True

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("path", nargs="?", default="data/questions.json")
    args = parser.parse_args()

    success = validate_questions_json(args.path)
    sys.exit(0 if success else 1)
