# Web Design Notes for a Coding Agent

## Goal

Convert the following design principles into implementation-friendly guidance for building or styling a landing page or marketing site.

## 6 Tips for best design 

---

## Tip 1: Typography

### Principle

Choose an **anchor font for the headline first**, not the body text. The headline font defines the page’s personality and tone.

### Rules

* The anchor font should match the brand personality:

  * modern
  * technical
  * warm
  * approachable
* Then choose supporting fonts that feel like they belong to the same visual family or “world.”
* Supporting fonts should create **clear contrast** without feeling disconnected.

  * Example: condensed headline font + wider sans-serif subheading font
* Avoid font pairings that are too similar.

  * Bad example: `Georgia + Times New Roman`
  * This looks accidental rather than intentional.
* Use resources like **Fonts In Use** to find proven real-world pairings for the anchor font.

### Example

* Anchor headline font: **Instrument Serif**
* Supporting font: **Geist Sans**
* Reason:

  * Instrument Serif is condensed and expressive.
  * Geist Sans is wider and cleaner.
  * The contrast is obvious, but the pairing still feels harmonious.

---

## Tip 2: Add a “Star of the Show”

### Principle

Every strong site should have one dominant visual element that immediately grabs attention and creates emotion.

### The “star” can be

* a font treatment
* an image
* a motion element
* an abstract object
* a product-related visual device

### Rules

* The star should stand out clearly from everything else.
* It should hold attention long enough for users to engage with the rest of the page.
* Do **not** choose it only because it looks cool.
* It must connect directly to the product story or site purpose.

---

## Tip 3: Use Visual Rhyming

### Principle

Visual rhyming means repeating small visual details across the site so everything feels connected.

### What can be repeated

* shapes
* colors
* gradients
* textures
* motifs
* icon logic
* layout patterns

### Rules

* Do not literally copy-paste the same element everywhere.
* Instead, reuse parts of the strongest visual ideas in different contexts.
* The best motifs often come from:

  * the logo
  * the star of the show
  * product metaphors

### Examples

#### Inspiration site 1

* Curved shapes from the logo are echoed in:

  * button overlays
  * arrow icons
* Result: subtle cohesion across the page

#### Inspiration site 2

* The “key” is the central visual metaphor
* Key-related shapes and layout ideas repeat in:

  * cards
  * section backgrounds
  * scroll-based transitions

---

## Tip 4: Add Subtle Depth

### Principle

Good modern interfaces often feel spatial, not flat. The page should feel layered and tangible.

### Methods

Add depth through:

* texture
* noise
* layered backgrounds
* glass effects
* soft 3D-like treatment
* translucency

### Rule

All depth effects must stay **subtle**. They should support the interface, not compete with the main visual.

### Example

#### SaaS redesign

* Add noise to the hero/star visual to make it feel tactile
* A Figma plugin like **Noise and Texture** can do this quickly
* Reuse the glassy quality of the star in:

  * cards
  * navbar elements
* Result: more layered depth across the page

---

## Tip 5: Use Text Opacity for Hierarchy

### Principle

Hierarchy should not rely only on font size and font weight. Opacity is another strong signal.

### Idea

Use different text opacity levels to indicate importance.

### Inspiration

Material-style hierarchy often uses something like:

* high emphasis: `87%`
* medium emphasis: `60%`

### Meaning

Different opacity levels tell the eye:

* read this first
* read this second
* ignore this unless needed

### Example

#### SaaS redesign

* Headline: `100%` opacity
* Subheading: around `70%` opacity
* Result:

  * the hierarchy feels cleaner
  * the page becomes easier to scan
  * the change is subtle but effective

---

## Tip 6: Push Beyond the First Idea

### Principle

The first decent design idea is usually not the best one.

### Analogy

In music production, artists are often pushed to try extreme alternatives:

* faster tempo
* slower tempo
* different key
* octave up
* octave down

This helps them break out of the first obvious arrangement.

### Design equivalent

