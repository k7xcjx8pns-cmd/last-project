particlesJS('particles-js', {
  particles: {
    number: { value: 95 },
    color: { value: "#6EE7E0" },
    shape: { type: "circle" },
    opacity: {
      value: 0.8,
      anim: { enable: true, speed: 1.5, opacity_min: 0 }
    },
    size: { value: 2, random: true },
    line_linked: {
      enable: true,
      distance: 130,
      color: "#4BB388",
      opacity: 1,
      width: 1
    },
    move: { enable: true, speed: 2 }
  },
  interactivity: {
    detect_on: "canvas",
    events: {
      onclick: { enable: true, mode: "push" },
      resize: true
    },
    modes: {
      grab: { distance: 500, line_linked: { opacity: 0.5 } },
      push: { particles_nb: 2 }
    }
  },
  retina_detect: true
});
