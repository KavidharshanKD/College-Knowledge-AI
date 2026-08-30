#!/usr/bin/env python
"""Comprehensive End-to-End RAG Test Script for College AI Knowledge Base."""

import sys

# Force UTF-8 output formatting for Windows console
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from pathlib import Path

# Ensure backend is in python path
current_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(current_dir))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("=" * 80)
print("     COLLEGE AI KNOWLEDGE BASE - END-TO-END RAG VERIFICATION TEST")
print("=" * 80)

# Step 1: Login User
print("\n1. USER LOGIN VERIFICATION")
print("-" * 80)
login_res = client.post("/api/auth/login", json={
    "name": "Verification Student",
    "email": "student@college.edu"
})

if login_res.status_code != 200:
    print(f"FAILED: Login endpoint returned {login_res.status_code}: {login_res.text}")
    sys.exit(1)

user_data = login_res.json()
user_id = user_data.get("user_id")
print(f"SUCCESS: User logged in with ID: {user_id}")

# Test Cases
test_cases = [
    {
        "id": "A",
        "question": "What is the syllabus for TY AIML?",
        "expected_keywords": ["Machine Learning", "Database", "Deep Learning", "AIML", "Third Year"],
        "should_find": True
    },
    {
        "id": "B",
        "question": "What subjects are included in the Third Year Artificial Intelligence and Machine Learning curriculum?",
        "expected_keywords": ["Machine Learning", "Big Data", "Digital Image Processing", "Soft Computing", "Advanced Data Structures"],
        "should_find": True
    },
    {
        "id": "C",
        "question": "Tell me the subjects and course names in the AIML TY 2025-26 syllabus.",
        "expected_keywords": ["AIML", "2025-26", "Machine Learning", "Course"],
        "should_find": True
    },
    {
        "id": "D (Negative Test)",
        "question": "What is the NASA space shuttle launch schedule for 2027?",
        "expected_keywords": ["could not find", "not found"],
        "should_find": False
    }
]

print("\n2. EXECUTING CHAT RAG TEST CASES")
print("=" * 80)

all_passed = True

for case in test_cases:
    print(f"\n--- TEST CASE {case['id']} ---")
    print(f"Query: \"{case['question']}\"")
    
    response = client.post("/api/chat", json={
        "user_id": user_id,
        "message": case['question']
    })
    
    if response.status_code != 200:
        print(f"FAIL: HTTP {response.status_code} - {response.text}")
        all_passed = False
        continue
        
    chat_data = response.json()
    assistant_msg = chat_data.get("assistant_message", {}).get("content", "")
    sources = chat_data.get("sources", [])
    
    print(f"HTTP Status: 200 OK")
    print(f"Sources Returned: {len(sources)}")
    
    if sources:
        print("Retrieved Source Documents:")
        for idx, src in enumerate(sources[:4], 1):
            doc_name = src.get("document_filename", "Unknown")
            cat = src.get("category", "General")
            page = src.get("page_number", 1)
            score = src.get("score", 0.0)
            print(f"  [{idx}] {doc_name} (Category: {cat}, Page: {page}, Similarity Score: {score})")
    
    print(f"\nAnswer Snippet:\n{assistant_msg[:400]}...\n")
    
    # Check Relevance for Positive Tests
    if case['should_find']:
        aiml_sources = [s for s in sources if "aiml" in s.get("document_filename", "").lower()]
        unrelated_sources = [s for s in sources if any(dep in s.get("document_filename", "").lower() for dep in ["mechanical", "civil", "chemical", "etc"])]
        
        if aiml_sources:
            print(f"PASS: Correct AIML source document(s) retrieved ({len(aiml_sources)} AIML sources).")
        else:
            print("WARNING: No AIML document found in top sources!")
            all_passed = False
            
        if unrelated_sources:
            print(f"WARNING: Found {len(unrelated_sources)} unrelated department sources in retrieval results.")
        else:
            print("PASS: No unrelated department documents (Mechanical/Civil/ETC) in retrieval sources.")
    else:
        # Check Negative Test Response
        if "could not find" in assistant_msg.lower() or "not found" in assistant_msg.lower():
            print("PASS: System correctly responded that information was NOT found for negative query.")
        else:
            print("FAIL: System hallucinated or did not state that info was missing!")
            all_passed = False

print("\n" + "=" * 80)
if all_passed:
    print("ALL TEST CASES PASSED SUCCESSFULLY!")
else:
    print("SOME TEST CASES REQUIRE REVIEW.")
print("=" * 80)
