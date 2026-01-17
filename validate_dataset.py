#!/usr/bin/env python3
"""Comprehensive validator for ultrasound dataset CSV"""

import pandas as pd
import re
import sys
from collections import defaultdict

# Expected columns in the new CSV
REQUIRED_COLUMNS = [
    'Dataset Name', 'Modalities', 'Clinical Application',
    'Registraition Type of Patients', 'Segmentaitions Available',
    'Landmarks Available', 'Meshes (STL) Available', 'Tracking / Pose Data',
    'Ground-Truth Transformations', 'Subjects', 'Link', 'Source',
    'DOI', 'Licence', 'Notes'
]

# Y/N columns
YN_COLUMNS = [
    'Segmentaitions Available', 'Landmarks Available',
    'Meshes (STL) Available', 'Tracking / Pose Data',
    'Ground-Truth Transformations'
]

# Whitelist of known variations (case-insensitive) for fuzzy match groups
# Items in the same list will not trigger fuzzy match warnings against each other
WHITELIST = {
    'Modalities': ['US', 'US (2D)', 'US (3D)', 'US (2D, 3D)', 'US (Video)', 'US (Sweep)', 'US (MicroUltrasound)', 'US (2D'],
    'Clinical Application': [
        'Brain Cancer', 'Breast Cancer', 'Lung Cancer', 'Liver Cancer', 'Uterus Cancer', 'Pancreas Cancer',
        'General', 'General MSK',
        'Prostate', 'Prostate Cancer'
    ],
}


def validate_url(url):
    """Basic URL validation."""
    if not isinstance(url, str):
        return False
    return re.match(r'^https?://', url) is not None


def validate_doi(doi):
    """Basic DOI validation. Adjusted to allow spaces at end and common TCIA formats."""
    if not isinstance(doi, str) or not doi.strip():
        return True  # DOI is optional
    # TCIA DOIs sometimes have extra slashes or dots
    return re.match(r'^10\.\d{4,9}/[-._;()/:A-Z0-9\s]+$', doi, re.I) is not None


def check_fuzzy_and_case(df, column, threshold=70):
    """Check for case inconsistencies and potential typos in categories."""
    try:
        from fuzzywuzzy import fuzz
    except ImportError:
        print("⚠️ fuzzywuzzy not installed, skipping fuzzy checks")
        return

    categories = set()
    for value in df[column].dropna():
        if isinstance(value, str):
            for part in value.split(','):
                cleaned = part.strip()
                if cleaned:
                    categories.add(cleaned)

    sorted_cats = sorted(list(categories))

    # Case consistency
    case_variations = defaultdict(list)
    for cat in sorted_cats:
        case_variations[cat.lower()].append(cat)

    for norm, variations in case_variations.items():
        if len(variations) > 1:
            print(f"❌ {column} - Case inconsistencies: {variations}")

    # Fuzzy similarity
    processed = set()
    for i, cat in enumerate(sorted_cats):
        if cat in processed:
            continue
        processed.add(cat)
        for other_cat in sorted_cats[i+1:]:
            if other_cat in processed:
                continue

            # Skip if both are in a whitelist group
            in_whitelist = False
            for group in WHITELIST.values():
                if cat in group and other_cat in group:
                    in_whitelist = True
                    break
            if in_whitelist:
                continue

            ratio = fuzz.token_sort_ratio(cat.lower(), other_cat.lower())
            if ratio >= threshold:
                print(
                    f"❌ {column} - Similar categories (potential typo): ['{cat}', '{other_cat}']")
                processed.add(other_cat)


def validate_dataset(file_path):
    print(f"🔍 Validating {file_path}...")
    errors = 0

    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        print(f"❌ Failed to read CSV: {e}")
        return False

    # 1. Check required columns
    missing_cols = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing_cols:
        print(f"❌ Missing columns: {missing_cols}")
        errors += 1

    # 2. Check for empty mandatory fields
    for idx, row in df.iterrows():
        name = row.get('Dataset Name')
        link = row.get('Link')

        if pd.isna(name) or not str(name).strip():
            print(f"❌ Row {idx+2}: Missing 'Dataset Name'")
            errors += 1

        if pd.isna(link) or not str(link).strip():
            print(f"❌ Row {idx+2}: Missing 'Link'")
            errors += 1
        elif not validate_url(link):
            print(f"❌ Row {idx+2}: Invalid URL in 'Link': {link}")
            errors += 1

        doi = row.get('DOI')
        if not validate_doi(doi):
            print(f"❌ Row {idx+2}: Potentially invalid DOI format: {doi}")
            errors += 1

        # Check Y/N columns
        for col in YN_COLUMNS:
            val = row.get(col)
            if pd.notna(val) and str(val).strip() not in ['Y', 'N', '']:
                print(
                    f"❌ Row {idx+2}: Column '{col}' must be 'Y', 'N' or empty. Found: '{val}'")
                errors += 1

    # 3. Fuzzy match and Case check
    for col in ['Modalities', 'Clinical Application']:
        if col in df.columns:
            check_fuzzy_and_case(df, col)

    if errors > 0:
        print(f"\nTotal errors found: {errors}")
        return False

    print("\n✅ Dataset validation passed!")
    return True


if __name__ == "__main__":
    csv_path = 'public/data/ultrasound_dataset_complete.csv'
    success = validate_dataset(csv_path)
    if not success:
        sys.exit(1)
