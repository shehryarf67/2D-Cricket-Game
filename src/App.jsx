import React, { useEffect, useMemo, useRef, useState } from 'react';
import bat from './assets/bat.svg';

const MAX_BALLS = 12;
const MAX_WICKETS = 2;
const SLIDER_SPEED_MS = 1600;
const COMMENTARY = {
  wicket: [
    'Cleaned up. The batter missed it completely.',
    'Gone. Pressure tells and the stumps are shattered.',
    'That is a massive breakthrough for the bowler.'
  ],
  0: [
    'A dot ball. Good discipline from the fielding side.',
    'No run there. Nicely defended.',
    'Straight to the fielder. Nothing added.'
  ],
  1: [
    'Just a single. Sensible cricket.',
    'Tapped away for one.',
    'They rotate strike with ease.'
  ],
  2: [
    'Good running. They come back for two.',
    'Placed into the gap for a comfortable brace.',
    'Sharp calling turns that into two runs.'
  ],
  3: [
    'Excellent placement. They sprint back for three.',
    'That rolls into the deep and they collect three.',
    'Terrific running between the wickets.'
  ],
  4: [
    'Cracked away for four. Beautiful timing.',
    'That races to the fence. Four runs.',
    'A boundary with real authority.'
  ],
  6: [
    'That is huge. Six into the crowd.',
    'Launched over the rope for a maximum.',
    'What a strike. That is a clean six.'
  ]
};

const PROBABILITIES = {
  aggressive: [
    { label: 'W', value: 'wicket', probability: 0.24, className: 'seg-wicket' },
    { label: '0', value: 0, probability: 0.12, className: 'seg-dot' },
    { label: '1', value: 1, probability: 0.10, className: 'seg-one' },
    { label: '2', value: 2, probability: 0.10, className: 'seg-two' },
    { label: '3', value: 3, probability: 0.06, className: 'seg-three' },
    { label: '4', value: 4, probability: 0.18, className: 'seg-four' },
    { label: '6', value: 6, probability: 0.20, className: 'seg-six' }
  ],
  defensive: [
    { label: 'W', value: 'wicket', probability: 0.10, className: 'seg-wicket' },
    { label: '0', value: 0, probability: 0.26, className: 'seg-dot' },
    { label: '1', value: 1, probability: 0.26, className: 'seg-one' },
    { label: '2', value: 2, probability: 0.16, className: 'seg-two' },
    { label: '3', value: 3, probability: 0.06, className: 'seg-three' },
    { label: '4', value: 4, probability: 0.11, className: 'seg-four' },
    { label: '6', value: 6, probability: 0.05, className: 'seg-six' }
  ]
};

function buildSegments(style) {
  let start = 0;
  return PROBABILITIES[style].map((segment) => {
    const end = start + segment.probability;
    const built = { ...segment, start, end };
    start = end;
    return built;
  });
}

function getOutcomeFromPosition(position, segments) {
  for (const segment of segments) {
    if (position >= segment.start && position < segment.end) {
      return segment;
    }
  }
  return segments[segments.length - 1];
}

function getOversText(ballsBowled) {
  return `${Math.floor(ballsBowled / 6)}.${ballsBowled % 6}`;
}

function getBallsRemainingText(ballsBowled) {
  return MAX_BALLS - ballsBowled;
}

function getRandomComment(outcome) {
  const options = COMMENTARY[outcome];
  return options[Math.floor(Math.random() * options.length)];
}

