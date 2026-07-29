/* Force full viewport on mobile browsers — eliminates white zones */
html,
body,
#root {
  height: 100dvh;
  min-height: 100dvh;
  max-height: 100dvh;
  overflow: hidden;
  background-color: #080810;
  margin: 0;
  padding: 0;
  width: 100%;
  overscroll-behavior: none;
}

/* Remove elastic scrolling on iOS Safari */
body {
  position: fixed;
  width: 100%;
}

/* Prevent default touch behaviors */
* {
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
}
