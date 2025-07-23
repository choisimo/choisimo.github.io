---
# A section created with the Blank widget.
# Any elements can be added in the body: https://docs.hugoblox.com/reference/content-blocks/
widget: blank
headless: true

# Order that this section appears on the page.
weight: 30

title: '최근 게시물'
subtitle: ''

design:
  columns: '1'
  spacing:
    padding: ['20px', '0', '20px', '0']
---

<div class="cards-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 2rem; margin-top: 2rem;">
  {{ range first 6 (where .Site.RegularPages "Type" "post") }}
    <div class="card">
      <a href="{{ .Permalink }}" style="text-decoration:none; color:inherit;">
        <div class="card-image">
          {{ if .Params.featured_image }}
            <img src="{{ .Params.featured_image }}" alt="{{ .Title }}" loading="lazy">
          {{ else if .Params.banner.image }}
            <img src="/media/{{ .Params.banner.image }}" alt="{{ .Title }}" loading="lazy">
          {{ else }}
            <img src="/media/header.jpg" alt="{{ .Title }}" loading="lazy">
          {{ end }}
        </div>
        <div class="card-content">
          <h3>{{ .Title }}</h3>
          <p>{{ .Summary | truncate 120 }}</p>
          <p><small>{{ .Date.Format "2006년 1월 2일" }}</small></p>
          <span class="btn">자세히 보기</span>
        </div>
      </a>
    </div>
  {{ end }}
</div>