After the first pass, make **radically different variations** instead of only polishing the original version.

### Things to vary

* dark mode vs light mode
* hero composition
* card structure
* typography direction
* visual motif system
* star of the show concept

### Example

For one project:

* 12 different versions of the same star visual were explored
* the first version was acceptable
* later iterations were much stronger

---



# Essential Web Design Skills

The focus is on systems and decision rules, not trends.

---

## 1. Typography Skills

### Core idea
Typography is foundational because text occupies most of the screen. Users often notice bad typography even if they cannot describe why it feels wrong.

To handle web typography well, answer two questions:

- How should fonts be chosen?
- How should typography be structured into a usable system?

### Pick better fonts
Avoid relying only on the same overused free fonts, because that makes designs feel generic.

Recommended approach:

- Explore less common free font libraries such as:
  - `fontshare.com` for clean, high-quality fonts
  - `uncut.wtf` for more experimental options
- Maintain a curated collection of free or affordable fonts that consistently look strong in real projects

### Use a type scale system
A type scale creates consistency and predictability without making the design feel mechanical.

Recommended process:

- Choose a base body size, usually `16px`
- Scale heading sizes using a consistent ratio instead of eyeballing values
- A good starting ratio is **Major Third**, where each step increases by about `1.25x`

Example scale:

- Body: `16px`
- H6: `20px`
- H5: `25px`
- Continue upward with the same ratio until H1

### Use REM units
Prefer `rem` over raw pixel values so the browser handles scaling more flexibly and accessibly.

### Letter-spacing rules
Use letter-spacing selectively:

- **Body text:** keep default letter-spacing for readability
- **Headings:** tighten letter-spacing slightly as font size increases

Reason: large text often looks cleaner with reduced spacing.

### Line-height rules
Adjust line-height by text purpose:

- **Paragraphs:** use about `150%` of font size
  - Example: `16px` text -> `1.5` line-height
- **Large headings:** use tighter line-height to increase impact and scannability

### Use type scale tools
Use a type scale generator such as `typescale.net`:

- Set a base size
- Choose a ratio
- Generate the full type system quickly

---

## 2. Layout Skills

### Core idea
Professional layouts are not built by dragging elements around until they “feel right.” They rely on systems for structure, spacing, and hierarchy.

The three essentials are:

- A grid system
- A spacing system
- Clear visual hierarchy

### Use a grid system
The grid is the structural foundation of a layout.

Recommended grid sizes:

- Desktop: `12 columns`
- Tablet: `8 columns`
- Mobile: `4 columns`

Why `12` columns works well:

- It divides easily into halves, thirds, and quarters
- It supports many layout patterns

Example:

- Two-column desktop layout:
  - Left: `6/12`
  - Right: `6/12`

### Use a spacing system
Use an **8-point spacing system** where spacing values are multiples of 8.

Common values:

- `8px`
- `16px`
- `24px`
- `32px`

Example usage:

- `16px` between cards
- `24px` between sections
- `32px` for larger layout breaks

The goal is consistency, not arbitrary spacing.

### Visual hierarchy for scanning
Users usually scan pages rather than read them line by line.

Design hierarchy using four levers:

#### Proximity
Place related elements close together to show they belong to the same group.

#### Size
Use larger elements to indicate higher importance and smaller elements to indicate lower importance.

#### Contrast
Emphasize priority with differences in:

- size
- font weight
- color
- opacity

#### Alignment
Use consistent alignment and clean visual lines so the page feels structured and easy to navigate.

Example:

- A large hero heading and strong image attract attention first
- Smaller, lighter, lower-contrast text signals secondary information

---

## 3. Color Skills

### Core idea
Color feels difficult because there are too many possible choices. Strong designers do not necessarily use more colors; they use color with more intent.

### Limit the palette and assign roles
Use only `2–3` main colors for most projects.

Each color should have a defined role rather than being chosen randomly.

### Use the 60–30–10 rule
A practical distribution model:

