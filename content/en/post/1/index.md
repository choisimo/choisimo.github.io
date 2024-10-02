---
widget: post
title: "[Hugo] .Summary 사용법"
date: "2024-10-02"
draft: false
description: "Hugo-library .Summary 사용법에 관한 포스트입니다."
tags:
  - "library"
  - "hugo"
  - "Summary"
  - "GoLang"
categories:
  - "hugo"
type: post
featured: "/images/post/1/featured.jpg"
---

In Hugo library, show only the portion of the content
 by using &lt;!--more--&gt; on it's own content.
 
<!--more-->
![.Summary 사용](https://github.com/user-attachments/assets/42e76be2-9749-47c2-92a4-a14ea5f91237)


```code
 In Hugo, when you use "<!--more-->" in the body of a post, the content before this marker is used as the summary. 

You can display this summary in a list view by using 
"{{ .Summary }}" in the HTML template.

Only the portion of the content before the <!--more--> marker will be shown.
```