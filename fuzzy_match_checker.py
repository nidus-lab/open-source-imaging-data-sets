#!/usr/bin/env python3
"""Fuzzy match checker for medical imaging dataset - detects typos and inconsistencies"""

import pandas as pd
from fuzzywuzzy import fuzz
from collections import defaultdict

# Whitelist of known acceptable variations (case-insensitive)
WHITELIST = {
    'Ultrasound': ['MicroUltrasound', 'Ultrasound'],
    'General': ['General', 'General MSK'],
}

def extract_categories(df, column):
    """Extract unique categories from comma-separated column."""
    categories = set()
    for value in df[column].dropna():
        if isinstance(value, str):
            for category in value.split(','):
                cleaned = category.strip()
                if cleaned: categories.add(cleaned)
    return sorted(list(categories))

def find_similar_categories(categories, threshold=70):
    """Find categories that are similar using fuzzy matching."""
    similar_groups = []
    processed = set()

    for i, category in enumerate(categories):
        if category in processed: continue
        similar = [category]
        processed.add(category)

        for other_category in categories[i+1:]:
            if other_category in processed: continue

            # Check if both categories are in the same whitelist group
            in_whitelist = False
            for whitelist_group in WHITELIST.values():
                if (category.lower() in [w.lower() for w in whitelist_group] and
                    other_category.lower() in [w.lower() for w in whitelist_group]):
                    in_whitelist = True
                    break

            if in_whitelist: continue

            max_similarity = max(
                fuzz.ratio(category.lower(), other_category.lower()),
                fuzz.partial_ratio(category.lower(), other_category.lower()),
                fuzz.token_sort_ratio(category.lower(), other_category.lower())
            )
            if max_similarity >= threshold:
                similar.append(other_category)
                processed.add(other_category)

        if len(similar) > 1: similar_groups.append(similar)

    return similar_groups

def check_case_consistency(categories):
    """Check for case inconsistencies in categories."""
    case_variations = defaultdict(list)
    for category in categories:
        case_variations[category.lower()].append(category)

    inconsistent = {norm: variations for norm, variations in case_variations.items()
                   if len(variations) > 1}

    # Filter out whitelisted variations
    filtered_inconsistent = {}
    for norm, variations in inconsistent.items():
        # Check if this is a whitelisted group
        is_whitelisted = False
        for whitelist_group in WHITELIST.values():
            if norm in [w.lower() for w in whitelist_group]:
                whitelist_variations = [w.lower() for w in whitelist_group]
                if all(v.lower() in whitelist_variations for v in variations):
                    is_whitelisted = True
                    break

        if not is_whitelisted:
            filtered_inconsistent[norm] = variations

    return filtered_inconsistent

def analyze_column(df, column, threshold=70):
    """Analyze column for typos and inconsistencies."""
    categories = extract_categories(df, column)

    case_errors = check_case_consistency(categories)
    if case_errors:
        print(f"❌ {column} - Case inconsistencies: {case_errors}")

    similar_groups = find_similar_categories(categories, threshold)
    if similar_groups:
        print(f"❌ {column} - Similar categories: {similar_groups}")

# Main execution
if __name__ == "__main__":
    try:
        df = pd.read_csv('public/data/snapshot-dataset.csv')

        for column in ['Area of body', 'Imaging type']:
            if column in df.columns:
                analyze_column(df, column)

    except FileNotFoundError:
        print("❌ File not found: public/data/snapshot-dataset.csv")
    except Exception as e:
        print(f"❌ Error: {e}")