- `60%` neutral colors
  - backgrounds
  - body text
  - general UI surfaces
- `30%` secondary colors
  - cards
  - sections
  - headers
  - supporting visuals
- `10%` accent color
  - buttons
  - CTAs
  - important highlights

Example:

- `60%` white/gray for background and text
- `30%` soft blue for sections and cards
- `10%` yellow or orange for CTA buttons

### Use opacity to create depth
Instead of adding many new colors, derive variations from an existing color by adjusting opacity.

Example:

- Start with a primary yellow
- Use lighter transparent versions for backgrounds and soft emphasis states

This creates depth while keeping the palette coherent.

### Prioritize contrast for accessibility
A color combination is ineffective if users cannot read it.

Minimum contrast targets:

- Large text: at least `3:1`
- Smaller text: at least `4.5:1`

### Do not build palettes from scratch unless necessary
Strong palettes are often borrowed, studied, and refined rather than invented from nothing.

A practical method:

- Inspect existing websites
- Extract their color usage, font families, and type scale
- Adapt what works instead of guessing from scratch

One way to do this is through browser developer tools and CSS inspection features.

---

## 4. Coding Basics

### Why coding matters
A web designer who understands basic code has a major advantage.

The goal is not to become a full application engineer. The goal is to understand enough to customize, troubleshoot, and implement ideas effectively.

### Focus on core technologies
At minimum, learn:

- **HTML** for structure
- **CSS** for styling
- **JavaScript** for interaction and behavior

If working in WordPress, basic **PHP** is also useful.

### Learn just in time
Do not try to learn everything upfront.

Better approach:

- Learn fundamentals through beginner-friendly platforms such as Codecademy or similar resources
- Go deeper only when real projects require it

This keeps learning practical and relevant.

### Use 80% solutions and customize them
Do not start from zero unless necessary.

A practical workflow:

- Find code that already solves about `80%` of the problem
- Sources can include:
  - CodePen examples
  - existing snippets
  - AI-generated drafts
  - plugin code
- Modify it to match the exact project need

This is often the fastest route to a working solution.

### Learn by doing
Do not optimize for becoming a full-stack developer unless that is the actual career goal.

Instead:

- keep shipping real projects
- use tools to close knowledge gaps
- build fluency through repeated implementation

---

## 5. Conversion Skills

### Why conversion matters
Good-looking design is not enough. Strong web design must produce action and support business goals.

A redesign can look visually better and still perform worse if the user journey is not considered.

### One clear goal per page
Each page should have exactly one primary objective.

Examples:

- buy a product
- book a call
- download a lead magnet

Problems happen when multiple competing primary goals are pushed at once.

### Strong and frequent CTAs
Calls to action should be:

- clear
- visible quickly
- strategically repeated

Recommended placement:

- one CTA in the hero section
- one CTA in the navigation
- repeated CTAs every `2–3` screenfuls during scrolling

### Build trust, clarity, and emotion
Users act when they trust the brand, understand the value, and feel that the message reflects their needs.

A strong page should:

- speak to real motivations
- explain benefits plainly
- make users feel understood
- reduce uncertainty

Useful trust elements:

- testimonials
- reviews
- social proof
- credibility markers

---

## Key Takeaways

### Focus on the five essential skills
Ignore most trend-chasing. The five skills that matter most are:

- typography
- layout
- color
- coding basics
- conversion

### Use systems instead of instinct alone
Reliable design comes from systems such as:

- type scales
- grid systems
- spacing systems
- limited color palettes
- clear hierarchy rules

### Learn enough code to solve real problems
You do not need to become a full developer. Learn enough to adapt snippets, customize behavior, and close implementation gaps.

### Design around outcomes
Every page should have:

- one primary goal
- clear CTAs
- trust signals
- emotional relevance

A page should not only look good. It should perform.

### Master the fundamentals before chasing tricks
Consistent improvement comes faster when you strengthen these five areas instead of constantly chasing new tactics or visual trends.