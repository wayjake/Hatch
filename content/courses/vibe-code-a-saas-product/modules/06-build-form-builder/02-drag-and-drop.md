---
title: Drag and Drop with React
duration: 15 min
type: hands-on
---

# Drag and Drop with React

Let's scaffold the project and build the interactive form builder interface.

## Scaffold

```bash
npx create-react-router@latest form-builder --yes
cd form-builder
git add .
git commit -m "Initial scaffold"
```

Third project, same rhythm. You're getting this.

## Install a DnD Library

Drag and drop from scratch is complex. We'll use a library:

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

`dnd-kit` is lightweight, accessible, and works well with React. AI generates solid dnd-kit code because there's plenty of training data on it.

## Vibe Code the Builder

This is a bigger prompt than our previous projects. Give the AI clear structure:

"Build a form builder interface. I need:

**Left sidebar — Field Types:**
A panel with draggable items: Text Input, Textarea, Select Dropdown, Checkbox. Users drag these onto the canvas to add them to the form.

**Center — Canvas:**
The main area where form fields are displayed. Fields can be reordered by dragging. Each field shows:
- The field type (icon + label)
- A 'Configure' button to edit settings
- A 'Remove' button to delete it

**Right sidebar — Field Settings:**
When a field is selected, show configuration options: label text, placeholder text, required toggle. For select fields, show an option to add/remove choices.

**Top bar:**
Form title (editable), a Preview button, and a Save button.

Use @dnd-kit/core and @dnd-kit/sortable for drag and drop. Tailwind for styling. Clean, professional look."

## Review What You Get

The AI will generate a fair amount of code for this one. Take your time reviewing:

- **Does dragging from the sidebar to the canvas work?** This is the core interaction.
- **Can you reorder fields on the canvas?** Drag a field up or down.
- **Does clicking "Configure" show the field settings?** The right sidebar should update.
- **Does the state make sense?** Fields should be stored in an array. Each field needs an ID, a type, and configuration properties.

If something doesn't work, don't panic. Drag and drop is fiddly. Describe the problem to your AI: "When I drag a text input from the sidebar, it doesn't appear on the canvas. Here's my code: [paste the relevant component]."

## The Data Shape

Pay attention to how the AI structures the form data. It should look something like:

```typescript
interface FormField {
  id: string;
  type: "text" | "textarea" | "select" | "checkbox";
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // for select fields
}

interface Form {
  id: string;
  title: string;
  fields: FormField[];
}
```

This data shape matters because we're about to store it in a database. Getting it right now saves headaches later.

## Add Preview Mode

Ask the AI to add a preview toggle that shows the form as a respondent would see it — real inputs, proper styling, no edit controls. This is a common pattern in builder-style apps.

## Commit

```bash
git add .
git commit -m "Add drag-and-drop form builder interface"
git push
```

The UI works. Next, we'll give it a database to save forms to.
