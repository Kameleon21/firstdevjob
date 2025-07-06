## Relevant Files

- `src/app/providers.tsx` - To wrap the application with the new `ThemeProvider`.
- `src/components/ThemeProvider.tsx` - (New File) The main component for managing theme state, handling persistence, and providing the theme context.
- `src/components/ThemeToggle.tsx` - (New File) The UI component for the sun/moon toggle button.
- `src/components/ThemeToggle.test.tsx` - (New File) Unit tests for the `ThemeToggle` component.
- `src/components/Header.tsx` - To integrate the `ThemeToggle` component into the main header.
- `src/app/globals.css` - To define the light and dark theme color palettes using CSS variables.
- `src/app/layout.tsx` - To apply the theme attribute (`data-theme`) to the root element.

### Notes

- Unit tests should be placed alongside the code files they are testing.
- Use `npm test -- src/components/ThemeToggle.test.tsx` to run a specific test file. Running `npm test` will execute all tests.

## Tasks

- [x] 1.0 Set Up Theme Management Infrastructure
  - [x] 1.1 Create a new file `src/components/ThemeProvider.tsx`.
  - [x] 1.2 In `ThemeProvider.tsx`, create a `ThemeContext` to hold the current theme (`'light' | 'dark'`) and a `toggleTheme` function.
  - [x] 1.3 Implement the `ThemeProvider` component that manages the theme state.
  - [x] 1.4 Add logic to `ThemeProvider` to detect the user's OS preference (`prefers-color-scheme`) for the initial theme.
  - [x] 1.5 Implement logic to read from and write to `localStorage` to persist the theme choice.
  - [x] 1.6 Create a `useTheme` custom hook to easily access the theme context.
  - [x] 1.7 In `src/app/layout.tsx`, wrap the children with the `ThemeProvider` and apply the current theme as a `data-theme` attribute on the `<html>` tag.

- [x] 2.0 Define and Implement Theme Color Variables
  - [x] 2.1 In `src/app/globals.css`, define CSS variables for the dark theme under `:root[data-theme='dark']`. Use the existing colors (black background, white foreground, various purple shades).
  - [x] 2.2 In `src/app/globals.css`, define CSS variables for the light theme under `:root[data-theme='light']`. Use a white background, dark text, and lighter shades of purple.
  - [x] 2.3 Refactor existing Tailwind utility classes in components to use the new CSS variables (e.g., `bg-background`, `text-foreground`).

- [x] 3.0 Create the Theme Toggle Component
  - [x] 3.1 Create a new file `src/components/ThemeToggle.tsx`.
  - [x] 3.2 Add `sun` and `moon` icons (from an icon library like `lucide-react`).
  - [x] 3.3 Use the `useTheme` hook to get the current theme and the `toggleTheme` function.
  - [x] 3.4 Implement the `onClick` handler to call `toggleTheme`.
  - [x] 3.5 Add CSS to conditionally display the correct icon based on the current theme.
  - [x] 3.6 Implement the rotating animation (300ms, ease-in-out) for the icon transition.
  - [x] 3.7 Create a corresponding test file `src/components/ThemeToggle.test.tsx` to verify that the component renders and toggles correctly.

- [x] 4.0 Integrate Theme Toggle into Application Header
  - [x] 4.1 Import and place the `ThemeToggle` component within `src/components/Header.tsx`.

- [ ] 5.0 Ensure Theme Consistency Across All Components
  - [ ] 5.1 Systematically review all components and pages to ensure they adapt correctly to both themes.
  - [ ] 5.2 Replace any hardcoded color classes with the newly defined theme-aware utility classes or CSS variables.
  - [ ] 5.3 Test the application in both light and dark modes to identify and fix any UI inconsistencies. 