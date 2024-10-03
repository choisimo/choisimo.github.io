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
#featured: "/images/post/1/featured.jpg"
commentable: true # 댓글 허용 여부
bannner: 
  image: "/images/post/1/banner.jpg"
image:
  placement: 1 
  focal_point: 'Left' # 
  preview_only: true # 썸네일에만 적용
show_related: true # 관련 컨텐츠 추천 표시
#profile: true # 작성자 프로필 표시 
#reading_time: true # 읽는 시간 표시
#show_date: true # 게시 날짜 표시

---
w
Hugo library 에서 MD 파일에  &lt;!--more--&gt;  사용하여 요약문 보여주기
<!--more-->
![.Summary 사용](https://github.com/user-attachments/assets/42e76be2-9749-47c2-92a4-a14ea5f91237)


```
본문에서 "<!--more-->" 지정한 부분 직전까지만 출력된다.
HTML에서 "{{ .Summary }}" 를 사용하여 리스트 상에 보여줄 수 있다.
```