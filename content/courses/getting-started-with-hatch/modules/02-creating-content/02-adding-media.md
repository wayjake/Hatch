---
title: Adding Media
duration: 6 min
---

# Adding Media

Enrich your lessons with images and videos stored in each module's `assets` directory.

## Images

Reference images from your module's assets folder:

```markdown
![Description of image](./assets/images/screenshot.png)
```

Keep images optimized for the web — aim for under 500KB per image when possible.

## Videos

Videos can be embedded by referencing files in your assets directory:

```markdown
[video](./assets/videos/demo.mp4)
```

Hatch will render these as inline video players in the lesson view.

## Best Practices

- Use descriptive filenames: `dashboard-overview.png` not `img1.png`
- Keep video segments short — 2 to 5 minutes per clip
- Add alt text to all images for accessibility
- Organize assets by type (images vs videos) within each module
