---
# A section created with the Portfolio widget.
# This section displays content from `content/project/`.
# See https://docs.hugoblox.com/widget/portfolio/
widget: portfolio

# This file represents a page section.
headless: true

# Order that this section appears on the page.
weight: 20

title: ''
subtitle: ''

content:
  # Page type to display. E.g. project.
  page_type: project

  # Default filter index (e.g. 0 corresponds to the first `filter_button` instance below).
  filter_default: 0


design:
  columns: '1'
  view: masonry
  flip_alt_rows: true
  background: {}
  spacing: {padding: [0, 0, 0, 0]}


# image filename : default :: static/
section:  
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
            #color


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
              filename: slider1.jpg
              filters:
                brightness: 0.5
            position: center
            #color




        - title: 11223344
          content: 1234
          align: center
          background:
            image:
              filename: slider1.jpg
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

