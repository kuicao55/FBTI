#!/usr/bin/env python3
"""
TDD Validation Script for data/types.json
Validates all 80 TasteType 3.1 personality types.

Validation criteria:
1. Exactly 80 types
2. Each type has: name, selfDescription, tasteSignature (array of 4 strings),
   analysis, dimensions (object with 4 keys: stimulus, taste, philosophy, novelty)
3. All 80 type keys match expected codes
4. Dimensions values match valid tendency codes per dimension
"""

import json
import sys
from pathlib import Path

# Valid tendency codes per dimension
VALID_STIMULUS = {'H', 'N', 'C', 'M'}
VALID_TASTE = {'U', 'S', 'W', 'B', 'O'}
VALID_PHILOSOPHY = {'A', 'S'}
VALID_NOVELTY = {'E', 'C'}

# Expected 80 type codes (4-character each)
# Format: stimulus + taste + philosophy + novelty
EXPECTED_CODES = set()
for stim in VALID_STIMULUS:
    for taste in VALID_TASTE:
        for phil in VALID_PHILOSOPHY:
            for nov in VALID_NOVELTY:
                EXPECTED_CODES.add(f"{stim}{taste}{phil}{nov}")

REQUIRED_FIELDS = {'name', 'selfDescription', 'tasteSignature', 'analysis', 'dimensions'}
REQUIRED_DIMENSION_KEYS = {'stimulus', 'taste', 'philosophy', 'novelty'}


def validate_types_json(filepath: str):
    """Validate types.json and return (is_valid, error_messages)"""
    errors = []

    # Check file exists
    path = Path(filepath)
    if not path.exists():
        return False, [f"File not found: {filepath}"]

    # Try to parse JSON
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        return False, [f"Invalid JSON: {e}"]

    # Check top-level structure
    if 'types' not in data:
        return False, ["Missing 'types' key at root level"]

    types_data = data['types']

    # Criterion 1: Exactly 80 types
    if len(types_data) != 80:
        errors.append(f"Expected 80 types, found {len(types_data)}")

    # Check for missing or extra type codes
    provided_codes = set(types_data.keys())
    missing_codes = EXPECTED_CODES - provided_codes
    extra_codes = provided_codes - EXPECTED_CODES

    if missing_codes:
        errors.append(f"Missing type codes ({len(missing_codes)}): {sorted(missing_codes)[:10]}{'...' if len(missing_codes) > 10 else ''}")
    if extra_codes:
        errors.append(f"Extra/unexpected type codes ({len(extra_codes)}): {sorted(extra_codes)}")

    # Validate each type entry
    for code, type_info in types_data.items():
        # Check required fields
        missing_fields = REQUIRED_FIELDS - set(type_info.keys())
        if missing_fields:
            errors.append(f"Type '{code}': missing fields {missing_fields}")

        # Validate tasteSignature
        if 'tasteSignature' in type_info:
            ts = type_info['tasteSignature']
            if not isinstance(ts, list):
                errors.append(f"Type '{code}': tasteSignature must be array, got {type(ts)}")
            elif len(ts) != 4:
                errors.append(f"Type '{code}': tasteSignature must have 4 elements, got {len(ts)}")
            elif not all(isinstance(s, str) for s in ts):
                errors.append(f"Type '{code}': tasteSignature must contain strings only")

        # Validate dimensions
        if 'dimensions' in type_info:
            dims = type_info['dimensions']
            if not isinstance(dims, dict):
                errors.append(f"Type '{code}': dimensions must be object, got {type(dims)}")
            else:
                # Check required dimension keys
                missing_dim_keys = REQUIRED_DIMENSION_KEYS - set(dims.keys())
                if missing_dim_keys:
                    errors.append(f"Type '{code}': dimensions missing keys {missing_dim_keys}")

                # Validate dimension values
                if 'stimulus' in dims:
                    if dims['stimulus'] not in VALID_STIMULUS:
                        errors.append(f"Type '{code}': invalid stimulus '{dims['stimulus']}' (valid: {VALID_STIMULUS})")
                if 'taste' in dims:
                    if dims['taste'] not in VALID_TASTE:
                        errors.append(f"Type '{code}': invalid taste '{dims['taste']}' (valid: {VALID_TASTE})")
                if 'philosophy' in dims:
                    if dims['philosophy'] not in VALID_PHILOSOPHY:
                        errors.append(f"Type '{code}': invalid philosophy '{dims['philosophy']}' (valid: {VALID_PHILOSOPHY})")
                if 'novelty' in dims:
                    if dims['novelty'] not in VALID_NOVELTY:
                        errors.append(f"Type '{code}': invalid novelty '{dims['novelty']}' (valid: {VALID_NOVELTY})")

                # Check that dimensions match the type code
                if len(code) == 4:
                    code_stim = code[0]
                    code_taste = code[1]
                    code_phil = code[2]
                    code_nov = code[3]

                    if 'stimulus' in dims and dims['stimulus'] != code_stim:
                        errors.append(f"Type '{code}': dimensions.stimulus '{dims['stimulus']}' doesn't match code first char '{code_stim}'")
                    if 'taste' in dims and dims['taste'] != code_taste:
                        errors.append(f"Type '{code}': dimensions.taste '{dims['taste']}' doesn't match code second char '{code_taste}'")
                    if 'philosophy' in dims and dims['philosophy'] != code_phil:
                        errors.append(f"Type '{code}': dimensions.philosophy '{dims['philosophy']}' doesn't match code third char '{code_phil}'")
                    if 'novelty' in dims and dims['novelty'] != code_nov:
                        errors.append(f"Type '{code}': dimensions.novelty '{dims['novelty']}' doesn't match code fourth char '{code_nov}'")

    # Check tasteSignature matches dimensions
    for code, type_info in types_data.items():
        if 'tasteSignature' in type_info and 'dimensions' in type_info:
            ts = type_info['tasteSignature']
            dims = type_info['dimensions']

            # tasteSignature format: ["X(desc)", "Y(desc)", "Z(desc)", "W(desc)"]
            # The first character should match the dimension value
            if len(ts) == 4 and len(code) == 4:
                expected_patterns = [
                    (dims.get('stimulus'), ts[0]),
                    (dims.get('taste'), ts[1]),
                    (dims.get('philosophy'), ts[2]),
                    (dims.get('novelty'), ts[3]),
                ]

                for dim_val, sig_str in expected_patterns:
                    if dim_val and sig_str and not sig_str.startswith(dim_val):
                        errors.append(f"Type '{code}': tasteSignature '{sig_str}' doesn't start with dimension value '{dim_val}'")

    return len(errors) == 0, errors


def main():
    filepath = sys.argv[1] if len(sys.argv) > 1 else 'data/types.json'

    print(f"Validating: {filepath}")
    print("-" * 50)

    is_valid, errors = validate_types_json(filepath)

    if is_valid:
        print("ALL VALIDATIONS PASSED!")
        print("  - Types: 80")
        print("  - All required fields present")
        print("  - All dimension values valid")
        print("  - Type codes match expected set")
        return 0
    else:
        print("VALIDATION FAILED:")
        for error in errors:
            print(f"  - {error}")
        return 1


if __name__ == '__main__':
    sys.exit(main())
