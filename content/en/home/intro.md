---
# Use the Intro widget of the Blog template

# This file represents a page section.
headless: true

# Order that this section will appear in.
weight: 10

#author: admin

design:
  background:
    image: "/image/background/main.jpg"     # 배경으로 사용할 이미지 파일 경로
    filters:
        brightness: 0.6                     # Range 0 - 1 : 1 is transparent and 0 is opaque
    position: center                        # 배경 이미지의 위치 (center, contain, actual)
    size: cover                             # 배경 이미지가 전체 화면을 덮도록 설정
    repeat: no-repeat                       # 배경 이미지가 반복되지 않도록 설정
    color: '#F5F5F5'                        # 배경 이미지가 없을 때 기본 색상
    parallax: true                          # fixed background effect on desktop
    text_color_light: true                  
    

---

{style="font-size: 1.2rem; background: #FFB76B; background: linear-gradient(to right, #FFB76B 0%, #FFA73D 30%, #FF7C00 60%, #FF7F04 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;"}

intro