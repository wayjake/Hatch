---
title: How Courses Work
duration: 5 min
---

# How Courses Work

Every course in Hatch is organized into **modules** and **lessons**.

## Structure

```
course/
  modules/
    01-introduction/
      01-welcome.md
      02-how-it-works.md
      assets/
        images/
        videos/
    02-next-topic/
      01-first-lesson.md
```

## Modules

Modules are the top-level groupings of your course. Think of them as chapters in a book. Each module contains one or more lessons.

## Lessons

Lessons are individual Markdown files. Each lesson has frontmatter metadata at the top (title, duration) and the content below. You can include images, code blocks, and references to video assets.

## Assets

Each module has an `assets` directory for images and videos. Reference them in your Markdown to create rich, multimedia lessons.