export default function App() {
  const [selectedStyle, setSelectedStyle] = useState('aggressive');
  const [runs, setRuns] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [ballsBowled, setBallsBowled] = useState(0);
  const [matchStatus, setMatchStatus] = useState('Choose a batting style and play your shot.');
  const [commentary, setCommentary] = useState('Welcome to the crease. Time your click using the power bar.');
  const [phase, setPhase] = useState('ready');
  const [ballKey, setBallKey] = useState(0);
  const [swingKey, setSwingKey] = useState(0);
  const [sliderProgress, setSliderProgress] = useState(0);
  const animationFrameRef = useRef(null);
  const sliderStartRef = useRef(null);

  const isGameOver = ballsBowled >= MAX_BALLS || wickets >= MAX_WICKETS;
  const segments = useMemo(() => buildSegments(selectedStyle), [selectedStyle]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isGameOver) {
      const endReason = wickets >= MAX_WICKETS ? 'All wickets are down.' : 'Innings complete.';
      setMatchStatus(`Game Over. ${endReason}`);
    }
  }, [isGameOver, wickets]);

  const startSliderLoop = () => {
    sliderStartRef.current = null;

    const tick = (timestamp) => {
      if (!sliderStartRef.current) {
        sliderStartRef.current = timestamp;
      }
      const elapsed = timestamp - sliderStartRef.current;
      const cycle = elapsed % SLIDER_SPEED_MS;
      const normalized = cycle / SLIDER_SPEED_MS;
      const pingPong = normalized < 0.5 ? normalized * 2 : (1 - normalized) * 2;
      setSliderProgress(pingPong);
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
  };

  const stopSliderLoop = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const handlePlayBall = () => {
    if (isGameOver || phase !== 'ready') return;

    setPhase('bowling');
    setMatchStatus(`Bowler runs in. ${selectedStyle === 'aggressive' ? 'Aggressive' : 'Defensive'} shot selected.`);
    setCommentary('Watch the line, length and the moving power bar.');
    setBallKey((prev) => prev + 1);

    window.setTimeout(() => {
      setPhase('timing');
      setMatchStatus('Click PLAY SHOT again while the slider is moving.');
      startSliderLoop();
    }, 900);
  };

  const finishBall = (resultSegment) => {
    const nextBalls = ballsBowled + 1;
    setBallsBowled(nextBalls);

    if (resultSegment.value === 'wicket') {
      const nextWickets = wickets + 1;
      setWickets(nextWickets);
      setMatchStatus('Wicket. The batter is dismissed.');
      setCommentary(getRandomComment('wicket'));
    } else {
      setRuns((prev) => prev + resultSegment.value);
      setMatchStatus(`${resultSegment.value} run${resultSegment.value === 1 ? '' : 's'} scored.`);
      setCommentary(getRandomComment(resultSegment.value));
    }

    window.setTimeout(() => {
      if (nextBalls >= MAX_BALLS || (resultSegment.value === 'wicket' ? wickets + 1 : wickets) >= MAX_WICKETS) {
        setPhase('complete');
      } else {
        setPhase('ready');
      }
    }, 500);
  };

  const handleShotClick = () => {
    if (isGameOver) return;

    if (phase === 'ready') {
      handlePlayBall();
      return;
    }

    if (phase !== 'timing') return;

    stopSliderLoop();
    setPhase('shot');
    setSwingKey((prev) => prev + 1);
    const resultSegment = getOutcomeFromPosition(sliderProgress, segments);
    finishBall(resultSegment);
  };

  const resetGame = () => {
    stopSliderLoop();
    setSelectedStyle('aggressive');
    setRuns(0);
    setWickets(0);
    setBallsBowled(0);
    setMatchStatus('Choose a batting style and play your shot.');
    setCommentary('Welcome to the crease. Time your click using the power bar.');
    setPhase('ready');
    setBallKey((prev) => prev + 1);
    setSwingKey((prev) => prev + 1);
    setSliderProgress(0);
  };

  const currentButtonLabel = phase === 'timing' ? 'Play Shot Now' : phase === 'bowling' ? 'Ball in Motion...' : isGameOver ? 'Match Finished' : 'Start Ball';

  return (
    <div className="app-shell">
      <header className="hero-panel">
        <div>
          <p className="eyebrow">Assignment 02 · Single Player Cricket Game</p>
          <h1>Cricket Power Shot</h1>
          <p className="subcopy">
            A React-based 2D batting game using probability-mapped power bar segments and slider timing.
          </p>
        </div>
        <button className="restart-btn" onClick={resetGame}>Restart Match</button>
      </header>

      <main className="game-layout">
        <section className="left-column">
          <div className="scoreboard card">
            <h2>Scoreboard</h2>
            <div className="score-grid">
              <div><span>Runs</span><strong>{runs}</strong></div>
              <div><span>Wickets</span><strong>{wickets}/{MAX_WICKETS}</strong></div>
              <div><span>Overs</span><strong>{getOversText(ballsBowled)}</strong></div>
              <div><span>Balls Left</span><strong>{getBallsRemainingText(ballsBowled)}</strong></div>
            </div>
          </div>

          <div className="controls card">
            <h2>Batting Style</h2>
            <div className="style-buttons">
              <button
                className={selectedStyle === 'aggressive' ? 'style-btn active aggressive' : 'style-btn aggressive'}
                onClick={() => setSelectedStyle('aggressive')}
                disabled={phase === 'timing' || phase === 'bowling'}
              >
                Aggressive
              </button>
              <button
                className={selectedStyle === 'defensive' ? 'style-btn active defensive' : 'style-btn defensive'}
                onClick={() => setSelectedStyle('defensive')}
                disabled={phase === 'timing' || phase === 'bowling'}
              >
                Defensive
              </button>
            </div>
            <p className="style-description">
              {selectedStyle === 'aggressive'
                ? 'High risk, higher wicket chance, stronger probability for boundaries.'
                : 'Safer approach, lower wicket chance, better chance of singles and dots.'}
            </p>
            <button className="action-btn" onClick={handleShotClick} disabled={phase === 'bowling' || isGameOver}>
              {currentButtonLabel}
            </button>
          </div>

          <div className="commentary card">
            <h2>Match Feed</h2>
            <p className="status-line">{matchStatus}</p>
            <p>{commentary}</p>
          </div>
        </section>

        <section className="right-column">
          <div className="field card">
            <div className="stadium-sky" />
            <div className="crowd-strip" />
            <div className="field-oval">
              <div className="pitch" />
              <div key={swingKey} className={phase === 'shot' ? 'batsman swing' : 'batsman'}>
                <img src={bat} className="bat" alt="bat" />
                <div className="player-head" />
                <div className="player-body" />
              </div>
              <div key={ballKey} className={phase === 'bowling' ? 'ball bowling' : 'ball'} />
            </div>
          </div>

          <div className="powerbar card">
            <div className="powerbar-header">
              <h2>Probability Power Bar</h2>
              <span>{selectedStyle === 'aggressive' ? 'Aggressive Distribution' : 'Defensive Distribution'}</span>
            </div>

            <div className="bar-wrapper">
              <div className="segments-row">
                {segments.map((segment) => (
                  <div
                    key={`${selectedStyle}-${segment.label}`}
                    className={`segment ${segment.className}`}
                    style={{ width: `${segment.probability * 100}%` }}
                    title={`${segment.label} = ${(segment.probability * 100).toFixed(0)}%`}
                  >
                    <span>{segment.label}</span>
                  </div>
                ))}
              </div>
              <div className="slider-track">
                <div className="slider-marker" style={{ left: `calc(${sliderProgress * 100}% - 10px)` }} />
              </div>
            </div>

            <div className="probability-table">
              {segments.map((segment) => (
                <div key={`${segment.label}-${segment.probability}`} className="prob-chip">
                  <strong>{segment.label === 'W' ? 'Wicket' : segment.label}</strong>
                  <span>{(segment.probability * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>

          {isGameOver && (
            <div className="game-over card overlay-card">
              <h2>Innings Complete</h2>
              <p>Final Score: {runs}/{wickets} in {getOversText(ballsBowled)} overs</p>
              <p>{wickets >= MAX_WICKETS ? 'The side has been bowled out.' : 'All 12 balls have been faced.'}</p>
              <button className="action-btn" onClick={resetGame}>Play Again</button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
