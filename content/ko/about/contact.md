---
# An instance of the Contact widget.
# Documentation: https://docs.hugoblox.com/getting-started/page-builder/
widget: contact

# This file represents a page section.
headless: true

# Order that this section appears on the page.
weight: 50

title: 연락 방법
subtitle:

content:
  # Automatically link email and phone or display as text?
  autolink: true

  # Email form provider
  form:
    provider: netlify
    formspree:
      id:
    netlify:
      # Enable CAPTCHA challenge to reduce spam?
      captcha: false

design:
  columns: '1'


content:
  coordinates:
    latitude: '35.4949'
    longitude: '127.0811'
---



[연락](https://choisimo.github.io/contact/)
[연락]({{< relref "/contact" >}})
