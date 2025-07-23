---
title: "Which AI Model Should I Use for Coding?"
date: 2025-01-24T10:00:00+09:00
draft: false
tags: ["AI", "Development", "GPT", "Claude", "Gemini", "Coding"]
categories: ["Technology"]
author: "choisimo"
description: "From a developer's perspective, comparing major AI models like GPT, Claude, and Gemini after actually using them"
---

I've been getting a lot of help from AI when developing recently, but honestly, I'm confused about which model to use. GPT-4o, Claude, Gemini... I want to organize what's different about each and when to use what.

## Why is Context Window Important?

The most important thing when choosing an AI model is the **context window** size. Simply put, it's the amount of information AI can remember at once.

For example, GPT-4o has about 32,000 tokens, which is roughly 100 pages. But in reality, system messages, previous conversation content, etc. are all included, so what you can actually use is less.

There are two approaches here:

1. **Native Long Context**: Using models like Gemini that have extremely large context windows
2. **RAG (Retrieval-Augmented Generation)**: Selectively giving only necessary information to the model

Personally, Gemini's long context was really convenient when working on large projects. I could put the entire codebase at once and say "find the buggy parts in this project."

## Characteristics of Each Model

### OpenAI GPT Series

- **GPT-4o**: 128,000 tokens, fast and stable
- **GPT-4.1**: 1,000,000 tokens, for complex tasks
- **Reasoning models (o1, o3)**: Specialized for complex logical tasks

I use GPT-4o the most, and it's sufficient for general coding tasks. However, it's disappointing that when using ChatGPT, the actual context is much smaller than the API.

### Anthropic Claude

- **Claude 3.5 Sonnet**: 200,000 tokens, strong in coding
- **Claude 3.7 Sonnet**: Can output 64,000 tokens in extended mode

Personally, Claude had the best code quality. It scored around 92-93% on the HumanEval benchmark, the highest level, and when I actually used it, it produced clean code.

### Google Gemini

- **Gemini 1.5 Pro**: 2,000,000 tokens(!)
- **Gemini 2.5 Pro**: Performance improvement + enhanced agent functionality

Gemini's 2 million tokens is really overwhelming. When I want to analyze an entire large project at once, I have no choice but to use this.

## How's the Actual Performance?

Looking at benchmark scores:

- **HumanEval (simple code generation)**: Claude 3.5 Sonnet (92%) > GPT-4o (90%) > Gemini 1.5 Pro (84%)
- **SWE-bench (actual issue resolution)**: This is more complex. Even the same model can have performance differences of more than 2x depending on what tools it's used with.

For example, GPT-4o was 18% on SWE-bench, but when used with other tools, it went up to 38%. This means how you use it is more important than the model itself.

## When Should I Use What?

Based on my personal usage experience:

### Large Codebase Analysis
- **Gemini 2.5 Pro** recommended
- Best when putting entire projects at once for refactoring or structural analysis

### General Coding, Bug Fixes
- **Claude 3.5/3.7 Sonnet** recommended  
- Best code quality and clean explanations

### Brainstorming, Complex Reasoning
- **GPT-4o/4.1** recommended
- Most balanced performance, knowledgeable about various topics

### Fast and Simple Tasks
- **GPT-4o mini** or **Gemini Flash** recommended
- Fast responses while saving costs

## Development Tools Are Important Too

Actually, these days, rather than using models directly, we often use integrated tools:

- **GitHub Copilot**: Direct editor integration, mixed use of multiple models
- **Cursor**: I hear the agent functionality is good  
- **Greptile**: Specialized for enterprise codebase analysis

These tools conveniently handle complex context management for us.

## What About the Future?

Context windows keep getting bigger, so it seems like we'll be able to put all information at once and process it without complex systems like RAG.

Looking at how Gemini 2.5 Pro achieved over 50% SWE-bench score with just simple prompts without complex tools, it seems like it'll get simpler in the future.

Of course, there's the cost issue. Long contexts get exponentially more expensive. But it's gradually being solved with features like Google's context caching.

## Conclusion

Ultimately, there's no "best model." Different models are suitable for different tasks.

I usually:
- Large project analysis: Gemini
- General coding: Claude  
- Quick questions: GPT-4o

I use them mixed like this. I hope you'll try them yourself and find what works for you.