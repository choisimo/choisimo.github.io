---
# This file represents a page section.
headless: true

# Order that this section will appear in.
weight: 10

author: admin


design:
  background:
    image: "/image/background/main.jpg"     # 배경으로 사용할 이미지 파일 경로
    filters:
      brightness: 0.9                     # Range 0 - 1 : 1 is transparent and 0 is opaque
      opacity: 0.5
    position: center                        # 배경 이미지의 위치 (center, contain, actual)
    size: cover                             # 배경 이미지가 전체 화면을 덮도록 설정
    repeat: no-repeat                       # 배경 이미지가 반복되지 않도록 설정
    color: '#e6ffc7'                        # 배경 이미지가 없을 때 기본 색상
    parallax: true                          # fixed background effect on desktop
    #text_color_light: true                  

      
# image filename : default :: static/
sections:  
  
  - block: slider
    content: 
      slides:

        - title: 11223344
          content: 1234
          align: center
          background:
            image:
              filename: /images/home/slider1.jpg
              filters:
                brightness: 0.5
            position: center
            color: '#000'


        - title: 11223344
          content: 1234
          align: center
          background:
            image:
              filename: /images/home/slider2.jpg
              filters:
                brightness: 0.5
            position: center
            #color


        - title: 11223344
          content: 1234
          align: center
          background:
            image:
              filename: /images/home/slider3.jpg
              filters:
                brightness: 0.5
            position: center
            #color


        - title: 11223344
          content: 1234
          align: center
          background:
            image:
              filename: /images/home/slider4.jpg
              filters:
                brightness: 0.5
            position: center
            #color


        - title: 11223344
          content: 1234
          align: center
          background:
            image:
              filename: /images/home/slider5.jpg
              filters:
                brightness: 0.5
            position: center
            #color


    design: 
      slide_height: "500px"
      slide_width: "100px"
      is_fullscreen: false
      loop: true
      interval: 2000
---

{style="font-size: 1.2rem; background: #FFB76B; background: linear-gradient(to right, #FFB76B 0%, #FFA73D 30%, #FF7C00 60%, #FF7F04 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;"}

### 최시몬
||||
|--|--|--|
|**소속**|전북대학교 &ensp;[링크](https://www.jbnu.ac.kr/kor/)|
|**전공**|컴퓨터 공학부 &ensp;[링크](https://csai.jbnu.ac.kr/csai/index.do)|
|**관심**|서버, 네트워크, 자동화 등|
|**연락**|[![이메일](/icons/envelope-at.svg)](mailto:nodove@nodove.com) &ensp; [![사이트](/icons/box-arrow-up-right.svg)](nodove.com) &ensp; [![채팅](/icons/chat-left.svg)](chat.career-block.com?receiver=nodove) &ensp; [![깃허브](/icons/iconmonstr-github-1.svg)](https://choisimo.github.com)|
|**스택**|[![](/icons/code.svg)]()|
||
