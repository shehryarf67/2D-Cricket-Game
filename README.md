# Cricket Power Shot Game

A React + Vite single-player 2D cricket batting game for the assignment rubric.

## Features

- Aggressive and Defensive batting modes with different probability distributions
- Probability-mapped power bar using fixed segments that sum to 1
- Moving slider that determines the ball outcome based on timing
- 2 overs / 12 balls match logic
- 2 wicket limit
- Scoreboard with runs, wickets, overs, and balls left
- Bowling animation and batting animation
- Restart match button
- Optional commentary system
- Responsive UI

## Run locally

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## Notes

- The cricket result is not generated randomly.
- The only random element is commentary text selection after the result has already been determined.
- Outcome mapping is driven by slider position against the selected batting style's probability segments.
