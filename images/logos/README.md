# Agency logos for the homepage

Drop the files here, then in `index.html` find the `trust-mark` row and put an
image inside the span, deleting the text:

```html
<span class="trust-mark">
  <img src="images/logos/romolini.svg" alt="Romolini" class="h-full w-auto" />
</span>
```

The height, spacing and muting are already set, so a logo dropped in matches
the others without further work.

**SVG is best.** It stays sharp at any size and weighs almost nothing. PNG with
a transparent background is fine; JPG is not, because the white box around it
will show against the photograph.

The row sits over a dark image, so the CSS turns every mark white. A logo that
is already white works. So does a dark one, because it gets inverted. A
multi-coloured one loses its colours, which is usually what you want in a
"trusted by" row and is worth checking with the agency first.

**Ask before you use a mark.** Reproducing a logo needs the agency's written
permission, and Engel & Völkers in particular runs a franchise network with
strict brand rules. Names are safe; marks are not.
