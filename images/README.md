# Restaurant Microsite — Image Assets

Place all client images here using the standardised naming convention below.

## Required Images

| Filename | Ratio | Section | Notes |
|---|---|---|---|
| `hero-bg.jpg` | 16:9 landscape | Hero background | Full-bleed, dark subject preferred |
| `about-main.jpg` | 3:4 portrait | About / Experience main | Interior or chef shot |
| `about-small.jpg` | 4:3 landscape | About / Experience secondary | Detail, plating, or ambience |
| `dish-01.jpg` | 1:1 square | Menu card 1 | Close-up plating |
| `dish-02.jpg` | 1:1 square | Menu card 2 | Close-up plating |
| `dish-03.jpg` | 1:1 square | Menu card 3 | Close-up plating |
| `dish-04.jpg` | 1:1 square | Menu card 4 | Close-up plating |
| `dish-05.jpg` | 1:1 square | Menu card 5 | Close-up plating |
| `dish-06.jpg` | 1:1 square | Menu card 6 | Close-up plating |
| `logo.svg` | — | Nav + Footer | SVG preferred, PNG fallback |

## Usage in index.html

Replace the emoji placeholder divs with:
```html
<img src="./images/dish-01.jpg" alt="[Dish name]" class="menu-card-img">
```

All images use `object-fit: cover` — imperfect ratios are handled automatically.
