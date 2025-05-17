#!/usr/bin/env python3
import os
import sys
import argparse
import openai
import google.generativeai as genai

def chatgpt_review(text, model):
    openai.api_key = os.getenv("OPENAI_API_KEY")
    if not openai.api_key:
        print("Error: OPENAI_API_KEY not set", file=sys.stderr)
        sys.exit(1)
    messages = [
        {"role": "system", "content": "You are a CI/CD assistant that reviews documents before deployment. Provide analysis of potential issues and improvements."},
        {"role": "user", "content": text}
    ]
    resp = openai.ChatCompletion.create(
        model=model,
        messages=messages,
        temperature=0.2
    )
    return resp.choices[0].message.content

def gemini_review(text, model):
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("Error: GOOGLE_API_KEY not set", file=sys.stderr)
        sys.exit(1)
    genai.configure(api_key=api_key)
    resp = genai.chat.completions.create(
        model=model,
        messages=[{"author": "user", "content": text}],
        temperature=0.2,
        candidate_count=1
    )
    return resp.candidates[0].content

def main():
    parser = argparse.ArgumentParser(description="AI CI/CD pre-review tool")
    parser.add_argument("file", help="Path to document to review")
    parser.add_argument("--provider", choices=["chatgpt", "gemini"], default="chatgpt")
    parser.add_argument("--model", help="Model to use", default=None)
    args = parser.parse_args()

    if not os.path.isfile(args.file):
        print(f"Error: file {args.file} not found", file=sys.stderr)
        sys.exit(1)

    with open(args.file, "r", encoding="utf-8") as f:
        content = f.read()

    model = args.model or ("gpt-3.5-turbo" if args.provider == "chatgpt" else "models/chat-bison-001")

    print(f"=== AI Review ({args.provider}, model={model}) ===\n")
    review = chatgpt_review(content, model) if args.provider == "chatgpt" else gemini_review(content, model)
    print(review)

if __name__ == "__main__":
    main()
